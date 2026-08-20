import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { getCommunityReportStatus } from "../services/api.js";

const labels = { UNVERIFIED: "Received", UNDER_REVIEW: "Under review", VERIFIED_HAZARD: "Verified hazard", REJECTED: "Rejected", DUPLICATE: "Duplicate" };
function initialId() { return new URLSearchParams(window.location.hash.split("?")[1] || "").get("id") || ""; }

function ReportStatusPage() {
  const [reportId, setReportId] = useState(initialId);
  const [state, setState] = useState({ status: "idle", result: null, error: "" });
  async function lookup(event) { event.preventDefault(); setState({ status: "loading", result: null, error: "" }); try { setState({ status: "ready", result: await getCommunityReportStatus(reportId.trim().toUpperCase()), error: "" }); } catch (error) { setState({ status: "error", result: null, error: error.message }); } }
  return <div className="min-h-screen bg-teal-50"><header className="border-b border-teal-100 bg-white"><div className="mx-auto flex max-w-xl items-center px-5 py-4"><a className="font-bold text-teal-700" href="#/citizen-report">← Report a hazard</a></div></header><main className="mx-auto max-w-xl px-5 py-12"><section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm sm:p-8"><div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-100 text-teal-700"><Icon name="verify"/></div><h1 className="mt-5 text-3xl font-bold">Check report status</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter the demo report ID shown after submission. No personal information is displayed.</p><form className="mt-6" onSubmit={lookup}><label className="text-sm font-bold" htmlFor="report-id">Report ID</label><input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase" id="report-id" required value={reportId} onChange={(e) => setReportId(e.target.value)} placeholder="CR-1001"/><button className="mt-3 w-full rounded-xl bg-teal-700 px-4 py-3 font-bold text-white disabled:opacity-60" disabled={state.status === "loading"}>{state.status === "loading" ? "Checking…" : "Check status"}</button></form>{state.error && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800" role="alert">{state.error}</p>}{state.result && <div className="mt-6 rounded-2xl border border-slate-200 p-5"><p className="text-xs font-bold uppercase text-slate-400">{state.result.report_id}</p><p className="mt-2 text-2xl font-bold text-slate-950">{labels[state.result.verification_status] || state.result.verification_status}</p><p className="mt-3 text-xs text-slate-500">{state.result.status_note}</p></div>}</section></main></div>;
}
export default ReportStatusPage;
