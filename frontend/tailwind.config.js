/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1e293b',
          purple: '#6366f1',
          main: '#3b82f6',
          light: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
