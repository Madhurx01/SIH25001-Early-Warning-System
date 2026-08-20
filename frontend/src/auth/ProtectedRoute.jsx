import { useEffect } from "react";

import { useAuth } from "./AuthContext.jsx";
import { routePermission } from "./routing.js";

export function ProtectedRoute({ route, children }) {
  const auth = useAuth();
  const permission = routePermission(route, auth.status, auth.user?.role);
  useEffect(() => {
    if (permission.outcome === "redirect") window.location.hash = `#/${permission.route}`;
  }, [permission.outcome, permission.route]);
  if (permission.outcome === "loading" || permission.outcome === "redirect") {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm font-semibold text-slate-500">Checking staff session…</div>;
  }
  return children(permission);
}
