import { defineConfig } from 'vite'
import { VitePluginRadar } from 'vite-plugin-radar'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePluginRadar({
      // Google Analytics tag injection
      analytics: {
        id: 'G-95MKMKP20C',
      },
    })
  ],
  base: "/glider-tactics-game/"
})
