import * as THREE from 'three/webgpu'
import {
  float,
  fract,
  instancedBufferAttribute,
  smoothstep,
  time,
  uniform,
  uv,
  vec3,
} from 'three/tsl'
import { SCENE_CONFIG } from './config'

export class MarineSnowField {
  public readonly object: THREE.Sprite

  private readonly material: THREE.SpriteNodeMaterial

  public constructor() {
    this.material = this.createMaterial()
    this.object = new THREE.Sprite(this.material)
    this.object.count = SCENE_CONFIG.marineSnow.count
    this.object.frustumCulled = false
  }

  public dispose(): void {
    this.material.dispose()
  }

  private createMaterial(): THREE.SpriteNodeMaterial {
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

    const material = new THREE.SpriteNodeMaterial({
      color: config.color,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.01,
    })
    const distanceFromCenter = uv().sub(0.5).length()
    material.positionNode = vec3(
      basePosition.x.add(driftX),
      fallingY,
      basePosition.z.add(driftZ),
    )
    material.scaleNode = uniform(config.size).mul(sizeVariation)
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
