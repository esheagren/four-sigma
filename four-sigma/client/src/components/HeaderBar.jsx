import React from 'react';
import '../styles/HeaderBar.css';

function HeaderBar() {
  return (
    <header className="header-bar">
      <div className="header-content">
        <h1 className="logo">4-σ</h1>
        <button className="metrics-button">Metrics</button>
      </div>
    </header>
  );
}

export default HeaderBar; 