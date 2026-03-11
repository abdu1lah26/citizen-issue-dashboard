import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" />;
  }

  // If allowedRoles is specified, check if user's role is permitted
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
