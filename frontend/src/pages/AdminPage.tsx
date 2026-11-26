import { locale, tr, useLocale } from '../i18n';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/api';
import { useAuth } from '../context/useAuth';
import type { AdminAuditEntry, AdminPagination, AdminStats, AdminUser, UserRole } from '../types';
import { authInputClass, FormAlert } from '../components/AuthLayout';

type ActionKind = 'makeAdmin' | 'removeAdmin' | 'turnOff' | 'turnOn' | 'resetMfa';
type Pending = { user: AdminUser; kind: ActionKind };

const copy: Record<ActionKind, { title: string; body: string; confirm: string; danger?: boolean }> = {
  makeAdmin: {
    title: 'Make {{v0}} an admin?',
    body: 'Admins can manage accounts and see the audit log. They still cannot open farm records, and they must turn on two-step verification to use this panel.',
    confirm: 'Make admin',
  },
  removeAdmin: {
    title: 'Remove admin access for {{v0}}?',
    body: 'They become a regular farmer account and lose access to this panel immediately.',
    confirm: 'Remove admin',
    danger: true,
  },
  turnOff: {
    title: 'Turn off {{v0}}?',
    body: 'They are signed out everywhere right away and cannot sign in until you turn the account back on. Their farm records are kept.',
    confirm: 'Turn off account',
    danger: true,
  },
  turnOn: {
    title: 'Turn on {{v0}}?',
    body: 'They can sign in again with their password.',
    confirm: 'Turn on account',
  },
  resetMfa: {
    title: 'Reset two-step verification for {{v0}}?',
    body: 'Use this when they lost their phone and their backup codes. They are signed out and can set up two-step verification again after signing in.',
    confirm: 'Reset two-step verification',
    danger: true,
  },
};

const run: Record<ActionKind, (id: string) => Promise<unknown>> = {
  makeAdmin: (id) => api.setAdminUserRole(id, 'admin'),
  removeAdmin: (id) => api.setAdminUserRole(id, 'user'),
  turnOff: (id) => api.deactivateAdminUser(id),
  turnOn: (id) => api.reactivateAdminUser(id),
  resetMfa: (id) => api.resetAdminUserMfa(id),
};

const auditLabels: Record<AdminAuditEntry['action'], string> = {
  grant_admin: 'Made admin',
  revoke_admin: 'Removed admin',
  deactivate: 'Account turned off',
  reactivate: 'Account turned on',
  reset_mfa: 'Two-step verification reset',
};

const secondary =
  'inline-flex h-10 items-center justify-center rounded-full border border-profarm-border bg-white px-4 text-sm font-semibold text-profarm-ink transition hover:bg-profarm-mist disabled:cursor-not-allowed disabled:opacity-50';

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat(locale(), { dateStyle: 'medium' }).format(new Date(value)) : tr('Never');

const failure = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Unable to load information. Please try again.';

const StatCard: React.FC<{ label: string; value: number | string; note?: string }> = ({ label, value, note }) => (
  <div className="rounded-3xl border border-profarm-border bg-white p-5">
    <p className="text-sm font-semibold text-profarm-muted">{label}</p>
    <p className="mt-2 font-display text-4xl font-bold text-profarm-ink">{value}</p>
    {note && <p className="mt-1 text-sm text-profarm-muted">{note}</p>}
  </div>
);

const Badge: React.FC<{ tone: 'green' | 'amber' | 'gray'; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
      tone === 'green' ? 'bg-[#E3F2E4] text-profarm-paddy' : tone === 'amber' ? 'bg-[#FDF1D2] text-profarm-soil' : 'bg-profarm-mist text-profarm-muted'
    }`}
  >
    {children}
  </span>
);

const Pager: React.FC<{ pagination: AdminPagination | null; onPage: (page: number) => void; busy: boolean }> = ({ pagination, onPage, busy }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <nav aria-label={tr('Pages')} className="mt-5 flex items-center justify-between gap-3">
      <button type="button" className={secondary} disabled={busy || pagination.currentPage <= 1} onClick={() => onPage(pagination.currentPage - 1)}>
        {tr('Previous')}
      </button>
      <span className="text-sm font-semibold text-profarm-muted">
        {tr('Page {{v0}} of {{v1}}', { v0: pagination.currentPage, v1: pagination.totalPages })}
      </span>
      <button type="button" className={secondary} disabled={busy || pagination.currentPage >= pagination.totalPages} onClick={() => onPage(pagination.currentPage + 1)}>
        {tr('Next')}
      </button>
    </nav>
  );
};

export const AdminPage: React.FC = () => {
  useLocale();
  const { user: me } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const [auditPagination, setAuditPagination] = useState<AdminPagination | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'' | UserRole>('');
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('');
  const [page, setPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [pending, setPending] = useState<Pending | null>(null);
  const [working, setWorking] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const requestId = useRef(0);

  // Wait a moment after typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.details?.code === 'mfa_required') setNeedsMfa(true);
    else setError(failure(err));
  }, []);

  const load = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const [statsResult, usersResult, auditResult] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers({ page, search: search || undefined, role: role || undefined, status: status || undefined }),
        api.getAdminAudit(auditPage),
      ]);
      if (request !== requestId.current) return;
      setStats(statsResult.data);
      setUsers(usersResult.users);
      setPagination(usersResult.pagination);
      setAudit(auditResult.entries);
      setAuditPagination(auditResult.pagination);
    } catch (err) {
      if (request === requestId.current) handleError(err);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [page, search, role, status, auditPage, handleError]);

  useEffect(() => { void load(); }, [load]);

  // Dialog: focus the safe choice, close on Escape.
  useEffect(() => {
    if (!pending) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !working) setPending(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending, working]);

  const confirm = async () => {
    if (!pending || working) return;
    setWorking(true);
    setDialogError(null);
    try {
      await run[pending.kind](pending.user.id);
      setPending(null);
      setNotice(tr('Done. {{v0}} was updated.', { v0: pending.user.name }));
      await load();
    } catch (err) {
      setDialogError(failure(err));
    } finally {
      setWorking(false);
    }
  };

  const open = (user: AdminUser, kind: ActionKind) => { setDialogError(null); setNotice(null); setPending({ user, kind }); };

  if (needsMfa) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-profarm-border bg-white p-8">
        <h1 className="font-display text-3xl font-bold text-profarm-ink">{tr('Turn on two-step verification first')}</h1>
        <p className="mt-2 text-profarm-muted">{tr('Admins can switch other accounts off, so the admin panel needs two-step verification on your account.')}</p>
        <Link to="/account/security" className="mt-6 inline-flex h-12 items-center rounded-xl bg-profarm-forest px-6 font-bold text-white hover:bg-profarm-deep">
          {tr('Go to Account security')}
        </Link>
      </div>
    );
  }

  const filtersActive = Boolean(search || role || status);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <header>
        <h1 className="font-display text-4xl font-bold text-profarm-ink">{tr('Admin panel')}</h1>
        <p className="mt-2 max-w-2xl text-profarm-muted">
          {tr('Manage accounts. Farm records stay private: you see how many farms a farmer has, never what is in them.')}
        </p>
      </header>

      <div aria-live="polite" className="space-y-3">
        {error && <FormAlert title={tr('Something went wrong')} message={tr(error)} />}
        {notice && <p role="status" className="rounded-xl bg-profarm-mist px-4 py-3 font-semibold text-profarm-forest">{notice}</p>}
      </div>

      {stats && (
        <section aria-label={tr('Overview')} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={tr('Accounts')} value={stats.users} note={tr('{{v0}} turned off', { v0: stats.inactiveUsers })} />
          <StatCard label={tr('New this week')} value={stats.newUsersLast7Days} />
          <StatCard label={tr('Two-step verification on')} value={stats.usersWithMfa} note={tr('of {{v0}} accounts', { v0: stats.users })} />
          <StatCard label={tr('Farms')} value={stats.farms} note={tr('{{v0}} active crop cycles', { v0: stats.activeCropCycles })} />
        </section>
      )}

      <section aria-labelledby="accounts-heading">
        <h2 id="accounts-heading" className="font-display text-2xl font-bold text-profarm-ink">{tr('Accounts')}</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <label htmlFor="admin-search" className="sr-only">{tr('Search by name or email')}</label>
            <input
              id="admin-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={tr('Search by name or email')}
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="admin-role" className="sr-only">{tr('Role')}</label>
            <select id="admin-role" value={role} onChange={(event) => { setRole(event.target.value as '' | UserRole); setPage(1); }} className={authInputClass}>
              <option value="">{tr('All roles')}</option>
              <option value="user">{tr('Farmers')}</option>
              <option value="admin">{tr('Admins')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="admin-status" className="sr-only">{tr('Status')}</label>
            <select id="admin-status" value={status} onChange={(event) => { setStatus(event.target.value as '' | 'active' | 'inactive'); setPage(1); }} className={authInputClass}>
              <option value="">{tr('Any status')}</option>
              <option value="active">{tr('On')}</option>
              <option value="inactive">{tr('Turned off')}</option>
            </select>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <p className="mt-6 text-profarm-muted">{tr('Loading...')}</p>
        ) : users.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-profarm-border p-6 text-center text-profarm-muted">
            {filtersActive ? tr('No accounts match these filters.') : tr('No accounts yet.')}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-profarm-border overflow-hidden rounded-3xl border border-profarm-border bg-white">
            {users.map((account) => {
              const isMe = account.id === me?.id;
              return (
                <li key={account.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="break-words font-semibold text-profarm-ink">{account.name}</span>
                      {isMe && <Badge tone="gray">{tr('You')}</Badge>}
                      {account.role === 'admin' && <Badge tone="amber">{tr('Admin')}</Badge>}
                      {!account.isActive && <Badge tone="gray">{tr('Turned off')}</Badge>}
                      {account.mfaEnabled && <Badge tone="green">{tr('Two-step on')}</Badge>}
                    </p>
                    <p className="break-all text-sm text-profarm-muted">{account.email}</p>
                    <p className="mt-1 text-sm text-profarm-muted">
                      {tr('Joined {{v0}}', { v0: formatDate(account.createdAt) })} · {tr('Last sign-in: {{v0}}', { v0: formatDate(account.lastLoginAt) })} · {tr('{{v0}} farms', { v0: account.farmCount })}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={secondary} disabled={isMe} onClick={() => open(account, account.role === 'admin' ? 'removeAdmin' : 'makeAdmin')}>
                      {account.role === 'admin' ? tr('Remove admin') : tr('Make admin')}
                    </button>
                    <button type="button" className={secondary} disabled={isMe && account.isActive} onClick={() => open(account, account.isActive ? 'turnOff' : 'turnOn')}>
                      {account.isActive ? tr('Turn off') : tr('Turn on')}
                    </button>
                    {account.mfaEnabled && !isMe && (
                      <button type="button" className={secondary} onClick={() => open(account, 'resetMfa')}>
                        {tr('Reset two-step verification')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pager pagination={pagination} busy={loading} onPage={setPage} />
      </section>

      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="font-display text-2xl font-bold text-profarm-ink">{tr('Recent admin actions')}</h2>
        {audit.length === 0 ? (
          <p className="mt-4 text-profarm-muted">{tr('No admin actions yet.')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-profarm-border rounded-3xl border border-profarm-border bg-white">
            {audit.map((entry) => (
              <li key={entry.id} className="p-4">
                <p className="text-profarm-ink">
                  <span className="font-semibold">{tr(auditLabels[entry.action])}</span>{' '}
                  {entry.target ? `${entry.target.name} (${entry.target.email})` : tr('Deleted account')}
                </p>
                <p className="text-sm text-profarm-muted">
                  {tr('By {{v0}}', { v0: entry.actor ? entry.actor.name : tr('Command line') })} · {formatDate(entry.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Pager pagination={auditPagination} busy={loading} onPage={setAuditPage} />
      </section>

      {pending && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-profarm-deep/50 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 id="admin-dialog-title" className="font-display text-2xl font-bold text-profarm-ink">
              {tr(copy[pending.kind].title, { v0: pending.user.name })}
            </h2>
            <p className="mt-2 text-profarm-muted">{tr(copy[pending.kind].body)}</p>
            {dialogError && <div className="mt-4"><FormAlert title={tr('Something went wrong')} message={tr(dialogError)} /></div>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button ref={cancelRef} type="button" className={secondary} disabled={working} onClick={() => setPending(null)}>
                {tr('Cancel')}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={working}
                className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-bold text-white disabled:opacity-60 ${
                  copy[pending.kind].danger ? 'bg-red-700 hover:bg-red-800' : 'bg-profarm-forest hover:bg-profarm-deep'
                }`}
              >
                {working ? tr('Please wait...') : tr(copy[pending.kind].confirm)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
