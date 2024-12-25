/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00979D', // Arduino teal
        secondary: '#62AEB2',
        background: '#F5F5F5',
        error: '#FF5252',
        success: '#4CAF50',
        warning: '#FFC107',
      },
    },
  },
  plugins: [],
} 