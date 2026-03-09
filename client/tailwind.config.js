/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f2f9f2',
          100: '#e0f2e0',
          200: '#bbdebb',
          300: '#88c488',
          400: '#55a855',
          500: '#319031',
          600: '#1e7a1e',
          700: '#186018',
          800: '#164d16',
          900: '#133f13',
        },
      },
      backgroundImage: {
        'leaf-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2388c488' fill-opacity='0.07'%3E%3Cellipse cx='30' cy='20' rx='10' ry='16' transform='rotate(-30 30 20)'/%3E%3Cellipse cx='42' cy='42' rx='8' ry='13' transform='rotate(20 42 42)'/%3E%3Cellipse cx='12' cy='44' rx='7' ry='12' transform='rotate(-15 12 44)'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
