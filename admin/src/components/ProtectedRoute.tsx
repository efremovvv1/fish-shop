import { Navigate } from "react-router-dom";
import { getAdminToken } from "../api/client";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const token = getAdminToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}