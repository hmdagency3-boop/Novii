import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

interface BanInfo {
  reason?: string;
  ban_until?: string;
  is_permanent: boolean;
  strikes_count?: number;
  show_duration?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isBanned: boolean;
  banInfo: BanInfo | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  recheckBan: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [banCheckDone, setBanCheckDone] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [, setLocation] = useLocation();
  const banCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkBanStatus = useCallback(async (accessToken?: string) => {
    const token = accessToken || session?.access_token;
    if (!token) return;

    try {
      const res = await fetch('/api/auth/ban-status', {
        headers: { 'x-user-token': token },
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.is_banned) {
        setIsBanned(true);
        setBanInfo({
          reason: data.reason,
          ban_until: data.ban_until,
          is_permanent: data.is_permanent,
          strikes_count: data.strikes_count,
          show_duration: data.show_duration,
        });
      } else {
        setIsBanned(false);
        setBanInfo(null);
      }
    } catch {}
    setBanCheckDone(true);
  }, [session?.access_token]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.access_token) {
            await checkBanStatus(session.access_token);
          } else {
            setBanCheckDone(true);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setBanCheckDone(true);
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          checkBanStatus(session.access_token);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      banCheckInterval.current = setInterval(() => {
        checkBanStatus();
      }, 30000);

      const handleFocus = () => checkBanStatus();
      window.addEventListener('focus', handleFocus);

      return () => {
        if (banCheckInterval.current) clearInterval(banCheckInterval.current);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [session?.access_token, checkBanStatus]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (data.user) setUser(data.user);
    if (data.session) setSession(data.session);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.user) setUser(data.user);
    if (data.session) {
      setSession(data.session);
      await checkBanStatus(data.session.access_token);
    }
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw new Error(error.message);
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw new Error(error.message);
    if (data.user) setUser(data.user);
    if (data.session) {
      setSession(data.session);
      await checkBanStatus(data.session.access_token);
    }
  };

  const signOut = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      if ('indexedDB' in window && 'databases' in indexedDB) {
        try {
          const dbs = await (indexedDB as any).databases();
          for (const db of dbs) {
            if (db.name) indexedDB.deleteDatabase(db.name);
          }
        } catch (e) {}
      }

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsBanned(false);
      setBanInfo(null);
      window.location.href = "/auth";
    } catch (error) {
      window.location.href = "/auth";
    }
  };

  const recheckBan = useCallback(async () => {
    await checkBanStatus();
  }, [checkBanStatus]);

  return (
    <AuthContext.Provider value={{ user, session, loading, isBanned, banInfo, signUp, signIn, signInWithPhone, verifyPhoneOtp, signOut, recheckBan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthGuard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  return { user, loading };
}
