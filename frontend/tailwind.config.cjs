module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-900': '#0b0f17',
        'bg-800': '#0f1724',
        'brand-500': '#7c3aed',
        'brand-600': '#6d28d9',
        'accent-500': '#7dd3fc',
        'muted-400': '#9aa4b2'
      },
      borderRadius: {
        'xl-2': '1rem',
      },
      boxShadow: {
        'glow-md': '0 8px 24px rgba(124,58,237,0.14), 0 2px 6px rgba(2,6,23,0.45)'
      },
      keyframes: {
        shimmer: {
          '0%': { 'background-position': '0% 50%' },
          '100%': { 'background-position': '200% 50%' }
        }
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite'
      }
    },
  },
  plugins: [],
};