import { homeForRole } from "../auth/routing.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AccessDeniedPage() {
  const { user } = useAuth();
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-5"><section className="max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm"><p className="text-sm font-black text-rose-700">403 · ACCESS DENIED</p><h1 className="mt-3 text-3xl font-bold">This area is not available for your role</h1><p className="mt-3 text-sm leading-6 text-slate-600">You are signed in as {user?.role?.replaceAll("_", " ")}. Backend permissions also block this operation.</p><a className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white" href={`#/${homeForRole(user?.role)}`}>Return to my portal</a></section></main>;
}
