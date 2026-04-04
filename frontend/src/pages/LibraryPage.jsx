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
  const generatedAt = formatGeneratedAt(note.createdAt || note.updatedAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left transition-all ${active ? "bg-primary-fixed/35" : "hover:bg-surface-container-low"
        }`}
    >
      <h3 className="font-headline text-sm font-bold leading-snug text-primary break-words">
        {note.title}
      </h3>
      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
        <span className="material-symbols-outlined text-sm">schedule</span>
        <span>{generatedAt}</span>
      </div>
    </button>
  );
}

function FolderGroup({ folderName, notes, expanded, activeNoteId, onToggleFolder, onSelectNote }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/70">
      <button
        type="button"
        onClick={() => onToggleFolder(folderName)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
            {folderName}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {notes.length} note{notes.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="material-symbols-outlined text-base text-on-surface-variant">
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-1 px-2 pb-2">
          {notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              active={note.id === activeNoteId}
              onClick={() => onSelectNote(note)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatGeneratedAt(value) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedFolders, setExpandedFolders] = useState([]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId],
  );

  const folderGroups = useMemo(() => {
    const groups = notes.reduce((accumulator, note) => {
      const folderName = (note.folder || "General").trim() || "General";

      if (!accumulator[folderName]) {
        accumulator[folderName] = [];
      }

      accumulator[folderName].push(note);
      return accumulator;
    }, {});

    return Object.entries(groups).sort(([leftFolder], [rightFolder]) =>
      leftFolder.localeCompare(rightFolder),
    );
  }, [notes]);

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
        setExpandedFolders((current) => {
          const firstFolder = (items[0]?.folder || "General").trim() || "General";

          return current.length ? current : [firstFolder];
        });
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
    const folderName = (note.folder || "General").trim() || "General";
    setExpandedFolders((current) => (current.includes(folderName) ? current : [...current, folderName]));
  }

  function removeNoteAndSelectNext(noteId) {
    let nextSelectedId = "";

    setNotes((current) => {
      const filtered = current.filter((item) => item.id !== noteId);
      nextSelectedId = filtered[0]?.id || "";
      return filtered;
    });

    setSelectedNoteId((current) => (current === noteId ? nextSelectedId : current));
  }

  function handleToggleFolder(folderName) {
    setExpandedFolders((current) =>
      current.includes(folderName)
        ? current.filter((item) => item !== folderName)
        : [...current, folderName],
    );
  }

  function handleSelectNote(note) {
    setSelectedNoteId(note.id);
    const folderName = (note.folder || "General").trim() || "General";
    setExpandedFolders((current) => (current.includes(folderName) ? current : [...current, folderName]));
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
      removeNoteAndSelectNext(selectedNote.id);
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
      removeNoteAndSelectNext(selectedNote.id);
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Unable to delete note"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-screen-2xl gap-6 p-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-[2rem] bg-white p-5 shadow-curator">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
              Library
            </p>
            <h1 className="mt-1 font-headline text-2xl font-extrabold text-primary">
              Saved notes
            </h1>
          </div>
          {busy ? (
            <span className="text-xs font-semibold text-on-surface-variant">Updating...</span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="rounded-xl bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
              Loading your library...
            </div>
          ) : folderGroups.length ? (
            folderGroups.map(([folderName, folderNotes]) => (
              <FolderGroup
                key={folderName}
                folderName={folderName}
                notes={folderNotes}
                expanded={expandedFolders.includes(folderName)}
                activeNoteId={selectedNoteId}
                onToggleFolder={handleToggleFolder}
                onSelectNote={handleSelectNote}
              />
            ))
          ) : (
            <div className="rounded-xl bg-surface-container-low px-4 py-4 text-sm leading-6 text-on-surface-variant">
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
