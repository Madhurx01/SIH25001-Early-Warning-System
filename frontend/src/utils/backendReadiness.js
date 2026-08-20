export const BACKEND_RETRY_INTERVAL_MS = 3_000;
export const BACKEND_MAX_ATTEMPTS = 21;

const TRANSIENT_BACKEND_STATUSES = new Set([502, 503, 504]);
const NETWORK_ERROR_PATTERN = /failed to fetch|fetch failed|network(?:error| request failed)|load failed/i;

export function isAbortError(error, signal) {
  return Boolean(signal?.aborted || error?.name === "AbortError");
}

export function markTransientBackendError(error) {
  const markedError = error instanceof Error ? error : new Error("Backend network request failed");
  markedError.transientBackendFailure = true;
  return markedError;
}

export function isTransientBackendError(error) {
  if (!error || error.name === "AbortError") return false;
  if (error.transientBackendFailure) return true;
  if (TRANSIENT_BACKEND_STATUSES.has(Number(error.status))) return true;
  return error instanceof TypeError || NETWORK_ERROR_PATTERN.test(error.message || "");
}

export function waitForRetry(delayMs, signal) {
  if (signal?.aborted) return Promise.reject(signal.reason || abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason || abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function abortError() {
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
}

export async function retryTransientOperation(operation, {
  maxAttempts = BACKEND_MAX_ATTEMPTS,
  delayMs = BACKEND_RETRY_INTERVAL_MS,
  sleep = waitForRetry,
  signal,
  onRetry,
} = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) throw signal.reason || abortError();
    try {
      return await operation({ attempt, signal });
    } catch (error) {
      if (isAbortError(error, signal) || !isTransientBackendError(error) || attempt === maxAttempts) {
        throw error;
      }
      onRetry?.({ attempt, error });
      await sleep(delayMs, signal);
    }
  }
  throw new Error("Backend retry attempts were exhausted");
}

export function createBackendConnector(checkBackend, retryOptions = {}) {
  return (signal) => retryTransientOperation(
    () => checkBackend(signal),
    { ...retryOptions, signal },
  );
}

export function createBackendUnavailableError(cause) {
  const error = new Error("We couldn't reach the server right now. Please try again shortly.");
  error.name = "BackendUnavailableError";
  error.transientBackendFailure = true;
  error.cause = cause;
  return error;
}
