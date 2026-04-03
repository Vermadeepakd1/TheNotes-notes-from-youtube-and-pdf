import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MaterialIcon({ name, className = "", filled = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      style={
        filled
          ? { fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' }
          : undefined
      }
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

const sidebarLinks = [
  { to: "/dashboard", label: "Dashboard", icon: "auto_awesome" },
  { to: "/library", label: "My Library", icon: "history" },
  { to: "/archive", label: "Archive", icon: "inventory_2" },
  { to: "/account", label: "Account", icon: "person" },
  { to: "/help", label: "Help Center", icon: "help_outline" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");

  const footerLinks = useMemo(
    () => [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Help Center", to: "/help" },
    ],
    [],
  );

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchValue.trim();
    navigate(query ? `/library?search=${encodeURIComponent(query)}` : "/library");
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="border-b border-slate-200 bg-slate-50 px-4 py-4 lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:border-slate-100">
        <div className="flex items-center justify-between gap-3 lg:mb-8 lg:px-2">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MaterialIcon name="auto_awesome" className="text-sm text-white" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-extrabold text-indigo-900">
                Smart Notes
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
                The Digital Curator
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-full p-2 text-slate-500 lg:hidden"
          >
            <MaterialIcon name="add" className="text-xl" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mt-4 hidden w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-3 text-sm font-headline font-bold text-white shadow-sm transition-all hover:shadow-lg lg:flex"
        >
          <MaterialIcon name="add" className="text-sm text-white" />
          <span>Create New Note</span>
        </button>

        <nav className="mt-4 hidden flex-1 space-y-1 lg:block">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `my-1 flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-transform duration-200 hover:translate-x-1 ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-indigo-600"
                }`
              }
            >
              <MaterialIcon name={link.icon} className="text-base" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm ${
                  isActive ? "bg-white text-indigo-700 shadow-sm" : "bg-white/60 text-slate-500"
                }`
              }
            >
              <MaterialIcon name={link.icon} className="text-base" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto hidden space-y-1 pt-4 lg:block">
          <button
            type="button"
            onClick={() => navigate("/help")}
            className="flex w-full items-center space-x-3 px-3 py-2 text-sm text-slate-500 transition-all hover:text-indigo-600"
          >
            <MaterialIcon name="help_outline" className="text-base" />
            <span>Help Center</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-3 py-2 text-sm text-slate-500 transition-all hover:text-indigo-600"
          >
            <MaterialIcon name="logout" className="text-base" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white/80 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-8">
              <span className="font-headline text-xl font-bold tracking-tight text-indigo-950">
                Smart Notes Generator
              </span>
              <nav className="hidden items-center space-x-6 font-headline text-sm font-medium tracking-tight md:flex">
                <NavLink
                  to="/library"
                  className={({ isActive }) =>
                    isActive
                      ? "border-b-2 border-indigo-600 pb-1 font-bold text-indigo-700"
                      : "text-slate-600 transition-colors hover:text-indigo-600"
                  }
                >
                  My Library
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    isActive
                      ? "border-b-2 border-indigo-600 pb-1 font-bold text-indigo-700"
                      : "text-slate-600 transition-colors hover:text-indigo-600"
                  }
                >
                  Workspace
                </NavLink>
                <NavLink
                  to="/account"
                  className={({ isActive }) =>
                    isActive
                      ? "border-b-2 border-indigo-600 pb-1 font-bold text-indigo-700"
                      : "text-slate-600 transition-colors hover:text-indigo-600"
                  }
                >
                  Account
                </NavLink>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search notes..."
                  className="w-64 rounded-full border-none bg-slate-100 py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary"
                />
                <MaterialIcon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
                />
              </form>
              <button
                type="button"
                onClick={() => navigate("/library")}
                className="rounded-full p-2 text-slate-600 transition-all hover:bg-slate-50"
              >
                <MaterialIcon name="history" className="text-xl" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/account")}
                className="rounded-full p-2 text-slate-600 transition-all hover:bg-slate-50"
              >
                <MaterialIcon name="settings" className="text-xl" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/account")}
                className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-indigo-50 bg-indigo-100 px-2 text-xs font-bold text-indigo-700"
              >
                {user?.name?.slice(0, 2).toUpperCase() || "SN"}
              </button>
            </div>
          </div>
          <div className="h-px w-full bg-slate-100" />
        </header>

        <main key={location.pathname} className="min-h-[calc(100vh-120px)]">
          <Outlet />
        </main>

        <footer className="w-full border-t border-slate-200 bg-slate-50 px-6 py-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
            <span className="text-xs tracking-wide text-slate-600">
              (c) 2026 Smart Notes Generator. All rights reserved.
            </span>
            <div className="flex flex-wrap justify-center gap-6">
              {footerLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-xs text-slate-500 transition-colors hover:text-indigo-500"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
