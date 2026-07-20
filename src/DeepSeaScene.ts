import * as THREE from 'three/webgpu'
import { SCENE_CONFIG } from './config'
import { VolumetricSpotLight } from './VolumetricSpotLight'

export class DeepSeaScene {
  public readonly scene: THREE.Scene

  private readonly volumetricLight: VolumetricSpotLight

  public constructor(camera: THREE.PerspectiveCamera) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(SCENE_CONFIG.background)
    this.scene.fog = new THREE.FogExp2(
      SCENE_CONFIG.background,
      SCENE_CONFIG.fogDensity,
    )

    this.scene.add(camera)
    this.addLights(camera)
    this.volumetricLight = new VolumetricSpotLight()
    camera.add(this.volumetricLight.object)
  }

  public dispose(): void {
    this.volumetricLight.dispose()
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

    const ambient = new THREE.AmbientLight(
      lighting.ambient.color,
      lighting.ambient.intensity,
    )
    this.scene.add(ambient)
  }
}
