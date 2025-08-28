import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
