import { OrbitControls, Sky } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { type ComponentRef, useEffect, useMemo, useRef } from 'react'
import { MathUtils, PerspectiveCamera, TOUCH, Vector3 } from 'three'
import { isCoarsePointer, isNarrowScreen, prefersReducedMotion } from '../media'
import { findPosition, sports } from '../sports'
import { useFieldGuide } from '../store'
import type { SportId } from '../types'
import { BaseballField } from './fields/BaseballField'
import { BasketballCourt } from './fields/BasketballCourt'
import { FootballField } from './fields/FootballField'
import { playerStyle } from './players/playerConfig'
import { Players } from './players/Players'
import { sceneConfigs, type SportSceneConfig } from './sceneConfig'

const INDOOR_BACKGROUND = '#0b1020'

/** Cadrage d'un joueur sélectionné : point visé (poitrine), distance et élévation de la caméra. */
const FOCUS = { height: 1.1, distance: 7, elevation: MathUtils.degToRad(28) }
/** Vitesse d'approche exponentielle de la caméra (1/s) et seuil d'arrivée (m). */
const FLIGHT_SPEED = 3.5
const FLIGHT_EPSILON = 0.02
/** Arrivée sur un terrain : rotation autour du point visé et recul initial. */
const INTRO = { angle: MathUtils.degToRad(-35), zoom: 1.4 }
/** Nombre d'images rendues avant de masquer l'écran de chargement. */
const READY_AFTER_FRAMES = 2
/** Décalage vertical du rendu (fraction de la hauteur) quand la fiche couvre le bas de l'écran mobile. */
const SHEET_VIEW_SHIFT = 0.22
/** Résolution des ombres : réduite sur mobile pour préserver la fluidité. */
const SHADOW_MAP_SIZE = isCoarsePointer() ? 2048 : 4096

interface Flight {
  target: Vector3
  camera: Vector3
}

function Field({ sport }: { sport: SportId }) {
  switch (sport) {
    case 'basketball':
      return <BasketballCourt />
    case 'football':
      return <FootballField />
    case 'baseball':
      return <BaseballField />
  }
}

/** Ciel ou salle, et éclairage adapté à la taille du terrain. */
function Atmosphere({ config }: { config: SportSceneConfig }) {
  const { sun, shadowExtent: e, outdoor } = config
  return (
    <>
      {outdoor ? (
        <Sky sunPosition={sun} turbidity={6} rayleigh={1.2} />
      ) : (
        <>
          <color attach="background" args={[INDOOR_BACKGROUND]} />
          <fog attach="fog" args={[INDOOR_BACKGROUND, 35, 90]} />
        </>
      )}
      <hemisphereLight args={outdoor ? ['#dbeafe', '#3f6212', 1.2] : ['#e2e8f0', '#1e293b', 0.8]} />
      <directionalLight
        position={sun}
        intensity={outdoor ? 2.4 : 2}
        castShadow
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-e}
        shadow-camera-right={e}
        shadow-camera-top={e}
        shadow-camera-bottom={-e}
        shadow-camera-near={1}
        shadow-camera-far={Math.hypot(...sun) + e}
      />
    </>
  )
}

/** Cadrage du poste sélectionné, vu depuis le côté où se trouve déjà la caméra. */
function focusOn(sport: SportId, positionId: string, from: Vector3, config: SportSceneConfig): Flight | null {
  const found = findPosition(sport, positionId)
  if (!found) return null
  const { view, position } = found
  const ground = playerStyle(sport, view.id, position.id).elevation ?? 0
  const target = new Vector3(position.x, ground + FOCUS.height, position.z)

  const horizontal = new Vector3(from.x - target.x, 0, from.z - target.z)
  if (horizontal.lengthSq() < 1e-6) horizontal.set(0, 0, 1)
  horizontal.normalize()
  const distance = MathUtils.clamp(FOCUS.distance, config.minDistance, config.maxDistance)
  const camera = target
    .clone()
    .addScaledVector(horizontal, distance * Math.cos(FOCUS.elevation))
    .setY(target.y + distance * Math.sin(FOCUS.elevation))
  return { target, camera }
}

/** Cadrage d'une vue (barycentre de ses joueurs), ou du terrain entier ; l'angle de vue est conservé. */
function frameView(sport: SportId, viewId: string | null, from: Flight, config: SportSceneConfig): Flight {
  const positions = sports[sport].views.find((v) => v.id === viewId)?.positions ?? []
  const target = new Vector3(...config.target)
  if (positions.length > 0) {
    target.set(0, 0, 0)
    for (const p of positions) target.add(new Vector3(p.x, 0, p.z))
    target.divideScalar(positions.length)
  }
  return { target, camera: from.camera.clone().sub(from.target).add(target) }
}

/** Point de départ de l'arrivée sur un terrain : plus loin et décalé autour du point visé. */
function introPosition(config: SportSceneConfig): Vector3 {
  const target = new Vector3(...config.target)
  const offset = new Vector3(...config.camera).sub(target)
  const zoom = Math.min(INTRO.zoom, config.maxDistance / offset.length())
  return offset.applyAxisAngle(UP, INTRO.angle).multiplyScalar(zoom).add(target)
}

const UP = new Vector3(0, 1, 0)

/**
 * Contrôles orbitaux bornés : la caméra ne descend pas sous l'horizon du point visé,
 * et ce point reste au-dessus du sol, à proximité du terrain.
 * La caméra se déplace en douceur vers : le terrain (changement de sport, recentrage),
 * le joueur sélectionné, la vue affichée. Toute manipulation interrompt le déplacement.
 * Une seule pression du doigt fait pivoter, deux doigts zooment et déplacent.
 */
function CameraRig({ config }: { config: SportSceneConfig }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const camera = useThree((s) => s.camera)
  const flight = useRef<Flight | null>(null)
  const [min, max] = useMemo(
    () => [new Vector3(...config.targetBounds.min), new Vector3(...config.targetBounds.max)],
    [config],
  )

  // Arrivée sur le terrain à chaque changement de sport.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const home: Flight = { target: new Vector3(...config.target), camera: new Vector3(...config.camera) }
    c.target.copy(home.target)
    c.object.position.copy(prefersReducedMotion() ? home.camera : introPosition(config))
    c.update()
    flight.current = home
  }, [config])

  // Réactions aux actions de l'interface, le sport restant le même (sinon voir ci-dessus).
  useEffect(
    () =>
      useFieldGuide.subscribe((state, prev) => {
        const c = controls.current
        if (!c || state.sport !== prev.sport) return
        const sceneConfig = sceneConfigs[state.sport]
        const current: Flight = { target: c.target.clone(), camera: c.object.position.clone() }
        if (state.cameraResets !== prev.cameraResets) {
          flight.current = { target: new Vector3(...sceneConfig.target), camera: new Vector3(...sceneConfig.camera) }
        } else if (state.selectedPositionId && state.selectedPositionId !== prev.selectedPositionId) {
          flight.current = focusOn(state.sport, state.selectedPositionId, current.camera, sceneConfig)
        } else if (state.viewId !== prev.viewId) {
          flight.current = frameView(state.sport, state.viewId, current, sceneConfig)
        } else if (!state.selectedPositionId && prev.selectedPositionId) {
          flight.current = null
        }
      }),
    [],
  )

  useFrame((_, delta) => {
    const c = controls.current
    const f = flight.current
    if (!c || !f) return
    const t = prefersReducedMotion() ? 1 : 1 - Math.exp(-FLIGHT_SPEED * delta)
    c.target.lerp(f.target, t)
    c.object.position.lerp(f.camera, t)
    c.update()
    if (c.object.position.distanceTo(f.camera) < FLIGHT_EPSILON && c.target.distanceTo(f.target) < FLIGHT_EPSILON) {
      flight.current = null
    }
  })

  const clampTarget = () => {
    const c = controls.current
    if (!c) return
    // Décale caméra et cible ensemble pour ne pas modifier l'angle de vue.
    const delta = c.target.clone().clamp(min, max).sub(c.target)
    if (delta.lengthSq() === 0) return
    c.target.add(delta)
    c.object.position.add(delta)
  }

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      camera={camera}
      enableDamping
      minDistance={config.minDistance}
      maxDistance={config.maxDistance}
      maxPolarAngle={Math.PI / 2 - 0.1}
      touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
      onChange={clampTarget}
      onStart={() => { flight.current = null }}
    />
  )
}

/**
 * Sur mobile, la fiche du poste couvre le bas de l'écran : le rendu est décalé vers le haut
 * pour que le joueur sélectionné (au centre de l'image) reste visible au-dessus de la feuille.
 */
function SheetViewOffset() {
  const sheetOpen = useFieldGuide((s) => s.selectedPositionId !== null)
  const shift = useRef(0)
  useFrame(({ camera, size }, delta) => {
    if (!(camera instanceof PerspectiveCamera)) return
    const goal = sheetOpen && isNarrowScreen() ? SHEET_VIEW_SHIFT : 0
    if (goal === 0 && shift.current === 0) {
      if (camera.view?.enabled) camera.clearViewOffset()
      return
    }
    // Réappliqué à chaque image tant que le décalage est actif : suit aussi les redimensionnements.
    const next = prefersReducedMotion() ? goal : MathUtils.damp(shift.current, goal, FLIGHT_SPEED, delta)
    shift.current = Math.abs(next - goal) < 0.001 ? goal : next
    if (shift.current === 0) camera.clearViewOffset()
    else camera.setViewOffset(size.width, size.height, 0, shift.current * size.height, size.width, size.height)
  })
  return null
}

/** Signale la scène comme prête une fois les premières images rendues (shaders compilés). */
function ReadySignal() {
  const frames = useRef(0)
  const setSceneReady = useFieldGuide((s) => s.setSceneReady)
  useFrame(() => {
    frames.current += 1
    if (frames.current === READY_AFTER_FRAMES) setSceneReady()
  })
  return null
}

export function Scene() {
  const sport = useFieldGuide((s) => s.sport)
  const viewId = useFieldGuide((s) => s.viewId)
  const config = sceneConfigs[sport]
  const selectPosition = useFieldGuide((s) => s.selectPosition)
  return (
    // `isolate` garde les labels HTML des joueurs sous l'interface superposée.
    <Canvas
      className="isolate"
      shadows
      dpr={[1, 2]}
      camera={{ position: config.camera, fov: 45, near: 1, far: 3000 }}
      onPointerMissed={() => { selectPosition(null) }}
      fallback={<p>Terrain de {sports[sport].name} en 3D. La liste des postes est disponible via le bouton « Liste des postes ».</p>}
    >
      {/* La clé remonte l'éclairage pour recalculer la caméra d'ombre. */}
      <Atmosphere key={sport} config={config} />
      <Field sport={sport} />
      <Players sport={sport} viewId={viewId} />
      <CameraRig config={config} />
      <SheetViewOffset />
      <ReadySignal />
    </Canvas>
  )
}
