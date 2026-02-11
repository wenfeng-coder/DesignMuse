
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: '#1a1410',
      },
      fontFamily: {
        handwriting: ['Caveat', 'cursive'],
        body: ['Patrick Hand', 'cursive'],
      },
    },
  },
  plugins: [],
}
