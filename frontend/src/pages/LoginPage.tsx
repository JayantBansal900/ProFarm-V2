import { tr, useLocale } from '../i18n';

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../api/api';
import { AuthLayout, EyeIcon, FormAlert, authInputClass, authLabelClass, authPrimaryButton } from '../components/AuthLayout';

function safeDestination(state: unknown): string {
  const from = (state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/\\') ? from : '/dashboard';
}

export const LoginPage: React.FC = () => {
  useLocale();
  const { user, login, completeMfaLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await login({ email: email.trim(), password });
      if (result.mfaChallengeToken) {
        setChallengeToken(result.mfaChallengeToken);
        setPassword('');
        return;
      }
      navigate(safeDestination(location.state), { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to sign in. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !challengeToken) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await completeMfaLogin(challengeToken, code.trim());
      navigate(safeDestination(location.state), { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        // Challenge expired or locked: start again from the password step.
        setChallengeToken(null);
        setCode('');
      }
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to sign in. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (challengeToken) {
    return (
      <AuthLayout>
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-profarm-mist text-2xl">🔐</span>
        <h1 className="mt-6 font-display text-4xl font-bold text-profarm-ink">{tr('Enter your verification code')}</h1>
        <p className="mt-2 text-profarm-muted">
          {useBackupCode
            ? tr('Type one of the backup codes you saved when you turned on two-step verification.')
            : tr('Open your authenticator app and type the 6-digit code shown for ProFarm.')}
        </p>

        <form onSubmit={handleCode} noValidate className="mt-8 space-y-5">
          {errorMessage && <FormAlert title={tr('Unable to sign in')} message={tr(errorMessage)} />}
          <div>
            <label htmlFor="login-code" className={authLabelClass}>
              {useBackupCode ? tr('Backup code') : tr('Verification code')}
            </label>
            <input
              id="login-code"
              value={code}
              onChange={(event) => setCode(useBackupCode ? event.target.value : event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode={useBackupCode ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              autoFocus
              required
              placeholder={useBackupCode ? 'abcde-fghjk' : '123456'}
              disabled={isSubmitting}
              className={`${authInputClass} text-center font-semibold tracking-[0.3em]`}
            />
          </div>
          <button type="submit" disabled={isSubmitting || code.trim().length < 6} className={authPrimaryButton}>
            {isSubmitting ? tr('Checking...') : tr('Verify and sign in')}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm font-semibold">
          <button type="button" onClick={() => { setUseBackupCode((value) => !value); setCode(''); setErrorMessage(null); }} className="text-profarm-forest hover:underline">
            {useBackupCode ? tr('Use the authenticator app instead') : tr('Use a backup code instead')}
          </button>
          <button type="button" onClick={() => { setChallengeToken(null); setCode(''); setErrorMessage(null); }} className="text-profarm-muted hover:text-profarm-ink">
            {tr('Back to sign in')}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl font-bold text-profarm-ink">{tr('Welcome Back')}</h1>
      <p className="mt-2 text-profarm-muted">{tr('Sign in to manage your farm and continue your farming journey.')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {errorMessage && <FormAlert title={tr('Unable to sign in')} message={tr(errorMessage)} />}

        <div>
          <label htmlFor="login-email" className={authLabelClass}>{tr('Email Address')}</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            placeholder={tr('you@example.com')}
            className={authInputClass}
          />
        </div>

        <div>
          <label htmlFor="login-password" className={authLabelClass}>{tr('Password')}</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              placeholder={tr('Enter your password')}
              className={`${authInputClass} pe-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? tr('Hide password') : tr('Show password')}
              aria-pressed={showPassword}
              className="absolute inset-y-0 end-0 flex w-12 items-center justify-center text-profarm-muted hover:text-profarm-ink"
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={authPrimaryButton}>
          {isSubmitting ? tr('Signing in...') : tr('Sign In')}
        </button>
      </form>

      <p className="mt-8 text-center text-profarm-muted">
        {tr("Don't have an account?")}{' '}
        <Link to="/signup" className="font-bold text-profarm-forest hover:underline">{tr('Create an account')}</Link>
      </p>
    </AuthLayout>
  );
};
