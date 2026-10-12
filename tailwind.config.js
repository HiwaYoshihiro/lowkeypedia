/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wiki: {
          blue: '#1d4ed8',
          darkblue: '#1e3a8a',
          navy: '#0f1b3d',
          gold: '#d4a017',
        },
      },
    },
  },
  plugins: [],
};
