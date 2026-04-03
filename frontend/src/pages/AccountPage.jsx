import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-curator">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Account</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="font-headline text-3xl font-extrabold text-primary">{user?.name}</h1>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">{user?.email}</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-xl font-bold text-primary">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-curator">
          <h2 className="font-headline text-xl font-bold text-primary">Workspace defaults</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
            <li>Generator runs against your authenticated account automatically.</li>
            <li>Shared links expose the saved note view without exposing your account.</li>
            <li>Archive keeps finished notes out of the main dashboard.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-curator">
          <h2 className="font-headline text-xl font-bold text-primary">Quick actions</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Go to dashboard
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface"
            >
              Log out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
