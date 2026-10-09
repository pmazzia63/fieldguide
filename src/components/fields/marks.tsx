import { useLayoutEffect, useMemo, useRef } from 'react'
import { Euler, type InstancedMesh, Matrix4, Quaternion, Shape, Vector3 } from 'three'
import { LAYER, localTheta, type Rect, type XZ } from './geometry'

const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0]
const WHITE = '#f8fafc'

interface Layered {
  color?: string
  y?: number
}

/** Ensemble de rectangles plats (lignes, hachures…) rendus en un seul InstancedMesh. */
export function Lines({ rects, color = WHITE, y = LAYER.line }: Layered & { rects: readonly Rect[] }) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4()
    const position = new Vector3()
    const rotation = new Quaternion()
    const euler = new Euler()
    const scale = new Vector3()
    rects.forEach((r, i) => {
      position.set(r.x, y, r.z)
      rotation.setFromEuler(euler.set(-Math.PI / 2, 0, -(r.angle ?? 0)))
      scale.set(r.sx, r.sz, 1)
      mesh.setMatrixAt(i, matrix.compose(position, rotation, scale))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [rects, y])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, rects.length]} receiveShadow>
      <planeGeometry />
      <meshStandardMaterial color={color} roughness={0.9} />
    </instancedMesh>
  )
}

interface ArcProps extends Layered {
  center: XZ
  /** Rayon de l'axe de la ligne */
  radius: number
  width: number
  /** Angle de départ (de +x vers +z) et ouverture, en radians */
  start?: number
  length?: number
}

/** Ligne courbe (arc de cercle) d'épaisseur `width`. */
export function Arc({ center, radius, width, start = 0, length = Math.PI * 2, color = WHITE, y = LAYER.line }: ArcProps) {
  const segments = Math.min(256, Math.max(16, Math.ceil(radius * length * 4)))
  return (
    <mesh position={[center[0], y, center[1]]} rotation={FLAT} receiveShadow>
      <ringGeometry args={[radius - width / 2, radius + width / 2, segments, 1, localTheta(start, length), length]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

/** Arc découpé en tirets réguliers. */
export function DashedArc({ dashes, ...props }: ArcProps & { dashes: number }) {
  const start = props.start ?? 0
  const step = (props.length ?? Math.PI * 2) / dashes
  return Array.from({ length: dashes }, (_, i) => (
    <Arc key={i} {...props} start={start + i * step + step / 4} length={step / 2} />
  ))
}

interface DiscProps extends Required<Layered> {
  center: XZ
  radius: number
  start?: number
  length?: number
}

/** Surface pleine en disque ou secteur de disque. */
export function Disc({ center, radius, color, y, start = 0, length = Math.PI * 2 }: DiscProps) {
  return (
    <mesh position={[center[0], y, center[1]]} rotation={FLAT} receiveShadow>
      <circleGeometry args={[radius, Math.min(128, Math.max(24, Math.ceil(radius * length * 2))), localTheta(start, length), length]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  )
}

/** Surface pleine rectangulaire alignée sur les axes. */
export function Area({ center, size, color, y }: Required<Layered> & { center: XZ; size: XZ }) {
  return (
    <mesh position={[center[0], y, center[1]]} rotation={FLAT} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  )
}

/** Surface pleine polygonale (points dans le plan du sol). */
export function Polygon({ points, color, y }: Required<Layered> & { points: readonly XZ[] }) {
  const shape = useMemo(() => {
    const s = new Shape()
    points.forEach(([x, z], i) => {
      if (i === 0) s.moveTo(x, -z)
      else s.lineTo(x, -z)
    })
    return s
  }, [points])

  return (
    <mesh position={[0, y, 0]} rotation={FLAT} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  )
}
