import { useEffect, useState } from "react";

import Icon from "../components/Icon.jsx";
import { getTasks, updateTaskStatus } from "../services/api.js";

const nextStatus = { OPEN: "ASSIGNED", ASSIGNED: "IN_PROGRESS", IN_PROGRESS: "VERIFIED", VERIFIED: "CLOSED" };
const actionLabels = { OPEN: "Assign task", ASSIGNED: "Start work", IN_PROGRESS: "Record verified", VERIFIED: "Close task" };
const statusStyles = { OPEN: "bg-slate-100 text-slate-700", ASSIGNED: "bg-sky-50 text-sky-700", IN_PROGRESS: "bg-amber-50 text-amber-800", VERIFIED: "bg-emerald-50 text-emerald-700", CLOSED: "bg-slate-800 text-white" };

function SurveillancePage({ onConnectionChange }) {
  const [state, setState] = useState({ status: "loading", tasks: [], error: "", updating: "", notice: "" });
  useEffect(() => {
    const controller = new AbortController();
    getTasks(controller.signal).then((tasks) => { setState((old) => ({ ...old, status: "ready", tasks })); onConnectionChange("connected"); }).catch((error) => { if (error.name !== "AbortError") { setState((old) => ({ ...old, status: "error", error: error.message })); onConnectionChange("unavailable"); } });
    return () => controller.abort();
  }, [onConnectionChange]);

  async function advance(task) {
    setState((old) => ({ ...old, updating: task.id, notice: "", error: "" }));
    try {
      const updated = await updateTaskStatus(task.id, nextStatus[task.status]);
      setState((old) => ({ ...old, updating: "", tasks: old.tasks.map((item) => item.id === task.id ? updated : item), notice: `${task.id} moved to ${updated.status}.` }));
    } catch (error) { setState((old) => ({ ...old, updating: "", error: error.message })); }
  }

  return (
    <div className="px-5 py-7 lg:px-8 lg:py-8"><p className="text-sm font-semibold text-violet-700">Demo session workflow</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Surveillance & verification</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Manage prototype evidence-verification tasks. Status changes reset when the backend restarts; no government authentication is implemented yet.</p>
      {state.notice && <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800" role="status">{state.notice}</p>}
      {state.error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800" role="alert">{state.error}</p>}
      {state.status === "loading" ? <div className="mt-6 h-96 animate-pulse rounded-2xl bg-white" role="status"><span className="sr-only">Loading verification tasks</span></div> : <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><caption className="sr-only">Verification task workflow</caption><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Task / village</th><th className="px-4 py-4">Type</th><th className="px-4 py-4">Reason</th><th className="px-4 py-4">Priority</th><th className="px-4 py-4">Created</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{state.tasks.map((task) => <tr className="align-top" key={task.id}><td className="px-5 py-4"><p className="font-bold text-slate-900">{task.id}</p><a className="mt-1 block text-sm font-semibold text-teal-700" href={`#/villages/${task.village_id}`}>{task.village_name}</a><p className="text-xs text-slate-400">{task.district}</p></td><td className="px-4 py-4 text-sm font-semibold text-slate-700">{task.task_type.replaceAll("_", " ")}</td><td className="max-w-md px-4 py-4"><p className="text-sm font-semibold text-slate-800">{task.action}</p><ul className="mt-2 list-disc pl-4 text-xs leading-5 text-slate-500">{task.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></td><td className="px-4 py-4 text-sm font-black">#{task.priority}</td><td className="px-4 py-4 text-sm text-slate-600">{new Date(task.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td><td className="px-4 py-4"><span className={`rounded-md px-2 py-1 text-[11px] font-bold ${statusStyles[task.status]}`}>{task.status.replaceAll("_", " ")}</span></td><td className="px-4 py-4">{nextStatus[task.status] ? <button className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" disabled={state.updating === task.id} onClick={() => advance(task)}>{state.updating === task.id ? "Updating…" : actionLabels[task.status]}</button> : <span className="text-xs font-semibold text-slate-400">Workflow complete</span>}</td></tr>)}</tbody></table></div></section>}
      <section className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-3 lg:grid-cols-6" aria-label="Closed-loop workflow">{["Evidence signal", "Evidence gap", "Task generated", "Evidence reviewed", "Evidence recorded", "Future risk reassessment"].map((step, index) => <div className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700" key={step}><span className="mb-2 block text-teal-700">0{index + 1}</span>{step}{index === 5 && <small className="mt-2 block text-[9px] uppercase text-amber-700">Future model integration</small>}</div>)}</section>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><Icon className="mt-0.5 h-4 w-4 shrink-0" name="info"/>This prototype records workflow state only. Verified findings do not automatically recalculate disease risk.</p>
    </div>
  );
}

export default SurveillancePage;
