import * as THREE from 'three/webgpu'
import { pass } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { SCENE_CONFIG } from './config'

export class BloomPipeline {
  private readonly pipeline: THREE.RenderPipeline
  private readonly scenePass: ReturnType<typeof pass>
  private readonly bloomPass: ReturnType<typeof bloom>

  public constructor(
    renderer: THREE.WebGPURenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    const config = SCENE_CONFIG.postProcessing.bloom
    this.scenePass = pass(scene, camera)
    const sceneColor = this.scenePass.getTextureNode('output')
    this.bloomPass = bloom(
      sceneColor,
      config.strength,
      config.radius,
      config.threshold,
    )
    this.pipeline = new THREE.RenderPipeline(renderer)
    this.pipeline.outputNode = sceneColor.add(this.bloomPass)
  }

  public render(): void {
    this.pipeline.render()
  }

  public dispose(): void {
    this.bloomPass.dispose()
    this.scenePass.dispose()
    this.pipeline.dispose()
  }
}
