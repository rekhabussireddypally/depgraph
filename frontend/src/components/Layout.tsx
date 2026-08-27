import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isActive ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const [dbOk, setDbOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      api
        .health()
        .then((h) => !cancelled && setDbOk(h.database_connected))
        .catch(() => !cancelled && setDbOk(false));
    };
    check();
    const id = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-[#0d1119]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-[13px] font-bold text-white">
                D
              </div>
              <span className="font-semibold tracking-tight text-slate-100">DepGraph</span>
            </div>
            <nav className="flex items-center gap-1">
              <NavItem to="/">Explore packages</NavItem>
              <NavItem to="/vulnerabilities">Vulnerabilities</NavItem>
              <NavItem to="/insights">Graph insights</NavItem>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                dbOk === null ? "bg-slate-600 animate-pulse" : dbOk ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            {dbOk === null ? "Checking database..." : dbOk ? "CognoDB connected" : "Database unreachable"}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 py-4">
        <div className="max-w-6xl mx-auto px-6 text-xs text-slate-600">
          DepGraph &middot; OSS dependency &amp; vulnerability blast-radius explorer &middot; backed by CognoDB
        </div>
      </footer>
    </div>
  );
}
