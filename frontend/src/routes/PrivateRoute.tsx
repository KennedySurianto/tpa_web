import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../utils/AuthProvider";

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
