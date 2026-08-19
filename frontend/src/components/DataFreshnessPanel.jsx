import Icon from "./Icon.jsx";

function classify(villages) {
  return villages.reduce(
    (counts, village) => {
      const age = village.water_test_age_days;
      if (age == null) counts.missing += 1;
      else if (age <= 30) counts.fresh += 1;
      else if (age <= 60) counts.aging += 1;
      else counts.stale += 1;
      return counts;
    },
    { fresh: 0, aging: 0, stale: 0, missing: 0 },
  );
}

const items = [
  { key: "fresh", label: "Fresh", detail: "0–30 days", color: "bg-emerald-500", text: "text-emerald-700" },
  { key: "aging", label: "Aging", detail: "31–60 days", color: "bg-amber-400", text: "text-amber-700" },
  { key: "stale", label: "Stale", detail: "Over 60 days", color: "bg-rose-500", text: "text-rose-700" },
  { key: "missing", label: "Missing", detail: "No record", color: "bg-slate-400", text: "text-slate-600" },
];

function DataFreshnessPanel({ villages }) {
  const counts = classify(villages);
  const total = villages.length || 1;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6" aria-labelledby="freshness-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Evidence quality</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950" id="freshness-heading">Water-data freshness</h2>
        </div>
        <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700"><Icon name="water" /></div>
      </div>

      <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-slate-100" aria-label="Water data freshness distribution">
        {items.map((item) => counts[item.key] > 0 && <span className={item.color} key={item.key} style={{ width: `${(counts[item.key] / total) * 100}%` }} />)}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3" key={item.key}>
            <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${item.color}`} /><p className="text-xs font-semibold text-slate-600">{item.label}</p></div>
            <p className={`mt-2 text-2xl font-bold ${item.text}`}>{counts[item.key]}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
        <strong>{counts.stale} villages</strong> have water-quality information older than the current demo freshness threshold.
      </p>
      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />Freshness rules are prototype rules for demonstration only.</p>
    </section>
  );
}

export default DataFreshnessPanel;
