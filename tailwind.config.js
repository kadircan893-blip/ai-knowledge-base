/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        purple: {
          400: '#a78bfa',
          500: '#8B5CF6',
          600: '#7c3aed',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06B6D4',
          600: '#0891b2',
        },
        pink: {
          400: '#f472b6',
          500: '#EC4899',
          600: '#db2777',
        },
        emerald: {
          400: '#34d399',
          500: '#10B981',
          600: '#059669',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.4)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.4)',
      },
    },
  },
  plugins: [],
}
