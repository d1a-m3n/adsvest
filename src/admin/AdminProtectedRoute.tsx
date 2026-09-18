import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminProtectedRoute() {
  const { user, isAuthenticated } = useAuth();

  // Not logged in → go to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  // Token exists but user information is still being restored
  if (user === null) {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center text-gray-400">
        Checking admin access...
      </div>
    );
  }

  // Logged-in normal user → don't allow admin dashboard
  if (user.role !== "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  // Confirmed admin → allow the dashboard
  return <Outlet />;
}
