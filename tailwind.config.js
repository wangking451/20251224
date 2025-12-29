/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'synth-bg': '#090014',
        'synth-panel': '#150024',
        'neon-pink': '#ff00ff',
        'neon-cyan': '#00f9ff',
        'neon-yellow': '#ffd000',
        'neon-purple': '#b026ff',
      },
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'body': ['Rajdhani', 'sans-serif'],
        'mono': ['Courier New', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00FFFF, 0 0 20px #00FFFF',
        'neon-pink': '0 0 10px #FF00FF, 0 0 20px #FF00FF',
        'neon-purple': '0 0 10px #9D00FF, 0 0 20px #9D00FF',
      },
      animation: {
        'grid-move': 'gridMove 20s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        gridMove: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(40px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      }
    },
  },
  plugins: [],
}
