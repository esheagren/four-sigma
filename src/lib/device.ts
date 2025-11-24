const DEVICE_ID_KEY = 'four_sigma_device_id';

/**
 * Get the device ID from localStorage, creating one if it doesn't exist
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Clear the device ID from localStorage
 * Use when user wants to start fresh or for testing
 */
export function clearDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}

/**
 * Check if a device ID exists
 */
export function hasDeviceId(): boolean {
  return localStorage.getItem(DEVICE_ID_KEY) !== null;
}
