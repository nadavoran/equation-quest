import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/ios/*.png', 'icons/android/*.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'EquationQuest',
        short_name: 'EqQuest',
        description: 'Math adventures for curious kids — equations, challenges and fun!',
        theme_color: '#6c5ce7',
        background_color: '#6c5ce7',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
})
