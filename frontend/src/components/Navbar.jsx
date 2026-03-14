import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const displayName =
    user?.full_name?.trim() ||
    user?.name?.trim() ||
    user?.email?.trim() ||
    "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="navbar" aria-label="Main Navigation">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand" aria-label="Home">
          <span>Civic Dashboard</span>
        </Link>
        <div className="navbar-links">
          <Link to="/">Dashboard</Link>
          <Link to="/issues">Issues</Link>
          <Link to="/heatmap">Heatmap</Link>
          <Link to="/overdue">Overdue</Link>
          {user && (
            <>
              <Link to="/report">Report Issue</Link>
              <Link to="/my-issues">My Issues</Link>
              {(user.role === 2 || user.role === 3) && (
                <>
                  <Link to="/admin/dashboard">Admin Dashboard</Link>
                  <Link to="/admin/issues">Dept Issues</Link>
                  <Link to="/admin/performance">Dept Performance</Link>
                  <Link to="/admin/overdue">Admin Overdue</Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div className="navbar-right">
        {user ? (
          <div className="navbar-user-dropdown">
            <button className="navbar-user-btn" aria-label="User Menu">
              <span className="navbar-user-avatar" aria-hidden="true">
                {avatarInitial}
              </span>
              <span className="navbar-user-name">{displayName}</span>
              <span className="navbar-user-caret">▼</span>
            </button>
            <div className="navbar-user-menu">
              <span className="navbar-user-role">
                Role:{" "}
                {user.role === 1
                  ? "Citizen"
                  : user.role === 2
                    ? "Admin"
                    : "Officer"}
              </span>
              <button onClick={logout} className="navbar-user-logout">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-auth">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
