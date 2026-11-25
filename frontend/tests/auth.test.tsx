
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '../src/context/AuthContext';
import { LoginPage } from '../src/pages/LoginPage';
import { SignupPage } from '../src/pages/SignupPage';
import { Header } from '../src/components/Header';
import { api, ApiError } from '../src/api/api';

vi.mock('../src/api/api', () => ({
  api: {
    getMe: vi.fn(),
    login: vi.fn(),
    loginWithMfa: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },

  ApiError: class ApiError extends Error {
    constructor(
      public message: string,
      public statusCode: number
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

describe('Frontend Authentication UI & Context Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form and handles invalid credentials error', async () => {
    vi.mocked(api.getMe).mockResolvedValueOnce(null as any);

    vi.mocked(api.login).mockRejectedValueOnce(
      new ApiError('Invalid email or password', 401)
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /Welcome Back/i,
      })
    ).toBeInTheDocument();

    const emailInput = screen.getByLabelText(
      /^Email Address$/i,
      { selector: 'input' }
    );

    const passwordInput = screen.getByLabelText(
      /^Password$/i,
      { selector: 'input' }
    );

    fireEvent.change(emailInput, {
      target: { value: 'farmer@example.com' },
    });

    fireEvent.change(passwordInput, {
      target: { value: 'wrongpassword' },
    });

    expect(emailInput).toHaveValue('farmer@example.com');
    expect(passwordInput).toHaveValue('wrongpassword');

    fireEvent.click(
      screen.getByRole('button', {
        name: /^Sign In$/i,
      })
    );

    await waitFor(() => {
      expect(api.login).toHaveBeenCalled();

      expect(
        screen.getByRole('alert')
      ).toHaveTextContent('Invalid email or password');
    });
  });

  it('validates password mismatch on signup form before making API call', async () => {
    vi.mocked(api.getMe).mockResolvedValueOnce(null as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /Create Your Account/i,
      })
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(
      /^Full Name$/i,
      { selector: 'input' }
    );

    const emailInput = screen.getByLabelText(
      /^Email Address$/i,
      { selector: 'input' }
    );

    const passwordInput = screen.getByLabelText(
      /^Password$/i,
      { selector: 'input' }
    );

    const confirmPasswordInput = screen.getByLabelText(
      /^Confirm Password$/i,
      { selector: 'input' }
    );

    fireEvent.change(nameInput, {
      target: { value: 'Kiran Rao' },
    });

    fireEvent.change(emailInput, {
      target: { value: 'kiran@example.com' },
    });

    fireEvent.change(passwordInput, {
      target: { value: 'secretPass123' },
    });

    fireEvent.change(confirmPasswordInput, {
      target: { value: 'differentPass' },
    });

    expect(nameInput).toHaveValue('Kiran Rao');
    expect(emailInput).toHaveValue('kiran@example.com');
    expect(passwordInput).toHaveValue('secretPass123');
    expect(confirmPasswordInput).toHaveValue('differentPass');

    fireEvent.click(
      screen.getByRole('button', {
        name: /^Create Account$/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('alert')
      ).toHaveTextContent('Passwords do not match');
    });

    expect(api.register).not.toHaveBeenCalled();
  });

  it('renders user details and sign out button in Header when authenticated', async () => {
    vi.mocked(api.getMe).mockResolvedValueOnce({
      status: 'success',
      user: {
        id: 'u-1',
        name: 'Sunita Sharma',
        email: 'sunita@example.com',
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );

    const accountButton = await screen.findByRole('button', { name: 'Account menu for Sunita Sharma' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(accountButton);

    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('Sunita Sharma')).toBeInTheDocument();
    expect(within(menu).getByText('sunita@example.com')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Account security' })).toHaveAttribute('href', '/account/security');
    expect(within(menu).getByRole('menuitem', { name: /Sign Out/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('asks for a verification code when the account has two-step verification', async () => {
    vi.mocked(api.getMe).mockResolvedValueOnce(null as any);
    vi.mocked(api.login).mockResolvedValueOnce({
      status: 'mfa_required', message: 'Enter the code', mfaRequired: true, challengeToken: 'c'.repeat(64),
    });
    vi.mocked(api.loginWithMfa)
      .mockRejectedValueOnce(new ApiError('That code is not correct. Try the newest code from your app, or a backup code.', 400))
      .mockResolvedValueOnce({ status: 'success', user: { id: 'u-2', name: 'Kiran Rao', email: 'kiran@example.com' } });

    render(<BrowserRouter><AuthProvider><LoginPage /></AuthProvider></BrowserRouter>);

    fireEvent.change(screen.getByLabelText(/^Email Address$/i, { selector: 'input' }), { target: { value: 'kiran@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i, { selector: 'input' }), { target: { value: 'secretPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(await screen.findByRole('heading', { name: 'Enter your verification code' })).toBeInTheDocument();
    const codeInput = screen.getByLabelText('Verification code');
    expect(codeInput).toHaveAttribute('autocomplete', 'one-time-code');

    // Non-digits are stripped and the button stays disabled until 6 digits.
    fireEvent.change(codeInput, { target: { value: '12ab34' } });
    expect(codeInput).toHaveValue('1234');
    expect(screen.getByRole('button', { name: 'Verify and sign in' })).toBeDisabled();

    fireEvent.change(codeInput, { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is not correct');

    fireEvent.click(screen.getByRole('button', { name: 'Use a backup code instead' }));
    fireEvent.change(screen.getByLabelText('Backup code'), { target: { value: 'abcde-fghjk' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and sign in' }));

    await waitFor(() => expect(api.loginWithMfa).toHaveBeenLastCalledWith({ challengeToken: 'c'.repeat(64), code: 'abcde-fghjk' }));
  });

  it('returns to the password step when the verification session expires', async () => {
    vi.mocked(api.getMe).mockResolvedValueOnce(null as any);
    vi.mocked(api.login).mockResolvedValueOnce({ status: 'mfa_required', message: '', mfaRequired: true, challengeToken: 'd'.repeat(64) });
    vi.mocked(api.loginWithMfa).mockRejectedValueOnce(new ApiError('Your sign-in took too long. Enter your email and password again.', 401));

    render(<BrowserRouter><AuthProvider><LoginPage /></AuthProvider></BrowserRouter>);
    fireEvent.change(screen.getByLabelText(/^Email Address$/i, { selector: 'input' }), { target: { value: 'kiran@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i, { selector: 'input' }), { target: { value: 'secretPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));
    fireEvent.change(await screen.findByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and sign in' }));

    expect(await screen.findByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Your sign-in took too long');
  });
});
