import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="border border-slate-200 bg-white rounded-lg p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Farm Management Dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">
        Placeholder route for the unified farm management dashboard. Core metric visualization,
        crop logs, and weather monitoring integrations will be established in subsequent phases.
      </p>
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
        Phase 2 Foundation: No mock or simulated agricultural metrics are displayed.
      </div>
    </div>
  );
};
