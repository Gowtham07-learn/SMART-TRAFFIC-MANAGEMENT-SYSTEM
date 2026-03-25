/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020617',
        },
        traffic: {
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444',
          orange: '#f97316',
          blue: '#2563eb',
        }
      },
    },
  },
  plugins: [],
}
