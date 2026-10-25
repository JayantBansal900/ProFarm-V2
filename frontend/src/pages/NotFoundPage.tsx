import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-16 border border-slate-200 bg-white rounded-lg p-6 shadow-sm">
      <div className="text-4xl font-bold text-slate-300">404</div>
      <h1 className="mt-2 text-xl font-bold text-slate-900">Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
        The requested page does not exist or has been migrated to a new module.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-block text-sm px-4 py-2 rounded-md bg-green-700 text-white font-medium hover:bg-green-800 transition"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};
