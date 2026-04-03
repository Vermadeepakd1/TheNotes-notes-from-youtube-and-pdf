import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import NoteViewer from "../components/NoteViewer";
import {
  deleteNote,
  getErrorMessage,
  listNotes,
  regenerateNote,
  toggleArchive,
  toggleComplete,
} from "../services/api";

function NoteRow({ note, active, onClick }) {
  const hasExamSet = note.mode === "exam" && note.questionCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-4 text-left transition-all ${
        active ? "bg-primary-fixed/50" : "hover:bg-surface-container-low"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-headline text-base font-bold text-primary">{note.title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          {note.mode}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{note.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary">
        <span>{note.folder}</span>
        <span>|</span>
        <span>{note.sourceType}</span>
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

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId],
  );

  useEffect(() => {
    let active = true;

    async function loadNotes() {
      try {
        setLoading(true);
        setError("");
        const items = await listNotes({
          archived: "false",
          ...(search ? { search } : {}),
        });

        if (!active) {
          return;
        }

        setNotes(items);
        setSelectedNoteId(items[0]?.id || "");
      } catch (loadError) {
        if (active) {
          setError(getErrorMessage(loadError, "Unable to load library"));
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
  }, [search]);

  function replaceNote(note) {
    setNotes((current) => current.map((item) => (item.id === note.id ? note : item)));
    setSelectedNoteId(note.id);
  }

  async function handleRegenerate() {
    if (!selectedNote) {
      return;
    }

    try {
      setBusy(true);
      const updated = await regenerateNote(selectedNote.id);
      replaceNote(updated);
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to regenerate note"));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleComplete() {
    if (!selectedNote) {
      return;
    }

    try {
      setBusy(true);
      const updated = await toggleComplete(selectedNote.id);
      replaceNote(updated);
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to update note"));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleArchive() {
    if (!selectedNote) {
      return;
    }

    try {
      setBusy(true);
      await toggleArchive(selectedNote.id);
      setNotes((current) => current.filter((item) => item.id !== selectedNote.id));
      setSelectedNoteId("");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to move note to archive"));
    } finally {
      setBusy(false);
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
      setBusy(true);
      await deleteNote(selectedNote.id);
      setNotes((current) => current.filter((item) => item.id !== selectedNote.id));
      setSelectedNoteId("");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to delete note"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-screen-2xl gap-6 p-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-[2rem] bg-white p-6 shadow-curator">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              Library
            </p>
            <h1 className="mt-2 font-headline text-3xl font-extrabold text-primary">
              Saved notes
            </h1>
          </div>
          {busy ? (
            <span className="text-xs font-semibold text-on-surface-variant">Updating...</span>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          {search
            ? `Showing notes matching "${search}".`
            : "Browse every active note saved to your account."}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          {loading ? (
            <div className="rounded-2xl bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">
              Loading your library...
            </div>
          ) : notes.length ? (
            notes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                active={note.id === selectedNoteId}
                onClick={() => setSelectedNoteId(note.id)}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-surface-container-low px-4 py-6 text-sm leading-7 text-on-surface-variant">
              No active notes matched this filter yet.
            </div>
          )}
        </div>
      </aside>

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
