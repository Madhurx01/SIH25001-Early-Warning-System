import { useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { homeForRole } from "../auth/routing.js";
import Icon from "../components/Icon.jsx";

const demos = [
  ["Government Officer", "officer@aaptirakshak.demo", "Officer@123"],
  ["ASHA Worker", "asha@aaptirakshak.demo", "Asha@123"],
  ["Water Worker", "water@aaptirakshak.demo", "Water@123"],
];

export default function LoginPage() {
  const { login, status, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [state, setState] = useState({ busy: false, error: "" });

  if (status === "authenticated") {
    window.location.hash = `#/${homeForRole(user.role)}`;
    return null;
  }

  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, error: "" });
    try {
      const signedInUser = await login(form.email, form.password);
      window.location.hash = `#/${homeForRole(signedInUser.role)}`;
    } catch (error) {
      setState({ busy: false, error: error.message });
    }
  }

  return <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-950"><div className="mx-auto grid max-w-5xl gap-7 lg:grid-cols-[1.05fr_.95fr]"><section className="flex flex-col justify-center py-6 text-white"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-400 text-slate-950"><Icon className="h-8 w-8" name="shield"/></div><p className="mt-7 text-sm font-black tracking-[.2em] text-teal-300">AAPTIRAKSHAK</p><h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Staff Portal</h1><p className="mt-4 max-w-lg text-lg leading-8 text-slate-300">Community Water Health Early Warning & Response System</p><div className="mt-9 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300"><strong className="text-white">Public reporting does not require a login.</strong><br/><a className="font-bold text-teal-300" href="#/citizen-report">Open Community Hazard Reporting →</a></div></section><section className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><h2 className="text-2xl font-bold">Staff sign in</h2><p className="mt-2 text-sm text-slate-500">Your account role determines the portal and permissions.</p><form className="mt-7 space-y-5" onSubmit={submit}><label className="block text-sm font-bold" htmlFor="email">Email / Staff ID<input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" id="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label><label className="block text-sm font-bold" htmlFor="password">Password<input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" id="password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/></label>{state.error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="alert">{state.error}</p>}<button className="w-full rounded-xl bg-teal-700 px-5 py-3.5 font-bold text-white disabled:opacity-60" disabled={state.busy}>{state.busy ? "Signing in…" : "Sign In"}</button></form><section className="mt-7 border-t border-slate-200 pt-6"><p className="text-xs font-black uppercase tracking-wider text-amber-700">Demo credentials · Hackathon testing only</p><div className="mt-3 space-y-2">{demos.map(([label,email,password]) => <button className="w-full rounded-xl border border-slate-200 p-3 text-left text-xs hover:bg-slate-50" key={email} onClick={() => setForm({ email, password })}><strong className="block text-sm text-slate-900">{label}</strong><span className="text-slate-500">{email} · {password}</span></button>)}</div></section></section></div></main>;
}
