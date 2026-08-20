import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getCurrentUser, loginStaff } from "../services/api.js";
import { BackendConnectionScreen } from "../components/BackendReadinessGate.jsx";
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

export async function restoreAuthSession(token, {
  loadUser = getCurrentUser,
  getToken = getStoredToken,
  tokenExpired = isTokenExpired,
} = {}) {
  try {
    const user = await loadUser();
    if (getToken() !== token) return { status: "stale" };
    if (tokenExpired(token)) return { status: "expired" };
    return { status: "authenticated", user };
  } catch (error) {
    const currentToken = getToken();
    if (error?.status === 401) {
      return currentToken && currentToken !== token
        ? { status: "stale", error }
        : { status: "unauthorized", error };
    }
    if (currentToken !== token) return { status: "stale", error };
    return { status: "unavailable", error };
  }
}

export function AuthRestorationContent({ status, onRetry, children }) {
  if (status === "unavailable") return <BackendConnectionScreen status="unavailable" onRetry={onRetry}/>;
  if (status === "recovering") return <BackendConnectionScreen status="connecting" onRetry={onRetry}/>;
  return children;
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", user: null });
  const [restorationAttempt, setRestorationAttempt] = useState(0);

  const logout = useCallback(() => {
    clearStoredToken();
    setState({ status: "unauthenticated", user: null });
  }, []);

  const applyRestoration = useCallback((result, token) => {
    if (result.status === "authenticated") {
      setState({ status: "authenticated", user: result.user });
    } else if (result.status === "unavailable") {
      setState({ status: "unavailable", user: null });
    } else if (result.status === "expired" || result.status === "unauthorized") {
      handleCurrentTokenFailure(token, logout);
    }
  }, [logout]);

  const retryRestoration = useCallback(() => {
    setState({ status: "recovering", user: null });
    setRestorationAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      if (token) clearStoredToken();
      setState({ status: "unauthenticated", user: null });
      return;
    }
    let active = true;
    restoreAuthSession(token).then((result) => {
      if (active) applyRestoration(result, token);
    });
    return () => { active = false; };
  }, [applyRestoration, restorationAttempt]);

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
          restoreAuthSession(token).then((result) => {
            if (active) applyRestoration(result, token);
          });
        },
      });
    };
    window.addEventListener("storage", handler);
    return () => {
      active = false;
      window.removeEventListener("storage", handler);
    };
  }, [applyRestoration, logout]);

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

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      <AuthRestorationContent status={state.status} onRetry={retryRestoration}>{children}</AuthRestorationContent>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
