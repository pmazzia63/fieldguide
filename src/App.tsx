import { useEffect } from 'react'
import { ControlsHint } from './components/ControlsHint'
import { LoadingScreen } from './components/LoadingScreen'
import { POSITION_LIST_ID, PositionList } from './components/PositionList'
import { PositionPanel } from './components/PositionPanel'
import { Scene } from './components/Scene'
import { SceneErrorBoundary } from './components/SceneErrorBoundary'
import { SportSelector } from './components/SportSelector'
import { SportTransition } from './components/SportTransition'
import { useFieldGuide } from './store'

const TOOL_BUTTON =
  'pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900/85 px-3 py-2 text-sm font-medium text-slate-200 shadow-lg ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 pointer-coarse:p-2.5'

/** Échap ferme la fiche du poste, puis la liste. */
function useEscapeKey() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const { selectedPositionId, listOpen, selectPosition, setListOpen } = useFieldGuide.getState()
      if (selectedPositionId) selectPosition(null)
      else if (listOpen) setListOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [])
}

function Toolbar() {
  const listOpen = useFieldGuide((s) => s.listOpen)
  const setListOpen = useFieldGuide((s) => s.setListOpen)
  const resetCamera = useFieldGuide((s) => s.resetCamera)
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        aria-expanded={listOpen}
        aria-controls={POSITION_LIST_ID}
        onClick={() => { setListOpen(!listOpen) }}
        className={TOOL_BUTTON}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path d="M7 5h10M7 10h10M7 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01" strokeLinecap="round" />
        </svg>
        <span className="pointer-coarse:sr-only">Liste des postes</span>
      </button>
      <button type="button" title="Recentrer la vue" onClick={resetCamera} className={TOOL_BUTTON}>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path d="M3.5 10a6.5 6.5 0 1 0 2-4.7M3.5 3.5v3h3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">Recentrer la vue</span>
      </button>
    </div>
  )
}

export default function App() {
  useEscapeKey()
  return (
    <main className="relative h-full overflow-hidden">
      <SceneErrorBoundary>
        <Scene />
      </SceneErrorBoundary>
      <SportTransition />
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-linear-to-b from-slate-950/70 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">FieldGuide</h1>
          <p className="text-sm text-slate-300">Basket · Football américain · Baseball</p>
        </div>
        <Toolbar />
      </header>
      <PositionList />
      <ControlsHint />
      <SportSelector />
      <PositionPanel />
      <LoadingScreen />
    </main>
  )
}
