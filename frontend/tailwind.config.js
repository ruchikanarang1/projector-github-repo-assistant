/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif']
      },
      colors: {
        obsidian: {
          950: '#07080b',
          900: '#090a0f',
          850: '#0d0e16',
          800: '#12141f',
          750: '#171928',
          700: '#1e2134',
        },
        steel: {
          900: '#1f2438',
          800: '#2a314c',
          700: '#384164',
          600: '#4e5b8a',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f8fafc',
        },
        tactical: {
          blue: '#2563eb',
          cyan: '#0284c7',
          amber: '#d97706',
          emerald: '#059669',
        }
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
        'subtle-grid': "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
