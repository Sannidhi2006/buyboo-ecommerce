import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Wraps any page that requires the user to be authenticated.
 * - If auth is still loading (restoring from localStorage), show a spinner.
 * - If user is not authenticated, redirect to /login and remember the
 *   attempted URL so they can be sent back after login.
 * - Optionally, if `adminOnly` prop is true, redirect non-ADMIN users to /unauthorized.
 *
 * Usage:
 *   <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
 *   <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being restored
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the intended destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
