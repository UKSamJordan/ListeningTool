/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cambridge: {
          blue: '#002B49',
          navy: '#0b1d3a',
          gold: '#f59e0b',
          light: '#f8fafc',
          accent: '#2563eb',
        }
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        }
      },
      animation: {
        wave: 'wave 1s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
