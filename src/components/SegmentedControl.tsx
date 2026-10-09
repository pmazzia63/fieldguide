interface SegmentedControlProps<T extends string> {
  label: string
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (value: T) => void
  size?: 'md' | 'sm'
}

/** Groupe de boutons à choix unique, en pilule. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, size = 'md' }: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="pointer-events-auto flex gap-1 rounded-full bg-slate-900/85 p-1 shadow-lg ring-1 ring-white/10 backdrop-blur"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => { onChange(option.id) }}
          className={`rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
            size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs pointer-coarse:py-2'
          } ${option.id === value ? 'bg-slate-100 text-slate-900' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
