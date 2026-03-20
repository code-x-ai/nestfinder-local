/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brick-primary': '#A0522D',   // Sienna
        'brick-secondary': '#CD853F', // Peru
        'brick-accent': '#E6C2A5',    // Soft peach
        'charcoal': '#2D3748',        // Dark text
        'off-white': '#F7FAFC',       // Background
        'warm-gray': '#718096',       // Secondary text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        'floating': '0 4px 12px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}