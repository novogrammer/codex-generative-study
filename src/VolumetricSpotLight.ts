import * as THREE from 'three/webgpu'
import { float, uv } from 'three/tsl'
import { SCENE_CONFIG } from './config'

export class VolumetricSpotLight {
  public readonly object: THREE.Mesh

  private readonly geometry: THREE.CylinderGeometry
  private readonly material: THREE.MeshBasicNodeMaterial

  public constructor() {
    const config = SCENE_CONFIG.lighting.volume
    const radius = Math.tan(config.angle) * config.distance

    this.geometry = new THREE.CylinderGeometry(
      0,
      radius,
      config.distance,
      config.radialSegments,
      config.heightSegments,
      true,
    )
    this.geometry.rotateX(Math.PI * 0.5)

    this.material = new THREE.MeshBasicNodeMaterial({
      color: config.color,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    })

    const longitudinalFade = uv().y.mul(Math.PI).sin()
    this.material.opacityNode = longitudinalFade
      .mul(longitudinalFade)
      .mul(float(config.opacity))

    this.object = new THREE.Mesh(this.geometry, this.material)
    this.object.position.set(
      config.position[0],
      config.position[1],
      config.position[2] - config.distance * 0.5,
    )
    this.object.frustumCulled = false
    this.object.renderOrder = 1
  }

  public dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
