import { useAuth } from "../../auth/AuthContext.jsx";
import Icon from "../Icon.jsx";

export default function StaffLayout({ kind, active, children }) {
  const { user, logout } = useAuth();
  const isAsha = kind === "asha";
  const base = isAsha ? "asha" : "water-operations";
  const links = isAsha
    ? [["", "ASHA Home"], ["tasks", "Assigned Tasks"], ["report", "Submit Health Report"], ["reports", "My Reports"]]
    : [["", "Water Operations"], ["tasks", "Assigned Tasks"], ["report", "Submit Water Report"], ["reports", "My Reports"]];
  function signOut() { logout(); window.location.hash = "#/login"; }

  return <div className="min-h-screen bg-slate-100"><header className={`border-b ${isAsha ? "border-rose-100 bg-rose-950" : "border-cyan-100 bg-cyan-950"} text-white`}><div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-5"><div className={`grid h-11 w-11 place-items-center rounded-xl ${isAsha ? "bg-rose-300" : "bg-cyan-300"} text-slate-950`}><Icon name={isAsha ? "activity" : "water"}/></div><div><p className="text-sm font-black tracking-[.15em]">AAPTIRAKSHAK</p><p className="text-xs text-slate-300">{isAsha ? "ASHA / Health Field Portal" : "Water & Sanitation Operations Portal"}</p></div><div className="ml-auto text-right"><p className="text-sm font-bold">{user.name}</p><p className="text-xs text-slate-300">{user.role.replaceAll("_", " ")}</p></div></div></header><nav className="border-b border-slate-200 bg-white" aria-label="Staff portal navigation"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">{links.map(([suffix,label]) => { const id = suffix || "home"; return <a className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold ${active === id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`} href={`#/${base}${suffix ? `/${suffix}` : ""}`} key={id}>{label}</a>; })}<button className="ml-auto whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50" onClick={signOut}>Logout</button></div></nav><main className="mx-auto max-w-7xl px-5 py-8">{children}</main></div>;
}
