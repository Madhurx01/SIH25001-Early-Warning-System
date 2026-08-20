import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getCurrentUser, loginStaff } from "../services/api.js";
import {
  AUTH_INVALIDATED_EVENT,
  clearStoredToken,
  getStoredToken,
  handleCurrentTokenFailure,
  handleTokenStorageEvent,
  isTokenExpired,
  scheduleTokenExpiration,
  storeToken,
} from "./session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", user: null });

  const logout = useCallback(() => {
    clearStoredToken();
    setState({ status: "unauthenticated", user: null });
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      if (token) clearStoredToken();
      setState({ status: "unauthenticated", user: null });
      return;
    }
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (!active || getStoredToken() !== token) return;
        if (isTokenExpired(token)) logout();
        else setState({ status: "authenticated", user });
      })
      .catch(() => { if (active) handleCurrentTokenFailure(token, logout); });
    return () => { active = false; };
  }, [logout]);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener(AUTH_INVALIDATED_EVENT, handler);
    return () => window.removeEventListener(AUTH_INVALIDATED_EVENT, handler);
  }, [logout]);

  useEffect(() => {
    let active = true;
    const handler = (event) => {
      handleTokenStorageEvent(event, {
        onRemoved: logout,
        onReplaced: (token) => {
          setState({ status: "loading", user: null });
          if (isTokenExpired(token)) {
            logout();
            return;
          }
          getCurrentUser()
            .then((user) => {
              if (!active || getStoredToken() !== token) return;
              if (isTokenExpired(token)) logout();
              else setState({ status: "authenticated", user });
            })
            .catch(() => { if (active) handleCurrentTokenFailure(token, logout); });
        },
      });
    };
    window.addEventListener("storage", handler);
    return () => {
      active = false;
      window.removeEventListener("storage", handler);
    };
  }, [logout]);

  useEffect(() => {
    if (state.status !== "authenticated") return undefined;
    const token = getStoredToken();
    return scheduleTokenExpiration(token, logout);
  }, [logout, state.status, state.user?.id]);

  const login = useCallback(async (email, password) => {
    const session = await loginStaff(email, password);
    if (isTokenExpired(session.access_token)) {
      logout();
      throw new Error("The server returned an invalid or expired session");
    }
    storeToken(session.access_token);
    setState({ status: "authenticated", user: session.user });
    return session.user;
  }, [logout]);

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
