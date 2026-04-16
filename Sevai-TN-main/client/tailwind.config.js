/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1B5E20',
          'green-dark': '#0D3A10',
          'green-light': '#2E7D32',
          saffron: '#FF8F00',
          'saffron-dark': '#E65100',
          bg: '#FAFAF5',
          amber: '#FFB300',
          ink: '#1C1C1C',
          muted: '#6B6B6B',
        },
      },
      fontSize: {
        body: ['16px', { lineHeight: '1.6' }],
        head: ['24px', { lineHeight: '1.3' }],
        xxl: ['32px', { lineHeight: '1.2' }],
      },
      fontFamily: {
        sans: ['"Noto Sans Tamil"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        cardHover: '0 6px 18px rgba(0,0,0,0.10)',
      },
      animation: {
        'pulse-slow': 'pulse 2.2s ease-in-out infinite',
        'wave': 'wave 1s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
