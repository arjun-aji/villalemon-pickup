/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          primary: '#10243A',
          sidebar: '#0B1B2D',
          light: '#1a3350',
        },
        green: {
          primary: '#00875A',
          secondary: '#007A50',
          light: '#E6F7F0',
        },
        background: '#F5F8FC',
        card: '#FFFFFF',
        border: '#DCE4EE',
        text: {
          primary: '#15243B',
          secondary: '#6B7890',
        },
        expense: '#F06445',
        warning: '#F5B544',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
