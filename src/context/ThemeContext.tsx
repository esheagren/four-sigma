import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { themes, Theme, DEFAULT_THEME_ID, THEME_STORAGE_KEY, getThemeById } from '../themes';

interface ThemeContextType {
  currentTheme: Theme;
  themes: Theme[];
  setTheme: (themeId: string) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user, isAnonymous, authToken } = useAuth();
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    // Initialize from localStorage (set by FOUC prevention script)
    if (typeof window !== 'undefined') {
      return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
    }
    return DEFAULT_THEME_ID;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSyncedFromServer, setHasSyncedFromServer] = useState(false);

  const currentTheme = getThemeById(currentThemeId);

  // Apply theme class to body
  useEffect(() => {
    // Remove all theme classes
    themes.forEach((t) => document.body.classList.remove(t.className));

    // Add current theme class
    document.body.classList.add(currentTheme.className);
  }, [currentTheme]);

  // Sync with server when user logs in
  useEffect(() => {
    async function syncThemeFromServer() {
      if (!user || isAnonymous || !authToken || hasSyncedFromServer) {
        return;
      }

      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const serverTheme = data.user?.themePreference;

          if (serverTheme && serverTheme !== currentThemeId) {
            // Server has a different theme - use it and update localStorage
            setCurrentThemeId(serverTheme);
            localStorage.setItem(THEME_STORAGE_KEY, serverTheme);
          } else if (!serverTheme && currentThemeId !== DEFAULT_THEME_ID) {
            // Server has no preference but user has local preference - sync to server
            await saveThemeToServer(currentThemeId);
          }
        }
      } catch (err) {
        console.error('Failed to sync theme from server:', err);
      } finally {
        setHasSyncedFromServer(true);
      }
    }

    syncThemeFromServer();
  }, [user, isAnonymous, authToken, hasSyncedFromServer]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (isAnonymous) {
      setHasSyncedFromServer(false);
    }
  }, [isAnonymous]);

  const saveThemeToServer = useCallback(
    async (themeId: string) => {
      if (isAnonymous || !authToken) {
        return;
      }

      try {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ themePreference: themeId }),
        });
      } catch (err) {
        console.error('Failed to save theme to server:', err);
      }
    },
    [isAnonymous, authToken]
  );

  const setTheme = useCallback(
    async (themeId: string) => {
      // Validate theme exists
      const theme = themes.find((t) => t.id === themeId);
      if (!theme) {
        console.warn(`Unknown theme ID: ${themeId}`);
        return;
      }

      setIsLoading(true);

      try {
        // Always save to localStorage
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
        setCurrentThemeId(themeId);

        // Save to server if authenticated
        if (!isAnonymous && authToken) {
          await saveThemeToServer(themeId);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAnonymous, authToken, saveThemeToServer]
  );

  const value: ThemeContextType = {
    currentTheme,
    themes,
    setTheme,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
