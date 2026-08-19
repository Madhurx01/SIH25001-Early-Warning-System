function DataFreshnessBadge({ age, type = "Water test" }) {
  if (age == null) {
    return <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Missing</span>;
  }
  const state = age <= 30 ? "Fresh" : age <= 60 ? "Aging" : "Stale";
  const style = state === "Fresh" ? "bg-emerald-50 text-emerald-700" : state === "Aging" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700";
  return (
    <div>
      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${style}`}>{age} days</span>
      <span className="sr-only">{type} is {state.toLowerCase()}</span>
    </div>
  );
}

export default DataFreshnessBadge;
