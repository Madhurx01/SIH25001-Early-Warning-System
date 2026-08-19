import ConfidenceIndicator from "./ConfidenceIndicator.jsx";
import DataFreshnessBadge from "./DataFreshnessBadge.jsx";
import RiskBadge from "./RiskBadge.jsx";

function ReportAge({ age }) {
  return age == null ? <span className="font-semibold text-slate-500">Missing</span> : <span>{age} days</span>;
}

function VillageTable({ villages, totalVillages }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Risk prioritisation</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Priority villages</h2>
          <p className="mt-1 text-sm text-slate-500">Highest synthetic risk scores shown first.</p>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Top {villages.length} of {totalVillages} monitored</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <caption className="sr-only">Priority villages sorted by risk score</caption>
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3.5">Village</th>
              <th className="px-4 py-3.5">Risk</th>
              <th className="px-4 py-3.5">Confidence</th>
              <th className="px-4 py-3.5">Alert level</th>
              <th className="px-4 py-3.5">Water data age</th>
              <th className="px-4 py-3.5">Health report</th>
              <th className="px-4 py-3.5">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {villages.map((village) => (
              <tr className="transition hover:bg-slate-50/80" key={village.id}>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-900">{village.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{village.district} · {village.state}</p>
                </td>
                <td className="px-4 py-4"><span className="text-base font-bold text-slate-950">{village.risk_score}%</span></td>
                <td className="px-4 py-4"><ConfidenceIndicator value={village.confidence_score} /></td>
                <td className="px-4 py-4"><RiskBadge level={village.alert_level} /></td>
                <td className="px-4 py-4"><DataFreshnessBadge age={village.water_test_age_days} /></td>
                <td className="px-4 py-4 text-sm text-slate-600"><ReportAge age={village.health_report_age_days} /></td>
                <td className="px-4 py-4">
                  {village.needs_verification ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700"><span className="h-2 w-2 rounded-full bg-rose-500" />Required</span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">Not required</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VillageTable;
