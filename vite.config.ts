import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Repo name on GitHub Pages: https://<user>.github.io/czech-please/
const REPO_BASE = '/czech-please/'

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Files in /public are served at the app root; we precache the whole shell + data.
      includeAssets: ['favicon.svg', 'icons/*.png', '404.html'],
      manifest: {
        name: 'Czech, Please',
        short_name: 'Czech, Please',
        description:
          'Offline English↔Czech travel reference: dictionary, phrases, grammar and conjugation.',
        lang: 'en',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#11324d',
        theme_color: '#11324d',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell AND every data file so the app is fully usable offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2}'],
        // The dictionary shard is large; raise the limit so it gets precached.
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
