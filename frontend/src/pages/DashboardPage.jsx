import { useEffect, useMemo, useState } from "react";
import NoteViewer from "../components/NoteViewer";
import {
  deleteNote,
  generateNote,
  getErrorMessage,
  listNotes,
  regenerateNote,
  toggleArchive,
  toggleComplete,
} from "../services/api";

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

const examQuestionFormats = [
  {
    value: "longAnswer",
    label: "Long format Q&A",
    helper: "Descriptive answers for theory-heavy exam writing.",
  },
  {
    value: "mediumAnswer",
    label: "Medium length Q&A",
    helper: "Balanced answers for short and medium mark questions.",
  },
  {
    value: "oneLiners",
    label: "One-liner Q&A",
    helper: "Fast recall prompts with crisp one-line answers.",
  },
  {
    value: "mcq",
    label: "Quiz",
    helper: "Attemptable MCQs with scoring and answer review.",
  },
];

function clampExamQuestionCount(value, minimum = 1) {
  const parsed = Number(value);
  const safeMinimum = Math.min(25, Math.max(1, minimum));

  if (!Number.isFinite(parsed)) {
    return Math.max(12, safeMinimum);
  }

  return Math.min(25, Math.max(safeMinimum, Math.round(parsed)));
}

function getExamQuestionMix(questionTypes, total) {
  const selectedTypes = examQuestionFormats
    .map((format) => format.value)
    .filter((type) => questionTypes.includes(type));
  const counts = {
    longAnswer: 0,
    mediumAnswer: 0,
    oneLiners: 0,
    mcq: 0,
  };

  if (!selectedTypes.length) {
    return counts;
  }

  const safeTotal = clampExamQuestionCount(total, selectedTypes.length);
  const baseCount = Math.floor(safeTotal / selectedTypes.length);
  let remainder = safeTotal % selectedTypes.length;

  selectedTypes.forEach((type) => {
    counts[type] = baseCount;

    if (remainder > 0) {
      counts[type] += 1;
      remainder -= 1;
    }
  });

  return counts;
}

function NoteListItem({ note, active, onClick }) {
  const hasExamSet = note.mode === "exam" && note.questionCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-primary/15 bg-primary-fixed/40 shadow-sm"
          : "border-transparent bg-white hover:border-primary/10 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
            {note.sourceType === "pdf" ? "PDF" : "YouTube"}
          </p>
          <h3 className="mt-2 font-headline text-base font-bold text-primary">{note.title}</h3>
        </div>
        {note.completed ? (
          <span className="rounded-full bg-secondary-container/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
            Done
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{note.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
        <span>{note.mode}</span>
        <span>|</span>
        <span>{note.folder}</span>
        {hasExamSet ? (
          <>
            <span>|</span>
            <span>{note.questionCount} questions</span>
          </>
        ) : null}
      </div>
    </button>
  );
}

const modes = [
  {
    value: "summary",
    label: "Summary mode",
    helper: "Complete summary of the full source",
    detail:
      "Generates concise notes that summarize the entire PDF or video from start to finish for quick revision.",
  },
  {
    value: "detailed",
    label: "Detailed mode",
    helper: "Detailed explanation of the full source",
    detail:
      "Generates fuller notes with more explanation so the full topic is easier to understand deeply.",
  },
  {
    value: "exam",
    label: "Exam-focused",
    helper: "Question practice and quiz generation",
    detail:
      "Lets you choose the exact question formats you want, set how many questions to generate, and attempt quiz questions inside the note viewer.",
  },
];

export default function DashboardPage() {
  const [sourceType, setSourceType] = useState("pdf");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [folder, setFolder] = useState("General");
  const [mode, setMode] = useState("summary");
  const [questionCount, setQuestionCount] = useState(12);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState(
    examQuestionFormats.map((format) => format.value),
  );
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId],
  );

  const selectedMode = useMemo(
    () => modes.find((item) => item.value === mode) || modes[0],
    [mode],
  );

  const orderedQuestionTypes = useMemo(
    () =>
      examQuestionFormats
        .map((format) => format.value)
        .filter((type) => selectedQuestionTypes.includes(type)),
    [selectedQuestionTypes],
  );

  const examQuestionMix = useMemo(
    () => getExamQuestionMix(orderedQuestionTypes, questionCount),
    [orderedQuestionTypes, questionCount],
  );

  const stats = useMemo(() => {
    const total = notes.length;
    const completed = notes.filter((note) => note.completed).length;
    const pdfNotes = notes.filter((note) => note.sourceType === "pdf").length;

    return [
      { label: "Active notes", value: total },
      { label: "Completed", value: completed },
      { label: "PDF sources", value: pdfNotes },
    ];
  }, [notes]);

  useEffect(() => {
    let active = true;

    async function loadNotes() {
      try {
        setLoading(true);
        const items = await listNotes({ archived: "false" });

        if (!active) {
          return;
        }

        setNotes(items);
        setSelectedNoteId((current) => current || items[0]?.id || "");
      } catch (loadError) {
        if (active) {
          setError(getErrorMessage(loadError, "Unable to load your notes"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadNotes();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "exam") {
      return;
    }

    setQuestionCount((current) =>
      clampExamQuestionCount(current, Math.max(1, orderedQuestionTypes.length)),
    );
  }, [mode, orderedQuestionTypes.length]);

  function upsertNote(note) {
    setNotes((current) => [note, ...current.filter((item) => item.id !== note.id)]);
    setSelectedNoteId(note.id);
  }

  function replaceNote(note) {
    setNotes((current) => current.map((item) => (item.id === note.id ? note : item)));
    setSelectedNoteId(note.id);
  }

  function handleToggleQuestionType(type) {
    setSelectedQuestionTypes((current) => {
      const next = current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type];

      return examQuestionFormats
        .map((format) => format.value)
        .filter((value) => next.includes(value));
    });
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (sourceType === "pdf" && !file) {
      setError("Select a PDF to generate notes.");
      return;
    }

    if (sourceType === "youtube" && !url.trim()) {
      setError("Paste a YouTube URL to generate notes.");
      return;
    }

    if (mode === "exam" && !orderedQuestionTypes.length) {
      setError("Select at least one exam question format.");
      return;
    }

    const safeQuestionCount =
      mode === "exam"
        ? clampExamQuestionCount(questionCount, Math.max(1, orderedQuestionTypes.length))
        : 0;

    try {
      setSubmitting(true);
      const createdNote = await generateNote({
        file: sourceType === "pdf" ? file : null,
        url: sourceType === "youtube" ? url.trim() : "",
        mode,
        folder: folder.trim(),
        questionCount: safeQuestionCount,
        questionTypes: mode === "exam" ? orderedQuestionTypes : [],
      });

      upsertNote(createdNote);
      setSuccess(
        mode === "exam"
          ? "Exam study set generated and saved to your library."
          : "Smart note generated and saved to your library.",
      );

      if (sourceType === "pdf") {
        setFile(null);
      } else {
        setUrl("");
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Unable to generate note"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegenerate() {
    if (!selectedNote) {
      return;
    }

    try {
      setActionBusy(true);
      setError("");
      const refreshed = await regenerateNote(selectedNote.id);
      replaceNote(refreshed);
      setSuccess("Note regenerated successfully.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to regenerate note"));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleToggleComplete() {
    if (!selectedNote) {
      return;
    }

    try {
      setActionBusy(true);
      setError("");
      const updated = await toggleComplete(selectedNote.id);
      replaceNote(updated);
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to update completion status"));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleToggleArchive() {
    if (!selectedNote) {
      return;
    }

    try {
      setActionBusy(true);
      setError("");
      const updated = await toggleArchive(selectedNote.id);
      setNotes((current) => current.filter((item) => item.id !== updated.id));
      setSelectedNoteId((current) => (current === updated.id ? "" : current));
      setSuccess(updated.archived ? "Note moved to archive." : "Note restored.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to archive note"));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete() {
    if (!selectedNote) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedNote.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setActionBusy(true);
      setError("");
      await deleteNote(selectedNote.id);
      setNotes((current) => current.filter((item) => item.id !== selectedNote.id));
      setSelectedNoteId("");
      setSuccess("Note deleted.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to delete note"));
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-screen-2xl gap-6 p-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <section className="space-y-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-curator sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                Workspace
              </p>
              <h1 className="mt-3 font-headline text-3xl font-extrabold text-primary">
                Create a new smart note
              </h1>
            </div>
            <div className="rounded-full bg-primary-fixed/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Live
            </div>
          </div>

          <form onSubmit={handleGenerate} className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-surface-container-low p-2">
              <button
                type="button"
                onClick={() => {
                  setSourceType("pdf");
                  setUrl("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  sourceType === "pdf"
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                PDF upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceType("youtube");
                  setFile(null);
                }}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  sourceType === "youtube"
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                YouTube link
              </button>
            </div>

            {sourceType === "pdf" ? (
              <div>
                <span className="mb-2 block text-sm font-medium text-on-surface-variant">
                  Choose PDF
                </span>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-primary/20 bg-surface-container-low px-4 py-5 transition-colors hover:border-primary/35">
                  <MaterialIcon name="upload_file" className="text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">
                      {file ? file.name : "Upload a lecture PDF"}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      PDF only, up to 15 MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                </label>
              </div>
            ) : (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-on-surface-variant">
                  YouTube URL
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-2xl border-none bg-surface-container-highest px-4 py-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-on-surface-variant">
                Folder
              </span>
              <input
                type="text"
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                placeholder="General"
                className="w-full rounded-2xl border-none bg-surface-container-highest px-4 py-4 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-on-surface-variant">
                Mode
              </span>
              <div className="space-y-3">
                {modes.map((item) => (
                  <label
                    key={item.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 transition-all ${
                      mode === item.value
                        ? "bg-primary-fixed/50 ring-1 ring-primary/10"
                        : "bg-surface-container-low"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={item.value}
                      checked={mode === item.value}
                      onChange={(event) => setMode(event.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{item.helper}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
                <p className="font-semibold text-on-surface">{selectedMode.detail}</p>
                {mode === "exam" ? (
                  <>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-secondary">
                      Selected output
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {orderedQuestionTypes.length ? (
                        examQuestionFormats
                          .filter((format) => orderedQuestionTypes.includes(format.value))
                          .map((format) => (
                            <span
                              key={format.value}
                              className="rounded-full bg-white px-3 py-2 shadow-sm"
                            >
                              {format.label}
                            </span>
                          ))
                      ) : (
                        <span className="rounded-full bg-white px-3 py-2 shadow-sm text-error">
                          Select at least one format
                        </span>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {mode === "exam" ? (
              <div className="space-y-5 rounded-2xl bg-surface-container-low p-5">
                <div>
                  <p className="text-sm font-semibold text-on-surface">Question formats</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Choose the exam formats you want to generate for this note.
                  </p>
                </div>

                <div className="space-y-3">
                  {examQuestionFormats.map((format) => {
                    const active = orderedQuestionTypes.includes(format.value);

                    return (
                      <label
                        key={format.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-all ${
                          active
                            ? "border-primary/15 bg-white shadow-sm"
                            : "border-transparent bg-white/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => handleToggleQuestionType(format.value)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{format.label}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">{format.helper}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="block text-sm font-medium text-on-surface-variant">
                      Number of questions
                    </span>
                    <input
                      type="number"
                      min={Math.max(1, orderedQuestionTypes.length)}
                      max="25"
                      value={questionCount}
                      onChange={(event) =>
                        setQuestionCount(
                          clampExamQuestionCount(
                            event.target.value,
                            Math.max(1, orderedQuestionTypes.length),
                          ),
                        )
                      }
                      className="w-20 rounded-xl border-none bg-white px-3 py-2 text-center text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <input
                    type="range"
                    min={Math.max(1, orderedQuestionTypes.length)}
                    max="25"
                    value={questionCount}
                    onChange={(event) =>
                      setQuestionCount(
                        clampExamQuestionCount(
                          event.target.value,
                          Math.max(1, orderedQuestionTypes.length),
                        ),
                      )
                    }
                    className="mt-4 w-full accent-primary"
                  />
                  <p className="mt-2 text-xs text-on-surface-variant">
                    You can generate up to 25 exam questions in one attempt.
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-secondary">
                    Planned mix
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    {examQuestionFormats
                      .filter((format) => orderedQuestionTypes.includes(format.value))
                      .map((format) => (
                        <span
                          key={format.value}
                          className="rounded-full bg-white px-3 py-2 shadow-sm"
                        >
                          {examQuestionMix[format.value]} {format.label}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl bg-secondary-container/40 px-4 py-3 text-sm text-on-surface">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-container px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <MaterialIcon name={submitting ? "hourglass_top" : "auto_awesome"} />
              {submitting
                ? mode === "exam"
                  ? "Generating exam study set..."
                  : "Generating smart note..."
                : mode === "exam"
                  ? "Generate exam study set"
                  : "Generate smart note"}
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-curator">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                {stat.label}
              </p>
              <p className="mt-3 font-headline text-3xl font-extrabold text-primary">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-curator">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                Recent Queries
              </p>
              <h2 className="mt-2 font-headline text-2xl font-extrabold text-primary">
                Your latest notes
              </h2>
            </div>
            {actionBusy ? (
              <span className="text-xs font-semibold text-on-surface-variant">Updating...</span>
            ) : null}
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="rounded-2xl bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">
                Loading your notes...
              </div>
            ) : notes.length ? (
              notes.slice(0, 6).map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  active={note.id === selectedNoteId}
                  onClick={() => setSelectedNoteId(note.id)}
                />
              ))
            ) : (
              <div className="rounded-2xl bg-surface-container-low px-4 py-6 text-sm leading-7 text-on-surface-variant">
                Generate your first note from a PDF or YouTube lecture to populate the workspace.
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <NoteViewer
          note={selectedNote}
          onRegenerate={handleRegenerate}
          onToggleComplete={handleToggleComplete}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}
