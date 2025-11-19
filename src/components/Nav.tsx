export function Nav() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-name">4-σ</span>
        </div>

        <div className="navbar-links">
          <a href="#" className="nav-link">Today</a>
          <a href="#" className="nav-link">Explore</a>
          <a href="#" className="nav-link">Leaderboard</a>
          <a href="#" className="nav-link nav-link-cta">Sign In</a>
        </div>
      </div>
    </nav>
  );
}
