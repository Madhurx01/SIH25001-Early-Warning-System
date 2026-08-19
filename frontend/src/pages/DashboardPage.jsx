import { useCallback, useEffect, useState } from "react";

import CommunitySignals from "../components/CommunitySignals.jsx";
import DashboardSkeleton from "../components/DashboardSkeleton.jsx";
import DataFreshnessPanel from "../components/DataFreshnessPanel.jsx";
import Icon from "../components/Icon.jsx";
import PreparednessOutlook from "../components/PreparednessOutlook.jsx";
import RainfallDiseaseTrend from "../components/RainfallDiseaseTrend.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import VerificationQueue from "../components/VerificationQueue.jsx";
import VillageTable from "../components/VillageTable.jsx";
import { getDashboardData } from "../services/api.js";

function DashboardPage({ onConnectionChange }) {
  const [state, setState] = useState({ status: "loading", data: null });

  const loadDashboard = useCallback(async () => {
    setState({ status: "loading", data: null });
    onConnectionChange("checking");
    try {
      const data = await getDashboardData();
      setState({ status: "ready", data });
      onConnectionChange("connected");
    } catch (error) {
      if (error.name !== "AbortError") {
        setState({ status: "error", data: null });
        onConnectionChange("unavailable");
      }
    }
  }, [onConnectionChange]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const data = await getDashboardData(controller.signal);
        if (active) {
          setState({ status: "ready", data });
          onConnectionChange("connected");
        }
      } catch (error) {
        if (active && error.name !== "AbortError") {
          setState({ status: "error", data: null });
          onConnectionChange("unavailable");
        }
      }
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [onConnectionChange]);

  if (state.status === "loading") return <DashboardSkeleton />;

  if (state.status === "error") {
    return (
      <div className="px-5 py-12 lg:px-8">
        <section className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-700"><Icon name="warning" /></div>
          <h1 className="mt-4 text-xl font-bold text-slate-950">Dashboard data is temporarily unavailable</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">The dashboard could not reach the FastAPI backend. Start the backend on port 8000, then try again. The page will remain stable while the service is offline.</p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800" onClick={loadDashboard}><Icon className="h-4 w-4" name="refresh" />Retry connection</button>
        </section>
      </div>
    );
  }

  const { overview, villages, forecast, rainfallDiseaseTrend, tasks, communityReports } = state.data;
  const cards = [
    { label: "Total Villages", value: overview.total_villages, helper: "Communities in the demo monitoring network", icon: "villages", tone: "slate" },
    { label: "Normal", value: overview.normal, helper: "No elevated preparedness signal", icon: "check", tone: "emerald" },
    { label: "Preparedness", value: overview.preparedness, helper: "Closer monitoring is indicated", icon: "shield", tone: "amber" },
    { label: "High Risk", value: overview.high_risk, helper: "Priority review and readiness", icon: "warning", tone: "rose" },
    { label: "Needs Verification", value: overview.needs_verification, helper: "Field evidence requested", icon: "verify", tone: "violet" },
    { label: "Stale Water Tests", value: overview.stale_water_tests, helper: "Older than the 60-day demo rule", icon: "water", tone: "blue" },
  ];

  return (
    <div className="px-5 py-7 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">District & state monitoring view</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Public health overview</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Risk, confidence, evidence quality and field priorities in one operational view.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><Icon className="h-4 w-4 text-emerald-600" name="check" /><span>API data received</span><span aria-hidden="true">·</span><span>Synthetic snapshot</span></div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" aria-label="Monitoring summary">
        {cards.map((card) => <SummaryCard {...card} key={card.label} />)}
      </section>

      <div className="mt-6"><VillageTable totalVillages={overview.total_villages} villages={villages.slice(0, 8)} /></div>

      <div className="mt-6"><RainfallDiseaseTrend trend={rainfallDiseaseTrend} /></div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <DataFreshnessPanel villages={villages} />
        <VerificationQueue tasks={tasks} />
      </div>

      <div className="mt-6"><CommunitySignals compact reports={communityReports} /></div>

      <div className="mt-6"><PreparednessOutlook forecast={forecast} /></div>
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400"><p>SIH25001 · Phase 2A Government Monitoring Dashboard</p><p>Demo / Synthetic Data · No ML model integrated</p></footer>
    </div>
  );
}

export default DashboardPage;
