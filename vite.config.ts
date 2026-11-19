import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'sw-notifications.js',
        ],
        manifest: {
          id: '/',
          name: 'مواقيت الصلاة والأذان - Al-Mawaqeet',
          short_name: 'المواقيت',
          description:
            'تطبيق مواقيت الصلاة والأذان بأصوات أشهر الشيوخ مع الرقية الشرعية والأذكار يعمل بدون إنترنت',
          theme_color: '#064e3b',
          background_color: '#03120f',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          dir: 'rtl',
          lang: 'ar',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: '📖 وِرد اليوم',
              short_name: 'وِرد اليوم',
              description: 'فتح وِرد القرآن اليومي لختمة الشهر',
              url: '/?shortcut=wird',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: '🤲 الاستخارة والحاجة',
              short_name: 'الاستخارة',
              description: 'دليل ودعاء صلاة الاستخارة وقضاء الحاجة',
              url: '/?shortcut=istikhara',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: '🖥️ وضع المنضدة',
              short_name: 'المنضدة',
              description: 'شاشة المنضدة الذكية الأفقية المريحة للعين',
              url: '/?mode=standby',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          importScripts: ['/sw-notifications.js'],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallback: 'index.html',
          runtimeCaching: [
            {
              urlPattern: /\/audio\/.*\.(mp3|m4a|wav|ogg)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'almawaqeet-offline-audio-v1',
                rangeRequests: true,
                expiration: {
                  maxEntries: 350,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200, 206],
                },
              },
            },
            {
              urlPattern:
                /^https:\/\/(everyayah\.com|archive\.org|dn\d+\.ca\.archive\.org|www\.hisnmuslim\.com|ar\.assabile\.com|media\.assabile\.com|server\d+\.mp3quran\.net|www\.islamcan\.com)\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'almawaqeet-offline-audio-v1',
                rangeRequests: true,
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200, 206],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
