import { tr, useLocale } from '../i18n';
import { sceneImage } from '../data/media';

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../api/api';

const BACKGROUND_IMAGE =
  sceneImage('mustard-field');

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  visible: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
};

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
        <path d="M10.6 5.1A11.2 11.2 0 0 1 12 5c6.5 0 10 7 10 7a16.8 16.8 0 0 1-3.2 4.2" />
        <path d="M6.1 6.1C3.4 8 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.2-.9" />
        <path d="M10 10a3 3 0 0 0 4 4" />
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
  'w-full rounded-xl border border-[#D0E3D9] bg-white px-4 py-3 text-sm text-[#22494C] outline-none transition placeholder:text-[#99AFA9] focus:border-[#3C7B7B] focus:ring-4 focus:ring-[#3C7B7B]/10 disabled:cursor-not-allowed disabled:opacity-60';

const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  value,
  placeholder,
  visible,
  disabled,
  onChange,
  onToggle,
}) => (
  <div>
    <label
      htmlFor={id}
      className="mb-2 block text-xs font-bold text-[#355958]"
    >
      {tr(label)}
    </label>

    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`${inputClass} pe-14`}
      />

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={visible ? tr("Hide {{v0}}", { v0: label.toLowerCase() }) : tr("Show {{v0}}", { v0: label.toLowerCase() })}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-[#829793] transition hover:text-[#265A5F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#265A5F] disabled:opacity-50"
      >
        <EyeIcon visible={visible} />
      </button>
    </div>
  </div>
);

export const SignupPage: React.FC = () => {
  useLocale();
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Failed to create account. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => {
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <div
      className="relative isolate flex min-h-[calc(100vh-76px)] w-screen max-w-none items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:py-16"
      style={{
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
      }}
    >
      {/* Background image covers the signup section only.
          The shared header and footer remain in normal layout. */}
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

      {/* Light tint, preserving the landscape */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[#0F2C2F]/10"
      />

      {/* Registration card */}
      <section className="relative z-10 w-full max-w-[470px] rounded-[26px] border border-[#DCE8E0] bg-[#F9FDF9]/95 px-6 py-8 shadow-[0_24px_75px_rgba(13,38,23,0.28)] backdrop-blur-md sm:px-10 sm:py-10">
        {/* No duplicate logo; the shared header has the ProFarm logo */}
        <div className="text-center">
          <p className="text-[13px] font-bold tracking-normal text-[#5C8781]">{tr("PROFARM")}</p>

          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#183B3F] sm:text-4xl">{tr("Create Your Account")}</h1>

          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#718884]">{tr("Join ProFarm and make every farming decision a little smarter.")}</p>
        </div>

        {/* Registration error */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-800"
          >
            <p className="font-semibold">{tr("Unable to create account")}</p>
            <p className="mt-1">{tr(errorMessage)}</p>
          </div>
        )}

        {/* Signup form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="mb-2 block text-xs font-bold text-[#355958]"
            >{tr("Full Name")}</label>

            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearError();
              }}
              disabled={isSubmitting}
              placeholder={tr("Enter your full name")}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-2 block text-xs font-bold text-[#355958]"
            >{tr("Email Address")}</label>

            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError();
              }}
              disabled={isSubmitting}
              placeholder={tr("you@example.com")}
              className={inputClass}
            />
          </div>

          <PasswordField
            id="signup-password"
            label={tr("Password")}
            value={password}
            placeholder={tr("Minimum 8 characters")}
            visible={showPassword}
            disabled={isSubmitting}
            onChange={(value) => {
              setPassword(value);
              clearError();
            }}
            onToggle={() => setShowPassword((value) => !value)}
          />

          <PasswordField
            id="signup-confirm-password"
            label={tr("Confirm Password")}
            value={confirmPassword}
            placeholder={tr("Re-enter your password")}
            visible={showConfirmPassword}
            disabled={isSubmitting}
            onChange={(value) => {
              setConfirmPassword(value);
              clearError();
            }}
            onToggle={() =>
              setShowConfirmPassword((value) => !value)
            }
          />

          <p className="text-xs leading-5 text-[#809691]">{tr("Use at least 8 characters for your password.")}</p>

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
                />{tr("Creating account...")}</>
            ) : (
              <>{tr("Create Account")}<ArrowIcon />
              </>
            )}
          </button>
        </form>

        <div className="mt-7 border-t border-[#DCECE1] pt-6 text-center">
          <p className="text-sm text-[#718884]">{tr("Already have an account?")}{' '}
            <Link
              to="/login"
              className="font-bold text-[#265A5F] underline-offset-4 transition hover:underline"
            >{tr("Sign In")}</Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-[#7C938E] transition hover:text-[#265A5F]"
          >{tr("← Back to Home")}</Link>
        </div>
      </section>
    </div>
  );
};
