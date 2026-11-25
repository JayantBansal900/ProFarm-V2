import { tr, useLocale } from '../i18n';

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

/** Only admins get through. Farmers are sent to their dashboard; signed-out visitors to sign in. */
export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  useLocale();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[300px] w-full items-center justify-center px-4 py-12">
        <LoadingSpinner label={tr('Checking authorization...')} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children ? <>{children}</> : null;
};
