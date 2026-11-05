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
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        noir: {
          950: '#060608',
          900: '#09090b',
          850: '#101014',
          800: '#141418',
          750: '#1c1c22',
          700: '#25252c',
        },
        ivory: {
          50: '#fdfcfb',
          100: '#f7f6f3',
          200: '#eceae4',
          300: '#ded9cd',
          400: '#c5bda9',
          500: '#9e9581',
        },
        champagne: {
          50: '#faf8f3',
          100: '#f3eedf',
          200: '#e6dac1',
          300: '#d7c29e',
          400: '#c5a777',
          500: '#ad8d56',
          600: '#8c6e3e',
        }
      }
    },
  },
  plugins: [],
}
