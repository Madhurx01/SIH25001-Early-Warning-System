import { useEffect, useState } from "react";

import Icon from "../components/Icon.jsx";
import { getVillages, submitCommunityReport } from "../services/api.js";
import { buildCitizenReportFormData, CITIZEN_PHOTO_ACCEPT, selectCitizenPhoto } from "../utils/citizenReport.js";

const categories = [
  ["STAGNANT_WATER", "Stagnant / accumulated water"], ["FLOODED_AREA", "Flooded area"],
  ["SEWAGE_OVERFLOW", "Overflowing drain / sewage"], ["SUSPECTED_DIRTY_WATER_SOURCE", "Suspected dirty drinking-water source"],
  ["BROKEN_WATER_PIPELINE", "Broken / leaking water pipeline"], ["GARBAGE_NEAR_WATER_SOURCE", "Garbage near water source"],
  ["SUSPECTED_MOSQUITO_BREEDING_SITE", "Possible mosquito-breeding environmental hazard"], ["OTHER_ENVIRONMENTAL_HAZARD", "Other"],
];

function CitizenHeader() { return <header className="border-b border-teal-100 bg-white"><div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-white"><Icon name="community"/></div><div><p className="font-bold text-slate-950">Community Hazard Reporting</p><p className="text-xs text-slate-500">SIH25001 demo service</p></div><a className="ml-auto text-xs font-bold text-teal-700" href="#/report-status">Check report status</a></div></header>; }

function CitizenReportPage() {
  const [villages, setVillages] = useState([]);
  const [form, setForm] = useState({ category: "", villageId: "", description: "", latitude: null, longitude: null, photo: null });
  const [preview, setPreview] = useState("");
  const [state, setState] = useState({ status: "editing", message: "", result: null });
  const [villageLoad, setVillageLoad] = useState({ status: "loading", error: "" });
  const [locationState, setLocationState] = useState("idle");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setVillageLoad({ status: "loading", error: "" });

    getVillages({}, controller.signal)
      .then((loadedVillages) => {
        if (!active) return;
        setVillages(loadedVillages);
        setVillageLoad({ status: "ready", error: "" });
      })
      .catch((error) => {
        if (!active || error.name === "AbortError") return;
        setVillageLoad({
          status: "error",
          error: "Village list is unavailable. Start the backend and reload this page.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choosePhoto(event) {
    const selection = selectCitizenPhoto(event.currentTarget, preview);
    setForm((old) => ({ ...old, photo: selection.photo }));
    setPreview(selection.preview);
    setState((old) => ({ ...old, message: selection.error }));
  }
  function requestLocation() {
    if (!navigator.geolocation) { setLocationState("unavailable"); return; }
    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition((position) => { setForm((old) => ({ ...old, latitude: position.coords.latitude, longitude: position.coords.longitude })); setLocationState("captured"); }, () => setLocationState("denied"), { enableHighAccuracy: false, timeout: 10000 });
  }
  async function submit(event) {
    event.preventDefault(); setState({ status: "submitting", message: "", result: null });
    const body = buildCitizenReportFormData(form);
    try { const result = await submitCommunityReport(body); setState({ status: "success", message: "", result }); }
    catch (error) { setState({ status: "editing", message: error.message, result: null }); }
  }

  if (state.status === "success") return <div className="min-h-screen bg-teal-50"><CitizenHeader/><main className="mx-auto max-w-2xl px-5 py-12"><section className="rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-sm sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon className="h-8 w-8" name="check"/></div><h1 className="mt-5 text-3xl font-bold">Report received</h1><p className="mt-3 text-sm text-slate-500">Report ID</p><p className="mt-1 text-2xl font-black tracking-wide text-slate-950">{state.result.report_id}</p><span className="mt-4 inline-flex rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">Status: UNVERIFIED</span><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-slate-600">Your report has been received and may be reviewed by the local health/water authority.</p>{state.result.clustered && <p className="mt-4 rounded-xl bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800">Your report was linked to an existing nearby community incident.</p>}<p className="mt-4 text-xs text-slate-500">No response time is promised. Demo session data resets when the backend restarts.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><a className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white" href={`#/report-status?id=${state.result.report_id}`}>Check this report</a><button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold" onClick={() => { setForm({ category: "", villageId: "", description: "", latitude: null, longitude: null, photo: null }); setPreview(""); setState({ status: "editing", message: "", result: null }); }}>Submit another</button></div></section></main></div>;

  return <div className="min-h-screen bg-teal-50"><CitizenHeader/><main className="mx-auto max-w-3xl px-5 py-8 sm:py-12"><div className="mb-7"><p className="text-sm font-bold text-teal-700">Simple, permission-based demo form</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Report a Community Health / Water Hazard</h1><p className="mt-3 text-base leading-7 text-slate-600">Share an environmental observation for official review. Photos are evidence only and are never used here to diagnose disease.</p></div><form className="space-y-6 rounded-3xl border border-teal-100 bg-white p-5 shadow-sm sm:p-8" onSubmit={submit}>
    {villageLoad.error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800" role="alert">{villageLoad.error}</p>}
    {state.message && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800" role="alert">{state.message}</p>}
    <fieldset><legend className="text-base font-bold">1. What issue did you observe?</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{categories.map(([value, label]) => <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${form.category === value ? "border-teal-500 bg-teal-50" : "border-slate-200"}`} key={value}><input required type="radio" name="category" value={value} checked={form.category === value} onChange={(e) => setForm({ ...form, category: e.target.value })}/>{label}</label>)}</div></fieldset>
    <div><label className="text-base font-bold" htmlFor="photo">2. Photo evidence <span className="font-normal text-slate-400">(optional)</span></label><input className="mt-3 block w-full rounded-xl border border-slate-300 p-3 text-sm" id="photo" type="file" accept={CITIZEN_PHOTO_ACCEPT} capture="environment" onChange={choosePhoto}/><p className="mt-2 text-xs text-slate-500">JPEG, PNG, WebP, or GIF; maximum 5 MB. No computer vision or medical diagnosis is performed.</p>{preview && <img className="mt-4 max-h-72 w-full rounded-2xl border border-slate-200 object-contain" src={preview} alt="Preview of selected community hazard evidence"/>}</div>
    <div><p className="text-base font-bold">3. Location <span className="font-normal text-slate-400">(optional)</span></p><button className="mt-3 inline-flex items-center gap-2 rounded-xl border border-teal-600 px-4 py-3 text-sm font-bold text-teal-700 disabled:opacity-60" type="button" disabled={locationState === "requesting"} onClick={requestLocation}><Icon name="village"/>{locationState === "requesting" ? "Requesting permission…" : locationState === "captured" ? "Location captured ✓" : "Share current location"}</button>{["denied", "unavailable"].includes(locationState) && <p className="mt-2 text-sm text-amber-700">Location was not available. You can continue by choosing a village below.</p>}{locationState === "captured" && <p className="mt-2 text-xs text-slate-500">Coordinates captured with browser permission. No precise address is required.</p>}</div>
    <label className="block text-base font-bold" htmlFor="village">4. Village<select className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base font-normal" disabled={villageLoad.status === "loading"} id="village" required value={form.villageId} onChange={(e) => setForm({ ...form, villageId: e.target.value })}><option value="">{villageLoad.status === "loading" ? "Loading demo villages…" : "Select a demo village"}</option>{villages.map((village) => <option value={village.id} key={village.id}>{village.name} — {village.district}</option>)}</select></label>
    <label className="block text-base font-bold" htmlFor="description">5. Description <span className="font-normal text-slate-400">(optional)</span><textarea className="mt-3 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-normal" id="description" maxLength="500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What did you see? Avoid personal or medical details."/></label>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">Citizen reports are community signals and require official verification. Submitting this report will not directly change any disease-risk classification.</div>
    <button className="w-full rounded-xl bg-teal-700 px-5 py-4 text-base font-bold text-white disabled:opacity-60" disabled={state.status === "submitting" || !villages.length} type="submit">{state.status === "submitting" ? "Submitting report…" : "Submit community report"}</button>
  </form><p className="mt-5 text-center text-xs leading-5 text-slate-500">Dengue and malaria are vector-borne diseases. Standing water is reported only as a potential mosquito-breeding environmental hazard requiring verification.</p></main></div>;
}

export default CitizenReportPage;
