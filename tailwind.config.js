/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // La herramienta es roca oscura; el informe es papel claro.
        // Esa division no es decorativa: el informe se imprime y se entrega.
        roca: '#14161A',
        roca2: '#1E2127',
        roca3: '#2C3038',
        hueso: '#F6F4F0',
        panel: '#FFFFFF',
        borde: '#E4DED4',
        bordeOscuro: '#343841',
        tinta: '#17150F',
        // Tonos SOLIDOS para texto secundario, no opacidades (§13.5).
        // 6.4:1 sobre hueso / 6.1:1 sobre roca.
        tinta2: '#575048',
        humo: '#A9AFBA',
        // El acento necesita dos tonos: uno cumple sobre claro, otro sobre
        // oscuro. Ninguno cumple en los dos a la vez.
        veta: '#8A5A00',
        vetaClara: '#E9B44C',
        ok: '#1B6B4F',
        okClaro: '#5FD3A4',
        aviso: '#8A6410',
        avisoClaro: '#E0B24F',
        fallo: '#A33726',
        falloClaro: '#F08D7A',
      },
      fontFamily: {
        titulo: ['Fraunces', 'Georgia', 'serif'],
        texto: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
