import * as THREE from 'three/webgpu'
import {
  attribute,
  float,
  fract,
  instanceIndex,
  mix,
  sin,
  smoothstep,
  time,
  transformNormalToView,
  vec3,
} from 'three/tsl'
import { SCENE_CONFIG } from './config'

const TAU = Math.PI * 2
const FRAME_TRANSPORT_STEPS = 16

export class OrbitalTubeField {
  public readonly object: THREE.Group

  private readonly tubeGeometry: THREE.BufferGeometry
  private readonly plateGeometry: THREE.BufferGeometry
  private readonly tubeMaterial: THREE.MeshStandardNodeMaterial
  private readonly plateMaterial: THREE.MeshStandardNodeMaterial
  private readonly tubeMesh: THREE.InstancedMesh
  private readonly plateMesh: THREE.InstancedMesh

  public constructor() {
    this.tubeGeometry = this.createTubeGeometry()
    this.plateGeometry = this.createPlateGeometry()
    this.tubeMaterial = this.createMaterial(false)
    this.plateMaterial = this.createMaterial(true)
    this.tubeMesh = new THREE.InstancedMesh(
      this.tubeGeometry,
      this.tubeMaterial,
      SCENE_CONFIG.tubes.count,
    )
    this.plateMesh = new THREE.InstancedMesh(
      this.plateGeometry,
      this.plateMaterial,
      SCENE_CONFIG.tubes.count,
    )
    this.tubeMesh.frustumCulled = false
    this.plateMesh.frustumCulled = false
    this.object = new THREE.Group()
    this.object.add(this.tubeMesh, this.plateMesh)
    this.setInstanceTransforms()
  }

  public dispose(): void {
    this.tubeGeometry.dispose()
    this.plateGeometry.dispose()
    this.tubeMaterial.dispose()
    this.plateMaterial.dispose()
  }

  private createTubeGeometry(): THREE.BufferGeometry {
    const { longitudinalSegments, radialSegments } = SCENE_CONFIG.tubes
    const verticesPerRing = radialSegments + 1
    const positions: number[] = []
    const normals: number[] = []
    const curveParameters: number[] = []
    const ringAngles: number[] = []
    const radiusScales: number[] = []
    const capNormalScales: number[] = []
    const indices: number[] = []

    for (let longitudinal = 0; longitudinal <= longitudinalSegments; longitudinal += 1) {
      const u = longitudinal / longitudinalSegments

      for (let radial = 0; radial <= radialSegments; radial += 1) {
        const angle = (radial / radialSegments) * TAU
        positions.push(u, Math.cos(angle), Math.sin(angle))
        normals.push(0, Math.cos(angle), Math.sin(angle))
        curveParameters.push(u)
        ringAngles.push(angle)
        radiusScales.push(1)
        capNormalScales.push(0)
      }
    }

    const capRingStart = positions.length / 3
    for (let radial = 0; radial < radialSegments; radial += 1) {
      const angle = (radial / radialSegments) * TAU
      positions.push(1, Math.cos(angle), Math.sin(angle))
      normals.push(1, 0, 0)
      curveParameters.push(1)
      ringAngles.push(angle)
      radiusScales.push(1)
      capNormalScales.push(1)
    }

    const tipIndex = positions.length / 3
    positions.push(1, 0, 0)
    normals.push(1, 0, 0)
    curveParameters.push(1)
    ringAngles.push(0)
    radiusScales.push(0)
    capNormalScales.push(1)

    for (let radial = 0; radial < radialSegments; radial += 1) {
      const a = capRingStart + radial
      const b = capRingStart + ((radial + 1) % radialSegments)
      indices.push(a, b, tipIndex)
    }

    const rootCapRingStart = positions.length / 3
    for (let radial = 0; radial < radialSegments; radial += 1) {
      const angle = (radial / radialSegments) * TAU
      positions.push(0, Math.cos(angle), Math.sin(angle))
      normals.push(-1, 0, 0)
      curveParameters.push(0)
      ringAngles.push(angle)
      radiusScales.push(1)
      capNormalScales.push(-1)
    }

    const rootCenterIndex = positions.length / 3
    positions.push(0, 0, 0)
    normals.push(-1, 0, 0)
    curveParameters.push(0)
    ringAngles.push(0)
    radiusScales.push(0)
    capNormalScales.push(-1)

    for (let radial = 0; radial < radialSegments; radial += 1) {
      const a = rootCapRingStart + radial
      const b = rootCapRingStart + ((radial + 1) % radialSegments)
      indices.push(a, rootCenterIndex, b)
    }

    for (let longitudinal = 0; longitudinal < longitudinalSegments; longitudinal += 1) {
      for (let radial = 0; radial < radialSegments; radial += 1) {
        const a = longitudinal * verticesPerRing + radial
        const b = a + verticesPerRing
        const c = b + 1
        const d = a + 1
        indices.push(a, b, d, b, c, d)
      }
    }

    const geometry = new THREE.BufferGeometry()
    const vertexCount = positions.length / 3
    const surfaceParameters = new Float32Array(vertexCount * 4)

    for (let index = 0; index < vertexCount; index += 1) {
      const offset = index * 4
      surfaceParameters[offset] = curveParameters[index]
      surfaceParameters[offset + 1] = ringAngles[index]
      surfaceParameters[offset + 2] = radiusScales[index]
      surfaceParameters[offset + 3] = capNormalScales[index]
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute(
      'surfaceParameters',
      new THREE.BufferAttribute(surfaceParameters, 4),
    )
    geometry.setIndex(indices)
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 24)
    return geometry
  }

  private createPlateGeometry(): THREE.BufferGeometry {
    const plates = SCENE_CONFIG.tubes.plates
    const positions: number[] = []
    const normals: number[] = []
    const surfaceParameters: number[] = []
    const plateParameters: number[] = []
    const indices: number[] = []
    const plateSlope = plates.tipLift / plates.length
    const vertexOffsets = [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ]

    for (let row = 0; row < plates.rowCount; row += 1) {
      const u = (row + 1) / (plates.rowCount + 1)
      const angleOffset = (row % 2) * (Math.PI / plates.aroundCount)

      for (let around = 0; around < plates.aroundCount; around += 1) {
        const angle = (around / plates.aroundCount) * TAU + angleOffset
        const vertexStart = positions.length / 3

        for (const [alongFactor, acrossFactor] of vertexOffsets) {
          positions.push(u, Math.cos(angle), Math.sin(angle))
          normals.push(0, Math.cos(angle), Math.sin(angle))
          surfaceParameters.push(u, angle, 1, 0)
          plateParameters.push(
            alongFactor * plates.length,
            acrossFactor * plates.width,
            plates.surfaceOffset + (alongFactor + 0.5) * plates.tipLift,
            plateSlope,
          )
        }

        indices.push(
          vertexStart,
          vertexStart + 3,
          vertexStart + 1,
          vertexStart + 1,
          vertexStart + 3,
          vertexStart + 2,
        )
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute(
      'surfaceParameters',
      new THREE.Float32BufferAttribute(surfaceParameters, 4),
    )
    geometry.setAttribute(
      'plateParameters',
      new THREE.Float32BufferAttribute(plateParameters, 4),
    )
    geometry.setIndex(indices)
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 24)
    return geometry
  }

  private createMaterial(isPlate: boolean): THREE.MeshStandardNodeMaterial {
    const config = SCENE_CONFIG.tubes
    const appearance = isPlate ? config.plates.material : config
    const material = new THREE.MeshStandardNodeMaterial({
      color: appearance.color,
      metalness: appearance.metalness,
      roughness: appearance.roughness,
      side: THREE.DoubleSide,
    })

    const surfaceParameters = attribute<'vec4'>('surfaceParameters', 'vec4')
    const uNode = surfaceParameters.x
    const angleNode = surfaceParameters.y
    const radiusScaleNode = surfaceParameters.z
    const capNormalScaleNode = surfaceParameters.w
    const plateParameters = isPlate
      ? attribute<'vec4'>('plateParameters', 'vec4')
      : null
    const longitudinalOffsetNode = plateParameters?.x ?? float(0)
    const circumferentialOffsetNode = plateParameters?.y ?? float(0)
    const outwardOffsetNode = plateParameters?.z ?? float(0)
    const plateSlopeNode = plateParameters?.w ?? float(0)

    if (plateParameters !== null) {
      const plates = config.plates
      const pattern = plates.roughnessPattern
      const plateU = longitudinalOffsetNode.div(plates.length).add(0.5)
      const plateV = circumferentialOffsetNode.div(plates.width).add(0.5)
      const gridU = plateU.mul(pattern.grid[0])
      const gridV = plateV.mul(pattern.grid[1])
      const across = fract(gridV).sub(0.5).mul(2)
      const curveOffset = float(pattern.curveDepth).sub(
        across.mul(across).mul(pattern.curveDepth),
      )
      const cellX = gridU.sub(curveOffset).floor()
      const cellY = gridV.floor()
      const checkerMask = cellX.add(cellY).mod(2).sign()

      material.roughnessNode = mix(
        plates.material.roughness,
        pattern.cellRoughness,
        checkerMask,
      )
      material.metalnessNode = mix(
        plates.material.metalness,
        pattern.cellMetalness,
        checkerMask,
      )
    }

    const instanceQuaternion = attribute<'vec4'>('instanceQuaternion', 'vec4')
    const instance = float(instanceIndex)
    const hashA = fract(sin(instance.mul(12.9898).add(0.31)).mul(43758.5453))
    const hashB = fract(sin(instance.mul(78.233).add(2.17)).mul(24634.6345))
    const hashC = fract(sin(instance.mul(39.425).add(7.91)).mul(19341.117))
    const variationA = hashA.mul(0.4).add(0.8)
    const variationB = hashB.mul(0.4).add(0.8)
    const variationSpeed = hashC.mul(0.4).add(0.8)
    const phase = instance.div(SCENE_CONFIG.tubes.count).mul(TAU)
    const phaseA = phase
    const phaseB = phase

    const rawCurvePoint = (u: THREE.Node<'float'>) => {
      const angleA = u
        .mul(config.modeA.turns * TAU)
        .add(time.mul(config.modeA.speed * TAU).mul(variationSpeed))
        .add(phaseA)
      const angleB = u
        .mul(config.modeB.turns * TAU)
        .add(time.mul(config.modeB.speed * TAU).mul(variationSpeed))
        .add(phaseB)
      const radiusA = variationA.mul(config.modeA.radius)
      const radiusB = variationB.mul(config.modeB.radius)
      const combinedRadius = variationA
        .add(variationB)
        .mul(config.combinedModeRadius * 0.5)

      return vec3(
        angleA.cos().mul(radiusA),
        angleB.sin().mul(radiusB),
        angleA.add(angleB).sin().mul(combinedRadius),
      )
    }

    const curvePoint = (u: THREE.Node<'float'>) => rawCurvePoint(u).sub(
      rawCurvePoint(float(0)),
    )

    const curveTangent = (u: THREE.Node<'float'>) => {
      const angleA = u
        .mul(config.modeA.turns * TAU)
        .add(time.mul(config.modeA.speed * TAU).mul(variationSpeed))
        .add(phaseA)
      const angleB = u
        .mul(config.modeB.turns * TAU)
        .add(time.mul(config.modeB.speed * TAU).mul(variationSpeed))
        .add(phaseB)
      const radiusA = variationA.mul(config.modeA.radius)
      const radiusB = variationB.mul(config.modeB.radius)
      const combinedRadius = variationA
        .add(variationB)
        .mul(config.combinedModeRadius * 0.5)
      const frequencyA = config.modeA.turns * TAU
      const frequencyB = config.modeB.turns * TAU

      return vec3(
        angleA.sin().mul(radiusA.mul(-frequencyA)),
        angleB.cos().mul(radiusB.mul(frequencyB)),
        angleA
          .add(angleB)
          .cos()
          .mul(combinedRadius.mul(frequencyA + frequencyB)),
      ).normalize()
    }

    const initialNormal = (tangent: THREE.Node<'vec3'>) => {
      const referenceBlend = smoothstep(0.55, 0.9, tangent.y.abs())
      const reference = mix(
        vec3(0, 1, 0),
        vec3(0, 0, 1),
        referenceBlend,
      ).normalize()
      return reference
        .sub(tangent.mul(reference.dot(tangent)))
        .normalize()
    }

    const transportedNormal = (u: THREE.Node<'float'>) => {
      let previousTangent: THREE.Node<'vec3'> = curveTangent(float(0))
      let normal: THREE.Node<'vec3'> = initialNormal(previousTangent)

      for (let step = 1; step <= FRAME_TRANSPORT_STEPS; step += 1) {
        const sampleU = u.mul(step / FRAME_TRANSPORT_STEPS)
        const nextTangent = curveTangent(sampleU)
        const rotationAxis = previousTangent.cross(nextTangent)
        const denominator = previousTangent
          .dot(nextTangent)
          .add(1)
          .max(0.0001)
        normal = normal
          .add(rotationAxis.cross(normal))
          .add(
            rotationAxis
              .cross(rotationAxis.cross(normal))
              .div(denominator),
          )
          .normalize()
        previousTangent = nextTangent
      }

      return normal
        .sub(previousTangent.mul(normal.dot(previousTangent)))
        .normalize()
    }

    const surfaceData = (
      u: THREE.Node<'float'>,
      ringAngle: THREE.Node<'float'>,
      radiusScale: THREE.Node<'float'>,
      longitudinalOffset: THREE.Node<'float'>,
      circumferentialOffset: THREE.Node<'float'>,
      outwardOffset: THREE.Node<'float'>,
    ) => {
      const center = curvePoint(u)
      const tangent = curveTangent(u)
      const transported = transportedNormal(u)
      const binormal = tangent.cross(transported).normalize()
      const normal = binormal.cross(tangent).normalize()
      const radial = normal
        .mul(ringAngle.cos())
        .add(binormal.mul(ringAngle.sin()))
      const circumferential = normal
        .mul(ringAngle.sin().negate())
        .add(binormal.mul(ringAngle.cos()))

      return {
        position: center
          .add(radial.mul(radiusScale.mul(config.radius).add(outwardOffset)))
          .add(tangent.mul(longitudinalOffset))
          .add(circumferential.mul(circumferentialOffset)),
        normal: radial,
        tangent,
      }
    }

    const surface = surfaceData(
      uNode,
      angleNode,
      radiusScaleNode,
      longitudinalOffsetNode,
      circumferentialOffsetNode,
      outwardOffsetNode,
    )
    const sideNormal = surface.normal
      .sub(surface.tangent.mul(plateSlopeNode))
      .normalize()
    const localNormal = sideNormal
      .mul(float(1).sub(capNormalScaleNode.abs()))
      .add(surface.tangent.mul(capNormalScaleNode))
      .normalize()
    const quaternionVector = instanceQuaternion.xyz
    const twiceCross = quaternionVector.cross(localNormal).mul(2)
    const instanceNormal = localNormal
      .add(twiceCross.mul(instanceQuaternion.w))
      .add(quaternionVector.cross(twiceCross))
      .normalize()

    material.positionNode = surface.position
    material.normalNode = transformNormalToView(instanceNormal).normalize()
    return material
  }

  private setInstanceTransforms(): void {
    const random = this.createRandom(0x51a7c3)
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3(0, 0, 0)
    const rotation = new THREE.Quaternion()
    const scale = new THREE.Vector3(1, 1, 1)
    const euler = new THREE.Euler()
    const instanceQuaternions = new Float32Array(SCENE_CONFIG.tubes.count * 4)
    const [rotationX, rotationY, rotationZ] = SCENE_CONFIG.tubes.rotationSpread

    for (let index = 0; index < SCENE_CONFIG.tubes.count; index += 1) {
      euler.set(
        (random() - 0.5) * rotationX,
        (random() - 0.5) * rotationY,
        (random() - 0.5) * rotationZ,
      )
      rotation.setFromEuler(euler)
      rotation.toArray(instanceQuaternions, index * 4)
      matrix.compose(position, rotation, scale)
      this.tubeMesh.setMatrixAt(index, matrix)
      this.plateMesh.setMatrixAt(index, matrix)
    }

    this.tubeMesh.instanceMatrix.needsUpdate = true
    this.plateMesh.instanceMatrix.needsUpdate = true
    this.tubeGeometry.setAttribute(
      'instanceQuaternion',
      new THREE.InstancedBufferAttribute(instanceQuaternions, 4),
    )
    this.plateGeometry.setAttribute(
      'instanceQuaternion',
      new THREE.InstancedBufferAttribute(instanceQuaternions, 4),
    )
  }

  private createRandom(seed: number): () => number {
    let state = seed >>> 0
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return state / 0x100000000
    }
  }
}
