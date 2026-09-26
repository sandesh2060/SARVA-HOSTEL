export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sarva: {
          primary: '#5C2A3D',
          primaryHover: '#4A2231',
          primaryDark: '#3A1A26',
          primarySoft: '#F4E9EC',
          gold: '#C99A3B',
          goldSoft: '#FBF3E1',
          bg: '#F7F5F6',
          surface: '#FFFFFF',
          border: '#E7DEE1',
          text: '#241318',
          muted: '#7A6670',
          success: '#1F8A5F',
          warning: '#B7791F',
          danger: '#B3261E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(36,19,24,0.04), 0 1px 3px 0 rgba(36,19,24,0.06)',
        premium: '0 20px 40px -12px rgba(36,19,24,0.18)',
        'premium-sm': '0 8px 20px -8px rgba(36,19,24,0.14)',
      },
    },
  },
  plugins: [],
}
