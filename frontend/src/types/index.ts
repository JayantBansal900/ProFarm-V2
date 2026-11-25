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
  /** Machine-readable reason, e.g. "mfa_required" when an admin has not set up two-step verification. */
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Older sessions and mocks may omit this; treat a missing role as a farmer account. */
  role?: UserRole;
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

// ============================================================
// ADMIN
// ============================================================

export interface AdminStats {
  users: number;
  activeUsers: number;
  inactiveUsers: number;
  admins: number;
  usersWithMfa: number;
  newUsersLast7Days: number;
  farms: number;
  activeCropCycles: number;
}

/** Account details only. Admins never receive farm names, locations, tasks or activities. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  farmCount: number;
}

export interface AdminPagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface AdminUsersResponse {
  status: 'success';
  users: AdminUser[];
  pagination: AdminPagination;
}

export interface AdminUserResponse {
  status: 'success';
  data: AdminUser;
}

export interface AdminAuditEntry {
  id: string;
  action: 'grant_admin' | 'revoke_admin' | 'deactivate' | 'reactivate' | 'reset_mfa';
  detail: string | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
  target: { name: string; email: string } | null;
}

export interface AdminAuditResponse {
  status: 'success';
  entries: AdminAuditEntry[];
  pagination: AdminPagination;
}
