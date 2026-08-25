/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AURA 2026 Submission Design Tokens
        auraDark: '#0B1F3A',
        auraSecondary: '#123B66',
        auraAccent: '#2563EB',
        auraLight: '#F8FAFC',
        auraMuted: '#64748B',
        auraBorder: '#CBD5E1',

        // Original Cyber/Cockpit Theme Tokens
        'cyber-text': '#0F172A',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}