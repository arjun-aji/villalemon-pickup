import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'driver';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-3" />
          <p className="text-text-secondary text-sm font-medium">Loading VillaLemon Pickup...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all
  if (!user || !profile) {
    if (requiredRole === 'admin') return <Navigate to="/admin/login" replace />;
    if (requiredRole === 'driver') return <Navigate to="/driver/login" replace />;
    return <Navigate to="/" replace />;
  }

  // Role restriction
  if (requiredRole && profile.role !== requiredRole) {
    if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (profile.role === 'driver') return <Navigate to="/driver/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

