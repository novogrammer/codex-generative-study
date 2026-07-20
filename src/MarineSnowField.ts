import * as THREE from 'three/webgpu'
import { instancedBufferAttribute, uniform } from 'three/tsl'
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
    const random = this.createRandom(0x0ce4a1)

    for (let index = 0; index < config.count; index += 1) {
      const offset = index * 3
      positions[offset] = centerX + (random() - 0.5) * width
      positions[offset + 1] = centerY + (random() - 0.5) * height
      positions[offset + 2] = centerZ + (random() - 0.5) * depth
    }

    const positionAttribute = new THREE.InstancedBufferAttribute(positions, 3)

    const material = new THREE.SpriteNodeMaterial({
      color: config.color,
      sizeAttenuation: true,
    })
    material.positionNode = instancedBufferAttribute<'vec3'>(positionAttribute)
    material.scaleNode = uniform(config.size)
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
