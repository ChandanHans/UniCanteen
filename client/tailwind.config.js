/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde4b8',
          200: '#fcd48a',
          300: '#fbc35c',
          400: '#fab63a',
          500: '#f9a825',
          600: '#f59322',
          700: '#ef7b1e',
          800: '#e8641b',
          900: '#dd3f16',
        },
      },
    },
  },
  plugins: [],
}
