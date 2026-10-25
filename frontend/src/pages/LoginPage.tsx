import React from 'react';

export const LoginPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto border border-slate-200 bg-white rounded-lg p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Farmer Authentication</h1>
      <p className="mt-2 text-sm text-slate-600">
        Placeholder interface for farmer account access. The secure authentication system (Argon2 /
        JWT / Session handling) will be implemented in a subsequent phase.
      </p>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
        Phase 2 Policy: Authentication endpoints and password handling are not yet activated.
      </div>
    </div>
  );
};
