import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  needsAuth: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .finally(() => setLoading(false));

    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { error: 'Supabase not configured' };
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error?.message };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { error: 'Supabase not configured' };
    const { error } = await sb.auth.signUp({ email: email.trim(), password });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    await sb?.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      needsAuth: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
