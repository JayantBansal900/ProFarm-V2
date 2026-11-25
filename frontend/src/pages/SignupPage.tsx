import { tr, useLocale } from '../i18n';

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../api/api';
import { passwordStrength } from '../utils/passwordStrength';
import { AuthLayout, EyeIcon, FormAlert, authInputClass, authLabelClass, authPrimaryButton } from '../components/AuthLayout';

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['bg-profarm-border', 'bg-red-500', 'bg-amber-500', 'bg-profarm-olive', 'bg-profarm-paddy'];

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

const PasswordField: React.FC<PasswordFieldProps> = ({ id, label, value, placeholder, visible, disabled, onChange, onToggle }) => (
  <div>
    <label htmlFor={id} className={authLabelClass}>{tr(label)}</label>
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
        className={`${authInputClass} pe-12`}
      />
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={visible ? tr('Hide {{v0}}', { v0: tr(label).toLowerCase() }) : tr('Show {{v0}}', { v0: tr(label).toLowerCase() })}
        aria-pressed={visible}
        className="absolute inset-y-0 end-0 flex w-12 items-center justify-center text-profarm-muted hover:text-profarm-ink"
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
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const strength = passwordStrength(password);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (password !== confirmPassword) return setErrorMessage('Passwords do not match.');
    if (password.length < 8) return setErrorMessage('Password must be at least 8 characters long.');
    if (!name.trim()) return setErrorMessage('Please enter your full name.');

    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to create account. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl font-bold text-profarm-ink">{tr('Create Your Account')}</h1>
      <p className="mt-2 text-profarm-muted">{tr('Join ProFarm and make every farming decision a little smarter.')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {errorMessage && <FormAlert title={tr('Unable to create account')} message={tr(errorMessage)} />}

        <div>
          <label htmlFor="signup-name" className={authLabelClass}>{tr('Full Name')}</label>
          <input id="signup-name" type="text" required autoComplete="name" value={name}
            onChange={(event) => setName(event.target.value)} disabled={isSubmitting}
            placeholder={tr('Enter your full name')} className={authInputClass} />
        </div>

        <div>
          <label htmlFor="signup-email" className={authLabelClass}>{tr('Email Address')}</label>
          <input id="signup-email" type="email" required autoComplete="email" value={email}
            onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting}
            placeholder={tr('you@example.com')} className={authInputClass} />
        </div>

        <div>
          <PasswordField id="signup-password" label="Password" value={password} placeholder={tr('Minimum 8 characters')}
            visible={showPassword} disabled={isSubmitting} onChange={setPassword} onToggle={() => setShowPassword((v) => !v)} />
          <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
            <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((level) => (
                <span key={level} className={`h-1.5 rounded-full transition-colors ${strength >= level ? strengthColors[strength] : 'bg-profarm-border'}`} />
              ))}
            </div>
            {strength > 0 && (
              <span className="w-24 text-end text-sm font-semibold text-profarm-muted">
                {tr('Strength: {{v0}}', { v0: tr(strengthLabels[strength]) })}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-profarm-muted">{tr('Use 12 or more characters with a mix of letters, numbers and symbols.')}</p>
        </div>

        <div>
          <PasswordField id="signup-confirm-password" label="Confirm Password" value={confirmPassword} placeholder={tr('Re-enter your password')}
            visible={showConfirmPassword} disabled={isSubmitting} onChange={setConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
          {mismatch && <p className="mt-1.5 text-sm font-semibold text-red-700">{tr('Passwords do not match.')}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className={authPrimaryButton}>
          {isSubmitting ? tr('Creating account...') : tr('Create Account')}
        </button>
      </form>

      <p className="mt-8 text-center text-profarm-muted">
        {tr('Already have an account?')}{' '}
        <Link to="/login" className="font-bold text-profarm-forest hover:underline">{tr('Sign In')}</Link>
      </p>
    </AuthLayout>
  );
};
