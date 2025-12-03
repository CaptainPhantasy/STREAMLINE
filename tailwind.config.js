module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Legacy theme-aware colors using CSS variables (keeping for backward compatibility)
        theme: {
          'bg-primary': 'var(--color-bg-primary)',
          'bg-secondary': 'var(--color-bg-secondary)',
          'bg-surface': 'var(--color-bg-surface)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-subtle': 'var(--color-text-subtle)',
          'border': 'var(--color-border)',
          'accent-primary': 'var(--color-accent-primary)',
          'accent-secondary': 'var(--color-accent-secondary)',
          'card-bg': 'var(--card-bg)',
          'card-border': 'var(--card-border)',
          'input-bg': 'var(--input-bg)',
          'badge-bg': 'var(--badge-bg)',
          'badge-text': 'var(--badge-text)',
        },
        dark: {
          primary: '#020617',
          secondary: '#0F172A',
          tertiary: '#1E293B',
          panel: 'rgba(15, 23, 42, 0.95)',
        },
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.75rem',
        'lg': '1rem',
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'elevated': 'var(--shadow-elevated)',
        'sm-theme': 'var(--shadow-sm)',
        'card': '0 2px 4px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.35), 0 16px 32px -8px rgba(0,0,0,0.12)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.45), 0 16px 32px rgba(0,0,0,0.4), 0 32px 64px -8px rgba(0,0,0,0.18)',
      },
      backgroundImage: {
      },
    },
  },
  plugins: [],
}
