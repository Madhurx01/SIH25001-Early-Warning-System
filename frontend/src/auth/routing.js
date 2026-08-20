export const ROLE_HOME = {
  GOVT_OFFICER: "overview",
  ASHA_WORKER: "asha",
  WATER_WORKER: "water-operations",
};

export const PUBLIC_ROUTES = new Set(["login", "citizen-report", "report-status"]);

const ROLE_ROUTES = {
  GOVT_OFFICER: ["overview", "villages", "surveillance", "outlook", "community", "staff-reports"],
  ASHA_WORKER: ["asha"],
  WATER_WORKER: ["water-operations"],
};

export function homeForRole(role) {
  return ROLE_HOME[role] || "login";
}

export function routePermission(route, authStatus, role) {
  const root = route.split("/")[0];
  if (PUBLIC_ROUTES.has(route)) return { outcome: "public" };
  if (authStatus === "loading") return { outcome: "loading" };
  if (authStatus !== "authenticated") return { outcome: "redirect", route: "login" };
  const permitted = (ROLE_ROUTES[role] || []).includes(root);
  return permitted ? { outcome: "allowed" } : { outcome: "denied", route: homeForRole(role) };
}
