import * as THREE from 'three/webgpu'
import {
  cameraWorldMatrix,
  float,
  fract,
  instancedBufferAttribute,
  positionGeometry,
  smoothstep,
  time,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl'
import { SCENE_CONFIG } from './config'

export class MarineSnowField {
  public readonly object: THREE.InstancedMesh

  private readonly geometry: THREE.PlaneGeometry
  private readonly material: THREE.MeshLambertNodeMaterial

  public constructor() {
    this.geometry = new THREE.PlaneGeometry(1, 1)
    this.material = this.createMaterial()
    this.object = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      SCENE_CONFIG.marineSnow.count,
    )
    const identity = new THREE.Matrix4()
    for (let index = 0; index < SCENE_CONFIG.marineSnow.count; index += 1) {
      this.object.setMatrixAt(index, identity)
    }
    this.object.instanceMatrix.needsUpdate = true
    this.object.frustumCulled = false
  }

  public dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }

  private createMaterial(): THREE.MeshLambertNodeMaterial {
    const config = SCENE_CONFIG.marineSnow
    const [width, height, depth] = config.spread
    const [centerX, centerY, centerZ] = SCENE_CONFIG.controls.target
    const positions = new Float32Array(config.count * 3)
    const phases = new Float32Array(config.count)
    const amplitudes = new Float32Array(config.count)
    const sizes = new Float32Array(config.count)
    const random = this.createRandom(0x0ce4a1)

    for (let index = 0; index < config.count; index += 1) {
      const offset = index * 3
      positions[offset] = centerX + (random() - 0.5) * width
      positions[offset + 1] = centerY + (random() - 0.5) * height
      positions[offset + 2] = centerZ + (random() - 0.5) * depth
      phases[index] = random() * Math.PI * 2
      amplitudes[index] = 0.45 + random() * 0.9
      sizes[index] = config.sizeVariation[0]
        + random() * (config.sizeVariation[1] - config.sizeVariation[0])
    }

    const positionAttribute = new THREE.InstancedBufferAttribute(positions, 3)
    const phaseAttribute = new THREE.InstancedBufferAttribute(phases, 1)
    const amplitudeAttribute = new THREE.InstancedBufferAttribute(amplitudes, 1)
    const sizeAttribute = new THREE.InstancedBufferAttribute(sizes, 1)
    const basePosition = instancedBufferAttribute<'vec3'>(positionAttribute)
    const phase = instancedBufferAttribute<'float'>(phaseAttribute)
    const amplitude = instancedBufferAttribute<'float'>(amplitudeAttribute)
    const sizeVariation = instancedBufferAttribute<'float'>(sizeAttribute)
    const fallingY = fract(
      basePosition.y
        .sub(centerY)
        .add(height * 0.5)
        .sub(time.mul(config.fallSpeed).mul(amplitude))
        .div(height),
    )
      .mul(height)
      .sub(height * 0.5)
      .add(centerY)
    const driftTime = time.mul(config.driftSpeed).add(phase)
    const driftX = driftTime.sin().mul(config.driftAmount).mul(amplitude)
    const driftZ = driftTime
      .mul(0.73)
      .cos()
      .mul(config.driftAmount * 0.65)
      .mul(amplitude)

    const material = new THREE.MeshLambertNodeMaterial({
      color: config.color,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.01,
    })
    const distanceFromCenter = uv().sub(0.5).length()
    const animatedPosition = vec3(
      basePosition.x.add(driftX),
      fallingY,
      basePosition.z.add(driftZ),
    )
    const billboardOffset = cameraWorldMatrix
      .mul(vec4(positionGeometry, 0))
      .xyz
      .mul(uniform(config.size))
      .mul(sizeVariation)
    material.positionNode = animatedPosition.add(billboardOffset)
    material.normalNode = vec3(0, 0, 1)
    material.opacityNode = float(1)
      .sub(smoothstep(0.16, 0.5, distanceFromCenter))
      .mul(config.opacity)
    return material
  }

  private createRandom(seed: number): () => number {
    let state = seed >>> 0
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return state / 0x100000000
    }
  }
}
