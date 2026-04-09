// frontend/src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types";

interface Props {
  children: React.ReactNode;
  role: UserRole;
}

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;
  if (!currentUser) return <Navigate to="/login" />;
  if (userProfile && userProfile.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
};

export default ProtectedRoute;
