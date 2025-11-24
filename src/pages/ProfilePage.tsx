import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';

export function ProfilePage() {
  const { user, isAnonymous, logout, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-empty">
          <h2>Profile</h2>
          <p>No user data available.</p>
        </div>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditDisplayName(user.displayName);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    // TODO: Implement profile update API call
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDisplayName('');
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          {isEditing ? (
            <div className="profile-edit-name">
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                maxLength={50}
              />
              <button onClick={handleSaveEdit} className="profile-save-btn">Save</button>
              <button onClick={handleCancelEdit} className="profile-cancel-btn">Cancel</button>
            </div>
          ) : (
            <h1>
              {user.displayName}
              {!isAnonymous && (
                <button onClick={handleStartEdit} className="profile-edit-btn" aria-label="Edit name">
                  ✏️
                </button>
              )}
            </h1>
          )}
          {user.email && <p className="profile-email">{user.email}</p>}
          {isAnonymous && (
            <span className="profile-badge guest-badge">Guest</span>
          )}
        </div>
      </div>

      {isAnonymous && (
        <div className="profile-cta">
          <h3>Save Your Progress</h3>
          <p>Create an account to save your scores and play on any device.</p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="profile-cta-button"
          >
            Create Account
          </button>
        </div>
      )}

      <div className="profile-stats">
        <h2>Your Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{user.gamesPlayed}</div>
            <div className="stat-label">Games Played</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(user.totalScore)}</div>
            <div className="stat-label">Total Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user.averageScore?.toFixed(1) || '0.0'}</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{(user.calibrationRate * 100).toFixed(0)}%</div>
            <div className="stat-label">Calibration Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user.currentStreak}</div>
            <div className="stat-label">Current Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user.bestStreak || 0}</div>
            <div className="stat-label">Best Streak</div>
          </div>
        </div>
      </div>

      {!isAnonymous && (
        <div className="profile-actions">
          <button onClick={logout} className="logout-button">
            Sign Out
          </button>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
