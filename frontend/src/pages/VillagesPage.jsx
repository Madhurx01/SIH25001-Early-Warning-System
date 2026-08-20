import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import ConfidenceIndicator from "../components/ConfidenceIndicator.jsx";
import Icon from "../components/Icon.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { getVillages } from "../services/api.js";

const markerCodes = { NORMAL: "N", PREPAREDNESS: "P", HIGH: "H" };
function markerIcon(village) {
  const level = village.alert_level.toLowerCase();
  return L.divIcon({
    className: "demo-map-marker-wrap",
    html: `<span class="demo-map-marker ${level} ${village.needs_verification ? "verify" : ""}" aria-label="${village.alert_level}${village.needs_verification ? ", needs verification" : ""}">${village.needs_verification ? "!" : markerCodes[village.alert_level]}</span>`,
    iconSize: [34, 42], iconAnchor: [17, 38], popupAnchor: [0, -35],
  });
}

function ageLabel(age) { return age == null ? "Missing" : `${age} days`; }

function VillagesPage({ onConnectionChange }) {
  const [state, setState] = useState({ status: "loading", villages: [], error: "" });
  const [filters, setFilters] = useState({ search: "", district: "", alert: "", verification: "", sort: "risk" });

  useEffect(() => {
    const controller = new AbortController();
    getVillages({}, controller.signal).then((villages) => {
      setState({ status: "ready", villages, error: "" }); onConnectionChange("connected");
    }).catch((error) => { if (error.name !== "AbortError") { setState({ status: "error", villages: [], error: error.message }); onConnectionChange("unavailable"); } });
    return () => controller.abort();
  }, [onConnectionChange]);

  const districts = useMemo(() => [...new Set(state.villages.map((v) => v.district))].sort(), [state.villages]);
  const displayed = useMemo(() => {
    const result = state.villages.filter((village) => (
      village.name.toLowerCase().includes(filters.search.toLowerCase())
      && (!filters.district || village.district === filters.district)
      && (!filters.alert || village.alert_level === filters.alert)
      && (!filters.verification || String(village.needs_verification) === filters.verification)
    ));
    return result.sort((a, b) => filters.sort === "confidence" ? a.confidence_score - b.confidence_score : filters.sort === "stale" ? (b.water_test_age_days ?? 999) - (a.water_test_age_days ?? 999) : b.risk_score - a.risk_score);
  }, [state.villages, filters]);

  if (state.status === "loading") return <div className="p-8"><div className="h-96 animate-pulse rounded-2xl bg-white" role="status"><span className="sr-only">Loading villages</span></div></div>;
  if (state.status === "error") return <div className="p-8"><section className="rounded-2xl border border-rose-200 bg-white p-8 text-center"><Icon className="mx-auto text-rose-700" name="warning"/><h1 className="mt-3 text-xl font-bold">Villages unavailable</h1><p className="mt-2 text-sm text-slate-500">{state.error}</p></section></div>;

  return (
    <div className="px-5 py-7 lg:px-8 lg:py-8">
      <p className="text-sm font-semibold text-teal-700">Operational village directory</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Villages</h1>
      <p className="mt-2 text-sm text-slate-500">Search, compare evidence quality, and open a village for operational review.</p>

      <section className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5" aria-label="Village filters">
        <label className="text-xs font-bold text-slate-600 xl:col-span-2">Search village<input className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" type="search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Village name" /></label>
        <label className="text-xs font-bold text-slate-600">District<select className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })}><option value="">All districts</option>{districts.map((district) => <option key={district}>{district}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">Alert level<select className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" value={filters.alert} onChange={(e) => setFilters({ ...filters, alert: e.target.value })}><option value="">All levels</option><option value="HIGH">High Risk</option><option value="PREPAREDNESS">Preparedness</option><option value="NORMAL">Normal</option></select></label>
        <label className="text-xs font-bold text-slate-600">Verification<select className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" value={filters.verification} onChange={(e) => setFilters({ ...filters, verification: e.target.value })}><option value="">All</option><option value="true">Needs verification</option><option value="false">No verification gap</option></select></label>
        <label className="text-xs font-bold text-slate-600 xl:col-start-5">Sort by<select className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="risk">Highest risk</option><option value="confidence">Lowest confidence</option><option value="stale">Stalest evidence</option></select></label>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="map-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h2 className="font-bold text-slate-950" id="map-heading">Interactive demo map</h2><p className="mt-1 text-xs font-semibold text-amber-700">Demo village locations / synthetic coordinates</p></div><div className="flex flex-wrap gap-2 text-[11px] font-bold"><span>N Normal</span><span>P Preparedness</span><span>H High Risk</span><span>! Needs Verification</span></div></div>
        <MapContainer center={[24.45, 92.9]} zoom={7} scrollWheelZoom={false} className="h-[430px] w-full" aria-label="Map of synthetic demo village locations">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {displayed.map((village) => <Marker key={village.id} position={[village.latitude, village.longitude]} icon={markerIcon(village)}><Popup><strong>{village.name}</strong><br/>Risk: {village.risk_score}%<br/>Confidence: {village.confidence_score}%<br/>Alert: {village.alert_level}<br/>Verification: {village.needs_verification ? "Required" : "No current gap"}<br/><a href={`#/villages/${village.id}`}>Open village detail</a></Popup></Marker>)}
        </MapContainer>
        <p className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">If map tiles are unavailable offline, the complete accessible village list below remains usable.</p>
      </section>

      <section className="mt-6" aria-labelledby="village-list-heading"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-950" id="village-list-heading">Village list</h2><p className="text-xs text-slate-500">{displayed.length} of {state.villages.length}</p></div>
        <div className="grid gap-4 xl:grid-cols-2">{displayed.map((village) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={village.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><a className="text-lg font-bold text-slate-950 hover:text-teal-700" href={`#/villages/${village.id}`}>{village.name}</a><p className="mt-1 text-sm text-slate-500">{village.district}, {village.state}</p></div><RiskBadge level={village.alert_level}/></div><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4"><div><p className="text-[11px] font-bold uppercase text-slate-400">Risk</p><p className="mt-1 text-xl font-bold text-slate-950">{village.risk_score}%</p></div><div><p className="text-[11px] font-bold uppercase text-slate-400">Confidence</p><ConfidenceIndicator value={village.confidence_score}/></div><div><p className="text-[11px] font-bold uppercase text-slate-400">Water data age</p><p className="mt-1 text-sm font-semibold">{ageLabel(village.water_test_age_days)}</p></div><div><p className="text-[11px] font-bold uppercase text-slate-400">Health report age</p><p className="mt-1 text-sm font-semibold">{ageLabel(village.health_report_age_days)}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className={`text-xs font-bold ${village.needs_verification ? "text-violet-700" : "text-emerald-700"}`}>{village.needs_verification ? "! Verification required" : "✓ No current verification gap"}</span><a className="text-sm font-bold text-teal-700" href={`#/villages/${village.id}`}>Open detail →</a></div></article>)}</div>
        {displayed.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No villages match these filters.</div>}
      </section>
    </div>
  );
}

export default VillagesPage;
