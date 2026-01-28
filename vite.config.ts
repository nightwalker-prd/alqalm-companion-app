import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'icons/*.svg',
        'icons/*.png',
      ],
      manifest: {
        name: 'Madina Arabic - Interactive Learning',
        short_name: 'Madina Arabic',
        description: 'Interactive Arabic learning through the Madina Book series with spaced repetition',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0D7377',
        orientation: 'portrait-primary',
        categories: ['education', 'books'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-167.png',
            sizes: '167x167',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/dashboard.png',
            sizes: '1024x1366',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard - Track your Arabic learning progress'
          }
        ]
      },
      workbox: {
        // Precache all built assets
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2}'
        ],
        // Don't precache source maps
        globIgnores: ['**/*.map'],
        // Increase max file size to handle large content files
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Runtime caching strategies
        runtimeCaching: [
          // Cache Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache Google Fonts webfonts
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache content JSON files (lessons, vocabulary, etc.)
          {
            urlPattern: /\/content\/.*\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'content-json-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache images
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache Convex API calls with network-first strategy
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'convex-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Clean old caches
        cleanupOutdatedCaches: true,
        // Skip waiting to activate new service worker immediately
        skipWaiting: false,
        clientsClaim: true,
        // Navigation fallback for SPA
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      },
      // Dev options
      devOptions: {
        enabled: false // Enable for testing in dev mode if needed
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React into its own chunk for better caching
          // React changes less frequently than app code
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
