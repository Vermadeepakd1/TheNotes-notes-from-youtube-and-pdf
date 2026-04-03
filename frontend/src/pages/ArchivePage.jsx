import { useEffect, useMemo, useState } from "react";
import NoteViewer from "../components/NoteViewer";
import {
  deleteNote,
  getErrorMessage,
  listNotes,
  regenerateNote,
  toggleArchive,
  toggleComplete,
} from "../services/api";

function ArchivedItem({ note, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full w-full flex-col rounded-2xl border px-4 py-4 text-left transition-all ${active
        ? "border-secondary/15 bg-secondary-container/45"
        : "border-transparent bg-white hover:border-secondary/10 hover:bg-surface-container-low"
        }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Archived</p>
      <h3 className="note-card-title mt-2 font-headline text-base font-bold text-primary">{note.title}</h3>
      <p className="note-card-summary mt-2 text-sm leading-6 text-on-surface-variant">{note.summary}</p>
    </button>
  );
}

export default function ArchivePage() {
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

    async function loadArchive() {
      try {
        setLoading(true);
        const items = await listNotes({ archived: "true" });

        if (!active) {
          return;
        }

        setNotes(items);
        setSelectedNoteId(items[0]?.id || "");
      } catch (loadError) {
        if (active) {
          setError(getErrorMessage(loadError, "Unable to load archive"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadArchive();

    return () => {
      active = false;
    };
  }, []);

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
      setError(getErrorMessage(actionError, "Unable to regenerate archived note"));
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
      setError(getErrorMessage(actionError, "Unable to update archived note"));
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
      const updated = await toggleArchive(selectedNote.id);
      setNotes((current) => current.filter((item) => item.id !== updated.id));
      setSelectedNoteId("");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to restore note"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!selectedNote) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedNote.title}" permanently?`);

    if (!confirmed) {
      return;
    }

    try {
      setBusy(true);
      await deleteNote(selectedNote.id);
      setNotes((current) => current.filter((item) => item.id !== selectedNote.id));
      setSelectedNoteId("");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to delete archived note"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-screen-2xl gap-6 p-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-[2rem] bg-white p-6 shadow-curator">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              Archive
            </p>
            <h1 className="mt-2 font-headline text-3xl font-extrabold text-primary">
              Completed and parked
            </h1>
          </div>
          {busy ? (
            <span className="text-xs font-semibold text-on-surface-variant">Updating...</span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid max-h-[58vh] gap-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="rounded-2xl bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">
              Loading archive...
            </div>
          ) : notes.length ? (
            notes.map((note) => (
              <ArchivedItem
                key={note.id}
                note={note}
                active={note.id === selectedNoteId}
                onClick={() => setSelectedNoteId(note.id)}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-surface-container-low px-4 py-6 text-sm leading-7 text-on-surface-variant">
              Archived notes will appear here when you move them out of the main library.
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
