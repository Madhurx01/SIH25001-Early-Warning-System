import Icon from "./Icon.jsx";
import { communityPhotoUrl } from "../services/api.js";
import { representativePhotoAttribution } from "../utils/communityReportPresentation.js";

const categoryLabels = {
  STAGNANT_WATER: "Stagnant water",
  FLOODED_AREA: "Flooded area",
  SEWAGE_OVERFLOW: "Sewage overflow",
  SUSPECTED_DIRTY_WATER_SOURCE: "Suspected dirty water source",
  BROKEN_WATER_PIPELINE: "Broken water pipeline",
  GARBAGE_NEAR_WATER_SOURCE: "Garbage near water source",
  SUSPECTED_MOSQUITO_BREEDING_SITE: "Possible mosquito-breeding site",
  OTHER_ENVIRONMENTAL_HAZARD: "Other environmental hazard",
};

const priorityStyles = {
  HIGH: "border-rose-200 bg-rose-50 text-rose-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
};

const verificationLabels = {
  UNVERIFIED: "Unverified",
  UNDER_REVIEW: "Under review",
  VERIFIED_HAZARD: "Verified hazard",
  DISMISSED: "Dismissed",
};

const verificationStyles = {
  UNVERIFIED: "bg-slate-100 text-slate-700",
  UNDER_REVIEW: "bg-sky-50 text-sky-700",
  VERIFIED_HAZARD: "bg-emerald-50 text-emerald-700",
  DISMISSED: "bg-slate-50 text-slate-500",
};

function formatReportedAt(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function CommunitySignals({ reports, compact = false }) {
  const displayedReports = compact ? reports.slice(0, 5) : reports;
  const stats = [
    {
      label: "Reports received",
      value: reports.reduce((total, report) => total + report.report_count_nearby, 0),
      detail: `${reports.length} clustered incidents`,
      tone: "text-slate-950",
    },
    {
      label: "Unverified reports",
      value: reports.filter((report) => report.verification_status === "UNVERIFIED").reduce((total, report) => total + report.report_count_nearby, 0),
      detail: "Awaiting official review",
      tone: "text-amber-700",
    },
    {
      label: "Verified hazards",
      value: reports.filter((report) => report.verification_status === "VERIFIED_HAZARD").length,
      detail: "Environmental findings only",
      tone: "text-emerald-700",
    },
    {
      label: "High-priority clusters",
      value: reports.filter((report) => report.priority === "HIGH" && report.report_count_nearby > 1).length,
      detail: "Multiple nearby reports",
      tone: "text-rose-700",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50" aria-labelledby="community-signals-heading">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">Community environmental reporting</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950" id="community-signals-heading">Community Signals</h2>
          <p className="mt-1 text-sm text-slate-500">Clustered citizen observations routed for government verification.</p>
        </div>
        {compact ? (
          <a className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50" href="#/community">View all reports <Icon className="h-3.5 w-3.5" name="arrow" /></a>
        ) : (
          <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">Demo / Synthetic Data</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200 lg:grid-cols-4">
        {stats.map((stat) => (
          <div className="bg-white px-5 py-4 sm:px-6" key={stat.label}>
            <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
            <p className="mt-1 text-[11px] text-slate-400">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <caption className="sr-only">Synthetic clustered community environmental reports</caption>
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3.5">Village</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Evidence</th>
              <th className="px-4 py-3.5">Nearby reports</th>
              <th className="px-4 py-3.5">Reported</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedReports.map((report) => (
              <tr className="align-top transition hover:bg-slate-50/80" key={report.id}>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-900">{report.village_name}</p>
                  <p className="mt-1 text-xs text-slate-400">{report.id}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-slate-800">{categoryLabels[report.category] ?? report.category}</p>
                  {!compact && <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{report.description}</p>}
                </td>
                <td className="px-4 py-4">
                  {report.photo_url ? (
                    <a
                      className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-100"
                      href={communityPhotoUrl(report.photo_url)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="grid h-6 w-7 place-items-center rounded bg-cyan-100 text-cyan-700"><Icon className="h-3.5 w-3.5" name="camera" /></span>
                      {representativePhotoAttribution(report) || "Submitted photo"}
                    </a>
                  ) : report.evidence_type === "DEMO_PHOTO_PLACEHOLDER" ? (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-600" title="Synthetic placeholder only — no citizen photo is stored">
                      <span className="grid h-6 w-7 place-items-center rounded bg-slate-200 text-slate-500"><Icon className="h-3.5 w-3.5" name="camera" /></span>
                      Demo photo
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">No photo</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex min-w-9 justify-center rounded-lg bg-cyan-50 px-2.5 py-1.5 text-sm font-bold text-cyan-800">{report.report_count_nearby}</span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{formatReportedAt(report.reported_at)}</td>
                <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${priorityStyles[report.priority] ?? priorityStyles.LOW}`}>{report.priority}</span></td>
                <td className="px-4 py-4"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${verificationStyles[report.verification_status] ?? verificationStyles.UNVERIFIED}`}>{verificationLabels[report.verification_status] ?? report.verification_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs leading-5 sm:px-6 lg:grid-cols-2">
        <p className="flex items-start gap-2 text-slate-700"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" name="info" /><strong>Citizen reports are unverified community signals and do not directly confirm disease or contamination.</strong></p>
        <p className="flex items-start gap-2 text-slate-600"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" name="warning" />Dengue and malaria are vector-borne diseases. Stagnant water is only a potential mosquito-breeding or environmental hazard requiring verification—not proof of disease.</p>
      </div>
    </section>
  );
}

export default CommunitySignals;
