import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Keep Firebase in its own long-cached chunk.
        advancedChunks: { groups: [{ name: 'firebase', test: /node_modules[\\/](@firebase|firebase)/ }] },
      },
    },
  },
})
