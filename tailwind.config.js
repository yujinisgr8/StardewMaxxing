/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['Zpix', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Stardew Valley menu palette
        parchment: {
          DEFAULT: '#f5e3c0',
          light: '#fbeeca',
          dark: '#e8cf9f',
        },
        wood: {
          light: '#c98b4b',
          DEFAULT: '#8b5a2b',
          dark: '#6b4226',
          darker: '#4a2c17',
        },
        ink: {
          DEFAULT: '#552f1a',
          soft: '#7a512e',
        },
        coin: {
          DEFAULT: '#f3c33a',
          dark: '#c98a1e',
        },
        leaf: {
          DEFAULT: '#7ab317',
          light: '#b9d96b',
          dark: '#557d12',
        },
      },
      boxShadow: {
        // bevel highlight (top-left) + shade (bottom-right) for chunky pixel look
        bevel: 'inset 2px 2px 0 0 rgba(255,255,255,0.45), inset -2px -2px 0 0 rgba(0,0,0,0.30)',
        'bevel-in': 'inset -2px -2px 0 0 rgba(255,255,255,0.40), inset 2px 2px 0 0 rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
