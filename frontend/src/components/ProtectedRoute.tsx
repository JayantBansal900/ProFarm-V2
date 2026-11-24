import { tr, useLocale } from '../i18n';

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
}) => {
  useLocale();
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait until authentication status has been verified.
  if (loading) {
    return (
      <div
        className="flex min-h-[300px] w-full items-center justify-center px-4 py-12"
      >
        <LoadingSpinner label={tr("Checking authorization...")} />
      </div>
    );
  }

  // Redirect unauthenticated users to login.
  // Preserve their intended destination.
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Render protected content for authenticated users.
  return children ? <>{children}</> : null;
};
