import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { getDeviceId } from '../../lib/device';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, isAnonymous, hasEmail, logout, authToken, checkUsername, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername(user?.username ?? '');
      setIsEditing(false);
      setError(null);
      setSuccessMessage(null);
      setUsernameAvailable(null);
      setSuggestions([]);
    }
  }, [isOpen, user?.username]);

  // Debounced username availability check
  useEffect(() => {
    if (!isEditing) return;

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Reset state if username is empty or too short
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setSuggestions([]);
      return;
    }

    // Don't check if it's the same as current username
    if (user?.username && username.toLowerCase() === user.username.toLowerCase()) {
      setUsernameAvailable(true);
      setSuggestions([]);
      return;
    }

    // Debounce the check
    setIsCheckingUsername(true);
    usernameCheckTimeout.current = setTimeout(async () => {
      const result = await checkUsername(username);
      setUsernameAvailable(result.available);
      setSuggestions(result.suggestions || []);
      setIsCheckingUsername(false);
    }, 400);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username, isEditing, user?.username, checkUsername]);

  if (!isOpen) return null;

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.trim().length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is not available');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
        throw new Error(data.error || 'Failed to update username');
      }

      setSuccessMessage('Username updated!');
      setIsEditing(false);
      await refreshUser();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update username');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion);
    setSuggestions([]);
    setError(null);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const isGuestUser = user?.username === 'Guest Player' || isAnonymous;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal dark-glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3 className="settings-section-title">Profile</h3>

            <div className="settings-item">
              <label className="settings-label">Username</label>
              {isEditing ? (
                <div className="settings-edit-row">
                  <div className="username-input-wrapper">
                    <input
                      type="text"
                      className={`settings-input ${
                        usernameAvailable === true ? 'input-valid' :
                        usernameAvailable === false ? 'input-invalid' : ''
                      }`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      maxLength={20}
                      autoFocus
                    />
                    {isCheckingUsername && (
                      <span className="username-status checking">checking...</span>
                    )}
                    {!isCheckingUsername && usernameAvailable === true && username.length >= 3 && (
                      <span className="username-status available">✓</span>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <span className="username-status taken">✗</span>
                    )}
                  </div>
                  <button
                    className="settings-save-button"
                    onClick={handleSaveUsername}
                    disabled={isSaving || usernameAvailable === false}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="settings-cancel-button"
                    onClick={() => {
                      setIsEditing(false);
                      setUsername(user?.username ?? '');
                      setError(null);
                      setUsernameAvailable(null);
                      setSuggestions([]);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="settings-value-row">
                  <span className="settings-value">
                    {isGuestUser ? <em>Not set</em> : user?.username}
                  </span>
                  <button
                    className="settings-edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    {isGuestUser ? 'Set' : 'Edit'}
                  </button>
                </div>
              )}
              
              {/* Username suggestions */}
              {suggestions.length > 0 && (
                <div className="username-suggestions">
                  <span className="suggestions-label">Try:</span>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {error && <div className="settings-error">{error}</div>}
              {successMessage && <div className="settings-success">{successMessage}</div>}
            </div>

            {user?.email && (
              <div className="settings-item">
                <label className="settings-label">Email</label>
                <span className="settings-value">{user.email}</span>
              </div>
            )}
          </div>

          {!isAnonymous && (
            <div className="settings-section">
              <h3 className="settings-section-title">Account</h3>
              <button className="settings-logout-button" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
