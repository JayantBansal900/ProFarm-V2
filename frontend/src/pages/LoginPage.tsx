import { tr, useLocale } from '../i18n';
import { sceneImage } from '../data/media';

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../api/api';

const BACKGROUND_IMAGE =
  sceneImage('mustard-field');

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {visible ? (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 5.1A11.2 11.2 0 0 1 12 5c6.5 0 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <path d="M3 3l18 18" />
      </>
    )}
  </svg>
);

const ArrowIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

const inputClass =
  'w-full rounded-xl border border-[#D0E3D9] bg-white px-4 py-3.5 text-sm text-[#22494C] outline-none transition placeholder:text-[#99AFA9] focus:border-[#3C7B7B] focus:ring-4 focus:ring-[#3C7B7B]/10 disabled:cursor-not-allowed disabled:opacity-60';

export const LoginPage: React.FC = () => {
  useLocale();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      const from = (
        location.state as {
          from?: {
            pathname?: string;
          };
        } | null
      )?.from?.pathname;

      const destination =
        from &&
        from.startsWith('/') &&
        !from.startsWith('//') &&
        !from.startsWith('/\\')
          ? from
          : '/dashboard';

      navigate(destination, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Failed to sign in. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative isolate flex min-h-[calc(100vh-76px)] w-screen max-w-none items-center justify-center overflow-hidden px-4 py-12 sm:px-6"
      style={{
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
      }}
    >
      {/* Full-width image, limited to the login section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
      >
        <div
          className="absolute -inset-2 bg-cover bg-center bg-no-repeat blur-[1px]"
          style={{
            backgroundImage: `url("${BACKGROUND_IMAGE}")`,
          }}
        />
      </div>

      {/* Subtle overlay, preserves landscape colors */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[#0F2C2F]/10"
      />

      {/* Centered login card */}
      <section className="relative z-10 w-full max-w-[460px] rounded-[26px] border border-[#DCE8E0] bg-[#F9FDF9]/95 px-6 py-9 shadow-[0_24px_75px_rgba(13,38,23,0.28)] backdrop-blur-md sm:px-10 sm:py-11">
        <div className="text-center">
          <p className="text-[13px] font-bold tracking-normal text-[#5C8781]">{tr("PROFARM")}</p>

          <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-[#183B3F]">{tr("Welcome Back")}</h1>

          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#718884]">{tr("Sign in to manage your farm and continue your farming journey.")}</p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-7 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800"
          >
            <p className="font-semibold">{tr("Unable to sign in")}</p>
            <p className="mt-1">{tr(errorMessage)}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-xs font-bold text-[#355958]"
            >{tr("Email Address")}</label>

            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isSubmitting}
              placeholder={tr("you@example.com")}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-xs font-bold text-[#355958]"
            >{tr("Password")}</label>

            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isSubmitting}
                placeholder={tr("Enter your password")}
                className={`${inputClass} pe-14`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={isSubmitting}
                aria-label={
                  showPassword ? tr("Hide password") : tr("Show password")
                }
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-[#829793] transition hover:text-[#265A5F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#265A5F] disabled:opacity-50"
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#265A5F] px-6 py-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(40,93,61,0.16)] transition hover:bg-[#17454A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#265A5F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                />{tr("Signing in...")}</>
            ) : (
              <>{tr("Sign In")}<ArrowIcon />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-[#DCECE1] pt-6 text-center">
          <p className="text-sm text-[#718884]">{tr("Don't have an account?")}{' '}
            <Link
              to="/signup"
              className="font-bold text-[#265A5F] underline-offset-4 transition hover:underline"
            >{tr("Create an account")}</Link>
          </p>
        </div>

        <div className="mt-7 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-[#7C938E] transition hover:text-[#265A5F]"
          >{tr("← Back to Home")}</Link>
        </div>
      </section>
    </div>
  );
};
