import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { ReactNode } from "react";

const ADMIN_ROLES = ["super_admin", "admin_content", "admin_moderation"];

export default function ProtectedRoute({
  children,
  adminOnly,
  userOnly,
}: {
  children: ReactNode;
  adminOnly?: boolean;
  userOnly?: boolean;
}) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-sakura-200 border-t-sakura-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  const isAdmin = profile && ADMIN_ROLES.includes(profile.role);

  if (adminOnly && !isAdmin) {
    return <Navigate to="/mon-espace" replace />;
  }

  if (userOnly && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
