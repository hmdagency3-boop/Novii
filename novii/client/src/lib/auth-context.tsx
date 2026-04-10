import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "./supabase";
import { checkUserBanStatus } from "./ban-checker";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isBanned: boolean;
  banMessage: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function callBackendAuth(endpoint: string, body: object): Promise<any> {
  const res = await fetch(`/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Authentication failed");
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banMessage, setBanMessage] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const data = await callBackendAuth("signup", { email, password });
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    } else if (data.user) {
      setUser(data.user);
    }
  };

  const signIn = async (email: string, password: string) => {
    const data = await callBackendAuth("signin", { email, password });
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
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

      const token = session?.access_token;
      if (token) {
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsBanned(false);
      setBanMessage(null);
      window.location.href = "/auth";
    } catch (error) {
      window.location.href = "/auth";
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isBanned, banMessage, signUp, signIn, signOut }}>
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
