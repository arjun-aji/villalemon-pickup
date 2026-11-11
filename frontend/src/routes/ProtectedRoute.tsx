import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1527] text-white">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-3 text-amber-400" />
          <p className="text-slate-300 text-sm font-medium">Loading VillaLemon Pickup...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all
  if (!user || !profile) {
    if (requiredRole === 'admin' || requiredRole === 'super_admin') {
      return <Navigate to="/admin/login" replace />;
    }
    if (requiredRole === 'driver') {
      return <Navigate to="/driver/login" replace />;
    }
    if (requiredRole === 'organization') {
      return <Navigate to="/org/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Role validation
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = profile.role;

    // Super admin can access admin routes
    const hasPermission =
      allowed.includes(userRole) ||
      (userRole === 'super_admin' && allowed.includes('admin'));

    if (!hasPermission) {
      if (userRole === 'admin' || userRole === 'super_admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (userRole === 'driver') {
        return <Navigate to="/driver/dashboard" replace />;
      }
      if (userRole === 'organization') {
        return <Navigate to="/org/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
