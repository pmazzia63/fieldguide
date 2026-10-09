import { type PointerEvent, type ReactNode, useState } from 'react'

/** Distance de glissement vers le bas (px) au-delà de laquelle la feuille se ferme. */
const CLOSE_DRAG = 80

interface SheetProps {
  id?: string
  labelledBy: string
  /** Côté du panneau flottant sur grand écran */
  side: 'left' | 'right'
  onClose: () => void
  children: ReactNode
}

/**
 * Panneau superposé à la scène : feuille ancrée en bas sur mobile (fermeture par glissement
 * de la poignée vers le bas), panneau flottant sur le côté à partir de `sm`.
 */
export function Sheet({ id, labelledBy, side, onClose, children }: SheetProps) {
  const [drag, setDrag] = useState<{ start: number; offset: number } | null>(null)

  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ start: e.clientY, offset: 0 })
  }
  const moveDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (drag) setDrag({ ...drag, offset: Math.max(0, e.clientY - drag.start) })
  }
  const endDrag = () => {
    if (drag && drag.offset > CLOSE_DRAG) onClose()
    setDrag(null)
  }

  return (
    <aside
      id={id}
      aria-labelledby={labelledBy}
      style={drag ? { transform: `translateY(${String(drag.offset)}px)` } : undefined}
      className={`absolute inset-x-0 bottom-0 z-20 flex max-h-[75dvh] flex-col rounded-t-2xl bg-slate-900/95 shadow-2xl ring-1 ring-white/10 backdrop-blur motion-safe:animate-sheet-up sm:inset-x-auto sm:top-24 sm:bottom-auto sm:max-h-[calc(100%-14rem)] sm:w-96 sm:rounded-2xl sm:bg-slate-900/90 ${
        side === 'right' ? 'sm:right-6 motion-safe:sm:animate-slide-right' : 'sm:left-6 motion-safe:sm:animate-slide-left'
      } ${drag ? '' : 'transition-transform'}`}
    >
      <div
        aria-hidden="true"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => { setDrag(null) }}
        className="flex shrink-0 cursor-grab touch-none justify-center py-3 active:cursor-grabbing sm:hidden"
      >
        <span className="h-1.5 w-10 rounded-full bg-white/30" />
      </div>
      <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5">
        {children}
      </div>
    </aside>
  )
}

/** Bouton ✕ de fermeture d'un panneau. */
export function CloseButton({ label = 'Fermer', onClick }: { label?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="-m-1 shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400 pointer-coarse:p-2.5"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
      </svg>
    </button>
  )
}
