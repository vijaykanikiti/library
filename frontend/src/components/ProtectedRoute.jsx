import { Navigate } from "react-router-dom";
import { getUser, getHomePathForRole } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRole }) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || "").toLowerCase().trim();
  const expectedRole = (allowedRole || "").toLowerCase().trim();

  if (expectedRole && userRole !== expectedRole) {
    return <Navigate to={getHomePathForRole(userRole)} replace />;
  }

  return children;
}