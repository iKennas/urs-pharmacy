import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, admin } = useAuth();
  if (!user && !admin) return <Navigate to="/login" replace />;
  return <Outlet />;
}
