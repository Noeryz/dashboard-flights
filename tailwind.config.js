/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#020617',
          panel: 'rgba(15, 23, 42, 0.65)',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
      },
      backdropBlur: {
        xl: '20px',
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.25)',
        'glow-violet': '0 0 25px rgba(139, 92, 246, 0.25)',
        'glow-rose': '0 0 25px rgba(244, 63, 94, 0.25)',
      },
      animation: {
        'radar-spin': 'spin 5s linear infinite',
      },
    },
  },
  plugins: [],
};