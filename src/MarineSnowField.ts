import * as THREE from 'three/webgpu'
import { attribute, fract, time, vec3 } from 'three/tsl'
import { SCENE_CONFIG } from './config'

export class MarineSnowField {
  public readonly object: THREE.Points

  private readonly geometry: THREE.BufferGeometry
  private readonly material: THREE.PointsNodeMaterial

  public constructor() {
    this.geometry = this.createGeometry()
    this.material = this.createMaterial()
    this.object = new THREE.Points(this.geometry, this.material)
    this.object.frustumCulled = false
  }

  public dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }

  private createGeometry(): THREE.BufferGeometry {
    const config = SCENE_CONFIG.marineSnow
    const [width, height, depth] = config.spread
    const positions = new Float32Array(config.count * 3)
    const phases = new Float32Array(config.count)
    const amplitudes = new Float32Array(config.count)
    const random = this.createRandom(0x0ce4a1)

    for (let index = 0; index < config.count; index += 1) {
      const offset = index * 3
      positions[offset] = (random() - 0.5) * width
      positions[offset + 1] = (random() - 0.5) * height
      positions[offset + 2] = 2 - random() * depth
      phases[index] = random() * Math.PI * 2
      amplitudes[index] = 0.45 + random() * 0.9
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('snowPhase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('snowAmplitude', new THREE.BufferAttribute(amplitudes, 1))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -7), 18)
    return geometry
  }

  private createMaterial(): THREE.PointsNodeMaterial {
    const config = SCENE_CONFIG.marineSnow
    const basePosition = attribute<'vec3'>('position', 'vec3')
    const phase = attribute<'float'>('snowPhase', 'float')
    const amplitude = attribute<'float'>('snowAmplitude', 'float')
    const [, height] = config.spread
    const fallingY = fract(
      basePosition.y
        .add(height * 0.5)
        .sub(time.mul(config.fallSpeed).mul(amplitude))
        .div(height),
    )
      .mul(height)
      .sub(height * 0.5)
    const driftTime = time.mul(config.driftSpeed).add(phase)
    const driftX = driftTime.sin().mul(config.driftAmount).mul(amplitude)
    const driftZ = driftTime
      .mul(0.73)
      .cos()
      .mul(config.driftAmount * 0.65)
      .mul(amplitude)

    const material = new THREE.PointsNodeMaterial({
      color: config.color,
      opacity: config.opacity,
      size: config.size,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    material.positionNode = vec3(
      basePosition.x.add(driftX),
      fallingY,
      basePosition.z.add(driftZ),
    )
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
