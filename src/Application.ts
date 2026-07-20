import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Inspector } from 'three/addons/inspector/Inspector.js'
import { DeepSeaScene } from './DeepSeaScene'
import { MarineSnowField } from './MarineSnowField'
import { OrbitalTubeField } from './OrbitalTubeField'
import { SCENE_CONFIG } from './config'

export class Application {
  private readonly root: HTMLElement
  private readonly renderer: THREE.WebGPURenderer
  private readonly camera: THREE.PerspectiveCamera
  private readonly controls: OrbitControls
  private readonly deepSea: DeepSeaScene
  private readonly tubeField: OrbitalTubeField
  private readonly marineSnow: MarineSnowField

  public constructor(root: HTMLElement) {
    this.root = root
    this.renderer = new THREE.WebGPURenderer({ antialias: true })
    this.renderer.inspector = new Inspector()
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, SCENE_CONFIG.pixelRatioMax),
    )
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = SCENE_CONFIG.toneMappingExposure

    const cameraConfig = SCENE_CONFIG.camera
    this.camera = new THREE.PerspectiveCamera(
      cameraConfig.fov,
      window.innerWidth / window.innerHeight,
      cameraConfig.near,
      cameraConfig.far,
    )
    this.camera.position.set(...cameraConfig.position)

    this.deepSea = new DeepSeaScene(this.camera)
    this.tubeField = new OrbitalTubeField()
    this.marineSnow = new MarineSnowField()
    this.deepSea.scene.add(this.tubeField.object, this.marineSnow.object)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.minDistance = SCENE_CONFIG.controls.minDistance
    this.controls.maxDistance = SCENE_CONFIG.controls.maxDistance
    this.controls.target.set(...SCENE_CONFIG.controls.target)
  }

  public async init(): Promise<void> {
    this.root.replaceChildren(this.renderer.domElement)
    await this.renderer.init()

    this.handleResize()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('pagehide', this.dispose, { once: true })
    this.renderer.setAnimationLoop(this.render)
  }

  private readonly render = (): void => {
    this.controls.update()
    this.renderer.render(this.deepSea.scene, this.camera)
  }

  private readonly handleResize = (): void => {
    const width = this.root.clientWidth || window.innerWidth
    const height = this.root.clientHeight || window.innerHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, SCENE_CONFIG.pixelRatioMax),
    )
    this.renderer.setSize(width, height, false)
  }

  private readonly dispose = (): void => {
    window.removeEventListener('resize', this.handleResize)
    this.renderer.setAnimationLoop(null)
    this.controls.dispose()
    this.tubeField.dispose()
    this.marineSnow.dispose()
    this.renderer.dispose()
  }
}
