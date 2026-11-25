import { tr, useLocale } from '../i18n';

import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api, ApiError } from '../api/api';
import type { MfaStatus } from '../types';
import { authInputClass, authLabelClass, FormAlert } from '../components/AuthLayout';

type Stage = 'idle' | 'setup' | 'codes' | 'disable' | 'regenerate';

const primary =
  'inline-flex h-12 items-center justify-center rounded-xl bg-profarm-forest px-6 font-bold text-white transition hover:bg-profarm-deep disabled:cursor-not-allowed disabled:opacity-60';
const secondary =
  'inline-flex h-12 items-center justify-center rounded-xl border border-profarm-border bg-white px-5 font-semibold text-profarm-ink transition hover:bg-profarm-mist disabled:opacity-60';

const message = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Unable to load information. Please try again.';

/** Groups a base32 key in fours so it is easier to type into an authenticator app. */
const groupKey = (key: string) => key.match(/.{1,4}/g)?.join(' ') ?? key;

const CodeInput: React.FC<{ id: string; value: string; onChange: (value: string) => void; allowBackup?: boolean; disabled?: boolean }> = ({
  id, value, onChange, allowBackup, disabled,
}) => (
  <input
    id={id}
    value={value}
    onChange={(event) => onChange(allowBackup ? event.target.value : event.target.value.replace(/\D/g, '').slice(0, 6))}
    inputMode={allowBackup ? 'text' : 'numeric'}
    autoComplete="one-time-code"
    placeholder="123456"
    disabled={disabled}
    className={`${authInputClass} max-w-[240px] text-center font-semibold tracking-[0.3em]`}
  />
);

export const SecurityPage: React.FC = () => {
  useLocale();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string; qr: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus((await api.getMfaStatus()).mfa);
    } catch (err) {
      setError(message(err));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reset = (next: Stage = 'idle') => {
    setStage(next); setCode(''); setPassword(''); setError(null); setCopied(false);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(null); setNotice(null);
    try { await action(); } catch (err) { setError(message(err)); } finally { setBusy(false); }
  };

  const beginSetup = () => run(async () => {
    const result = await api.startMfaSetup();
    const qr = await QRCode.toDataURL(result.otpauthUri, { margin: 1, width: 220, color: { dark: '#14262E', light: '#FFFFFF' } });
    setSetup({ secret: result.secret, otpauthUri: result.otpauthUri, qr });
    reset('setup');
  });

  const confirmSetup = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      const result = await api.enableMfa(code);
      setBackupCodes(result.backupCodes);
      setSetup(null);
      reset('codes');
      await load();
    });
  };

  const regenerate = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      const result = await api.regenerateBackupCodes(code.trim());
      setBackupCodes(result.backupCodes);
      reset('codes');
      await load();
    });
  };

  const turnOff = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      await api.disableMfa({ password, code: code.trim() });
      reset('idle');
      setNotice('Two-step verification is off.');
      await load();
    });
  };

  const copyCodes = async () => {
    try { await navigator.clipboard.writeText(backupCodes.join('\n')); setCopied(true); } catch { setCopied(false); }
  };

  const downloadCodes = () => {
    const text = `ProFarm backup codes\n\n${backupCodes.join('\n')}\n\nEach code works once.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: 'profarm-backup-codes.txt' });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-display text-4xl font-bold text-profarm-ink">{tr('Account security')}</h1>
      <p className="mt-2 text-profarm-muted">{tr('Protect your farm records with a second step when you sign in.')}</p>

      <section aria-labelledby="mfa-heading" className="mt-8 rounded-3xl border border-profarm-border bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-lg">
            <h2 id="mfa-heading" className="font-display text-2xl font-bold text-profarm-ink">{tr('Two-step verification')}</h2>
            <p className="mt-1 text-profarm-muted">
              {tr('After your password, ProFarm asks for a 6-digit code from an authenticator app on your phone, such as Google Authenticator or Microsoft Authenticator.')}
            </p>
          </div>
          {status && (
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${status.enabled ? 'bg-[#E3F2E4] text-profarm-paddy' : 'bg-profarm-mist text-profarm-muted'}`}>
              {status.enabled ? tr('On') : tr('Off')}
            </span>
          )}
        </div>

        <div className="mt-6 space-y-5" aria-live="polite">
          {error && <FormAlert title={tr('Something went wrong')} message={tr(error)} />}
          {notice && <p role="status" className="rounded-xl bg-profarm-mist px-4 py-3 font-semibold text-profarm-forest">{tr(notice)}</p>}

          {!status && !error && <p className="text-profarm-muted">{tr('Loading...')}</p>}

          {/* Off: offer setup */}
          {status && !status.enabled && stage === 'idle' && (
            <button type="button" onClick={beginSetup} disabled={busy} className={primary}>
              {busy ? tr('Please wait...') : tr('Turn on two-step verification')}
            </button>
          )}

          {/* Setup: scan or type the key, then confirm a code */}
          {stage === 'setup' && setup && (
            <form onSubmit={confirmSetup} className="space-y-6">
              <ol className="space-y-6">
                <li>
                  <p className="font-semibold text-profarm-ink">{tr('1. Add ProFarm to your authenticator app')}</p>
                  <div className="mt-3 flex flex-wrap items-start gap-6">
                    <img src={setup.qr} alt={tr('QR code for your authenticator app')} width={180} height={180} className="rounded-2xl border border-profarm-border p-2" />
                    <div className="min-w-0 flex-1 space-y-3 text-profarm-muted">
                      <p>{tr('Scan the QR code with your app. On this phone? Tap the button instead.')}</p>
                      <a href={setup.otpauthUri} className={secondary}>{tr('Open authenticator app')}</a>
                      <p className="text-sm">{tr('Or type this key into the app:')}</p>
                      <code className="block break-all rounded-xl bg-profarm-mist px-4 py-3 font-mono text-base font-semibold text-profarm-ink">{groupKey(setup.secret)}</code>
                    </div>
                  </div>
                </li>
                <li>
                  <label htmlFor="mfa-setup-code" className={authLabelClass}>{tr('2. Enter the 6-digit code from the app')}</label>
                  <CodeInput id="mfa-setup-code" value={code} onChange={setCode} disabled={busy} />
                </li>
              </ol>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={busy || code.length !== 6} className={primary}>{busy ? tr('Checking...') : tr('Turn on')}</button>
                <button type="button" onClick={() => { setSetup(null); reset(); }} className={secondary}>{tr('Cancel')}</button>
              </div>
            </form>
          )}

          {/* Backup codes: shown once */}
          {stage === 'codes' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <p className="font-bold">{tr('Save these backup codes now')}</p>
                <p className="mt-1 text-sm">{tr('If you lose your phone, each code lets you sign in once. They will not be shown again.')}</p>
              </div>
              <ul className="grid grid-cols-2 gap-2 rounded-2xl bg-profarm-mist p-4 font-mono text-base font-semibold text-profarm-ink sm:grid-cols-2">
                {backupCodes.map((backup) => <li key={backup}>{backup}</li>)}
              </ul>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={copyCodes} className={secondary}>{copied ? tr('Copied') : tr('Copy codes')}</button>
                <button type="button" onClick={downloadCodes} className={secondary}>{tr('Download as text file')}</button>
                <button type="button" onClick={() => { setBackupCodes([]); reset(); }} className={primary}>{tr('I have saved them')}</button>
              </div>
            </div>
          )}

          {/* On: manage */}
          {status?.enabled && stage === 'idle' && (
            <div className="space-y-4">
              <p className="text-profarm-muted">
                {tr('Backup codes left: {{v0}}', { v0: status.backupCodesRemaining })}
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => reset('regenerate')} className={secondary}>{tr('Get new backup codes')}</button>
                <button type="button" onClick={() => reset('disable')} className={`${secondary} text-red-700`}>{tr('Turn off')}</button>
              </div>
            </div>
          )}

          {stage === 'regenerate' && (
            <form onSubmit={regenerate} className="space-y-4">
              <p className="text-profarm-muted">{tr('New codes replace all your old backup codes.')}</p>
              <div>
                <label htmlFor="mfa-regen-code" className={authLabelClass}>{tr('Verification code')}</label>
                <CodeInput id="mfa-regen-code" value={code} onChange={setCode} disabled={busy} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={busy || code.length !== 6} className={primary}>{tr('Get new backup codes')}</button>
                <button type="button" onClick={() => reset()} className={secondary}>{tr('Cancel')}</button>
              </div>
            </form>
          )}

          {stage === 'disable' && (
            <form onSubmit={turnOff} className="space-y-4">
              <p className="text-profarm-muted">{tr('To turn off two-step verification, confirm your password and a current code.')}</p>
              <div>
                <label htmlFor="mfa-disable-password" className={authLabelClass}>{tr('Password')}</label>
                <input id="mfa-disable-password" type="password" autoComplete="current-password" value={password}
                  onChange={(event) => setPassword(event.target.value)} disabled={busy} className={`${authInputClass} max-w-sm`} />
              </div>
              <div>
                <label htmlFor="mfa-disable-code" className={authLabelClass}>{tr('Verification code or backup code')}</label>
                <CodeInput id="mfa-disable-code" value={code} onChange={setCode} allowBackup disabled={busy} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={busy || !password || code.trim().length < 6}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-red-700 px-6 font-bold text-white hover:bg-red-800 disabled:opacity-60">
                  {busy ? tr('Please wait...') : tr('Turn off two-step verification')}
                </button>
                <button type="button" onClick={() => reset()} className={secondary}>{tr('Cancel')}</button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-profarm-border bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold text-profarm-ink">{tr('Who can see your data')}</h2>
        <p className="mt-1 text-profarm-muted">
          {tr('Only you can see your farms, crop cycles, tasks and activities. ProFarm has no admin accounts that can open them.')}
        </p>
      </section>
    </div>
  );
};
