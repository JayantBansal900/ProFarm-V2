import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center space-x-2 py-4" role="status">
      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
};
