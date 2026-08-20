import Icon from "../components/Icon.jsx";

const content = {
  villages: { title: "Villages", description: "Detailed village profiles, search and drill-down views will be added in the next delivery phase.", icon: "village" },
  surveillance: { title: "Surveillance", description: "Environmental, water-quality and health-signal exploration will be added in the next delivery phase.", icon: "surveillance" },
  outlook: { title: "4-Week Outlook", description: "The expanded preparedness planning view will be added in the next delivery phase. The overview already includes the synthetic four-week outlook.", icon: "outlook" },
};

function PlaceholderPage({ page }) {
  const pageContent = content[page] ?? content.villages;
  return (
    <div className="px-5 py-12 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon className="h-7 w-7" name={pageContent.icon} /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">AAPTIRAKSHAK</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{pageContent.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{pageContent.description}</p>
        <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">Feature not yet available</div>
        <a className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800" href="#/overview">Return to overview <Icon className="h-4 w-4" name="arrow" /></a>
      </section>
    </div>
  );
}

export default PlaceholderPage;
