"use client";

import {
  createContext,
  PropsWithChildren,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { api } from "../lib/api";
import { AuthUser, LoginResponse } from "../lib/types";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "saluddigital.token";
const USER_KEY = "saluddigital.user";

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }

    setReady(true);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);

    startTransition(() => {
      setToken(response.accessToken);
      setUser(response.user);
    });

    window.localStorage.setItem(TOKEN_KEY, response.accessToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    return response;
  };

  const logout = () => {
    startTransition(() => {
      setToken(null);
      setUser(null);
    });
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  };

  const refreshUser = async () => {
    if (!token) {
      return;
    }

    const me = await api.me(token);
    startTransition(() => {
      setUser(me);
    });
    window.localStorage.setItem(USER_KEY, JSON.stringify(me));
  };

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      login,
      logout,
      refreshUser
    }),
    [token, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
