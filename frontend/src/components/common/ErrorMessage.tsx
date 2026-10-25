import React from 'react';

export const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <div className="rounded-md bg-red-50 p-4 border border-red-200 my-2" role="alert">
      <div className="flex items-center justify-between">
        <p className="text-sm text-red-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-2 rounded"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
