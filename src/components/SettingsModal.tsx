import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, isAnonymous, logout, authToken } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    if (displayName.trim().length > 20) {
      setError('Display name must be 20 characters or less');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update display name');
      }

      setSuccessMessage('Display name updated!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update display name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
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
              <label className="settings-label">Display Name</label>
              {isEditing ? (
                <div className="settings-edit-row">
                  <input
                    type="text"
                    className="settings-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    className="settings-save-button"
                    onClick={handleSaveDisplayName}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="settings-cancel-button"
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(user?.displayName ?? '');
                      setError(null);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="settings-value-row">
                  <span className="settings-value">{user?.displayName}</span>
                  <button
                    className="settings-edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
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
    </div>
  );
}
