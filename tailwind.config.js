/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        reported: '#ef4444',
        progress: '#f59e0b',
        resolved: '#10b981',
      },
    },
  },
  plugins: [],
}
