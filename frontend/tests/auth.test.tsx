
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
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

    await waitFor(() => {
      expect(
        screen.getByText('Sunita Sharma')
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {
          name: /Sign Out/i,
        })
      ).toBeInTheDocument();
    });
  });
});
