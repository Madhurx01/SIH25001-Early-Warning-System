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

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#07111f] px-4 py-6 text-slate-950 sm:px-6 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-teal-500/15 blur-3xl"/>
        <div className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-cyan-700/15 blur-3xl"/>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent"/>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center sm:min-h-[calc(100vh-4.5rem)]">
        <header className="mb-7 flex items-center gap-3.5 text-white sm:mb-9">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-teal-200/20 bg-teal-400/15 text-teal-200 shadow-lg shadow-teal-950/30 backdrop-blur-sm">
            <Icon className="h-7 w-7" name="shield"/>
          </div>
          <div>
            <p className="text-sm font-black tracking-[.22em] text-teal-200">AAPTIRAKSHAK</p>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">Community Water Health Early Warning &amp; Response System</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <section aria-labelledby="citizen-services-heading" className="flex h-full flex-col rounded-[1.75rem] border border-teal-200/15 bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-teal-950/80 p-6 text-white shadow-[0_24px_70px_-32px_rgba(13,148,136,0.45)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black tracking-[.2em] text-teal-300">CITIZEN ACCESS</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                <Icon className="h-3.5 w-3.5" name="check"/> No login required
              </span>
            </div>

            <div className="mt-8 grid h-14 w-14 place-items-center rounded-2xl border border-teal-200/15 bg-teal-300/10 text-teal-200 shadow-inner">
              <Icon className="h-7 w-7" name="community"/>
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl" id="citizen-services-heading">Citizen Services</h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-300">Report local water, sanitation, or environmental hazards instantly. No account is required.</p>

            <div className="mt-auto grid gap-3 pt-10 sm:grid-cols-2">
              <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-center text-sm font-black text-slate-950 shadow-lg shadow-teal-950/25 transition-colors hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200/30" href="#/citizen-report">
                Report a Hazard
                <Icon className="h-4 w-4 shrink-0" name="arrow"/>
              </a>
              <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/5 px-5 py-3 text-center text-sm font-bold text-slate-100 transition-colors hover:border-teal-300/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200/20" href="#/report-status">
                <Icon className="h-4 w-4 shrink-0 text-teal-300" name="verify"/>
                Track Report Status
              </a>
            </div>
            <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">Citizen access is limited to public reporting and status tracking.</p>
          </section>

          <section aria-labelledby="staff-sign-in-heading" className="flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-6 shadow-[0_24px_70px_-28px_rgba(2,8,23,0.65)] sm:p-8">
            <p className="text-xs font-black tracking-[.2em] text-teal-700">AUTHORIZED STAFF</p>
            <div className="mt-5 flex items-start gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm">
                <Icon className="h-6 w-6" name="staff"/>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl" id="staff-sign-in-heading">Staff Sign In</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">For Government Officers, ASHA Workers, and Water &amp; Sanitation Staff.</p>
              </div>
            </div>

            <form className="mt-7 space-y-5" onSubmit={submit}>
              <label className="block text-sm font-bold text-slate-700" htmlFor="email">
                Email / Staff ID
                <input className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-normal text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10" id="email" autoComplete="username" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/>
              </label>
              <label className="block text-sm font-bold text-slate-700" htmlFor="password">
                Password
                <input className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-normal text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10" id="password" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/>
              </label>
              {state.error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="alert">{state.error}</p>}
              <button className="min-h-12 w-full rounded-xl bg-teal-700 px-5 py-3 font-bold text-white shadow-md shadow-teal-900/15 transition-colors hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60" disabled={state.busy}>
                {state.busy ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <details className="group mt-6 border-t border-slate-200 pt-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-1 py-2 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/10 [&::-webkit-details-marker]:hidden">
                <span>
                  <strong className="block text-sm text-slate-800">Demo Access for Evaluation</strong>
                  <span className="mt-0.5 block text-xs font-semibold text-amber-700">Hackathon testing only</span>
                </span>
                <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500 group-open:bg-slate-100">+</span>
              </summary>
              <div className="mt-3 space-y-2">
                {demos.map(([label, email, password]) => (
                  <button className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/10" key={email} onClick={() => setForm({ email, password })} type="button">
                    <strong className="block text-sm text-slate-900">{label}</strong>
                    <span className="mt-0.5 block break-all text-slate-500">{email} · {password}</span>
                  </button>
                ))}
              </div>
            </details>
          </section>
        </div>
      </div>
    </main>
  );
}