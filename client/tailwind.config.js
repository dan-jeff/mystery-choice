/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Carnival wedge palette — used in rotation around the wheel.
        carnival: {
          red: '#ef4444',
          orange: '#fb923c',
          amber: '#fbbf24',
          mint: '#34d399',
          sky: '#38bdf8',
          violet: '#a78bfa',
          pink: '#f472b6',
          rose: '#fb7185',
        },
        // Backdrop tones: warm cream / sky / sunset.
        backdrop: {
          cream: '#fef3c7',
          peach: '#fed7aa',
          coral: '#fda4af',
          ink: '#1f1147', // for "dark" theme variant
        },
      },
      boxShadow: {
        chunky: '0 6px 0 rgba(0, 0, 0, 0.2)',
        'chunky-sm': '0 3px 0 rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
