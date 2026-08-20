import assert from "node:assert/strict";
import test from "node:test";

import { homeForRole, routePermission } from "../src/auth/routing.js";
import { clearStoredToken, getStoredToken, storeToken } from "../src/auth/session.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("unauthenticated operational routes redirect to the common staff login", () => {
  assert.deepEqual(routePermission("overview", "unauthenticated"), { outcome: "redirect", route: "login" });
  assert.deepEqual(routePermission("villages/ASM-CCH-001", "unauthenticated"), { outcome: "redirect", route: "login" });
});

test("successful logins route each role to its correct portal", () => {
  assert.equal(homeForRole("GOVT_OFFICER"), "overview");
  assert.equal(homeForRole("ASHA_WORKER"), "asha");
  assert.equal(homeForRole("WATER_WORKER"), "water-operations");
});

test("role-inappropriate routes are denied while correct routes are allowed", () => {
  assert.equal(routePermission("overview", "authenticated", "ASHA_WORKER").outcome, "denied");
  assert.equal(routePermission("staff-reports", "authenticated", "WATER_WORKER").outcome, "denied");
  assert.equal(routePermission("asha/report", "authenticated", "ASHA_WORKER").outcome, "allowed");
  assert.equal(routePermission("water-operations/tasks", "authenticated", "WATER_WORKER").outcome, "allowed");
  assert.equal(routePermission("community", "authenticated", "GOVT_OFFICER").outcome, "allowed");
});

test("citizen reporting and status lookup remain public", () => {
  assert.equal(routePermission("citizen-report", "unauthenticated").outcome, "public");
  assert.equal(routePermission("report-status", "unauthenticated").outcome, "public");
  assert.equal(routePermission("login", "unauthenticated").outcome, "public");
});

test("nested public-route variants and unknown routes cannot bypass authentication", () => {
  assert.deepEqual(routePermission("login/foo", "unauthenticated"), { outcome: "redirect", route: "login" });
  assert.deepEqual(routePermission("citizen-report/foo", "unauthenticated"), { outcome: "redirect", route: "login" });
  assert.deepEqual(routePermission("unknown", "unauthenticated"), { outcome: "redirect", route: "login" });
  assert.equal(routePermission("unknown", "authenticated", "GOVT_OFFICER").outcome, "denied");
  assert.equal(routePermission("overview", "authenticated", "GOVT_OFFICER").outcome, "allowed");
});

test("logout removes the stored session token", () => {
  const storage = memoryStorage();
  storeToken("demo-token", storage);
  assert.equal(getStoredToken(storage), "demo-token");
  clearStoredToken(storage);
  assert.equal(getStoredToken(storage), "");
});
