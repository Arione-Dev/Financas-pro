/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F19',
          card: '#131B2E',
          border: '#1E293B',
          muted: '#94A3B8'
        },
        brand: {
          500: '#6366F1',
          600: '#4F46E5',
          emerald: '#10B981',
          rose: '#F43F5E',
          amber: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}

