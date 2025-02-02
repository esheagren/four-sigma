import React, { useState } from 'react';
import '../styles/HeaderBar.css';

function HeaderBar() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const openInfoPopup = () => {
    setIsInfoOpen(true);
  };

  const closeInfoPopup = () => {
    setIsInfoOpen(false);
  };

  return (
    <>
      <header className="header-bar">
        <div className="header-content">
          <h1 className="logo">4-σ</h1>
          <div>
            <button className="metrics-button">Metrics</button>
            <button className="info-icon" onClick={openInfoPopup} title="More information">
              ℹ️
            </button>
          </div>
        </div>
      </header>
      {isInfoOpen && (
        <div className="info-popup-overlay" onClick={closeInfoPopup}>
          <div className="info-popup" onClick={(e) => e.stopPropagation()}>
            <button className="info-popup-close" onClick={closeInfoPopup}>&times;</button>
            <h2>About the Game</h2>
            <p>
              Welcome to the Four Sigma game! In this game, you'll be presented with numerical challenges.
              Adjust the lower and upper bounds to answer each question. Earn points for correct responses
              and track your progress round by round. Make sure the lower bound is not greater than the upper bound.
              Good luck and have fun!
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default HeaderBar; 