// User preferences stored in localStorage

const NUMPAD_KEY = 'four_sigma_use_numpad';

// Custom event for same-tab preference changes
export const NUMPAD_CHANGE_EVENT = 'numpad-preference-change';

export function getUseNumpad(): boolean {
  const stored = localStorage.getItem(NUMPAD_KEY);
  // Default to true (show numpad) if not set
  return stored === null ? true : stored === 'true';
}

export function setUseNumpad(value: boolean): void {
  localStorage.setItem(NUMPAD_KEY, value.toString());
  // Dispatch custom event for same-tab listeners
  window.dispatchEvent(new CustomEvent(NUMPAD_CHANGE_EVENT, { detail: value }));
}
