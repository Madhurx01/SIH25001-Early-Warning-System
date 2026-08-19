import Icon from "./Icon.jsx";

const chart = {
  width: 960,
  height: 320,
  margin: { top: 22, right: 66, bottom: 56, left: 66 },
};

function roundedMaximum(value, interval) {
  return Math.max(interval, Math.ceil(value / interval) * interval);
}

function RainfallDiseaseTrend({ trend }) {
  const { weeks } = trend;
  const peakRainfall = weeks.reduce((peak, week) => week.rainfall_mm > peak.rainfall_mm ? week : peak);
  const peakCases = weeks.reduce((peak, week) => week.reported_cases > peak.reported_cases ? week : peak);
  const peakDifferenceDays = Math.abs(
    Date.parse(`${peakCases.week_start}T00:00:00Z`) - Date.parse(`${peakRainfall.week_start}T00:00:00Z`),
  ) / 86_400_000;
  const illustrativeLagWeeks = Math.round(peakDifferenceDays / 7);
  const dataStatus = trend.data_source === "synthetic" ? "Synthetic demonstration only" : trend.data_source;
  const plotWidth = chart.width - chart.margin.left - chart.margin.right;
  const plotHeight = chart.height - chart.margin.top - chart.margin.bottom;
  const step = plotWidth / weeks.length;
  const barWidth = Math.min(44, step * 0.52);
  const maxRainfall = roundedMaximum(Math.max(...weeks.map((week) => week.rainfall_mm)), 50);
  const maxCases = roundedMaximum(Math.max(...weeks.map((week) => week.reported_cases)), 5);
  const gridLevels = [0, 0.25, 0.5, 0.75, 1];
  const xFor = (index) => chart.margin.left + step * (index + 0.5);
  const yForRainfall = (value) => chart.margin.top + plotHeight * (1 - value / maxRainfall);
  const yForCases = (value) => chart.margin.top + plotHeight * (1 - value / maxCases);
  const casePoints = weeks.map((week, index) => `${xFor(index)},${yForCases(week.reported_cases)}`).join(" ");

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50" aria-labelledby="rainfall-cases-heading">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Environmental & health trend</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950" id="rainfall-cases-heading">Rainfall and reported disease cases</h2>
          <p className="mt-1 text-sm text-slate-500">Weekly synthetic rainfall alongside reported diarrhoeal/water-borne disease cases.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"><Icon className="h-3.5 w-3.5" name="database" />Demo / Synthetic Data</div>
      </div>

      <div className="px-4 pb-2 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-sky-300" />Weekly rainfall (mm)</span>
          <span className="inline-flex items-center gap-2"><span className="relative h-3 w-5"><span className="absolute left-0 right-0 top-1.5 h-0.5 bg-rose-500" /><span className="absolute left-2 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 shadow-sm" /></span>Reported cases</span>
          <span className="ml-auto text-[11px] font-medium text-slate-400">{trend.location_scope}</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <svg
            aria-labelledby="rainfall-trend-title rainfall-trend-description"
            className="h-auto min-w-[760px] w-full"
            role="img"
            viewBox={`0 0 ${chart.width} ${chart.height}`}
          >
            <title id="rainfall-trend-title">Synthetic weekly rainfall and reported disease cases</title>
            <desc id="rainfall-trend-description">A combined bar and line chart. Blue bars show rainfall in millimetres and a red line shows reported diarrhoeal and water-borne disease cases over {weeks.length} weeks. It is illustrative and does not establish causation or a validated lag.</desc>

            {gridLevels.map((level) => {
              const y = chart.margin.top + plotHeight * (1 - level);
              return (
                <g key={level}>
                  <line stroke="#e2e8f0" strokeDasharray={level === 0 ? undefined : "4 5"} x1={chart.margin.left} x2={chart.width - chart.margin.right} y1={y} y2={y} />
                  <text fill="#64748b" fontSize="11" textAnchor="end" x={chart.margin.left - 12} y={y + 4}>{Math.round(maxRainfall * level)}</text>
                  <text fill="#64748b" fontSize="11" textAnchor="start" x={chart.width - chart.margin.right + 12} y={y + 4}>{Math.round(maxCases * level)}</text>
                </g>
              );
            })}

            <text fill="#64748b" fontSize="11" fontWeight="600" x={chart.margin.left} y="12">Rainfall (mm)</text>
            <text fill="#64748b" fontSize="11" fontWeight="600" textAnchor="end" x={chart.width - chart.margin.right} y="12">Reported cases</text>

            {weeks.map((week, index) => {
              const x = xFor(index);
              const y = yForRainfall(week.rainfall_mm);
              return (
                <g key={week.week_start}>
                  <rect fill="#7dd3fc" height={chart.margin.top + plotHeight - y} rx="5" width={barWidth} x={x - barWidth / 2} y={y}>
                    <title>{`${week.label}: ${week.rainfall_mm} mm rainfall`}</title>
                  </rect>
                  <text fill="#64748b" fontSize="10.5" textAnchor="middle" x={x} y={chart.height - 27}>{week.label}</text>
                </g>
              );
            })}

            <polyline fill="none" points={casePoints} stroke="#e11d48" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
            {weeks.map((week, index) => (
              <circle cx={xFor(index)} cy={yForCases(week.reported_cases)} fill="#e11d48" key={week.week_start} r="5" stroke="white" strokeWidth="2.5">
                <title>{`${week.label}: ${week.reported_cases} synthetic reported cases`}</title>
              </circle>
            ))}
          </svg>
        </div>

        <table className="sr-only">
          <caption>Synthetic weekly rainfall and reported diarrhoeal or water-borne disease cases</caption>
          <thead><tr><th>Week</th><th>Rainfall in millimetres</th><th>Reported cases</th></tr></thead>
          <tbody>{weeks.map((week) => <tr key={week.week_start}><td>{week.label}</td><td>{week.rainfall_mm}</td><td>{week.reported_cases}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="mx-5 mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:mx-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white p-1.5 text-slate-600 shadow-sm"><Icon className="h-4 w-4" name="activity" /></div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">Demo Observation</p>
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-white px-3.5 py-3">
            <dt className="text-[11px] font-semibold text-slate-500">Peak Rainfall</dt>
            <dd className="mt-1 text-sm font-bold text-slate-900">{peakRainfall.label} — {peakRainfall.rainfall_mm} mm</dd>
          </div>
          <div className="rounded-lg bg-white px-3.5 py-3">
            <dt className="text-[11px] font-semibold text-slate-500">Peak Reported Cases</dt>
            <dd className="mt-1 text-sm font-bold text-slate-900">{peakCases.label} — {peakCases.reported_cases} cases</dd>
          </div>
          <div className="rounded-lg bg-white px-3.5 py-3">
            <dt className="text-[11px] font-semibold text-slate-500">Illustrative Lag</dt>
            <dd className="mt-1 text-sm font-bold text-amber-800">~{illustrativeLagWeeks} {illustrativeLagWeeks === 1 ? "week" : "weeks"}</dd>
          </div>
          <div className="rounded-lg bg-white px-3.5 py-3">
            <dt className="text-[11px] font-semibold text-slate-500">Data Status</dt>
            <dd className="mt-1 text-sm font-bold text-slate-700">{dataStatus}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">The displayed lag is only the calendar difference between the two synthetic peak dates.</p>
      </div>

      <div className="grid gap-3 border-t border-amber-200 bg-amber-50 px-5 py-4 text-xs leading-5 sm:px-6 lg:grid-cols-2">
        <p className="flex items-start gap-2 text-amber-950"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" name="warning" /><strong>{trend.disclaimer}</strong></p>
        <p className="flex items-start gap-2 text-slate-700"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" name="info" />{trend.future_analysis_note}</p>
      </div>
    </section>
  );
}

export default RainfallDiseaseTrend;
