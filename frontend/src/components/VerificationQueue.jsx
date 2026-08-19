import Icon from "./Icon.jsx";

function VerificationQueue({ tasks }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50" aria-labelledby="verification-heading">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Field evidence</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950" id="verification-heading">Verification queue</h2>
            <p className="mt-1 text-sm text-slate-500">Alerts identify where new evidence is most useful.</p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">{tasks.length} open</span>
        </div>
      </div>
      <ol className="divide-y divide-slate-100">
        {tasks.slice(0, 4).map((task) => (
          <li className="px-5 py-4 sm:px-6" key={task.id}>
            <div className="flex gap-3.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-950 text-xs font-bold text-white" aria-label={`Priority ${task.priority}`}>{task.priority}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-bold text-slate-900">{task.village_name}</p>
                  <div className="flex items-center gap-2">
                    {task.source_type === "COMMUNITY_REPORT" && <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-700">Community signal</span>}
                    <p className="text-xs text-slate-400">{task.district}</p>
                  </div>
                </div>
                <p className="mt-1 text-sm font-semibold text-violet-700">{task.action}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Reasons">
                  {task.reasons.map((reason) => <li className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600" key={reason}>{reason}</li>)}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex items-start gap-2 border-t border-teal-100 bg-teal-50 px-5 py-3.5 text-xs leading-5 text-teal-900 sm:px-6">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" name="verify" />
        <p><strong>Decision support:</strong> prediction creates an alert and points teams to the evidence needed to improve the next assessment.</p>
      </div>
    </section>
  );
}

export default VerificationQueue;
