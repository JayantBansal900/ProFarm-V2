import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SecurityPage } from '../src/pages/SecurityPage';
import { api } from '../src/api/api';
import { passwordStrength } from '../src/utils/passwordStrength';

vi.mock('../src/api/api', () => ({
  api: {
    getMfaStatus: vi.fn(),
    startMfaSetup: vi.fn(),
    enableMfa: vi.fn(),
    disableMfa: vi.fn(),
    regenerateBackupCodes: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number) { super(message); this.name = 'ApiError'; }
  },
}));

const codes = Array.from({ length: 10 }, (_, i) => `abcd${i}-efghj`);
const renderPage = () => render(<MemoryRouter><SecurityPage /></MemoryRouter>);

describe('account security page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets up two-step verification with a QR code, manual key and one-time backup codes', async () => {
    vi.mocked(api.getMfaStatus)
      .mockResolvedValueOnce({ status: 'success', mfa: { enabled: false, enabledAt: null, backupCodesRemaining: 0 } })
      .mockResolvedValueOnce({ status: 'success', mfa: { enabled: true, enabledAt: '2026-11-25', backupCodesRemaining: 10 } });
    vi.mocked(api.startMfaSetup).mockResolvedValue({
      status: 'success', secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
      otpauthUri: 'otpauth://totp/ProFarm%3Aa%40b.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=ProFarm',
    });
    vi.mocked(api.enableMfa).mockResolvedValue({ status: 'success', backupCodes: codes });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on two-step verification' }));

    const qr = await screen.findByRole('img', { name: 'QR code for your authenticator app' });
    expect(qr.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(screen.getByText('JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open authenticator app' })).toHaveAttribute('href', expect.stringMatching(/^otpauth:\/\/totp\//));

    const input = screen.getByLabelText('2. Enter the 6-digit code from the app');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }));

    expect(await screen.findByText('Save these backup codes now')).toBeInTheDocument();
    expect(api.enableMfa).toHaveBeenCalledWith('123456');
    codes.forEach((code) => expect(screen.getByText(code)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'I have saved them' }));
    expect(screen.queryByText(codes[0])).not.toBeInTheDocument();
    expect(await screen.findByText('Backup codes left: 10')).toBeInTheDocument();
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('turns off only after password and code are given', async () => {
    vi.mocked(api.getMfaStatus)
      .mockResolvedValueOnce({ status: 'success', mfa: { enabled: true, enabledAt: '2026-11-25', backupCodesRemaining: 7 } })
      .mockResolvedValueOnce({ status: 'success', mfa: { enabled: false, enabledAt: null, backupCodesRemaining: 0 } });
    vi.mocked(api.disableMfa).mockResolvedValue({ status: 'success', message: 'off' });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Turn off' }));
    const submit = screen.getByRole('button', { name: 'Turn off two-step verification' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'my password' } });
    fireEvent.change(screen.getByLabelText('Verification code or backup code'), { target: { value: 'abcde-fghjk' } });
    fireEvent.click(submit);

    await waitFor(() => expect(api.disableMfa).toHaveBeenCalledWith({ password: 'my password', code: 'abcde-fghjk' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Two-step verification is off.');
    expect(await screen.findByRole('button', { name: 'Turn on two-step verification' })).toBeInTheDocument();
  });

  it('explains that only the farmer can see their data', async () => {
    vi.mocked(api.getMfaStatus).mockResolvedValue({ status: 'success', mfa: { enabled: false, enabledAt: null, backupCodesRemaining: 0 } });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Who can see your data' })).toBeInTheDocument();
  });
});

describe('password strength', () => {
  it.each([['', 0], ['short', 1], ['longenough', 1], ['longenoughpass', 2], ['LongEnoughPass', 3], ['LongEnough1!', 4]])(
    '%j scores %i', (password, score) => expect(passwordStrength(password)).toBe(score));
});
