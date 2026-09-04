import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // El puerto del preview va fijo y con strictPort a proposito: sin el,
  // vite se cambia de puerto en silencio si el 4173 esta ocupado por otra
  // app del reto y acabas capturando la portada equivocada.
  server: { proxy: { '/api': 'http://localhost:3008' } },
  preview: { proxy: { '/api': 'http://localhost:3008' } },
})
