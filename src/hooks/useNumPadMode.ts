import { useState, useEffect, useCallback } from 'react';

export type NumPadMode = 'slider' | 'direct';

const STORAGE_KEY = 'four_sigma_numpad_mode';
const CHANGE_EVENT = 'numpad-mode-change';

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

  const setNumPadMode = useCallback((mode: NumPadMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setNumPadModeState(mode);
    // Dispatch custom event to sync within same tab
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: mode }));
  }, []);

  const toggleNumPadMode = useCallback(() => {
    const newMode = numPadMode === 'slider' ? 'direct' : 'slider';
    setNumPadMode(newMode);
  }, [numPadMode, setNumPadMode]);

  // Sync within same tab via custom event
  useEffect(() => {
    const handleModeChange = (e: CustomEvent<NumPadMode>) => {
      setNumPadModeState(e.detail);
    };

    window.addEventListener(CHANGE_EVENT, handleModeChange as EventListener);
    return () => window.removeEventListener(CHANGE_EVENT, handleModeChange as EventListener);
  }, []);

  // Sync across tabs via storage event
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
