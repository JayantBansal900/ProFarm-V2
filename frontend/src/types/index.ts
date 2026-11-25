export interface ApiHealthResponse {
  status: 'ok' | 'error';
  service: string;
}

export interface DatabaseHealthResponse extends ApiHealthResponse {
  database: 'connected' | 'disconnected';
  latencyMs?: number;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  status: 'success';
  message?: string;
  user: AuthUser;
}

export interface LogoutResponse {
  status: 'success';
  message: string;
}


/** Login reply when the account has two-step verification on: no session yet. */
export interface MfaChallengeResponse {
  status: 'mfa_required';
  message: string;
  mfaRequired: true;
  challengeToken: string;
}

export type LoginResponse = AuthResponse | MfaChallengeResponse;

export interface MfaStatus {
  enabled: boolean;
  enabledAt: string | null;
  backupCodesRemaining: number;
}

export interface MfaSetupResponse {
  status: 'success';
  secret: string;
  otpauthUri: string;
}

export interface MfaBackupCodesResponse {
  status: 'success';
  backupCodes: string[];
}
