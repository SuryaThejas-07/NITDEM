/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F97316',
          amber: '#F59E0B',
          red: '#EF4444',
          green: '#22C55E',
          blue: '#3B82F6',
          cyan: '#06B6D4',
        },
        surface: {
          900: '#0A0C10',
          800: '#0F1117',
          700: '#151820',
          600: '#1C202B',
          500: '#242836',
          400: '#2E3347',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}
