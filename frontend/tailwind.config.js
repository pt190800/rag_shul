/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Heebo', 'sans-serif'],
        serif: ['"Frank Ruhl Libre"', 'serif'],
      },
      colors: {
        teal:  { DEFAULT: '#0f766e', dark: '#115e59', light: '#ccfbf1' },
        gold:  { DEFAULT: '#b7791f', light: '#fef3c7' },
        ink:   { DEFAULT: '#111827', soft: '#263241' },
        page:  '#f6f2ea',
        paper: '#fffaf0',
        line:  '#ded6c8',
      },
      animation: {
        'fade-up':   'fadeUp 0.22s ease both',
        'pulse-dot': 'pulseDot 1s infinite ease-in-out',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)'   },
        },
        pulseDot: {
          '0%, 100%': { transform: 'translateY(0)',    opacity: '0.4' },
          '50%':      { transform: 'translateY(-5px)', opacity: '1'   },
        },
      },
    },
  },
  plugins: [],
}

