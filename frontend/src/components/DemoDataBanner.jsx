import Icon from "./Icon.jsx";

function DemoDataBanner() {
  return (
    <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-amber-950 lg:px-8" role="note">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" name="info" />
      <p className="text-xs leading-5 sm:text-sm">
        <span className="font-bold">Demo / Synthetic Data</span>
        <span className="mx-2 text-amber-400" aria-hidden="true">•</span>
        Values and freshness rules are illustrative prototype inputs, not validated medical thresholds or real government records.
      </p>
    </div>
  );
}

export default DemoDataBanner;
