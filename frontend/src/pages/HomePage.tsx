import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ApiHealthResponse, DatabaseHealthResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const HomePage: React.FC = () => {
  const [apiHealth, setApiHealth] = useState<ApiHealthResponse | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnectivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiRes, dbRes] = await Promise.all([
        api.getHealth(),
        api.getDatabaseHealth(),
      ]);
      setApiHealth(apiRes);
      setDbHealth(dbRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach ProFarm API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  return (
    <div className="space-y-8">
      <div className="border border-slate-200 bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          ProFarm V2 Architecture Foundation
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Welcome to the modernized ProFarm platform. ProFarm empowers farmers with accessible,
          reliable agricultural information to improve crop productivity, conserve natural resources,
          and adopt sustainable farming practices.
        </p>
      </div>

      <div className="border border-slate-200 bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              System Connectivity & Health Status
            </h2>
            <p className="text-xs text-slate-500">
              Verifying real-time communication between Frontend, Express API, and SQLite Database.
            </p>
          </div>
          <button
            onClick={checkConnectivity}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition"
          >
            Refresh Diagnostics
          </button>
        </div>

        {loading && <LoadingSpinner label="Querying backend & database health probes..." />}

        {error && <ErrorMessage message={error} onRetry={checkConnectivity} />}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Express Backend API
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-slate-900">
                  {apiHealth?.service} — {apiHealth?.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Connected via safe endpoint: <code>/api/health</code>
              </p>
            </div>

            <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                SQLite / Prisma Database
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-slate-900">
                  Status: {dbHealth?.database.toUpperCase()}
                </span>
                {dbHealth?.latencyMs !== undefined && (
                  <span className="text-xs text-slate-500">({dbHealth.latencyMs} ms)</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Connected via safe probe: <code>/api/health/database</code>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-slate-200 bg-white rounded-lg p-5">
          <h3 className="font-semibold text-sm text-slate-900">Phase 2 Foundation</h3>
          <p className="text-xs text-slate-600 mt-1">
            Establishing monorepo, strict TypeScript, Prisma ORM, and baseline security middleware.
          </p>
        </div>
        <div className="border border-slate-200 bg-white rounded-lg p-5">
          <h3 className="font-semibold text-sm text-slate-900">Indian Agriculture Scope</h3>
          <p className="text-xs text-slate-600 mt-1">
            Configured for state and district agricultural contexts, expandable to global NASA data.
          </p>
        </div>
        <div className="border border-slate-200 bg-white rounded-lg p-5">
          <h3 className="font-semibold text-sm text-slate-900">Secure Architecture</h3>
          <p className="text-xs text-slate-600 mt-1">
            Zero plaintext credentials, strict CORS, request validation, and safe error handling.
          </p>
        </div>
      </div>
    </div>
  );
};
