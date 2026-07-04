/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        milk: '#FAF7F2',
        beige: '#F0EAD6',
        cream: '#E8DCC8',
        sand: '#D4C5A9',
        'warm-gray': '#8B8174',
        chocolate: {
          DEFAULT: '#5C3D2E',
          light: '#7A5544',
          dark: '#3D2218',
        },
        olive: {
          DEFAULT: '#6B7C45',
          light: '#859C55',
          dark: '#4F5C32',
        },
        amber: {
          DEFAULT: '#D48B30',
          light: '#E8A84A',
          dark: '#B07020',
        },
        rose: {
          DEFAULT: '#C0544E',
          light: '#D4706A',
          dark: '#9C3C36',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(92, 61, 46, 0.08)',
        'card-hover': '0 4px 24px rgba(92, 61, 46, 0.14)',
        'card-lg': '0 8px 32px rgba(92, 61, 46, 0.12)',
      },
    },
  },
  plugins: [],
}
