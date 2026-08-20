import assert from "node:assert/strict";
import test from "node:test";

import { routePermission } from "../src/auth/routing.js";
import {
  AUTH_INVALIDATED_EVENT,
  TOKEN_KEY,
  getStoredToken,
  clearStoredToken,
  handleCurrentTokenFailure,
  handleTokenStorageEvent,
  invalidateSession,
  scheduleTokenExpiration,
  storeToken,
} from "../src/auth/session.js";
import {
  getCommunityPhoto,
  getCommunityReportStatus,
  getOverview,
  getPublicVillages,
  submitCommunityReport,
} from "../src/services/api.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function jwtWithExpiration(expirationSeconds) {
  const payload = Buffer.from(JSON.stringify({ exp: expirationSeconds })).toString("base64url");
  return `header.${payload}.signature`;
}

function response(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function installBrowserGlobals() {
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  globalThis.localStorage = memoryStorage();
  globalThis.window = new EventTarget();
  return () => {
    globalThis.localStorage = originalStorage;
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  };
}

test("an expired token clears auth and protected routing redirects to login", () => {
  const storage = memoryStorage();
  const events = new EventTarget();
  let authStatus = "authenticated";
  const token = jwtWithExpiration(1_700_000_000);
  storeToken(token, storage);

  scheduleTokenExpiration(token, () => {
    invalidateSession(storage, events);
    authStatus = "unauthenticated";
  }, { now: 1_700_000_001_000, storage });

  assert.equal(getStoredToken(storage), "");
  assert.deepEqual(routePermission("overview", authStatus), { outcome: "redirect", route: "login" });
});

test("a cross-tab token removal clears current-tab auth state", () => {
  const storage = memoryStorage();
  storeToken("staff-token", storage);
  clearStoredToken(storage);
  let authStatus = "authenticated";
  const handled = handleTokenStorageEvent(
    { key: TOKEN_KEY, oldValue: "staff-token", newValue: null },
    {
      onRemoved: () => { authStatus = "unauthenticated"; },
      onReplaced: () => { authStatus = "loading"; },
    },
    storage,
  );
  assert.equal(handled, true);
  assert.equal(authStatus, "unauthenticated");
  assert.equal(getStoredToken(storage), "");
});

test("a cross-tab token replacement immediately hides privileged auth state", () => {
  const storage = memoryStorage();
  storeToken("new-token", storage);
  let authStatus = "authenticated";
  const handled = handleTokenStorageEvent(
    { key: TOKEN_KEY, oldValue: "old-token", newValue: "new-token" },
    {
      onRemoved: () => { authStatus = "unauthenticated"; },
      onReplaced: () => { authStatus = "loading"; },
    },
    storage,
  );
  assert.equal(handled, true);
  assert.equal(authStatus, "loading");
});

test("a protected API 401 clears the stored session", async () => {
  const restore = installBrowserGlobals();
  try {
    storeToken("staff-token");
    let invalidations = 0;
    window.addEventListener(AUTH_INVALIDATED_EVENT, () => { invalidations += 1; });
    globalThis.fetch = async () => response(401, { detail: "Authentication required" });

    await assert.rejects(getOverview(), (error) => error.status === 401);
    assert.equal(getStoredToken(), "");
    assert.equal(invalidations, 1);
  } finally {
    restore();
  }
});

test("a protected photo 401 uses the same session invalidation path", async () => {
  const restore = installBrowserGlobals();
  try {
    storeToken("staff-token");
    let invalidations = 0;
    window.addEventListener(AUTH_INVALIDATED_EVENT, () => { invalidations += 1; });
    globalThis.fetch = async () => response(401);

    await assert.rejects(getCommunityPhoto("/api/community-reports/CR-001/photo"), (error) => error.status === 401);
    assert.equal(getStoredToken(), "");
    assert.equal(invalidations, 1);
  } finally {
    restore();
  }
});

test("a protected API 403 preserves a valid authenticated session", async () => {
  const restore = installBrowserGlobals();
  try {
    storeToken("staff-token");
    let invalidations = 0;
    window.addEventListener(AUTH_INVALIDATED_EVENT, () => { invalidations += 1; });
    globalThis.fetch = async () => response(403, { detail: "Insufficient permissions" });

    await assert.rejects(getOverview(), (error) => error.status === 403);
    assert.equal(getStoredToken(), "staff-token");
    assert.equal(invalidations, 0);
  } finally {
    restore();
  }
});

test("public citizen requests remain unauthenticated and do not redirect to staff login", async () => {
  const restore = installBrowserGlobals();
  try {
    storeToken("staff-token");
    const requests = [];
    globalThis.fetch = async (url, options) => {
      requests.push({ url, options });
      return response(200, []);
    };

    await getPublicVillages();
    await submitCommunityReport(new FormData());
    await getCommunityReportStatus("CR-PUBLIC");

    assert.equal(requests.length, 3);
    assert.ok(requests.every(({ options }) => !options.headers.has("Authorization")));
    assert.equal(routePermission("citizen-report", "unauthenticated").outcome, "public");
    assert.equal(getStoredToken(), "staff-token");
  } finally {
    restore();
  }
});
test("a stale protected 401 cannot clear a replacement token", async () => {
  const restore = installBrowserGlobals();
  try {
    const pendingResponse = deferred();
    let invalidations = 0;
    window.addEventListener(AUTH_INVALIDATED_EVENT, () => { invalidations += 1; });
    storeToken("token-a");
    globalThis.fetch = () => pendingResponse.promise;

    const pendingRequest = getOverview();
    storeToken("token-b");
    pendingResponse.resolve(response(401, { detail: "Authentication required" }));

    await assert.rejects(pendingRequest, (error) => error.status === 401);
    assert.equal(getStoredToken(), "token-b");
    assert.equal(invalidations, 0);
  } finally {
    restore();
  }
});

test("startup validation failure ignores a superseded token", () => {
  const storage = memoryStorage();
  let authStatus = "authenticated";
  storeToken("token-a", storage);
  storeToken("token-b", storage);

  const handled = handleCurrentTokenFailure("token-a", () => {
    storage.removeItem(TOKEN_KEY);
    authStatus = "unauthenticated";
  }, storage);

  assert.equal(handled, false);
  assert.equal(getStoredToken(storage), "token-b");
  assert.equal(authStatus, "authenticated");
});

test("protected photo fetch sends bearer auth and creates an object URL", async () => {
  const restore = installBrowserGlobals();
  let objectUrl = "";
  try {
    let capturedRequest;
    storeToken("staff-token");
    globalThis.fetch = async (url, options) => {
      capturedRequest = { url, options };
      return {
        ok: true,
        status: 200,
        blob: async () => new Blob(["photo"], { type: "image/png" }),
      };
    };

    objectUrl = await getCommunityPhoto("/api/community-reports/CR-001/photo");
    assert.equal(capturedRequest.options.headers.get("Authorization"), "Bearer staff-token");
    assert.equal(capturedRequest.url.endsWith("/api/community-reports/CR-001/photo"), true);
    assert.match(objectUrl, /^blob:/);
    assert.equal(getStoredToken(), "staff-token");
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    restore();
  }
});
test("a stale expiry callback cannot clear a replacement token", () => {
  const storage = memoryStorage();
  const tokenA = jwtWithExpiration(1_700_000_100);
  const tokenB = jwtWithExpiration(1_700_000_200);
  const now = 1_700_000_000_000;
  let expireA;
  let expireB;
  let authStatus = "authenticated";
  const logout = () => {
    clearStoredToken(storage);
    authStatus = "unauthenticated";
  };

  storeToken(tokenA, storage);
  scheduleTokenExpiration(tokenA, logout, {
    now,
    storage,
    setTimer: (callback) => { expireA = callback; },
    clearTimer: () => {},
  });

  storeToken(tokenB, storage);
  expireA();
  assert.equal(getStoredToken(storage), tokenB);
  assert.equal(authStatus, "authenticated");

  scheduleTokenExpiration(tokenB, logout, {
    now,
    storage,
    setTimer: (callback) => { expireB = callback; },
    clearTimer: () => {},
  });
  expireB();
  assert.equal(getStoredToken(storage), "");
  assert.equal(authStatus, "unauthenticated");
});

test("stale removal is ignored before the current replacement event is handled", () => {
  const storage = memoryStorage();
  let authStatus = "authenticated:token-b";
  storeToken("token-b", storage);
  const callbacks = {
    onRemoved: () => {
      clearStoredToken(storage);
      authStatus = "unauthenticated";
    },
    onReplaced: (token) => { authStatus = `authenticated:${token}`; },
  };

  const staleRemovalHandled = handleTokenStorageEvent(
    { key: TOKEN_KEY, oldValue: "token-a", newValue: null },
    callbacks,
    storage,
  );
  assert.equal(staleRemovalHandled, false);
  assert.equal(getStoredToken(storage), "token-b");
  assert.equal(authStatus, "authenticated:token-b");

  const replacementHandled = handleTokenStorageEvent(
    { key: TOKEN_KEY, oldValue: null, newValue: "token-b" },
    callbacks,
    storage,
  );
  assert.equal(replacementHandled, true);
  assert.equal(getStoredToken(storage), "token-b");
  assert.equal(authStatus, "authenticated:token-b");
});
