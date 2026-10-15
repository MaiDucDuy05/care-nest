/**
 * Design tokens snapshot — mirrors `frontend/web-buyer/src/app/globals.css`.
 * Do NOT generate new values; copy directly from the CSS source.
 * Any future changes to globals.css MUST also update this file.
 */

export const tokens = {
  font: {
    sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  color: {
    /** Teal 600 */
    primary: '#0d9488',
    primaryHover: '#0f766e',
    primaryLight: '#ccfbf1',
    primaryGlow: 'rgba(13, 148, 136, 0.25)',

    /** Indigo 600 */
    secondary: '#4f46e5',
    secondaryHover: '#4338ca',
    secondaryLight: '#e0e7ff',

    /** Amber 500 */
    accent: '#f59e0b',
    accentLight: '#fef3c7',

    /** Red 500 */
    danger: '#ef4444',
    dangerHover: '#dc2626',
    dangerLight: '#fee2e2',

    /** Emerald 500 */
    success: '#10b981',
    successLight: '#d1fae5',

    /** Backgrounds */
    bgPage: '#f8fafc',
    bgCard: '#ffffff',
    bgCardSubtle: '#f1f5f9',

    /** Text */
    textMain: '#0f172a',
    textMuted: '#64748b',
    textLight: '#94a3b8',

    /** Borders */
    borderColor: '#e2e8f0',
    borderFocus: '#0d9488',
  },

  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(13, 148, 136, 0.25)',
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },

  transition: {
    smooth: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type DesignTokens = typeof tokens;
