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
        darkBg: '#070B14',
        darkBgStrong: '#0A1220',
        darkSurface: '#101827',
        darkElevated: '#151E2F',
        darkInput: '#0D1626',
        darkLine: '#243148',
        brandPrimary: '#3B82F6',
        brandSecondary: '#8B5CF6',
        brandCyan: '#22D3EE',
      },
    },
  },
  plugins: [],
}
