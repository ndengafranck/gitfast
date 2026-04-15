import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    // Do NOT wipe dist/ before each rebuild in watch mode.
    // Wiping while Electron has files open causes EBUSY on Windows.
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
