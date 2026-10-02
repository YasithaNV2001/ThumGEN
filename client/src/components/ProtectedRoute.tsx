import { Loader2Icon } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Sends logged-out users to /login and brings them back afterwards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
