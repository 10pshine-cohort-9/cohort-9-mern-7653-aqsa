import { Navigate, Outlet } from "react-router-dom";
const ProtectedRoute = ({ isAuthenticated }) => {
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    alert("Please login first.");
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
export default ProtectedRoute;