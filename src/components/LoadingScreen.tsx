import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../media'
import { useFieldGuide } from '../store'

/** Durée du fondu de sortie (ms), identique à la classe `duration-500` ci-dessous. */
const FADE_MS = 500

/**
 * Écran de chargement affiché jusqu'au premier rendu de la scène 3D.
 * Il prend le relais de #boot-loader (index.html), affiché pendant le téléchargement du code.
 */
export function LoadingScreen() {
  const ready = useFieldGuide((s) => s.sceneReady)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => { setGone(true) }, prefersReducedMotion() ? 0 : FADE_MS)
    return () => { clearTimeout(timer) }
  }, [ready])

  if (gone) return null
  return (
    <div
      role="status"
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 transition-opacity duration-500 motion-reduce:transition-none ${
        ready ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-full border-4 border-slate-700 border-t-amber-400 motion-reduce:animate-none"
      />
      <p className="text-sm text-slate-300">Chargement du terrain 3D…</p>
    </div>
  )
}
