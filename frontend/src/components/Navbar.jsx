import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      <Link to="/">Dashboard</Link> | <Link to="/issues">Issues</Link> |{" "}
      <Link to="/heatmap">Heatmap</Link> | <Link to="/overdue">Overdue</Link>
      {user && (
        <>
          {" | "}
          <Link to="/report">Report Issue</Link>
          {" | "}
          <Link to="/my-issues">My Issues</Link>
          {" | "}
          <Link to="/admin/issues">Department Issues</Link>
        </>
      )}
      <span style={{ float: "right" }}>
        {user ? (
          <>
            {user.full_name} | <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link> |{" "}
            <Link to="/register">Register</Link>
          </>
        )}
      </span>
    </nav>
  );
}

export default Navbar;
