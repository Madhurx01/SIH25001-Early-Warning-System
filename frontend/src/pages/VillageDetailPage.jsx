import { useEffect, useState } from "react";

import CommunitySignals from "../components/CommunitySignals.jsx";
import Icon from "../components/Icon.jsx";
import RainfallDiseaseTrend from "../components/RainfallDiseaseTrend.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { getVillage, getVillageReports, getVillageTasks, getVillageTrend } from "../services/api.js";

const freshnessStyles = { FRESH: "bg-emerald-50 text-emerald-700", AGING: "bg-amber-50 text-amber-700", STALE: "bg-rose-50 text-rose-700", MISSING: "bg-slate-100 text-slate-600" };
const stepLabels = ["Prediction / Evidence Signal", "Missing or uncertain evidence detected", "Verification task generated", "Field/citizen evidence reviewed", "Verified evidence recorded", "Future risk reassessment"];

function VillageDetailPage({ villageId, onConnectionChange }) {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getVillage(villageId, controller.signal), getVillageTrend(villageId, controller.signal), getVillageReports(villageId, controller.signal), getVillageTasks(villageId, controller.signal)])
      .then(([village, trend, reports, tasks]) => { setState({ status: "ready", data: { village, trend, reports, tasks }, error: "" }); onConnectionChange("connected"); })
      .catch((error) => { if (error.name !== "AbortError") { setState({ status: "error", data: null, error: error.message }); onConnectionChange("unavailable"); } });
    return () => controller.abort();
  }, [villageId, onConnectionChange]);

  if (state.status === "loading") return <div className="p-8"><div className="h-[36rem] animate-pulse rounded-2xl bg-white" role="status"><span className="sr-only">Loading village detail</span></div></div>;
  if (state.status === "error") return <div className="p-8"><section className="rounded-2xl border border-rose-200 bg-white p-8 text-center"><Icon className="mx-auto text-rose-700" name="warning"/><h1 className="mt-3 text-xl font-bold">Village detail unavailable</h1><p className="mt-2 text-sm text-slate-500">{state.error}</p><a className="mt-5 inline-block font-bold text-teal-700" href="#/villages">Return to villages</a></section></div>;

  const { village, trend, reports, tasks } = state.data;
  const latestReport = reports[0];
  return (
    <div className="px-5 py-7 lg:px-8 lg:py-8">
      <a className="text-sm font-bold text-teal-700" href="#/villages">← Back to villages</a>
      <header className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-5"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight text-slate-950">{village.name}</h1><span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">Demo / Synthetic Data</span></div><p className="mt-2 text-sm text-slate-500">{village.district}, {village.state} · Population {village.population.toLocaleString("en-IN")}</p><p className="mt-1 text-xs text-slate-400">{village.id} · {village.location_note}</p></div><RiskBadge level={village.alert_level}/></div></header>

      <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Risk and confidence"><article className="rounded-2xl border border-rose-100 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wider text-rose-700">Risk Score</p><p className="mt-2 text-4xl font-black text-slate-950">{village.risk_score}%</p><p className="mt-3 text-sm leading-6 text-slate-600">{village.risk_explanation}</p></article><article className="rounded-2xl border border-sky-100 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wider text-sky-700">Confidence Score</p><p className="mt-2 text-4xl font-black text-slate-950">{village.confidence_score}%</p><p className="mt-3 text-sm leading-6 text-slate-600">{village.confidence_explanation}</p></article></section>

      <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-6"><p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Why is this village prioritized?</p><h2 className="mt-1 text-xl font-bold text-slate-950">Evidence drivers, not claims of causality</h2><ul className="mt-4 grid gap-3 md:grid-cols-2">{village.priority_drivers.map((driver) => <li className="flex items-start gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700" key={driver}><Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" name="verify"/>{driver}</li>)}</ul><p className="mt-4 text-xs leading-5 text-slate-500">Drivers summarize synthetic evidence fields only and do not establish scientific or medical causality.</p></section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-slate-950">Evidence & data freshness</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{village.evidence.map((item) => <article className="rounded-xl border border-slate-200 p-4" key={item.key}><div className="flex items-start justify-between gap-2"><p className="text-sm font-bold text-slate-800">{item.label}</p><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${freshnessStyles[item.freshness]}`}>{item.freshness}</span></div><p className="mt-3 text-sm text-slate-600">{item.value.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-400">{item.age_days == null ? "No record" : `${item.age_days} days old`}</p></article>)}<article className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><p className="text-sm font-bold text-slate-800">Community reports</p><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${reports.length ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{reports.length ? "REVIEW" : "MISSING"}</span></div><p className="mt-3 text-sm text-slate-600">{reports.length} incident cluster{reports.length === 1 ? "" : "s"}</p><p className="mt-1 text-xs text-slate-400">{latestReport ? `Latest ${new Date(latestReport.reported_at).toLocaleDateString("en-IN")}` : "No report"}</p></article></div><p className="mt-4 flex items-start gap-2 text-xs text-slate-500"><Icon className="h-4 w-4 shrink-0" name="info"/>{village.freshness_rules_note}</p></section>

      <div className="mt-6"><RainfallDiseaseTrend trend={trend}/></div>
      <div className="mt-6"><CommunitySignals reports={reports}/></div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Operational follow-up</p><h2 className="mt-1 text-xl font-bold">Verification tasks</h2></div><a className="text-sm font-bold text-teal-700" href="#/surveillance">Manage all tasks →</a></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{tasks.map((task) => <article className="rounded-xl border border-slate-200 p-4" key={task.id}><div className="flex justify-between gap-3"><p className="font-bold text-slate-900">{task.action}</p><span className="h-fit rounded-md bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">{task.status}</span></div><p className="mt-2 text-xs font-bold text-slate-400">{task.id} · {task.task_type.replaceAll("_", " ")}</p><p className="mt-3 text-xs font-bold text-slate-600">Reason:</p><ul className="mt-1 list-disc pl-5 text-sm leading-6 text-slate-600">{task.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></article>)}{tasks.length === 0 && <p className="text-sm text-slate-500">No open verification tasks for this village.</p>}</div></section>

      <section className="mt-6 rounded-2xl bg-slate-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-wider text-teal-300">Closed-loop surveillance</p><h2 className="mt-1 text-xl font-bold">From evidence gap to future reassessment</h2><ol className="mt-5 grid gap-2 lg:grid-cols-6">{stepLabels.map((label, index) => <li className="relative rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-semibold leading-5" key={label}><span className="mb-2 grid h-6 w-6 place-items-center rounded-full bg-teal-400 font-black text-slate-950">{index + 1}</span>{label}{index === 5 && <span className="mt-2 block text-[10px] font-bold uppercase text-amber-300">Future model integration</span>}</li>)}</ol></section>
    </div>
  );
}

export default VillageDetailPage;
