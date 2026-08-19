import { useState } from "react";

import DemoDataBanner from "../DemoDataBanner.jsx";
import Icon from "../Icon.jsx";

const navigation = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "community", label: "Community Reports", icon: "community" },
  { id: "villages", label: "Villages", icon: "village" },
  { id: "surveillance", label: "Surveillance", icon: "surveillance" },
  { id: "outlook", label: "4-Week Outlook", icon: "outlook" },
];

function Sidebar({ activePage, onNavigate, mobileOpen, onClose }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col bg-slate-950 text-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Primary navigation">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-slate-950">
          <Icon name="activity" className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-teal-300">SIH25001</p>
          <p className="mt-0.5 text-sm font-semibold text-white">Health Surveillance</p>
        </div>
        <button className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close navigation">
          <Icon name="close" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-7">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Monitoring</p>
        <ul className="mt-3 space-y-1.5">
          {navigation.map((item) => {
            const active = activePage === item.id;
            return (
              <li key={item.id}>
                <a
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-950/20" : "text-slate-300 hover:bg-white/7 hover:text-white"}`}
                  href={`#/${item.id}`}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" name={item.icon} />
                  {item.label}
                  {!["overview", "community"].includes(item.id) && <span className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${active ? "bg-slate-950/12 text-slate-800" : "bg-white/7 text-slate-500"}`}>2B</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-teal-300">
          <Icon name="shield" className="h-4 w-4" />
          <p className="text-xs font-semibold">Prototype environment</p>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Decision-support demonstration for district and state health teams.</p>
      </div>
    </aside>
  );
}

function DashboardLayout({ activePage, onNavigate, connection, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const connected = connection === "connected";

  return (
    <div className="min-h-screen bg-slate-100">
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/55 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
      <Sidebar activePage={activePage} onNavigate={onNavigate} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-20 items-center gap-4 px-5 lg:px-8">
            <button className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Icon name="menu" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-white sm:inline">SIH25001</span>
                <p className="truncate text-sm font-bold text-slate-900 sm:text-base">Water-Borne Disease Early Warning System</p>
              </div>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block">Government monitoring dashboard · Phase 2A + Community Signals</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 md:inline">Demo / Synthetic Data</span>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5" title={connected ? "Backend connected" : "Backend unavailable"}>
                <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : connection === "checking" ? "bg-amber-500" : "bg-rose-500"}`} aria-hidden="true" />
                <span className="hidden text-xs font-semibold text-slate-600 sm:inline">{connected ? "API live" : connection === "checking" ? "Checking" : "API offline"}</span>
              </div>
            </div>
          </div>
          <DemoDataBanner />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
