/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF6F2',
        pearl: '#FFFDFB',
        espresso: '#2A201D',
        mocha: '#6E5A54',
        dusty: {
          DEFAULT: '#C87A72',
          deep: '#B86566',
          soft: '#F7EAE7',
        },
        champagne: {
          DEFAULT: '#C59B5F',
          soft: '#F6EFE3',
        },
        linen: '#E9D9CF',
      },
    },
  },
  plugins: [],
};
