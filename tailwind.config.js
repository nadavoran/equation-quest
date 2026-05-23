/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6c5ce7',
        'primary-light': '#a29bfe',
        'primary-bg': '#f0efff',
        success: '#00b894',
        warning: '#fdcb6e',
        error: '#e17055',
        surface: '#f8f9fa',
        border: '#e0e0e0',
        'text-primary': '#333333',
        'text-secondary': '#666666',
        'text-muted': '#999999',
      },
      borderRadius: {
        block: '6px',
        btn: '10px',
        card: '16px',
        pill: '20px',
        phone: '24px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 1.5s infinite',
      },
    },
  },
  plugins: [],
}
