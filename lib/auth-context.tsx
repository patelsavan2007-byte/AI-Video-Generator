"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: "email" | "google";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => void;
  signOut: () => void;
}

// ─── localStorage helpers ─────────────────────────────────────────
const STORAGE_KEYS = {
  SESSION: "vf_session",
  ACCOUNTS: "vf_accounts",
};

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // simple hash for demo — NOT production-grade
  provider: "email";
}

/** Simple deterministic hash for demo purposes (NOT cryptographically secure) */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

function saveSession(user: User): void {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
}

function getSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// ─── Google OAuth types ───────────────────────────────────────────
interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleJwtPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

/** Decode a JWT token (payload only) without verification — client‑side only */
function decodeJwt(token: string): GoogleJwtPayload {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

// ─── Context ──────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedUser = getSession();
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
        });
      }
    };

    // If GSI script already loaded
    if ((window as any).google?.accounts?.id) {
      initGoogle();
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGoogle();
          clearInterval(checkInterval);
        }
      }, 200);

      return () => clearInterval(checkInterval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleCallback = useCallback((response: GoogleCredentialResponse) => {
    try {
      const payload = decodeJwt(response.credential);
      const googleUser: User = {
        id: `google-${payload.sub}`,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        provider: "google",
      };
      setUser(googleUser);
      saveSession(googleUser);
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  }, []);

  // ── Email/Password Sign Up ────────────────────────────────────
  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      // Validation
      if (!name.trim()) return { success: false, error: "Name is required" };
      if (!email.trim() || !email.includes("@")) return { success: false, error: "Valid email is required" };
      if (password.length < 6) return { success: false, error: "Password must be at least 6 characters" };

      const accounts = getStoredAccounts();
      const exists = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (exists) return { success: false, error: "An account with this email already exists" };

      const newAccount: StoredAccount = {
        id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: simpleHash(password),
        provider: "email",
      };

      accounts.push(newAccount);
      saveAccounts(accounts);

      const newUser: User = {
        id: newAccount.id,
        email: newAccount.email,
        name: newAccount.name,
        provider: "email",
      };
      setUser(newUser);
      saveSession(newUser);

      return { success: true };
    },
    []
  );

  // ── Email/Password Sign In ────────────────────────────────────
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (!email.trim() || !email.includes("@")) return { success: false, error: "Valid email is required" };
      if (!password) return { success: false, error: "Password is required" };

      const accounts = getStoredAccounts();
      const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
      if (!account) return { success: false, error: "No account found with this email" };
      if (account.passwordHash !== simpleHash(password)) return { success: false, error: "Incorrect password" };

      const loggedInUser: User = {
        id: account.id,
        email: account.email,
        name: account.name,
        provider: "email",
      };
      setUser(loggedInUser);
      saveSession(loggedInUser);

      return { success: true };
    },
    []
  );

  // ── Google Sign In (trigger popup) ────────────────────────────
  const signInWithGoogle = useCallback(() => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      console.warn("Google Identity Services not loaded. Make sure NEXT_PUBLIC_GOOGLE_CLIENT_ID is set in .env.local");
    }
  }, []);

  // ── Sign Out ──────────────────────────────────────────────────
  const signOut = useCallback(() => {
    setUser(null);
    clearSession();

    // Also revoke Google session if applicable
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
