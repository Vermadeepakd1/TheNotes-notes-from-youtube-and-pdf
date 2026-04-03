import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NoteViewer from "../components/NoteViewer";
import { getErrorMessage, getSharedNote } from "../services/api";

export default function SharedNotePage() {
  const { shareId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSharedNote() {
      try {
        setLoading(true);
        const sharedNote = await getSharedNote(shareId);

        if (active) {
          setNote(sharedNote);
        }
      } catch (loadError) {
        if (active) {
          setError(getErrorMessage(loadError, "Unable to load shared note"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSharedNote();

    return () => {
      active = false;
    };
  }, [shareId]);

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              Shared Note
            </p>
            <h1 className="mt-2 font-headline text-3xl font-extrabold text-primary">
              Study pack preview
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary shadow-curator"
            >
              Back to home
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Create your workspace
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white px-6 py-10 text-sm text-on-surface-variant shadow-curator">
            Loading shared note...
          </div>
        ) : error ? (
          <div className="rounded-[2rem] bg-error-container px-6 py-10 text-sm text-on-error-container shadow-curator">
            {error}
          </div>
        ) : (
          <NoteViewer note={note} readOnly />
        )}
      </div>
    </div>
  );
}
