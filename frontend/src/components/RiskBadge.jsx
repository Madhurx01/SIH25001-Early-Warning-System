const styles = {
  NORMAL: "border-emerald-200 bg-emerald-50 text-emerald-800",
  PREPAREDNESS: "border-amber-200 bg-amber-50 text-amber-800",
  HIGH: "border-rose-200 bg-rose-50 text-rose-800",
};

function RiskBadge({ level }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${styles[level] ?? styles.NORMAL}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${level === "HIGH" ? "bg-rose-500" : level === "PREPAREDNESS" ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
      {level}
    </span>
  );
}

export default RiskBadge;
