import { useCallback, useEffect, useState } from "react";

import CommunitySignals from "../components/CommunitySignals.jsx";
import Icon from "../components/Icon.jsx";
import { getCommunityReports } from "../services/api.js";

function CommunityReportsPage({ onConnectionChange }) {
  const [state, setState] = useState({ status: "loading", reports: [] });

  const loadReports = useCallback(async () => {
    setState({ status: "loading", reports: [] });
    try {
      const reports = await getCommunityReports();
      setState({ status: "ready", reports });
      onConnectionChange("connected");
    } catch {
      setState({ status: "error", reports: [] });
      onConnectionChange("unavailable");
    }
  }, [onConnectionChange]);

  useEffect(() => {
    const controller = new AbortController();
    getCommunityReports(controller.signal)
      .then((reports) => {
        setState({ status: "ready", reports });
        onConnectionChange("connected");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ status: "error", reports: [] });
          onConnectionChange("unavailable");
        }
      });
    return () => controller.abort();
  }, [onConnectionChange]);

  return (
    <div className="px-5 py-7 lg:px-8 lg:py-8">
      <div className="mb-7">
        <p className="text-sm font-semibold text-cyan-700">Government review workspace</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Community environmental hazard reports</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Synthetic incident clusters that help authorities decide where official inspection or sampling is needed. No submission changes modeled disease risk automatically.</p>
      </div>

      {state.status === "loading" && <div className="h-96 animate-pulse rounded-2xl bg-white" role="status"><span className="sr-only">Loading community reports</span></div>}
      {state.status === "error" && (
        <section className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
          <Icon className="mx-auto h-8 w-8 text-rose-700" name="warning" />
          <h2 className="mt-3 text-lg font-bold text-slate-950">Community reports are unavailable</h2>
          <p className="mt-2 text-sm text-slate-500">Check the backend connection and try again.</p>
          <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white" onClick={loadReports}><Icon className="h-4 w-4" name="refresh" />Retry</button>
        </section>
      )}
      {state.status === "ready" && <CommunitySignals reports={state.reports} />}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Closed-loop surveillance</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">Community evidence requires official verification</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">High-priority clusters can create an inspection item in the Verification Queue. Only verified findings can become official evidence in a future assessment cycle; unverified community signals do not directly alter risk scores or confirm contamination.</p>
      </section>
    </div>
  );
}

export default CommunityReportsPage;
