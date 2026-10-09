import { useEffect } from 'react'
import { prefersReducedMotion } from '../media'
import { sports } from '../sports'
import { useFieldGuide } from '../store'

/** Délai maximal (ms) avant de changer de sport si la fin du fondu n'est pas signalée. */
const FADE_TIMEOUT_MS = 1000

/**
 * Fondu au noir entre deux sports : le nouveau terrain est monté une fois l'écran noir
 * (fin de la transition CSS), puis la scène réapparaît pendant l'arrivée de la caméra (voir CameraRig).
 */
export function SportTransition() {
  const sport = useFieldGuide((s) => s.sport)
  const requested = useFieldGuide((s) => s.requestedSport)
  const commitSport = useFieldGuide((s) => s.commitSport)
  const switching = sport !== requested

  // Filet de sécurité : sans animation, ou si transitionend ne se déclenche pas (onglet en arrière-plan…).
  useEffect(() => {
    if (!switching) return
    const timer = setTimeout(commitSport, prefersReducedMotion() ? 0 : FADE_TIMEOUT_MS)
    return () => { clearTimeout(timer) }
  }, [switching, requested, commitSport])

  return (
    <>
      <div
        aria-hidden="true"
        onTransitionEnd={() => { if (switching) commitSport() }}
        className={`pointer-events-none absolute inset-0 bg-slate-950 transition-opacity duration-300 motion-reduce:transition-none ${
          switching ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <p className="sr-only" aria-live="polite">
        {sports[sport].name}
      </p>
    </>
  )
}
