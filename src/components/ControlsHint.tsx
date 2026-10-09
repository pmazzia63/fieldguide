import { useEffect, useState } from 'react'
import { isCoarsePointer } from '../media'
import { useFieldGuide } from '../store'

const STORAGE_KEY = 'fieldguide:controls-hint-seen'
/** Durée d'affichage maximale (ms) ; la première interaction le masque aussi. */
const DISPLAY_MS = 7000

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Stockage indisponible (navigation privée…) : l'aide réapparaîtra à la prochaine visite.
  }
}

/** Aide aux gestes (souris ou tactile), affichée à la première visite une fois la scène prête. */
export function ControlsHint() {
  const ready = useFieldGuide((s) => s.sceneReady)
  const [dismissed, setDismissed] = useState(alreadySeen)
  const visible = ready && !dismissed

  useEffect(() => {
    if (!visible) return
    const dismiss = () => {
      markSeen()
      setDismissed(true)
    }
    const timer = setTimeout(dismiss, DISPLAY_MS)
    window.addEventListener('pointerdown', dismiss, { once: true })
    window.addEventListener('wheel', dismiss, { once: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('wheel', dismiss)
    }
  }, [visible])

  if (!visible) return null
  const gestures = isCoarsePointer()
    ? ['Glissez pour pivoter', 'Pincez pour zoomer', 'Touchez un joueur']
    : ['Glissez pour pivoter', 'Molette pour zoomer', 'Clic droit pour déplacer', 'Cliquez sur un joueur']

  return (
    <p className="pointer-events-none absolute inset-x-4 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-2xl bg-slate-900/80 px-4 py-3 text-center text-sm text-slate-200 shadow-lg ring-1 ring-white/10 backdrop-blur">
      {gestures.join(' · ')}
    </p>
  )
}
