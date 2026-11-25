import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import { AdminPage } from '../src/pages/AdminPage';
import { AdminRoute } from '../src/components/AdminRoute';
import { Header } from '../src/components/Header';
import { api } from '../src/api/api';
import type { AdminUser } from '../src/types';

vi.mock('../src/api/api', () => ({
  api: {
    getMe: vi.fn(),
    logout: vi.fn(),
    getAdminStats: vi.fn(),
    getAdminUsers: vi.fn(),
    getAdminAudit: vi.fn(),
    setAdminUserRole: vi.fn(),
    deactivateAdminUser: vi.fn(),
    reactivateAdminUser: vi.fn(),
    resetAdminUserMfa: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number, public details?: { code?: string }) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mocked = vi.mocked(api);
const { ApiError } = await import('../src/api/api');

const base = { isActive: true, mfaEnabled: false, createdAt: '2026-10-01T00:00:00.000Z', lastLoginAt: null, farmCount: 0 };
const adminUser = { id: 'admin-1', name: 'Admin Person', email: 'admin@example.com', role: 'admin' as const };
const me: AdminUser = { ...base, ...adminUser, mfaEnabled: true, farmCount: 1, lastLoginAt: '2026-11-20T00:00:00.000Z' };
const asha: AdminUser = { ...base, id: 'u-2', name: 'Asha Devi', email: 'asha@example.com', role: 'user', mfaEnabled: true, farmCount: 2 };
const ravi: AdminUser = { ...base, id: 'u-3', name: 'Ravi Kumar', email: 'ravi@example.com', role: 'user', isActive: false };

const pagination = { totalRecords: 3, totalPages: 1, currentPage: 1, limit: 10 };
const stats = { users: 3, activeUsers: 2, inactiveUsers: 1, admins: 1, usersWithMfa: 2, newUsersLast7Days: 1, farms: 3, activeCropCycles: 2 };

function seed(users: AdminUser[] = [me, asha, ravi]) {
  mocked.getMe.mockResolvedValue({ status: 'success', user: adminUser });
  mocked.getAdminStats.mockResolvedValue({ status: 'success', data: stats });
  mocked.getAdminUsers.mockResolvedValue({ status: 'success', users, pagination });
  mocked.getAdminAudit.mockResolvedValue({
    status: 'success',
    entries: [{ id: 'a1', action: 'deactivate', detail: null, createdAt: '2026-11-21T00:00:00.000Z',
      actor: { name: 'Admin Person', email: 'admin@example.com' }, target: { name: 'Ravi Kumar', email: 'ravi@example.com' } }],
    pagination: { totalRecords: 1, totalPages: 1, currentPage: 1, limit: 8 },
  });
}

const renderPage = () => render(
  <MemoryRouter initialEntries={['/admin']}>
    <AuthProvider><AdminPage /></AuthProvider>
  </MemoryRouter>
);
const row = (email: string) => screen.getByText(email).closest('li') as HTMLElement;

describe('admin panel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the overview, accounts with their badges, and the audit log', async () => {
    seed();
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Admin panel' })).toBeInTheDocument();
    const overview = screen.getByRole('region', { name: 'Overview' });
    expect(within(overview).getByText('1 turned off')).toBeInTheDocument();
    expect(within(overview).getByText('of 3 accounts')).toBeInTheDocument();
    expect(within(overview).getByText('2 active crop cycles')).toBeInTheDocument();

    expect(within(row('admin@example.com')).getByText('You')).toBeInTheDocument();
    expect(within(row('admin@example.com')).getByText('Admin')).toBeInTheDocument();
    expect(within(row('asha@example.com')).getByText('Two-step on')).toBeInTheDocument();
    expect(within(row('asha@example.com')).getByText(/2 farms/)).toBeInTheDocument();
    expect(within(row('ravi@example.com')).getByText('Turned off')).toBeInTheDocument();
    expect(within(row('ravi@example.com')).getByText(/Last sign-in: Never/)).toBeInTheDocument();

    const audit = screen.getByRole('heading', { name: 'Recent admin actions' }).closest('section') as HTMLElement;
    expect(within(audit).getByText('Account turned off')).toBeInTheDocument();
    expect(within(audit).getByText(/By Admin Person/)).toBeInTheDocument();
  });

  it('stops admins acting on themselves and offers a reset only for accounts using two-step', async () => {
    seed();
    renderPage();
    await screen.findByText('asha@example.com');

    const mine = within(row('admin@example.com'));
    expect(mine.getByRole('button', { name: 'Remove admin' })).toBeDisabled();
    expect(mine.getByRole('button', { name: 'Turn off' })).toBeDisabled();
    expect(mine.queryByRole('button', { name: 'Reset two-step verification' })).not.toBeInTheDocument();

    expect(within(row('asha@example.com')).getByRole('button', { name: 'Reset two-step verification' })).toBeEnabled();
    expect(within(row('ravi@example.com')).queryByRole('button', { name: 'Reset two-step verification' })).not.toBeInTheDocument();
    expect(within(row('ravi@example.com')).getByRole('button', { name: 'Turn on' })).toBeEnabled();
  });

  it('asks before acting, can be cancelled, and refreshes after confirming', async () => {
    seed();
    mocked.deactivateAdminUser.mockResolvedValue({ status: 'success', data: { ...asha, isActive: false } });
    renderPage();
    await screen.findByText('asha@example.com');

    fireEvent.click(within(row('asha@example.com')).getByRole('button', { name: 'Turn off' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Turn off Asha Devi?' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocked.deactivateAdminUser).not.toHaveBeenCalled();

    fireEvent.click(within(row('asha@example.com')).getByRole('button', { name: 'Turn off' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Turn off account' }));

    await waitFor(() => expect(mocked.deactivateAdminUser).toHaveBeenCalledWith('u-2'));
    expect(await screen.findByRole('status')).toHaveTextContent('Done. Asha Devi was updated.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocked.getAdminUsers.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('grants admin and resets two-step through the right endpoints', async () => {
    seed();
    mocked.setAdminUserRole.mockResolvedValue({ status: 'success', data: { ...asha, role: 'admin' } });
    mocked.resetAdminUserMfa.mockResolvedValue({ status: 'success', data: { ...asha, mfaEnabled: false } });
    renderPage();
    await screen.findByText('asha@example.com');

    fireEvent.click(within(row('asha@example.com')).getByRole('button', { name: 'Make admin' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Make admin' }));
    await waitFor(() => expect(mocked.setAdminUserRole).toHaveBeenCalledWith('u-2', 'admin'));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(within(row('asha@example.com')).getByRole('button', { name: 'Reset two-step verification' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset two-step verification' }));
    await waitFor(() => expect(mocked.resetAdminUserMfa).toHaveBeenCalledWith('u-2'));
  });

  it('keeps the dialog open and explains when the server refuses', async () => {
    seed();
    mocked.setAdminUserRole.mockRejectedValue(new ApiError('Turn this account on before making it an admin.', 409));
    renderPage();
    await screen.findByText('ravi@example.com');

    fireEvent.click(within(row('ravi@example.com')).getByRole('button', { name: 'Make admin' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Make admin' }));

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Turn this account on before making it an admin.');
  });

  it('searches after a short pause and shows an empty state', async () => {
    seed();
    renderPage();
    await screen.findByText('asha@example.com');

    mocked.getAdminUsers.mockResolvedValue({ status: 'success', users: [], pagination: { ...pagination, totalRecords: 0 } });
    fireEvent.change(screen.getByLabelText('Search by name or email'), { target: { value: ' nobody ' } });
    await waitFor(() => expect(mocked.getAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'nobody', page: 1 })));
    expect(await screen.findByText('No accounts match these filters.')).toBeInTheDocument();
  });

  it('filters by role and status', async () => {
    seed();
    renderPage();
    await screen.findByText('asha@example.com');

    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'admin' } });
    await waitFor(() => expect(mocked.getAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'admin' })));
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'inactive' } });
    await waitFor(() => expect(mocked.getAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'admin', status: 'inactive' })));
  });

  it('sends admins without two-step verification to set it up', async () => {
    mocked.getMe.mockResolvedValue({ status: 'success', user: adminUser });
    const message = 'Turn on two-step verification to use the admin panel.';
    const refusal = new ApiError(message, 403, { status: 'error', message, code: 'mfa_required' });
    mocked.getAdminStats.mockRejectedValue(refusal);
    mocked.getAdminUsers.mockRejectedValue(refusal);
    mocked.getAdminAudit.mockRejectedValue(refusal);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Turn on two-step verification first' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Account security' })).toHaveAttribute('href', '/account/security');
  });
});

describe('admin route guard', () => {
  beforeEach(() => vi.clearAllMocks());

  const renderGuard = () => render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <Routes>
          <Route path="/admin" element={<AdminRoute><p>secret admin content</p></AdminRoute>} />
          <Route path="/dashboard" element={<p>farmer dashboard</p>} />
          <Route path="/login" element={<p>sign in page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  it('lets admins in', async () => {
    mocked.getMe.mockResolvedValue({ status: 'success', user: adminUser });
    renderGuard();
    expect(await screen.findByText('secret admin content')).toBeInTheDocument();
  });

  it('sends farmers to their dashboard and visitors to sign in', async () => {
    mocked.getMe.mockResolvedValue({ status: 'success', user: { id: 'u-2', name: 'Asha Devi', email: 'asha@example.com', role: 'user' } });
    renderGuard();
    expect(await screen.findByText('farmer dashboard')).toBeInTheDocument();
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument();
  });

  it('treats a missing role as a farmer and redirects signed-out visitors', async () => {
    mocked.getMe.mockResolvedValueOnce({ status: 'success', user: { id: 'u-4', name: 'Old Session', email: 'old@example.com' } });
    renderGuard();
    expect(await screen.findByText('farmer dashboard')).toBeInTheDocument();
  });

  it('redirects a signed-out visitor to sign in', async () => {
    mocked.getMe.mockRejectedValue(new Error('Unauthorized'));
    renderGuard();
    expect(await screen.findByText('sign in page')).toBeInTheDocument();
  });
});

describe('admin link in the header', () => {
  beforeEach(() => vi.clearAllMocks());

  const openMenu = async (role: 'admin' | 'user') => {
    mocked.getMe.mockResolvedValue({ status: 'success', user: { id: 'u-9', name: 'Meera Singh', email: 'meera@example.com', role } });
    render(<MemoryRouter><AuthProvider><Header /></AuthProvider></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Account menu for Meera Singh' }));
    return screen.getByRole('menu');
  };

  it('appears only for admins', async () => {
    const adminMenu = await openMenu('admin');
    expect(within(adminMenu).getByRole('menuitem', { name: 'Admin panel' })).toHaveAttribute('href', '/admin');
  });

  it('is missing for farmers', async () => {
    const farmerMenu = await openMenu('user');
    expect(within(farmerMenu).queryByRole('menuitem', { name: 'Admin panel' })).not.toBeInTheDocument();
    expect(within(farmerMenu).getByRole('menuitem', { name: 'Account security' })).toBeInTheDocument();
  });
});
