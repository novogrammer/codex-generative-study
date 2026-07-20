import * as THREE from 'three/webgpu'
import { SCENE_CONFIG } from './config'

export class DeepSeaScene {
  public readonly scene: THREE.Scene

  public constructor(camera: THREE.PerspectiveCamera) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(SCENE_CONFIG.background)
    this.scene.fog = new THREE.FogExp2(
      SCENE_CONFIG.background,
      SCENE_CONFIG.fogDensity,
    )

    this.scene.add(camera)
    this.addLights(camera)
  }

  private addLights(camera: THREE.PerspectiveCamera): void {
    const lighting = SCENE_CONFIG.lighting
    const searchLight = new THREE.SpotLight(
      lighting.search.color,
      lighting.search.intensity,
      lighting.search.distance,
      lighting.search.angle,
      lighting.search.penumbra,
      lighting.search.decay,
    )
    searchLight.position.set(0, 0.4, 0)
    searchLight.target.position.set(0, -0.2, -7)
    camera.add(searchLight, searchLight.target)

    const blueFill = new THREE.PointLight(
      lighting.blueFill.color,
      lighting.blueFill.intensity,
      lighting.blueFill.distance,
      lighting.blueFill.decay,
    )
    blueFill.position.set(-5, 2, -4)

    const rimLight = new THREE.PointLight(
      lighting.rim.color,
      lighting.rim.intensity,
      lighting.rim.distance,
      lighting.rim.decay,
    )
    rimLight.position.set(5, -3, -8)

    const ambient = new THREE.AmbientLight(
      lighting.ambient.color,
      lighting.ambient.intensity,
    )
    this.scene.add(blueFill, rimLight, ambient)
  }
}
