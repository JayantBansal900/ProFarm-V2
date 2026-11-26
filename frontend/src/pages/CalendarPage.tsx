import { tr, useLocale, locale } from '../i18n';
import { sceneImage } from '../data/media';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/api';
import type { FarmCalendarData } from '../types/farm';

const weekdayLabels = () => Array.from({ length: 7 }, (_, day) => new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(new Date(2024, 0, 7 + day)));

const HERO_IMAGE =
  sceneImage('tractor-punjab');

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#265A5F] disabled:cursor-not-allowed disabled:opacity-40';

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5m6 6-6-6 6-6" />
  </svg>
);

const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M7 3v4m10-4v4M3 10h18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function formatDate(value: string): string {
  const [year, month, day] = dateOnly(value).split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return value;
  }

  return date.toLocaleDateString(locale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCategory(value: string): string {
  return tr(value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()));
}

type CalendarEvent = {
  id: string;
  title: string;
  type: 'activity' | 'task' | 'milestone';
  label: string;
  category?: string;
  status?: string;
  cropName?: string;
  date: string;
  milestoneKind?: 'sowing' | 'expected-harvest' | 'actual-harvest';
};

type CalendarDay = {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
};

const EVENT_STYLES: Record<
  CalendarEvent['type'] | 'sowing' | 'expected-harvest' | 'actual-harvest',
  { background: string; dot: string; symbol: string }
> = {
  activity: {
    background: 'bg-[#E4F4EC] text-[#327270]',
    dot: 'bg-[#398987]',
    symbol: '●',
  },
  task: {
    background: 'bg-[#F6EEDB] text-[#8B6A32]',
    dot: 'bg-[#C49B4A]',
    symbol: '◆',
  },
  milestone: {
    background: 'bg-[#E8F0F8] text-[#416B93]',
    dot: 'bg-[#5985AE]',
    symbol: '✦',
  },
  sowing: {
    background: 'bg-[#E5F4EE] text-[#317679]',
    dot: 'bg-[#399593]',
    symbol: '🌱',
  },
  'expected-harvest': {
    background: 'bg-[#FFF2DA] text-[#936826]',
    dot: 'bg-[#D7A243]',
    symbol: '◈',
  },
  'actual-harvest': {
    background: 'bg-[#F0E9F9] text-[#76519D]',
    dot: 'bg-[#9165BA]',
    symbol: '✓',
  },
};

function eventStyle(event: CalendarEvent) {
  return EVENT_STYLES[event.milestoneKind ?? event.type];
}

function countInvalidDates(
  counts: FarmCalendarData['invalidDateCounts'] | undefined
): number {
  if (!counts) return 0;

  return (
    (counts.tasks ?? 0) +
    (counts.activities ?? 0) +
    (counts.milestones ?? 0)
  );
}

export const CalendarPage: React.FC = () => {
  useLocale();
  const [searchParams] = useSearchParams();
  const farmId = searchParams.get('farmId') ?? undefined;

  const [today] = useState(() => new Date());
  const todayKey = localDateKey(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [data, setData] = useState<FarmCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const requestRef = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchCalendar = useCallback(async () => {
    const currentRequest = ++requestRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await api.getFarmCalendar(year, month, farmId);

      if (currentRequest !== requestRef.current) return;

      setData(response.data);
    } catch (err) {
      if (currentRequest !== requestRef.current) return;

      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the farm calendar.'
      );
    } finally {
      if (currentRequest === requestRef.current) {
        setLoading(false);
      }
    }
  }, [year, month, farmId]);

  useEffect(() => {
    void fetchCalendar();

    return () => {
      requestRef.current += 1;
    };
  }, [fetchCalendar]);

  useEffect(() => {
    setSelectedDate(null);
  }, [year, month, farmId]);

  useEffect(() => {
    if (!selectedDate) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const closeButton =
      modalRef.current?.querySelector<HTMLButtonElement>(
        '[data-close-modal]'
      );

    closeButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedDate(null);
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled])'
        )
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [selectedDate]);

  const prevMonth = () => {
    if (year === MIN_YEAR && month === 1) return;

    if (month === 1) {
      setYear((value) => value - 1);
      setMonth(12);
    } else {
      setMonth((value) => value - 1);
    }
  };

  const nextMonth = () => {
    if (year === MAX_YEAR && month === 12) return;

    if (month === 12) {
      setYear((value) => value + 1);
      setMonth(1);
    } else {
      setMonth((value) => value + 1);
    }
  };

  const goToToday = () => {
    const current = new Date();
    const currentYear = current.getFullYear();

    if (currentYear < MIN_YEAR || currentYear > MAX_YEAR) return;

    setYear(currentYear);
    setMonth(current.getMonth() + 1);
    setSelectedDate(localDateKey(current));
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(
    locale(),
    { month: 'long', year: 'numeric' }
  );

  const activities = useMemo(
    () => data?.activities ?? [],
    [data?.activities]
  );

  const tasks = useMemo(
    () => data?.tasks ?? [],
    [data?.tasks]
  );

  const milestones = useMemo(
    () => data?.cropCycleMilestones ?? [],
    [data?.cropCycleMilestones]
  );

  const invalidDateCounts = data?.invalidDateCounts;
  const invalidDateTotal = countInvalidDates(invalidDateCounts);

  const eventsByDate = useMemo(() => {
    const result = new Map<string, CalendarEvent[]>();

    const addEvent = (date: string, event: CalendarEvent) => {
      const key = dateOnly(date);

      if (!result.has(key)) result.set(key, []);
      result.get(key)!.push(event);
    };

    for (const activity of activities) {
      addEvent(activity.activityDate, {
        id: `activity-${activity.id}`,
        title: activity.title,
        type: 'activity',
        label: 'Activity',
        category: activity.category,
        date: activity.activityDate,
      });
    }

    for (const task of tasks) {
      addEvent(task.dueDate, {
        id: `task-${task.id}`,
        title: task.title,
        type: 'task',
        label: 'Task',
        status: task.status,
        date: task.dueDate,
      });
    }

    for (const milestone of milestones) {
      const milestoneKind: CalendarEvent['milestoneKind'] =
        milestone.type === 'sowing'
          ? 'sowing'
          : milestone.harvestKind === 'actual'
            ? 'actual-harvest'
            : 'expected-harvest';

      const label =
        milestoneKind === 'sowing'
          ? 'Sowing'
          : milestoneKind === 'actual-harvest'
            ? 'Actual Harvest'
            : 'Expected Harvest';

      addEvent(milestone.date, {
        id: `milestone-${milestone.id}-${milestoneKind}`,
        title: milestone.title || label,
        type: 'milestone',
        label,
        cropName: milestone.cropName,
        date: milestone.date,
        milestoneKind,
      });
    }

    return result;
  }, [activities, tasks, milestones]);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const totalSlots =
      Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: totalSlots }, (_, index) => {
      const offset = index - firstWeekday + 1;
      const date = new Date(year, month - 1, offset);
      const key = localDateKey(date);

      return {
        date: key,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month - 1,
        events: eventsByDate.get(key) ?? [],
      };
    });
  }, [year, month, eventsByDate]);

  const selectedEvents = selectedDate
    ? eventsByDate.get(selectedDate) ?? []
    : [];

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

  const daysWithEvents = Array.from(eventsByDate.keys()).filter(
    (key) => key.startsWith(monthPrefix)
  ).length;

  const upcomingEvents = calendarDays
    .filter(
      (day) =>
        day.isCurrentMonth &&
        day.date >= todayKey &&
        day.events.length > 0
    )
    .slice(0, 4);

  const renderDay = (day: CalendarDay) => {
    const isToday = day.date === todayKey;
    const isSelected = day.date === selectedDate;
    const visibleEvents = day.events.slice(0, 2);
    const additionalCount = Math.max(0, day.events.length - 2);

    return (
      <button
        key={day.date}
        type="button"
        onClick={() => setSelectedDate(day.date)}
        aria-label={tr("{{v0}}, {{v1}} events", { v0: formatDate(day.date), v1: day.events.length })}
        aria-pressed={isSelected}
        className={`group relative flex min-h-[90px] min-w-0 flex-col border-b border-r border-[#E1ECE5] p-2 text-start transition sm:min-h-[125px] sm:p-3 lg:min-h-[145px] ${
          day.isCurrentMonth
            ? 'bg-white hover:bg-[#F2F9F4]'
            : 'bg-[#F6FAF7] text-[#AFBEB7]'
        } ${
          isSelected ? 'ring-2 ring-inset ring-[#39797B]' : ''
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
            isToday
              ? 'bg-[#265A5F] text-white'
              : day.isCurrentMonth
                ? 'text-[#345554]'
                : 'text-[#AFBEB7]'
          }`}
        >
          {day.day}
        </span>

        <div className="mt-2 hidden w-full min-w-0 space-y-1 sm:block">
          {visibleEvents.map((event) => {
            const style = eventStyle(event);

            return (
              <div
                key={event.id}
                className={`truncate rounded-md px-2 py-1.5 text-xs font-semibold ${style.background}`}
                title={`${tr(event.label)}: ${event.title}`}
              >
                <span className="me-1">{style.symbol}</span>
                {event.title}
              </div>
            );
          })}

          {additionalCount > 0 && (
            <span className="block px-1 text-xs font-semibold text-[#6F8883]">
              +{additionalCount}{tr("more")}</span>
          )}
        </div>

        {day.events.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
            {day.events.slice(0, 3).map((event) => (
              <span
                key={event.id}
                className={`h-1.5 w-1.5 rounded-full ${eventStyle(event).dot}`}
              />
            ))}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-7 pb-16 text-[#234444]">
      {/* Heading */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav
            aria-label={tr("Breadcrumb")}
            className="mb-3 flex items-center gap-2 text-xs font-medium text-[#67827E]"
          >
            <Link to="/" className="hover:text-[#265A5F]">{tr("Home")}</Link>
            <span>/</span>
            <Link to="/my-farms" className="hover:text-[#265A5F]">{tr("My Farms")}</Link>
            <span>/</span>
            <span className="font-semibold text-[#265A5F]">{tr("Calendar")}</span>
          </nav>

          <p className="text-[13px] font-bold tracking-normal text-[#52837E]">{tr("Farm Planning")}</p>

          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#153A3F] sm:text-4xl">{tr("Farm Calendar")}</h1>

          <p className="mt-2 text-sm text-[#5E7774]">{tr("Stay organized with field activities, tasks, and crop milestones.")}</p>
        </div>

        <Link
          to="/my-farms"
          className={`${buttonBase} border border-[#CFE3D7] bg-white text-[#2F5E5E] hover:bg-[#ECF6EF]`}
        >
          <ArrowLeft />{tr("Back to My Farms")}</Link>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#153B40]">
        <img
          src={HERO_IMAGE}
          alt={tr("Green agricultural fields")}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#10353A]/95 via-[#164348]/85 to-[#164348]/25" />

        <div className="relative flex min-h-[220px] flex-col justify-center p-7 text-white sm:p-10">
          <span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-normal backdrop-blur-sm">
            {farmId ? tr("Selected Farm Calendar") : tr("All Farms Calendar")}
          </span>

          <h2 className="mt-4 max-w-lg font-serif text-3xl font-semibold sm:text-4xl">{tr("Plan every season")}<br />{tr("with confidence.")}</h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-[#DFF0E9]">{tr("Track scheduled work, sowing dates, and expected or actual harvest milestones in one calendar.")}</p>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Activities',
            value: activities.length,
            detail: 'This month',
          },
          {
            label: 'Tasks',
            value: tasks.length,
            detail: 'This month',
          },
          {
            label: 'Crop Milestones',
            value: milestones.length,
            detail: 'Sowing and harvest',
          },
          {
            label: 'Scheduled Days',
            value: daysWithEvents,
            detail: 'Days with events',
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-[#D7E7DE] bg-white p-5 sm:p-6"
          >
            <p className="text-xs font-semibold text-[#6B827D]">
              {tr(metric.label)}
            </p>

            <p className="mt-3 font-serif text-4xl font-semibold text-[#225358]">
              {loading || error ? '—' : metric.value}
            </p>

            <p className="mt-2 text-[13px] text-[#889B96]">
              {tr(metric.detail)}
            </p>
          </div>
        ))}
      </section>

      {/* Invalid-date diagnostics */}
      {!loading && !error && invalidDateTotal > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-bold">{tr("Some historical records have invalid dates")}</p>

          <p className="mt-1 leading-6">
            {invalidDateTotal}{tr("record")}{invalidDateTotal === 1 ? '' : 's'}{tr("could not be placed on this calendar. Tasks:")}{invalidDateCounts?.tasks ?? 0}{tr(", activities:")}{invalidDateCounts?.activities ?? 0}{tr(", crop milestones:")}{invalidDateCounts?.milestones ?? 0}{tr(". Existing records have not been modified.")}</p>
        </div>
      )}

      {/* Calendar */}
      <section className="overflow-hidden rounded-2xl border border-[#D7E7DE] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCEBE1] p-5 sm:p-7">
          <div>
            <p className="text-[13px] font-bold tracking-normal text-[#6A8C87]">{tr("Monthly Overview")}</p>

            <h2 className="mt-2 font-serif text-2xl font-semibold text-[#1B4045] sm:text-3xl">
              {monthLabel}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className={`${buttonBase} border border-[#D1E4D9] bg-white text-[#4D6E6B] hover:bg-[#EEF6F0]`}
            >{tr("Today")}</button>

            <button
              type="button"
              onClick={prevMonth}
              disabled={year === MIN_YEAR && month === 1}
              aria-label={tr("Previous month")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D1E4D9] bg-white text-[#3E6564] transition hover:bg-[#EEF6F0] disabled:opacity-40"
            >
              <ArrowLeft />
            </button>

            <button
              type="button"
              onClick={nextMonth}
              disabled={year === MAX_YEAR && month === 12}
              aria-label={tr("Next month")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D1E4D9] bg-white text-[#3E6564] transition hover:bg-[#EEF6F0] disabled:opacity-40"
            >
              <ArrowRight />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1ECE5] bg-[#F6FAF7] px-5 py-3 text-xs sm:px-7">
          <div className="flex flex-wrap items-center gap-4">
            {[
              ['Activities', EVENT_STYLES.activity.dot],
              ['Tasks', EVENT_STYLES.task.dot],
              ['Sowing', EVENT_STYLES.sowing.dot],
              ['Expected Harvest', EVENT_STYLES['expected-harvest'].dot],
              ['Actual Harvest', EVENT_STYLES['actual-harvest'].dot],
            ].map(([label, dot]) => (
              <span
                key={label}
                className="flex items-center gap-2 font-semibold text-[#557270]"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                {tr(label)}
              </span>
            ))}
          </div>

          <span className="text-[#7F9491]">{tr("Select a date to view details")}</span>
        </div>

        {error && (
          <div
            role="alert"
            className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{tr(error)}</span>
            <button
              type="button"
              onClick={() => void fetchCalendar()}
              className="font-bold underline"
            >{tr("Retry")}</button>
          </div>
        )}

        <div className="grid grid-cols-7 border-b border-[#E1ECE5] bg-[#EFF7F1]">
          {weekdayLabels().map((weekday) => (
            <div
              key={weekday}
              className="py-3 text-center text-xs font-bold tracking-normal text-[#637F7B] sm:py-4 sm:text-xs"
            >
              {weekday}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-7" aria-label={tr("Loading calendar")}>
            {Array.from({ length: 35 }, (_, index) => (
              <div
                key={index}
                className="h-[90px] animate-pulse border-b border-r border-[#E1ECE5] bg-[#F4F9F5] sm:h-[130px]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map(renderDay)}
          </div>
        )}

        {!loading &&
          !error &&
          activities.length + tasks.length + milestones.length === 0 && (
            <div className="border-t border-[#E1ECE5] bg-[#F6FAF7] px-5 py-5 text-center">
              <p className="text-sm font-medium text-[#6F8681]">{tr("No activities, tasks, or crop milestones are recorded for this month. You can still select any date.")}</p>
            </div>
          )}
      </section>

      {/* Below calendar */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#D7E7DE] bg-white p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F4EB] text-[#377575]">
              <CalendarIcon />
            </span>

            <div>
              <p className="text-[13px] font-bold tracking-normal text-[#6F918C]">{tr("Upcoming")}</p>

              <h2 className="font-serif text-xl font-semibold text-[#1F474A]">{tr("Scheduled Work")}</h2>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="mt-6 text-sm leading-6 text-[#738984]">{tr("No upcoming events are listed in this month.")}</p>
          ) : (
            <div className="mt-5 space-y-3">
              {upcomingEvents.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#E0ECE4] bg-[#F6FAF7] p-4 text-start transition hover:border-[#B7D2C7] hover:bg-[#ECF7F0]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#2A5756]">
                      {formatDate(day.date)}
                    </p>

                    <p className="mt-1 truncate text-xs text-[#738984]">
                      {day.events
                        .map((event) => `${tr(event.label)}: ${event.title}`)
                        .join(' · ')}
                    </p>
                  </div>

                  <ArrowRight />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-[#1B464B] p-7 text-white">
          <div>
            <p className="text-[13px] font-bold tracking-normal text-[#B7D9CF]">{tr("Farm Workspace")}</p>

            <h2 className="mt-4 font-serif text-3xl font-semibold">{tr("Organize your")}<br />{tr("next field activity.")}</h2>

            <p className="mt-4 max-w-sm text-sm leading-6 text-[#CDE4DB]">{tr("Add tasks, record activities, and manage crop cycles from your farm detail page.")}</p>
          </div>

          <Link
            to={
              farmId
                ? `/my-farms/${encodeURIComponent(farmId)}`
                : '/my-farms'
            }
            className={`${buttonBase} mt-8 w-fit bg-white text-[#265A5F] hover:bg-[#E4F3EA]`}
          >
            {farmId ? tr("Open Farm Details") : tr("Manage My Farms")}
            <ArrowRight />
          </Link>
        </div>
      </section>

      {/* Date detail modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2628]/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDate(null);
            }
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={tr("Events on {{v0}}", { v0: formatDate(selectedDate) })}
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#F8FCF9] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#DAEAE0] bg-white p-6">
              <div>
                <p className="text-[13px] font-bold tracking-normal text-[#578580]">{tr("Daily Schedule")}</p>

                <h2 className="mt-2 font-serif text-2xl font-semibold text-[#1B4045]">
                  {formatDate(selectedDate)}
                </h2>

                <p className="mt-2 text-xs text-[#7A918C]">
                  {selectedEvents.length}{tr("event")}{selectedEvents.length === 1 ? '' : 's'}{tr("recorded")}</p>
              </div>

              <button
                data-close-modal
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label={tr("Close date details")}
                className="rounded-xl border border-[#D7E7DE] p-2.5 text-[#587270] hover:bg-[#EBF5EE]"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto p-6">
              {selectedEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#C8DED2] bg-white p-8 text-center">
                  <p className="font-serif text-xl font-semibold text-[#265356]">{tr("Nothing scheduled")}</p>

                  <p className="mt-2 text-sm text-[#7A918C]">{tr("No tasks, activities, or crop milestones are recorded for this day.")}</p>
                </div>
              ) : (
                selectedEvents.map((event) => {
                  const style = eventStyle(event);

                  return (
                    <article
                      key={event.id}
                      className="rounded-xl border border-[#DAEAE1] bg-white p-4"
                    >
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-normal ${style.background}`}
                      >
                        {tr(event.label)}
                      </span>

                      <h3 className="mt-3 break-words font-serif text-xl font-semibold text-[#21494C]">
                        {event.title}
                      </h3>

                      <p className="mt-2 text-xs text-[#738984]">
                        {event.type === 'activity' ? tr("Category: {{v0}}", { v0: formatCategory(event.category || 'general') }) : event.type === 'task' ? tr("Status: {{v0}}", { v0: formatCategory(event.status || 'unknown') }) : tr("Crop: {{v0}}", { v0: event.cropName || 'Not specified' })}
                      </p>
                    </article>
                  );
                })
              )}
            </div>

            <div className="flex justify-end border-t border-[#DAEAE0] bg-white p-4">
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className={`${buttonBase} bg-[#265A5F] text-white hover:bg-[#17454A]`}
              >{tr("Done")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
