import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthUser } from '../types';
import { api } from '../api/api';
import { AuthContext } from './authContextDef';
import { bindLanguageUser, preferenceRevision } from '../i18n';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const authGeneration = useRef(0);

  const refreshUser = useCallback(async () => {
    const generation = authGeneration.current;
    const languageRevision = preferenceRevision();
    try {
      const response = await api.getMe();
      if (generation !== authGeneration.current) return;
      if (response && response.user) {
        setUser(response.user);
        await bindLanguageUser(response.user.id, languageRevision);
      } else {
        setUser(null);
      }
    } catch {
      if (generation !== authGeneration.current) return;
      setUser(null);
    } finally {
      if (generation === authGeneration.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    const generation = ++authGeneration.current;
    const languageRevision = preferenceRevision();
    try {
      const response = await api.login(credentials);
      if (generation !== authGeneration.current) return {};
      if (response.status === 'mfa_required') return { mfaChallengeToken: response.challengeToken };
      await bindLanguageUser(response.user.id, languageRevision);
      setUser(response.user);
      return {};
    } finally {
      if (generation === authGeneration.current) setLoading(false);
    }
  };

  const completeMfaLogin = async (challengeToken: string, code: string) => {
    const generation = ++authGeneration.current;
    const languageRevision = preferenceRevision();
    try {
      const response = await api.loginWithMfa({ challengeToken, code });
      if (generation !== authGeneration.current) return;
      await bindLanguageUser(response.user.id, languageRevision);
      setUser(response.user);
    } finally {
      if (generation === authGeneration.current) setLoading(false);
    }
  };

  const register = async (details: { name: string; email: string; password: string }) => {
    const generation = ++authGeneration.current;
    const languageRevision = preferenceRevision();
    try {
      const response = await api.register(details);
      if (generation !== authGeneration.current) return;
      await bindLanguageUser(response.user.id, languageRevision);
      setUser(response.user);
    } finally {
      if (generation === authGeneration.current) setLoading(false);
    }
  };

  const logout = async () => {
    const generation = ++authGeneration.current;
    try {
      await api.logout();
    } finally {
      if (generation === authGeneration.current) {
        await bindLanguageUser(null);
        setUser(null);
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        completeMfaLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
