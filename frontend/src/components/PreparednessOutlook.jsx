import Icon from "./Icon.jsx";
import RiskBadge from "./RiskBadge.jsx";

function PreparednessOutlook({ forecast }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50" aria-labelledby="outlook-heading">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Preparedness planning</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950" id="outlook-heading">4-week preparedness outlook</h2>
          <p className="mt-1 text-sm text-slate-500">Synthetic scenario for forward planning and evidence collection.</p>
        </div>
        <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><Icon name="outlook" /></div>
      </div>

      <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {forecast.weeks.map((week, index) => (
          <article className="relative p-5 sm:p-6" key={week.week}>
            {index < forecast.weeks.length - 1 && <div className="absolute right-0 top-8 z-10 hidden translate-x-1/2 rounded-full border border-slate-200 bg-white p-1 text-slate-400 xl:block"><Icon className="h-3 w-3" name="arrow" /></div>}
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{week.label}</p>
            <div className="mt-3"><RiskBadge level={week.risk_level} /></div>
            <ul className="mt-4 space-y-2">
              {week.drivers.map((driver) => (
                <li className="flex gap-2 text-xs leading-5 text-slate-600" key={driver}><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />{driver}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="flex items-start gap-3 border-t border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 sm:px-6">
        <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <p><strong>{forecast.disclaimer}</strong> {forecast.explanation}</p>
      </div>
    </section>
  );
}

export default PreparednessOutlook;
