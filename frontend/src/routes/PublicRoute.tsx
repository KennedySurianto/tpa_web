import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../utils/AuthProvider";

const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
};

export default PublicRoute;
