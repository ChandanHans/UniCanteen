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
          50:  '#edf4f7',
          100: '#d2e8ef',
          200: '#ADC5CF',
          300: '#85b5c6',
          400: '#5aa5bb',
          500: '#3596B5',
          600: '#2e7d96',
          700: '#296073',
          800: '#1e4858',
          900: '#13303d',
        },
        accent: {
          300: '#b89fdd',
          400: '#9b7dd0',
          500: '#845EC2',
          600: '#6e4baa',
          700: '#573994',
        },
      },
    },
  },
  plugins: [],
}
