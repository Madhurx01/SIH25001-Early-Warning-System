const TOKEN_KEY = "aaptirakshak_access_token";
const AUTH_INVALIDATED_EVENT = "aaptirakshak:unauthorized";

export function getStoredToken(storage = globalThis.localStorage) {
  return storage?.getItem(TOKEN_KEY) || "";
}

export function storeToken(token, storage = globalThis.localStorage) {
  storage?.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(storage = globalThis.localStorage) {
  storage?.removeItem(TOKEN_KEY);
}

export function getTokenExpirationTime(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    let json;
    if (typeof globalThis.atob === "function") {
      const bytes = Uint8Array.from(globalThis.atob(padded), (character) => character.charCodeAt(0));
      json = new TextDecoder().decode(bytes);
    } else {
      json = Buffer.from(padded, "base64").toString("utf8");
    }
    const expiration = Number(JSON.parse(json).exp);
    return Number.isFinite(expiration) ? expiration * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token, now = Date.now()) {
  const expiration = getTokenExpirationTime(token);
  return expiration === null || expiration <= now;
}

export function scheduleTokenExpiration(
  token,
  onExpire,
  {
    now = Date.now(),
    setTimer = globalThis.setTimeout,
    clearTimer = globalThis.clearTimeout,
    storage = globalThis.localStorage,
  } = {},
) {
  const expiration = getTokenExpirationTime(token);
  const expireCurrentToken = () => handleCurrentTokenFailure(token, onExpire, storage);
  if (expiration === null || expiration <= now) {
    expireCurrentToken();
    return () => {};
  }
  const timer = setTimer(expireCurrentToken, expiration - now);
  return () => clearTimer(timer);
}

export function handleTokenStorageEvent(
  event,
  { onRemoved, onReplaced },
  storage = globalThis.localStorage,
) {
  if (event.key !== TOKEN_KEY || event.oldValue === event.newValue) return false;
  if (event.newValue) {
    if (getStoredToken(storage) !== event.newValue) return false;
    onReplaced(event.newValue);
  } else {
    if (getStoredToken(storage)) return false;
    onRemoved();
  }
  return true;
}

export function handleCurrentTokenFailure(
  token,
  onCurrentFailure,
  storage = globalThis.localStorage,
) {
  if (!token || getStoredToken(storage) !== token) return false;
  onCurrentFailure();
  return true;
}

export function invalidateSession(
  storage = globalThis.localStorage,
  eventTarget = globalThis.window,
) {
  clearStoredToken(storage);
  if (eventTarget?.dispatchEvent && typeof globalThis.Event === "function") {
    eventTarget.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT));
  }
}

export { AUTH_INVALIDATED_EVENT, TOKEN_KEY };
