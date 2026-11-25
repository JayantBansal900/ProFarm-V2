import React from 'react';
import { Link } from 'react-router-dom';
import { tr, useLocale } from '../i18n';
import { sceneImage } from '../data/media';

const promises = [
  'Your farm records stay private to your account',
  'Two-step verification keeps your account safe',
  'Use ProFarm in English, Hindi, Punjabi, Telugu or Tamil',
];

/** Split layout for sign-in and sign-up: a quiet form beside one field photograph. */
export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useLocale();
  return (
    <div className="grid min-h-[calc(100vh-72px)] bg-white lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-profarm-deep lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)]" aria-hidden="true">
        <img src={sceneImage('mustard-field')} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#072B2E] via-[#072B2E]/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="max-w-md font-display text-4xl font-bold leading-tight">
            {tr('Better decisions for every season on your farm.')}
          </p>
          <ul className="mt-8 space-y-3 text-white/85">
            {promises.map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-profarm-turmeric text-xs font-bold text-profarm-ink">✓</span>
                <span>{tr(line)}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex flex-col px-5 py-10 sm:px-10 lg:px-16">
        <Link to="/" className="w-fit text-sm font-semibold text-profarm-muted hover:text-profarm-ink">
          {tr('← Back to Home')}
        </Link>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </div>
  );
};

export const authInputClass =
  'h-[52px] w-full rounded-xl border border-profarm-border bg-white px-4 text-base text-profarm-ink outline-none transition placeholder:text-[#9AAFAD] hover:border-[#B9CBC7] focus:border-profarm-forest focus:ring-4 focus:ring-profarm-forest/10 disabled:cursor-not-allowed disabled:opacity-60';

export const authLabelClass = 'mb-2 block text-sm font-semibold text-profarm-ink';

export const authPrimaryButton =
  'inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-profarm-forest px-6 text-base font-bold text-white transition hover:bg-profarm-deep disabled:cursor-not-allowed disabled:opacity-60';

export const EyeIcon: React.FC<{ visible: boolean }> = ({ visible }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {!visible && <path d="M3 3l18 18" />}
  </svg>
);

export const FormAlert: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
    <p className="font-bold">{title}</p>
    <p className="mt-0.5">{message}</p>
  </div>
);
