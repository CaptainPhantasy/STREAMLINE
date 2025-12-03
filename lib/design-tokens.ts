// CRM-AI PRO Design System Tokens
// Updated to support multi-theme architecture (Solaris, Abyss, Latte, Borealis, Amethyst, Forest, Citrus)

export const themeTokens = {
  colors: {
    theme: {
      primary: 'var(--color-bg-primary)',
      secondary: 'var(--color-bg-secondary)',
      surface: 'var(--color-bg-surface)',
      textPrimary: 'var(--color-text-primary)',
      textSecondary: 'var(--color-text-secondary)',
      textSubtle: 'var(--color-text-subtle)',
      border: 'var(--color-border)',
      accentPrimary: 'var(--color-accent-primary)',
      accentSecondary: 'var(--color-accent-secondary)',
    }
  },
  shadows: {
    glow: 'var(--shadow-glow)',
    elevated: 'var(--shadow-elevated)',
    sm: 'var(--shadow-sm)',
  }
}

export const typography = {
  iconLabel: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    color: 'var(--color-text-primary)',
    textTransform: 'lowercase' as const,
  },
  splashTitle: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    textTransform: 'uppercase' as const,
  },
  splashTagline: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-accent-primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
}
