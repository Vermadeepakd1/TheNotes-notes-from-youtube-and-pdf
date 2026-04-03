import { Link, useNavigate } from "react-router-dom";
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

const featureCards = [
  {
    title: "PDF to notes",
    description: "Upload study material and turn dense pages into clean revision blocks.",
    icon: "picture_as_pdf",
  },
  {
    title: "YouTube to notes",
    description: "Paste a lecture URL and get structured notes plus key takeaways.",
    icon: "play_circle",
  },
  {
    title: "Exam-focused questions",
    description: "Generate viva questions and exam prompts from the same source.",
    icon: "quiz",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      <nav className="sticky top-0 z-50 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <span className="font-headline text-xl font-bold tracking-tight text-indigo-950">
              Smart Notes Generator
            </span>
            <div className="hidden items-center gap-6 font-headline text-sm font-medium tracking-tight md:flex">
              <Link className="text-slate-600 transition-colors hover:text-indigo-600" to="/help">
                Help
              </Link>
              <Link className="text-slate-600 transition-colors hover:text-indigo-600" to="/account">
                Account
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                Open Workspace
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-primary/10 bg-white px-5 py-2.5 text-sm font-semibold text-primary"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="h-px w-full bg-slate-100" />
      </nav>

      <main className="relative overflow-hidden">
        <section className="mx-auto max-w-7xl px-6 pb-24 pt-20">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary-container/30 px-3 py-1 text-xs font-semibold text-on-secondary-container">
                <MaterialIcon name="auto_awesome" className="text-[16px]" filled />
                AI-POWERED ANALYSIS
              </div>
              <h1 className="mb-8 font-headline text-5xl font-extrabold leading-[1.1] tracking-tight text-primary lg:text-6xl">
                Turn PDFs and videos into smart notes in seconds
              </h1>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-on-surface-variant lg:text-xl">
                The intelligent curator for your study materials. Upload a PDF or paste a YouTube lecture and get structured notes, key points, and exam-ready questions instantly.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate(user ? "/dashboard" : "/register")}
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary-container px-8 py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90"
                >
                  <MaterialIcon name="upload_file" />
                  {user ? "Open Dashboard" : "Get Started"}
                </button>
                <Link
                  to="/help"
                  className="flex items-center gap-3 rounded-xl border-2 border-primary/5 bg-white px-8 py-4 font-semibold text-primary shadow-sm transition-all hover:bg-slate-50"
                >
                  <MaterialIcon name="help_outline" />
                  Learn More
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {["AA", "NV", "DS"].map((initials) => (
                    <div
                      key={initials}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-xs font-bold text-primary"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-on-surface-variant">
                  Joined by <span className="font-bold text-primary">12,000+</span> students and researchers
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-20 -top-20 -z-10 h-96 w-96 rounded-full bg-primary-fixed/30 blur-[120px]" />
              <div className="absolute -bottom-20 -left-20 -z-10 h-72 w-72 rounded-full bg-secondary-fixed/20 blur-[100px]" />

              <div className="rounded-[2.5rem] border border-white/50 bg-surface-container-low p-6 shadow-2xl">
                <div className="rounded-[1.5rem] bg-surface-container-lowest p-8 shadow-sm">
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <MaterialIcon name="picture_as_pdf" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-on-surface">Lecture_04_Economics.pdf</h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Generated 2m ago
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-slate-200" />
                      <span className="h-3 w-3 rounded-full bg-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <MaterialIcon name="stars" className="text-secondary text-[20px]" filled />
                        <h4 className="text-sm font-bold text-primary">Executive Summary</h4>
                      </div>
                      <div className="mb-2 h-2 w-full rounded-full bg-slate-100" />
                      <div className="mb-2 h-2 w-3/4 rounded-full bg-slate-100" />
                      <div className="h-2 w-1/2 rounded-full bg-slate-100" />
                    </div>

                    <div>
                      <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface">
                        Key Learning Objectives
                      </h4>
                      <ul className="space-y-4">
                        {featureCards.map((card) => (
                          <li key={card.title} className="flex gap-3">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary" />
                            <div className="flex-grow space-y-2">
                              <div className="h-2 w-full rounded-full bg-slate-50" />
                              <div className="h-2 w-5/6 rounded-full bg-slate-50" />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <div key={card.title} className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-curator">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed/60 text-primary">
                  <MaterialIcon name={card.icon} />
                </div>
                <h2 className="font-headline text-xl font-bold text-primary">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{card.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
