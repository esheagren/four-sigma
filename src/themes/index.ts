/**
 * Theme definitions for Four Sigma
 *
 * To add a new theme:
 * 1. Add an entry to the `themes` array below
 * 2. Add a corresponding CSS block in themes.css with `body.theme-{id}` selector
 *    that overrides the CSS variables
 *
 * The theme will automatically appear in the Settings modal.
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  className: string;
  preview: {
    primary: string;
    background: string;
    surface: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Light',
    description: 'Clean, professional light theme',
    className: 'theme-default',
    preview: {
      primary: '#635bff',
      background: '#f6f9fc',
      surface: '#ffffff',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes dark mode',
    className: 'theme-dark',
    preview: {
      primary: '#818cf8',
      background: '#0f0f12',
      surface: '#1a1a1f',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue dark theme',
    className: 'theme-midnight',
    preview: {
      primary: '#6366f1',
      background: '#0f172a',
      surface: '#1e293b',
    },
  },
];

export const DEFAULT_THEME_ID = 'default';

export const THEME_STORAGE_KEY = 'four_sigma_theme';

/**
 * Get a theme by ID, falling back to default if not found
 */
export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}
