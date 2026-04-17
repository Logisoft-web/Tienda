/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#F4622A',
        secondary: '#E8920A',
        accent:    '#F5C842',
        dark:      '#0F0B08',
        'dark-card':   '#1A1410',
        'dark-raised': '#231C16',
        'dark-hover':  '#2E2419',
        'text-base':   '#F5EDE4',
        'text-muted':  '#A8917E',
        'text-dim':    '#6B5545',
        light: '#F5EDE4',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body:    ['Nunito', 'sans-serif'],
        sans:    ['Nunito', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(244, 98, 42, 0.12)',
      },
    },
  },
  plugins: [],
}
