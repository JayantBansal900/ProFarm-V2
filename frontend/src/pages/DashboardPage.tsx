import React from 'react';
import { useAuth } from '../context/useAuth';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Farm Management Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-semibold text-green-800">{user?.name || 'Farmer'}</span>
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Authenticated Session Active
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <h2 className="text-sm font-semibold text-slate-700">Account Details</h2>
            <div className="mt-2 text-sm text-slate-600 space-y-1">
              <p><span className="text-slate-500">Name:</span> {user?.name}</p>
              <p><span className="text-slate-500">Email:</span> {user?.email}</p>
              <p><span className="text-slate-500">Farmer ID:</span> <code className="text-xs bg-slate-200 px-1 py-0.5 rounded">{user?.id}</code></p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
            <h2 className="text-sm font-semibold text-emerald-900">Registered Farms</h2>
            <p className="mt-2 text-sm text-emerald-800">
              Your farm records and plots are tied directly to your account. Detailed plot configuration and satellite telemetry integrations will be added in Phase 3B.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
