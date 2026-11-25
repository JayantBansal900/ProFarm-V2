import { locale, tr, useLocale } from '../i18n';
import { sceneImage } from '../data/media';

import React, { useCallback, useEffect, useState } from 'react';
import { sowingSeason, seasonMonths } from '../data/seasons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../api/api';
import type { FarmOverview } from '../types/farm';

const heroImage =
  sceneImage('tractor-punjab');

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
          color: '#427777',
        },
        {
          label: 'Crop Cycles',
          value: overview.activeCropCyclesCount,
          color: '#63A164',
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

  const season = sowingSeason();
  const todayIso = new Date().toLocaleDateString('en-CA');

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-9 pb-8 sm:space-y-11">
      {/* PAGE HEADING */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>

          <h1 className="mt-2 font-serif text-[clamp(2.7rem,5vw,4.5rem)] leading-tight tracking-tight text-[#1F3D40]">{tr("Dashboard")}
          </h1>

          <p className="mt-1 text-[13px] text-[#74857E]">{tr("Welcome back,")}{' '}
            <span className="font-bold text-[#22484D]">
              {user?.name || tr("Farmer")}
            </span>
          </p>
        </div>

        <Link
          to="/my-farms"
          className="inline-flex items-center gap-3 rounded-full bg-[#22484D] px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#325D5F]"
        >{tr("My Farms")}<span aria-hidden="true">↗</span>
        </Link>
      </div>

      {/* TODAY: season and the next tasks, instead of a decorative banner */}
      <section
        aria-labelledby="today-heading"
        className="grid overflow-hidden rounded-3xl border border-profarm-border bg-white lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="relative isolate min-h-[220px] bg-profarm-deep p-6 text-white sm:p-8">
          <img
            src={heroImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-profarm-deep via-profarm-deep/50 to-transparent" />
          <div className="flex h-full flex-col justify-end">
            <p className="inline-flex w-fit rounded-full bg-profarm-turmeric px-3 py-1 text-sm font-bold text-profarm-ink">
              {tr(season)} · {tr(seasonMonths[season])}
            </p>
            <h2 id="today-heading" className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              {tr('Today on your farms')}
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="font-display text-xl font-bold text-profarm-ink">{tr('Next tasks')}</h3>
          {overview && overview.upcomingTasks.length > 0 ? (
            <ul className="mt-4 divide-y divide-profarm-border">
              {overview.upcomingTasks.slice(0, 4).map((task) => {
                const overdue = task.isOverdue ?? task.dueDate < todayIso;
                return (
                  <li key={task.id}>
                    <Link
                      to={`/my-farms/${task.farmId}#tasks`}
                      className="flex items-center justify-between gap-4 py-3 hover:text-profarm-forest"
                    >
                      <span className="min-w-0">
                        <span className="block break-words font-semibold text-profarm-ink">{task.title}</span>
                        {task.farm && <span className="block text-sm text-profarm-muted">{task.farm.name}</span>}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                          overdue ? 'bg-red-50 text-red-700' : 'bg-profarm-mist text-profarm-forest'
                        }`}
                      >
                        {overdue ? tr('Overdue') : tr('Due {{v0}}', { v0: new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' }).format(new Date(`${task.dueDate}T00:00:00`)) })}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-profarm-muted">
              {tr('No tasks are due. Add tasks from My Farms to see them here.')}
            </p>
          )}
        </div>
      </section>

      {/* LIVE FARM STATS */}
      <section aria-labelledby="farm-stats-heading">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="farm-stats-heading"
            className="font-serif text-[29px] tracking-tight text-[#1F3D40]"
          >{tr("Farm Overview")}</h2>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label={tr("Refresh farm overview")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D2E2D8] bg-white text-[#22484D] transition-colors hover:bg-[#E4F0E6] disabled:opacity-50"
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
                className="h-[150px] animate-pulse rounded-[20px] bg-[#E2EBE3]"
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
              className="mt-3 text-sm font-bold text-[#22484D] underline"
            >{tr("Retry")}</button>
          </div>
        ) : overview ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-[20px] border border-[#DCE7DE] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(26,58,39,0.07)] sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className="mb-6 block h-1.5 w-9 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />

                <p className="font-serif text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-tight text-[#1F3D40]">
                  {stat.value}
                </p>

                <p className="mt-4 text-sm font-semibold text-[#72837C]">
                  {tr(stat.label)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-[#DCE7DE] bg-white p-6 text-sm text-[#72837C]">{tr("No farm data available.")}</div>
        )}
      </section>

      {/* QUICK ACCESS */}
      <section aria-labelledby="quick-access-heading">
        <h2
          id="quick-access-heading"
          className="mb-5 font-serif text-[29px] tracking-tight text-[#1F3D40]"
        >{tr("Quick Access")}</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shortcuts.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group flex min-h-[145px] flex-col items-start justify-between rounded-[20px] border border-[#DCE7DE] bg-white p-5 text-[#22484D] transition-all duration-300 hover:-translate-y-1 hover:border-[#A9CAB3] hover:bg-[#E9F3EA] hover:shadow-[0_12px_30px_rgba(26,58,39,0.06)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#E7F2E8] transition-colors group-hover:bg-white">
                <ShortcutIcon name={item.icon} />
              </span>

              <span className="flex w-full items-center justify-between gap-2 text-sm font-bold">
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
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[#D4E7D9] bg-[#E5F0E6] px-6 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#22484D] text-lg font-bold text-white">
            {(user?.name || 'F').charAt(0).toUpperCase()}
          </span>

          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[#22484D]">
              {user?.name || tr("Farmer")}
            </p>

            <p className="truncate text-[13px] text-[#72837C]">
              {user?.email || tr("ProFarm Account")}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#4F7E6E]">
          <span className="h-2 w-2 rounded-full bg-[#68A58A]" />{tr("Active")}</span>
      </section>
    </div>
  );
};
