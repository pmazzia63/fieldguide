import { Scene } from './components/Scene'

export default function App() {
  return (
    <main className="relative h-full">
      <Scene />
      <header className="pointer-events-none absolute inset-x-0 top-0 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">FieldGuide</h1>
        <p className="text-sm text-slate-400">Basket · Football américain · Baseball</p>
      </header>
    </main>
  )
}
