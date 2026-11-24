import { tr, useLocale } from '../i18n';

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../api/api';
import type { FarmOverview } from '../types/farm';

const heroImage =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=85';

const shortcuts = [
  { label: 'My Farms', path: '/my-farms', icon: 'farm' },
  {
    label: 'Calendar',
    path: '/my-farms/calendar',
    icon: 'calendar',
  },
  { label: 'Weather', path: '/tools/weather', icon: 'weather' },
  { label: 'Mandi Prices', path: '/tools/mandi', icon: 'market' },
  { label: 'Crop Advisor', path: '/tools/advisor', icon: 'leaf' },
  { label: 'Knowledge', path: '/knowledge', icon: 'book' },
] as const;

type IconName = (typeof shortcuts)[number]['icon'];

const ShortcutIcon = ({ name }: { name: IconName }) => {
  const paths: Record<IconName, React.ReactNode> = {
    farm: (
      <>
        <path d="M3 21V9l9-6 9 6v12" />
        <path d="M9 21v-8h6v8M3 10h18" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18M8 15h3" />
      </>
    ),
    weather: (
      <>
        <path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M20 12h2M17.7 6.3l1.4-1.4" />
        <path d="M7 16a5 5 0 0 1 8.5-3.5A4 4 0 1 1 17 20H7a3 3 0 0 1 0-6" />
      </>
    ),
    market: (
      <>
        <path d="M3 10h18l-2-6H5l-2 6ZM5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C9 4 4 9 4 16a4 4 0 0 0 4 4c7 0 12-5 12-16Z" />
        <path d="M4 20c3-5 7-8 12-11" />
      </>
    ),
    book: (
      <>
        <path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1ZM12 6v14" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="25"
      height="25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

export const DashboardPage: React.FC = () => {
  useLocale();
  const { user } = useAuth();

  const [overview, setOverview] = useState<FarmOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.getFarmsOverview();

        if (!cancelled) {
          setOverview(response.data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const stats = overview
    ? [
        {
          label: 'Active Farms',
          value: overview.activeFarmsCount,
          color: '#447553',
        },
        {
          label: 'Crop Cycles',
          value: overview.activeCropCyclesCount,
          color: '#8C9F65',
        },
        {
          label: 'Pending Tasks',
          value: overview.pendingTasksCount,
          color: '#C69C58',
        },
        {
          label: 'Overdue Tasks',
          value: overview.overdueTasksCount,
          color: '#BC7664',
        },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-9 pb-8 sm:space-y-11">
      {/* PAGE HEADING */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#839478]">{tr("Your workspace")}</span>

          <h1 className="mt-2 font-serif text-[clamp(2.7rem,5vw,4.5rem)] leading-tight tracking-[-0.05em] text-[#203F2C]">{tr("Dashboard")}<span className="text-[#9AB28A]">.</span>
          </h1>

          <p className="mt-1 text-[13px] text-[#778475]">{tr("Welcome back,")}{' '}
            <span className="font-bold text-[#244B35]">
              {user?.name || tr("Farmer")}
            </span>
          </p>
        </div>

        <Link
          to="/my-farms"
          className="inline-flex items-center gap-3 rounded-full bg-[#244B35] px-6 py-3 text-[12px] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#345D42]"
        >{tr("My Farms")}<span aria-hidden="true">↗</span>
        </Link>
      </div>

      {/* CINEMATIC HERO */}
      <section className="relative isolate min-h-[250px] overflow-hidden rounded-[24px] bg-[#193B29] sm:min-h-[320px]">
        <img
          src={heroImage}
          alt={tr("Green farmland at sunset")}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#10291D]/85 via-[#10291D]/45 to-transparent" />

        <div className="relative flex min-h-[250px] flex-col justify-end p-7 sm:min-h-[320px] sm:p-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D0E3B7]">{tr("ProFarm")}</span>

          <h2 className="mt-3 max-w-[550px] font-serif text-[clamp(2.3rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.045em] text-white">{tr("Grow smarter.")}<span className="block italic text-[#D0E3B7]">{tr("Every season.")}</span>
          </h2>
        </div>
      </section>

      {/* LIVE FARM STATS */}
      <section aria-labelledby="farm-stats-heading">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="farm-stats-heading"
            className="font-serif text-[29px] tracking-[-0.035em] text-[#203F2C]"
          >{tr("Farm Overview")}</h2>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label={tr("Refresh farm overview")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8E1D3] bg-white text-[#244B35] transition-colors hover:bg-[#EAF0E4] disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M5.5 9A7 7 0 0 1 18 7l2 5M4 12l2 5a7 7 0 0 0 12.5-2" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div
            role="status"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-[150px] animate-pulse rounded-[20px] bg-[#E7EBE2]"
              />
            ))}

            <span className="sr-only">{tr("Loading farm overview")}</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-[20px] border border-red-200 bg-red-50 p-6"
          >
            <p className="text-sm text-red-700">{tr(error)}</p>

            <button
              type="button"
              onClick={refresh}
              className="mt-3 text-sm font-bold text-[#244B35] underline"
            >{tr("Retry")}</button>
          </div>
        ) : overview ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-[20px] border border-[#E1E7DC] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(26,58,39,0.07)] sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className="mb-6 block h-1.5 w-9 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />

                <p className="font-serif text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-[-0.05em] text-[#203F2C]">
                  {stat.value}
                </p>

                <p className="mt-4 text-[12px] font-semibold text-[#758273]">
                  {tr(stat.label)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-[#E1E7DC] bg-white p-6 text-sm text-[#758273]">{tr("No farm data available.")}</div>
        )}
      </section>

      {/* QUICK ACCESS */}
      <section aria-labelledby="quick-access-heading">
        <h2
          id="quick-access-heading"
          className="mb-5 font-serif text-[29px] tracking-[-0.035em] text-[#203F2C]"
        >{tr("Quick Access")}</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shortcuts.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group flex min-h-[145px] flex-col items-start justify-between rounded-[20px] border border-[#E1E7DC] bg-white p-5 text-[#244B35] transition-all duration-300 hover:-translate-y-1 hover:border-[#B6C9AA] hover:bg-[#EFF3E9] hover:shadow-[0_12px_30px_rgba(26,58,39,0.06)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#EDF2E7] transition-colors group-hover:bg-white">
                <ShortcutIcon name={item.icon} />
              </span>

              <span className="flex w-full items-center justify-between gap-2 text-[12px] font-bold">
                {tr(item.label)}

                <span
                  aria-hidden="true"
                  className="text-base transition-transform group-hover:translate-x-1"
                >
                  ↗
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ACCOUNT */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[#DDE6D5] bg-[#EBF0E5] px-6 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#244B35] text-lg font-bold text-white">
            {(user?.name || 'F').charAt(0).toUpperCase()}
          </span>

          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[#244B35]">
              {user?.name || tr("Farmer")}
            </p>

            <p className="truncate text-[11px] text-[#758273]">
              {user?.email || tr("ProFarm Account")}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-semibold text-[#537C51]">
          <span className="h-2 w-2 rounded-full bg-[#72A36A]" />{tr("Active")}</span>
      </section>
    </div>
  );
};
