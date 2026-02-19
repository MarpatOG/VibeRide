/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        lg: '2rem'
      }
    },
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-tertiary': 'var(--bg-tertiary)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        border: 'var(--border)',
        'state-success': 'var(--state-success)',
        'state-warning': 'var(--state-warning)',
        'state-danger': 'var(--state-danger)'
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)'
      },
      borderRadius: {
        md: 'var(--radius-md)'
      },
      boxShadow: {
        'focus-ring': '0 0 0 3px var(--border-focus)'
      },
      backgroundImage: {
        'btn-primary': 'linear-gradient(120deg, var(--btn-primary-from), var(--btn-primary-to))'
      }
    }
  },
  plugins: []
};
