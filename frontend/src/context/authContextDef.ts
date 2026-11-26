import { createContext } from 'react';
import { AuthUser } from '../types';

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** Resolves to a challenge token when the account needs a second step; otherwise signs in. */
  login: (credentials: { email: string; password: string }) => Promise<{ mfaChallengeToken?: string }>;
  completeMfaLogin: (challengeToken: string, code: string) => Promise<void>;
  register: (details: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
