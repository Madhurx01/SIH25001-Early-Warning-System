import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getHealth } from "../services/api.js";
import { createBackendConnector, isAbortError } from "../utils/backendReadiness.js";
import Icon from "./Icon.jsx";

export function BackendConnectionScreen({ status, onRetry }) {
  const unavailable = status === "unavailable";
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-center text-white">
      <section className="w-full max-w-md rounded-3xl border border-teal-200/15 bg-slate-900 p-7 shadow-2xl shadow-teal-950/30 sm:p-9" aria-live="polite">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-teal-200/20 bg-teal-300/10 text-teal-200">
          <Icon className="h-7 w-7" name={unavailable ? "warning" : "shield"}/>
        </div>
        <p className="mt-5 text-xs font-black tracking-[.2em] text-teal-300">AAPTIRAKSHAK</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {unavailable ? "Server temporarily unavailable" : "Connecting to AAPTIRAKSHAK server…"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {unavailable
            ? "We couldn't reach the server right now. Please try again shortly."
            : "The demo server may take up to a minute to wake after inactivity."}
        </p>
        {unavailable ? (
          <button className="mt-6 min-h-11 rounded-xl bg-teal-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200/30" onClick={onRetry} type="button">Retry</button>
        ) : (
          <div className="mx-auto mt-6 h-7 w-7 animate-spin rounded-full border-2 border-teal-300/25 border-t-teal-300 motion-reduce:animate-none" aria-hidden="true"/>
        )}
      </section>
    </main>
  );
}

export function BackendReadinessContent({ status, onRetry, children }) {
  if (status === "ready") return children;
  return <BackendConnectionScreen status={status} onRetry={onRetry}/>;
}

export default function BackendReadinessGate({ children }) {
  const [status, setStatus] = useState("connecting");
  const controllerRef = useRef(null);
  const connectBackend = useMemo(() => createBackendConnector((signal) => getHealth(signal, { maxAttempts: 1 })), []);

  const connect = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("connecting");
    connectBackend(controller.signal)
      .then(() => {
        if (controllerRef.current === controller && !controller.signal.aborted) setStatus("ready");
      })
      .catch((error) => {
        if (controllerRef.current === controller && !isAbortError(error, controller.signal)) {
          setStatus("unavailable");
        }
      });
  }, [connectBackend]);

  useEffect(() => {
    connect();
    return () => controllerRef.current?.abort();
  }, [connect]);

  return <BackendReadinessContent status={status} onRetry={connect}>{children}</BackendReadinessContent>;
}
