import { useState, useEffect } from 'react';

export type NumPadMode = 'slider' | 'direct';

const STORAGE_KEY = 'four_sigma_numpad_mode';

export function useNumPadMode() {
  const [numPadMode, setNumPadModeState] = useState<NumPadMode>(() => {
    // Initialize from localStorage, default to 'slider'
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'slider' || stored === 'direct') {
        return stored;
      }
    }
    return 'slider';
  });

  const setNumPadMode = (mode: NumPadMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setNumPadModeState(mode);
  };

  const toggleNumPadMode = () => {
    setNumPadMode(numPadMode === 'slider' ? 'direct' : 'slider');
  };

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'slider' || e.newValue === 'direct') {
          setNumPadModeState(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { numPadMode, setNumPadMode, toggleNumPadMode };
}
