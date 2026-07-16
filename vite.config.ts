import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// ─── Deploy target ────────────────────────────────────────────────────────────
// Change to '/' for Firebase Hosting, '/MoneyTr/' for GitHub Pages.
const BASE_URL = '/MoneyTr/'

export default defineConfig({
  base: BASE_URL,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'DebtTrack',
        short_name: 'DebtTrack',
        description: 'Зручний облік взаємних боргів та спільних витрат',
        start_url: BASE_URL,
        scope: BASE_URL,
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#FAF7F2',
        theme_color: '#5C3D2E',
        lang: 'uk',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: `${BASE_URL}pwa-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${BASE_URL}pwa-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: `${BASE_URL}pwa-512x512-maskable.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: `${BASE_URL}index.html`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'debttrack-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'debttrack-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Google Fonts stylesheets — StaleWhileRevalidate for CSS
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Google Fonts webfont files — CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
        // Do NOT cache Firebase Auth, Firestore, or any API requests
        navigateFallbackDenylist: [
          /^\/__(\/.*)?$/, // Firebase reserved URLs
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
