import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

function MaterialIcon({ name, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{name}</span>;
}

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }

      navigate("/dashboard");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Unable to continue"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] bg-gradient-to-br from-primary to-primary-container p-10 text-white shadow-2xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
            <MaterialIcon name="arrow_back" className="text-base" />
            Back to home
          </Link>

          <div className="mt-16 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              TheNotes Workspace
            </p>
            <h1 className="mt-6 font-headline text-5xl font-extrabold leading-tight">
              {isRegister ? "Create your study workspace" : "Welcome back to your note studio"}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/80">
              Sign in to save generated notes, revisit past lectures, archive finished material, and share polished study packs with a single link.
            </p>

            <div className="mt-12 rounded-2xl bg-white/10 p-6 backdrop-blur">
              <h2 className="font-headline text-xl font-bold">What unlocks after sign in</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-white/85">
                <li>Save PDF and YouTube notes automatically to your library</li>
                <li>Regenerate notes and questions whenever you need a refresh</li>
                <li>Archive completed material and keep your dashboard focused</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-curator sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              {isRegister ? "Get Started" : "Sign In"}
            </p>
            <h2 className="mt-3 font-headline text-3xl font-extrabold text-primary">
              {isRegister ? "Create account" : "Access your dashboard"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-on-surface-variant">Full name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-on-surface-variant">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
                className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-4 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-on-surface-variant">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
                minLength={6}
                className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-4 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {error ? (
              <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 disabled:opacity-70"
            >
              {submitting
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-on-surface-variant">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              to={isRegister ? "/login" : "/register"}
              className="font-semibold text-primary hover:underline"
            >
              {isRegister ? "Sign in" : "Create one"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
