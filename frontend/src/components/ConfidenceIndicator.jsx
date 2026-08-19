function ConfidenceIndicator({ value }) {
  const tone = value < 55 ? "bg-amber-500" : value < 75 ? "bg-sky-500" : "bg-teal-600";
  return (
    <div className="min-w-24" aria-label={`Confidence ${value} percent`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{value}%</span>
        <span className="text-[10px] font-medium text-slate-400">{value < 55 ? "Low" : value < 75 ? "Moderate" : "Strong"}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default ConfidenceIndicator;
