import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { getStoredToken, storeToken } from "../src/auth/session.js";
import { getCurrentUser, getHealth, getPublicVillages, loginStaff } from "../src/services/api.js";
import {
  createBackendConnector,
  retryTransientOperation,
} from "../src/utils/backendReadiness.js";

const immediateRetry = { delayMs: 0, sleep: async () => {} };
const frontendRoot = fileURLToPath(new URL("..", import.meta.url));

function httpError(status) {
  const error = new Error(`Request failed with status ${status}`);
  error.status = status;
  return error;
}

function response(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("an already awake backend continues immediately", async () => {
  let attempts = 0;
  const result = await retryTransientOperation(async () => {
    attempts += 1;
    return { status: "ok" };
  }, immediateRetry);

  assert.deepEqual(result, { status: "ok" });
  assert.equal(attempts, 1);
});

test("a temporary 503 retries and continues after the backend wakes", async () => {
  let attempts = 0;
  const result = await retryTransientOperation(async () => {
    attempts += 1;
    if (attempts === 1) throw httpError(503);
    return "ready";
  }, { ...immediateRetry, maxAttempts: 3 });

  assert.equal(result, "ready");
  assert.equal(attempts, 2);
});

test("a network failure retries and continues after the backend wakes", async () => {
  let attempts = 0;
  const result = await retryTransientOperation(async () => {
    attempts += 1;
    if (attempts === 1) throw new TypeError("Failed to fetch");
    return "ready";
  }, { ...immediateRetry, maxAttempts: 3 });

  assert.equal(result, "ready");
  assert.equal(attempts, 2);
});

test("transient retries stop at the configured maximum", async () => {
  let attempts = 0;
  await assert.rejects(
    retryTransientOperation(async () => {
      attempts += 1;
      throw httpError(503);
    }, { ...immediateRetry, maxAttempts: 4 }),
    (error) => error.status === 503,
  );
  assert.equal(attempts, 4);
});

test("400, 401, and 403 responses are never retried as cold starts", async () => {
  for (const status of [400, 401, 403]) {
    let attempts = 0;
    await assert.rejects(
      retryTransientOperation(async () => {
        attempts += 1;
        throw httpError(status);
      }, { ...immediateRetry, maxAttempts: 4 }),
      (error) => error.status === status,
    );
    assert.equal(attempts, 1);
  }
});

test("the same connector can be invoked by Retry after a final failure", async () => {
  let backendAwake = false;
  let attempts = 0;
  const connect = createBackendConnector(async () => {
    attempts += 1;
    if (!backendAwake) throw httpError(503);
    return { status: "ok" };
  }, { ...immediateRetry, maxAttempts: 1 });

  await assert.rejects(connect(), (error) => error.status === 503);
  backendAwake = true;
  assert.deepEqual(await connect(), { status: "ok" });
  assert.equal(attempts, 2);
});

test("health and citizen startup requests remain public and continue in order", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  try {
    globalThis.fetch = async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith("/api/health")) return response(200, { status: "ok" });
      return response(200, [{ id: "ASM-CCH-001", name: "Borigaon" }]);
    };

    await getHealth();
    const villages = await getPublicVillages(undefined, { ...immediateRetry, maxAttempts: 1 });

    assert.equal(requests.length, 2);
    assert.ok(requests[0].url.endsWith("/api/health"));
    assert.ok(requests[1].url.endsWith("/api/public/villages"));
    assert.ok(requests.every(({ options }) => !options.headers.has("Authorization")));
    assert.equal(villages[0].id, "ASM-CCH-001");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("auth restoration retries a temporary failure without clearing the staff token", async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  const requests = [];
  try {
    globalThis.localStorage = memoryStorage();
    storeToken("current-token");
    globalThis.fetch = async (url, options) => {
      requests.push({ url, options });
      if (requests.length === 1) return response(503, { detail: "Service unavailable" });
      return response(200, { id: "staff-1", role: "GOVT_OFFICER" });
    };

    const user = await getCurrentUser(undefined, { ...immediateRetry, maxAttempts: 2 });
    assert.equal(user.role, "GOVT_OFFICER");
    assert.equal(getStoredToken(), "current-token");
    assert.equal(requests.length, 2);
    assert.ok(requests.every(({ options }) => options.headers.get("Authorization") === "Bearer current-token"));
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalStorage;
  }
});

test("exhausted auth restoration exits loading, preserves the token, and succeeds after Retry", async () => {
  const vite = await createServer({
    root: frontendRoot,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const { AuthRestorationContent, restoreAuthSession } = await vite.ssrLoadModule("/src/auth/AuthContext.jsx");
    let storedToken = "current-token";
    let backendReady = false;
    const loadUser = async () => {
      if (!backendReady) throw Object.assign(new Error("Server unavailable"), { status: 503 });
      return { id: "staff-1", role: "GOVT_OFFICER" };
    };
    const options = {
      loadUser,
      getToken: () => storedToken,
      tokenExpired: () => false,
    };

    const unavailable = await restoreAuthSession(storedToken, options);
    assert.equal(unavailable.status, "unavailable");
    assert.equal(storedToken, "current-token");

    const unavailableMarkup = renderToStaticMarkup(React.createElement(AuthRestorationContent, {
      status: unavailable.status,
      onRetry: () => {},
      children: React.createElement("span", null, "protected-content"),
    }));
    assert.match(unavailableMarkup, /couldn&#x27;t reach the server right now/);
    assert.match(unavailableMarkup, />Retry<\/button>/);
    assert.doesNotMatch(unavailableMarkup, /protected-content/);

    backendReady = true;
    const restored = await restoreAuthSession(storedToken, options);
    assert.equal(restored.status, "authenticated");
    assert.equal(restored.user.role, "GOVT_OFFICER");
    assert.equal(storedToken, "current-token");

    const restoredMarkup = renderToStaticMarkup(React.createElement(AuthRestorationContent, {
      status: restored.status,
      onRetry: () => {},
      children: React.createElement("span", null, "protected-content"),
    }));
    assert.match(restoredMarkup, /protected-content/);
  } finally {
    await vite.close();
  }
});

test("auth restoration preserves 401, 403, and superseded-token behavior", async () => {
  const vite = await createServer({
    root: frontendRoot,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const { restoreAuthSession } = await vite.ssrLoadModule("/src/auth/AuthContext.jsx");
    let storedToken = "current-token";
    const options = {
      getToken: () => storedToken,
      tokenExpired: () => false,
    };

    const unauthorized = await restoreAuthSession(storedToken, {
      ...options,
      loadUser: async () => { throw Object.assign(new Error("Authentication required"), { status: 401 }); },
    });
    assert.equal(unauthorized.status, "unauthorized");
    assert.equal(storedToken, "current-token");

    const forbidden = await restoreAuthSession(storedToken, {
      ...options,
      loadUser: async () => { throw Object.assign(new Error("Insufficient permissions"), { status: 403 }); },
    });
    assert.equal(forbidden.status, "unavailable");
    assert.equal(storedToken, "current-token");

    const requestedToken = storedToken;
    storedToken = "replacement-token";
    const stale = await restoreAuthSession(requestedToken, {
      ...options,
      loadUser: async () => { throw Object.assign(new Error("Server unavailable"), { status: 503 }); },
    });
    assert.equal(stale.status, "stale");
    assert.equal(storedToken, "replacement-token");
  } finally {
    await vite.close();
  }
});

test("login retries a cold-start 503 without converting it to invalid credentials", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  try {
    globalThis.fetch = async () => {
      attempts += 1;
      if (attempts === 1) return response(503, { detail: "Service unavailable" });
      return response(200, { access_token: "staff-token", user: { role: "GOVT_OFFICER" } });
    };

    const session = await loginStaff("officer@aaptirakshak.demo", "Officer@123", {
      ...immediateRetry,
      maxAttempts: 2,
    });
    assert.equal(session.access_token, "staff-token");
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("login preserves actual 401 and 403 semantics without retrying", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const status of [401, 403]) {
      let attempts = 0;
      globalThis.fetch = async () => {
        attempts += 1;
        return response(status, { detail: status === 401 ? "Invalid email or password" : "Insufficient permissions" });
      };

      await assert.rejects(
        loginStaff("staff@example.test", "wrong", { ...immediateRetry, maxAttempts: 3 }),
        (error) => error.status === status,
      );
      assert.equal(attempts, 1);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("readiness and citizen states render connecting, continuation, and Retry UI", async () => {
  const vite = await createServer({
    root: frontendRoot,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const [{ BackendReadinessContent }, { VillageLoadNotice }] = await Promise.all([
      vite.ssrLoadModule("/src/components/BackendReadinessGate.jsx"),
      vite.ssrLoadModule("/src/pages/CitizenReportPage.jsx"),
    ]);
    const noop = () => {};
    const connecting = renderToStaticMarkup(React.createElement(BackendReadinessContent, {
      status: "connecting",
      onRetry: noop,
      children: React.createElement("span", null, "requested-page"),
    }));
    const unavailable = renderToStaticMarkup(React.createElement(BackendReadinessContent, {
      status: "unavailable",
      onRetry: noop,
      children: React.createElement("span", null, "requested-page"),
    }));
    const ready = renderToStaticMarkup(React.createElement(BackendReadinessContent, {
      status: "ready",
      onRetry: noop,
      children: React.createElement("span", null, "requested-page"),
    }));
    const villageLoading = renderToStaticMarkup(React.createElement(VillageLoadNotice, {
      status: "loading",
      onRetry: noop,
    }));
    const villageError = renderToStaticMarkup(React.createElement(VillageLoadNotice, {
      status: "error",
      onRetry: noop,
    }));

    assert.match(connecting, /Connecting to AAPTIRAKSHAK server/);
    assert.match(connecting, /may take up to a minute to wake/);
    assert.doesNotMatch(connecting, /requested-page/);
    assert.match(unavailable, /couldn&#x27;t reach the server right now/);
    assert.match(unavailable, /<button[^>]*type="button"[^>]*>Retry<\/button>/);
    assert.match(ready, /requested-page/);
    assert.match(villageLoading, /Connecting to the server/);
    assert.match(villageError, /couldn&#x27;t reach the server right now/);
    assert.match(villageError, />Retry<\/button>/);
  } finally {
    await vite.close();
  }
});
