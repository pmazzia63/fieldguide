import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

/** Scène vide : un sol de 30 × 30 m centré sur l'origine. */
export function Scene() {
  return (
    <Canvas camera={{ position: [0, 18, 22], fov: 45 }} shadows>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <gridHelper args={[30, 30, '#475569', '#334155']} position={[0, 0.01, 0]} />
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  )
}
