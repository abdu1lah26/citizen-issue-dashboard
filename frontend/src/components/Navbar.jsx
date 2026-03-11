import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Civic Dashboard
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
              <Link to="/admin/issues">Department Issues</Link>
            )}
          </>
        )}
      </div>

      <div className="navbar-user">
        {user ? (
          <>
            <span className="navbar-user-name">{user.full_name}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
