import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { staticPositions } from './scripts/static-positions.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), staticPositions()],
})
