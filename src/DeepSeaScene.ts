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
    for (const source of lighting.search.sources) {
      const searchLight = new THREE.SpotLight(
        source.color,
        source.intensity,
        lighting.search.distance,
        lighting.search.angle,
        lighting.search.penumbra,
        lighting.search.decay,
      )
      searchLight.position.set(
        source.position[0],
        source.position[1],
        source.position[2],
      )
      searchLight.target.position.set(
        source.target[0],
        source.target[1],
        source.target[2],
      )
      camera.add(searchLight, searchLight.target)
    }

    const ambient = new THREE.AmbientLight(
      lighting.ambient.color,
      lighting.ambient.intensity,
    )
    this.scene.add(ambient)
  }
}
