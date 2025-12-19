import { useState, useEffect, useCallback } from 'react';

export type CalculatorMode = 'on' | 'off';

const STORAGE_KEY = 'four_sigma_calculator_mode';
const CHANGE_EVENT = 'calculator-mode-change';

export function useCalculatorMode() {
  const [calculatorMode, setCalculatorModeState] = useState<CalculatorMode>(() => {
    // Initialize from localStorage, default to 'on'
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'on' || stored === 'off') {
        return stored;
      }
    }
    return 'on';
  });

  const setCalculatorMode = useCallback((mode: CalculatorMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setCalculatorModeState(mode);
    // Dispatch custom event to sync within same tab
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: mode }));
  }, []);

  const toggleCalculatorMode = useCallback(() => {
    const newMode = calculatorMode === 'on' ? 'off' : 'on';
    setCalculatorMode(newMode);
  }, [calculatorMode, setCalculatorMode]);

  // Sync within same tab via custom event
  useEffect(() => {
    const handleModeChange = (e: CustomEvent<CalculatorMode>) => {
      setCalculatorModeState(e.detail);
    };

    window.addEventListener(CHANGE_EVENT, handleModeChange as EventListener);
    return () => window.removeEventListener(CHANGE_EVENT, handleModeChange as EventListener);
  }, []);

  // Sync across tabs via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'on' || e.newValue === 'off') {
          setCalculatorModeState(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { calculatorMode, setCalculatorMode, toggleCalculatorMode };
}
