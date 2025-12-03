import { useState, useEffect } from 'react';

export type GuessMode = 'range' | 'specific';

const STORAGE_KEY = 'guessMode';

export function useGuessMode() {
  const [guessMode, setGuessModeState] = useState<GuessMode>(() => {
    // Initialize from localStorage, default to 'range'
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'range' || stored === 'specific') {
        return stored;
      }
    }
    return 'range';
  });

  const setGuessMode = (mode: GuessMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setGuessModeState(mode);
  };

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'range' || e.newValue === 'specific') {
          setGuessModeState(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { guessMode, setGuessMode };
}
