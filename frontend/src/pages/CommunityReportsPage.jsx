import { useCallback, useEffect, useState } from "react";

import Icon from "../components/Icon.jsx";
import { getCommunityPhoto, getCommunityReports, updateCommunityReportStatus } from "../services/api.js";
import { representativePhotoAttribution } from "../utils/communityReportPresentation.js";
import { beginEvidencePhotoLoad } from "../utils/evidencePhotoLifecycle.js";
import { settleAbortableRequest } from "../utils/requestLifecycle.js";

const labels = { STAGNANT_WATER: "Stagnant water", FLOODED_AREA: "Flooded area", SEWAGE_OVERFLOW: "Sewage overflow", SUSPECTED_DIRTY_WATER_SOURCE: "Suspected dirty water source", BROKEN_WATER_PIPELINE: "Broken water pipeline", GARBAGE_NEAR_WATER_SOURCE: "Garbage near water source", SUSPECTED_MOSQUITO_BREEDING_SITE: "Possible mosquito-breeding site", OTHER_ENVIRONMENTAL_HAZARD: "Other environmental hazard" };
const statuses = ["UNVERIFIED", "UNDER_REVIEW", "VERIFIED_HAZARD", "REJECTED", "DUPLICATE"];

function ProtectedEvidencePhoto({ report }) {
  const [photo, setPhoto] = useState({ path: "", source: "" });
  const source = photo.path === report.photo_url ? photo.source : "";
  useEffect(() => {
    const controller = new AbortController();
    const stop = beginEvidencePhotoLoad({
      path: report.photo_url,
      signal: controller.signal,
      loadPhoto: getCommunityPhoto,
      setSource: (nextSource) => setPhoto({ path: report.photo_url, source: nextSource }),
      revokeObjectUrl: URL.revokeObjectURL,
    });
    return () => { controller.abort(); stop(); };
  }, [report.photo_url]);
  return source ? <img className="mt-4 max-h-64 w-full rounded-xl border border-slate-200 object-contain" src={source} alt={`Submitted evidence for ${labels[report.category] || "community hazard"}`}/> : <div className="mt-4 grid h-32 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-500">Loading protected evidence…</div>;
}

function CommunityReportsPage({ onConnectionChange }) {
  const [state, setState] = useState({ status: "loading", reports: [], selected: null, updating: false, message: "", error: "" });
  const load = useCallback(async (signal) => {
    setState((old) => ({ ...old, status: "loading", error: "" }));
    try {
      const result = await settleAbortableRequest(getCommunityReports, signal);
      if (result.aborted) return;
      const reports = result.value;
      setState({ status: "ready", reports, selected: reports[0] || null, updating: false, message: "", error: "" });
      onConnectionChange("connected");
    } catch (error) {
      setState((old) => ({ ...old, status: "error", error: error.message }));
      onConnectionChange("unavailable");
    }
  }, [onConnectionChange]);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  async function changeStatus(status) { setState((old) => ({ ...old, updating: true, error: "", message: "" })); try { const updated = await updateCommunityReportStatus(state.selected.id, status); setState((old) => ({ ...old, updating: false, selected: updated, reports: old.reports.map((report) => report.cluster_id === updated.cluster_id ? updated : report), message: updated.risk_boundary_notice })); } catch (error) { setState((old) => ({ ...old, updating: false, error: error.message })); } }

  return <div className="px-5 py-7 lg:px-8 lg:py-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-cyan-700">Government review workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Community environmental hazard reports</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Inspect clustered signals and record a prototype verification outcome. Status changes do not modify disease risk.</p></div><a className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white" href="#/citizen-report">Open citizen report form</a></div>
    {state.status === "loading" && <div className="mt-6 h-96 animate-pulse rounded-2xl bg-white" role="status"><span className="sr-only">Loading reports</span></div>}{state.status === "error" && <section className="mt-6 rounded-2xl border border-rose-200 bg-white p-8 text-center"><Icon className="mx-auto text-rose-700" name="warning"/><h2 className="mt-3 text-lg font-bold">Reports unavailable</h2><p className="mt-2 text-sm text-slate-500">{state.error}</p><button className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white" onClick={() => load()}>Retry</button></section>}
    {state.status === "ready" && <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1.15fr_.85fr]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold">Incident clusters</h2><p className="mt-1 text-xs text-slate-500">Includes synthetic seeds and new demo citizen submissions.</p></div><div className="max-h-[760px] divide-y divide-slate-100 overflow-y-auto">{state.reports.map((report) => <button className={`w-full p-5 text-left transition hover:bg-slate-50 ${state.selected?.cluster_id === report.cluster_id ? "bg-cyan-50/60" : ""}`} key={report.cluster_id} onClick={() => setState((old) => ({ ...old, selected: report, message: "", error: "" }))}><div className="flex items-start justify-between gap-4"><div><p className="font-bold text-slate-950">{labels[report.category] || report.category}</p><p className="mt-1 text-sm text-slate-500">{report.village_name} · {report.id} / {report.cluster_id}</p></div><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${report.priority === "HIGH" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{report.priority}</span></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-slate-100 px-2 py-1 font-semibold">{report.verification_status.replaceAll("_", " ")}</span><span className="rounded-md bg-cyan-50 px-2 py-1 font-semibold text-cyan-800">{report.report_count_nearby} nearby reports</span><span className="px-2 py-1 text-slate-400">{new Date(report.reported_at).toLocaleString("en-IN")}</span></div></button>)}</div></section>
      {state.selected && <aside className="sticky top-32 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="Selected community incident detail"><p className="text-xs font-bold uppercase tracking-wider text-cyan-700">Incident review</p><h2 className="mt-1 text-xl font-bold">{labels[state.selected.category] || state.selected.category}</h2><p className="mt-1 text-sm text-slate-500">{state.selected.id} · Cluster {state.selected.cluster_id}</p><dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-xs font-bold text-slate-400">Village</dt><dd className="mt-1 font-semibold">{state.selected.village_name}</dd></div><div><dt className="text-xs font-bold text-slate-400">Priority</dt><dd className="mt-1 font-semibold">{state.selected.priority}</dd></div><div><dt className="text-xs font-bold text-slate-400">Coordinates</dt><dd className="mt-1 font-semibold">{state.selected.latitude == null || state.selected.longitude == null ? "Not shared" : `${state.selected.latitude.toFixed(4)}, ${state.selected.longitude.toFixed(4)}`}</dd></div><div><dt className="text-xs font-bold text-slate-400">Reported</dt><dd className="mt-1 font-semibold">{new Date(state.selected.reported_at).toLocaleString("en-IN")}</dd></div><div><dt className="text-xs font-bold text-slate-400">Nearby reports</dt><dd className="mt-1 font-semibold">{state.selected.report_count_nearby}</dd></div><div><dt className="text-xs font-bold text-slate-400">Evidence</dt><dd className="mt-1 font-semibold">{state.selected.evidence_type.replaceAll("_", " ")}</dd></div></dl><p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{state.selected.description}</p>{state.selected.photo_url ? <><ProtectedEvidencePhoto report={state.selected}/><p className="mt-2 text-xs font-bold text-cyan-800">{representativePhotoAttribution(state.selected)}</p></> : <div className="mt-4 grid h-32 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs font-semibold text-slate-500"><span><Icon className="mx-auto mb-2" name="camera"/>Demo photo placeholder / no stored photo</span></div>}<label className="mt-5 block text-xs font-bold text-slate-600">Verification status<select className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" value={state.selected.verification_status} disabled={state.updating} onChange={(event) => changeStatus(event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>{state.updating && <p className="mt-2 text-xs font-semibold text-slate-500">Updating demo session…</p>}{state.message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800" role="status">{state.message}</p>}{state.error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800" role="alert">{state.error}</p>}<p className="mt-5 text-xs leading-5 text-slate-500"><strong>Boundary:</strong> verified environmental evidence is recorded only. Future model/evidence integration will handle any reassessment.</p></aside>}
    </div>}
    <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Closed-loop surveillance</p><p className="mt-2 text-sm leading-6 text-violet-950">Community signals → official review → verified environmental evidence → future model integration. Unverified or verified citizen reports never directly change current synthetic disease-risk scores.</p></section>
  </div>;
}
export default CommunityReportsPage;
