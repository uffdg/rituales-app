import { Navigate } from "react-router";
import { useUser } from "../context/UserContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useUser();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
