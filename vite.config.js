import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',  // Usar nuestra propia implementación de SW
      srcDir: 'public',
      filename: 'sw.js',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Barbershop App',
        short_name: 'Barbershop',
        description: 'Aplicación para gestión de barbería',
        theme_color: '#e11d48',
        icons: [
          {
            src: '/Rojo negro.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/Rojo negro.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      injectManifest: {
        injectionPoint: null, // No buscamos punto de inyección ya que tenemos nuestro propio SW
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp}',
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})