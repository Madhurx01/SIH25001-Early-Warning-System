const statusContent = {
  checking: {
    dotClass: "bg-amber-500",
    label: "Checking backend connection…",
  },
  connected: {
    dotClass: "bg-emerald-500",
    label: "Backend connected",
  },
  unavailable: {
    dotClass: "bg-rose-500",
    label: "Backend unavailable",
  },
};

function ConnectionStatus({ status, service }) {
  const content = statusContent[status] ?? statusContent.unavailable;

  return (
    <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Backend connection status
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${content.dotClass}`}
        />
        <p className="font-medium text-slate-800" role="status">
          {content.label}
        </p>
      </div>
      {service && <p className="mt-1 pl-5.5 text-sm text-slate-500">{service}</p>}
    </div>
  );
}

export default ConnectionStatus;
