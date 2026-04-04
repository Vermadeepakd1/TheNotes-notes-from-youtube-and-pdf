import { useEffect, useMemo, useState } from "react";

async function copyTextWithFallback(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }

  if (!copied) {
    throw new Error("Clipboard copy failed");
  }

  return true;
}

function resolveShareUrl(note) {
  if (!note) {
    return "";
  }

  if (typeof window !== "undefined" && note.shareId) {
    return `${window.location.origin}/shared/${note.shareId}`;
  }

  return note.shareUrl || "";
}

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

function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center space-x-2 pb-4 text-sm transition-colors ${active
        ? "active-tab-dot font-headline font-bold text-primary"
        : "font-headline font-medium text-on-surface-variant hover:text-primary"
        }`}
    >
      <MaterialIcon name={icon} className="text-sm" />
      <span>{label}</span>
    </button>
  );
}

function EmptyState({ message = "Generate a note or select one from the library." }) {
  return (
    <section className="flex min-h-[700px] items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-curator">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed/60">
          <MaterialIcon name="auto_awesome" className="text-primary" />
        </div>
        <h2 className="font-headline text-2xl font-bold text-primary">Nothing selected yet</h2>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">{message}</p>
      </div>
    </section>
  );
}

function QuestionAnswerSection({ title, icon, items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-slate-50/80 p-6">
      <h2 className="mb-4 flex items-center gap-2 font-headline text-lg font-bold text-primary">
        <MaterialIcon name={icon} className="text-base" />
        <span>{title}</span>
      </h2>
      <div className="space-y-5">
        {items.map((item, index) => (
          <article key={`${title}-${index}`} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
              Question {index + 1}
            </p>
            <p className="mt-2 font-semibold leading-7 text-on-surface">{item.question}</p>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const questionTypeLabels = {
  longAnswer: "Long format Q&A",
  mediumAnswer: "Medium length Q&A",
  oneLiners: "One-liner Q&A",
  mcq: "Quiz",
};

export default function NoteViewer({
  note,
  onRegenerate,
  onToggleComplete,
  onToggleArchive,
  onDelete,
  readOnly = false,
}) {
  const [activeTab, setActiveTab] = useState("notes");
  const [feedback, setFeedback] = useState("");
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState({});
  const [quizChecked, setQuizChecked] = useState(false);

  const shareUrl = useMemo(() => resolveShareUrl(note), [note]);
  const markdown = note?.markdown;
  const questionTypes = note?.questionTypes || [];
  const hasStudyKit = note?.mode === "exam" && questionTypes.length > 0;
  const mcqItems = note?.questions?.mcq || [];

  useEffect(() => {
    setSelectedMcqAnswers({});
    setQuizChecked(false);
    setFeedback("");
    setActiveTab("notes");
  }, [note?.id]);

  useEffect(() => {
    if (!hasStudyKit && activeTab === "questions") {
      setActiveTab("notes");
    }
  }, [activeTab, hasStudyKit]);

  const quizStats = useMemo(() => {
    const answered = mcqItems.filter((_, index) => selectedMcqAnswers[index]).length;
    const correct = mcqItems.filter(
      (item, index) => selectedMcqAnswers[index] === item.correctAnswer,
    ).length;

    return {
      answered,
      total: mcqItems.length,
      correct,
    };
  }, [mcqItems, selectedMcqAnswers]);

  const actions = useMemo(
    () => [
      {
        key: "download",
        icon: "download",
        onClick() {
          if (!markdown || !note) {
            setFeedback("Markdown is unavailable for this note.");
            return;
          }

          const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `${note.title
            .replace(/[^a-z0-9\s-]/gi, "")
            .trim()
            .replace(/\s+/g, "-")
            .toLowerCase() || "smart-note"}.md`;
          link.click();
          URL.revokeObjectURL(link.href);
          setFeedback("Markdown downloaded.");
        },
      },
      {
        key: "share",
        icon: "share",
        async onClick() {
          if (!shareUrl) {
            setFeedback("Share link unavailable for this note.");
            return;
          }

          try {
            if (navigator.share) {
              await navigator.share({
                title: note?.title || "Smart Note",
                url: shareUrl,
              });
              setFeedback("Share dialog opened.");
              return;
            }

            await copyTextWithFallback(shareUrl);
            setFeedback("Share link copied to clipboard.");
          } catch {
            // Final fallback still exposes the link when copy/share APIs are blocked.
            setFeedback(`Share link: ${shareUrl}`);
          }
        },
      },
      {
        key: "print",
        icon: "print",
        onClick() {
          setFeedback("Print dialog opened.");
          window.print();
        },
      },
    ],
    [markdown, note, shareUrl],
  );

  if (!note) {
    return <EmptyState />;
  }

  return (
    <section className="flex min-h-[700px] flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-curator">
      <div className="bg-surface-container-low/50 px-8 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              Result
            </span>
          </div>
          <div className="flex space-x-2 text-on-surface-variant">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                className="rounded-lg p-2 transition-all hover:bg-surface-container"
              >
                <MaterialIcon name={action.icon} className="text-lg" />
              </button>
            ))}
          </div>
        </div>

        {feedback ? (
          <div
            className="mb-4 rounded-lg bg-secondary-container/40 px-3 py-2 text-xs text-on-surface"
            aria-live="polite"
          >
            {feedback}
          </div>
        ) : null}

        <div className="flex space-x-8 border-b border-outline-variant/20">
          <TabButton
            active={activeTab === "notes"}
            icon="notes"
            label="Notes"
            onClick={() => setActiveTab("notes")}
          />
          <TabButton
            active={activeTab === "keyPoints"}
            icon="format_list_bulleted"
            label="Key Points"
            onClick={() => setActiveTab("keyPoints")}
          />
          {hasStudyKit ? (
            <TabButton
              active={activeTab === "questions"}
              icon="quiz"
              label="Study Kit"
              onClick={() => setActiveTab("questions")}
            />
          ) : null}
        </div>
      </div>

      <div className="editor-scrollbar max-h-[calc(100vh-280px)] flex-1 overflow-y-auto p-10">
        {activeTab === "notes" ? (
          <article className="max-w-none">
            <header className="mb-10">
              <h1 className="mb-4 font-headline text-3xl font-extrabold leading-tight text-indigo-950">
                {note.title}
              </h1>
              <p className="mb-4 max-w-3xl text-sm leading-7 text-on-surface-variant">
                {note.summary}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                <span className="flex items-center">
                  <MaterialIcon name="timer" className="mr-1 text-sm" />
                  {note.readTime}
                </span>
                <span className="flex items-center">
                  <MaterialIcon name="school" className="mr-1 text-sm" />
                  {note.academicLevel}
                </span>
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  {note.mode}
                </span>
                {hasStudyKit ? (
                  <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary">
                    {note.questionCount} questions
                  </span>
                ) : null}
              </div>
            </header>

            <div className="space-y-12">
              {(note.notesSections || []).map((section) => (
                <section key={section.title}>
                  <h2 className="mb-4 flex items-center font-headline text-xl font-bold text-primary">
                    <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed">
                      <MaterialIcon
                        name={section.icon || "description"}
                        className="text-sm text-primary"
                      />
                    </span>
                    {section.title}
                  </h2>
                  <p className="mb-4 leading-relaxed text-on-surface-variant">
                    {section.body}
                  </p>
                  {section.quote ? (
                    <div className="rounded-r-lg border-l-4 border-secondary bg-surface-container-low p-4 text-sm italic text-on-surface-variant">
                      {section.quote}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </article>
        ) : null}

        {activeTab === "keyPoints" ? (
          <div className="space-y-4">
            {(note.keyPoints || []).map((point) => (
              <div key={point} className="flex items-start rounded-2xl bg-slate-50/80 p-5">
                <MaterialIcon name="check_circle" className="mr-3 text-secondary" filled />
                <p className="text-sm leading-7 text-on-surface-variant">{point}</p>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "questions" && hasStudyKit ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-primary-fixed/35 p-5 text-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface">
                This exam study kit includes only the formats you selected when generating the note.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {questionTypes.map((type) => (
                  <span key={type} className="rounded-full bg-white px-3 py-2 shadow-sm">
                    {questionTypeLabels[type]}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {questionTypes.includes("longAnswer") ? (
                <QuestionAnswerSection
                  title="Long Format Questions with Answers"
                  icon="subject"
                  items={note.questions?.longAnswer || []}
                />
              ) : null}

              {questionTypes.includes("mediumAnswer") ? (
                <QuestionAnswerSection
                  title="Medium Length Questions with Answers"
                  icon="short_text"
                  items={note.questions?.mediumAnswer || []}
                />
              ) : null}
            </div>

            {questionTypes.includes("oneLiners") ? (
              <QuestionAnswerSection
                title="One Liner Questions with Answers"
                icon="format_list_numbered"
                items={note.questions?.oneLiners || []}
              />
            ) : null}

            {questionTypes.includes("mcq") ? (
              <section className="rounded-2xl bg-slate-50/80 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-headline text-lg font-bold text-primary">MCQ Quiz</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Attempt the quiz and then check your score.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {quizChecked ? (
                      <span className="rounded-full bg-secondary-container/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                        Score {quizStats.correct}/{quizStats.total}
                      </span>
                    ) : (
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant shadow-sm">
                        Answered {quizStats.answered}/{quizStats.total}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {mcqItems.map((item, index) => (
                    <article key={`mcq-${index}`} className="rounded-2xl bg-white p-5 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                        MCQ {index + 1}
                      </p>
                      <p className="mt-2 font-semibold leading-7 text-on-surface">
                        {item.question}
                      </p>

                      <div className="mt-4 space-y-3">
                        {item.options.map((option) => {
                          const isSelected = selectedMcqAnswers[index] === option;
                          const isCorrect = quizChecked && option === item.correctAnswer;
                          const isWrong =
                            quizChecked && isSelected && option !== item.correctAnswer;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setSelectedMcqAnswers((current) => ({
                                  ...current,
                                  [index]: option,
                                }))
                              }
                              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${isCorrect
                                ? "border-secondary bg-secondary-container/35 text-on-surface"
                                : isWrong
                                  ? "border-error bg-error-container text-on-error-container"
                                  : isSelected
                                    ? "border-primary bg-primary-fixed/40 text-on-surface"
                                    : "border-slate-200 bg-white text-on-surface hover:border-primary/20"
                                }`}
                            >
                              <span>{option}</span>
                              {quizChecked && isCorrect ? (
                                <MaterialIcon
                                  name="check_circle"
                                  className="text-secondary"
                                  filled
                                />
                              ) : null}
                              {quizChecked && isWrong ? (
                                <MaterialIcon name="cancel" className="text-error" filled />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>

                      {quizChecked ? (
                        <div className="mt-4 rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                          <p className="font-semibold text-on-surface">
                            Correct answer: {item.correctAnswer}
                          </p>
                          <p className="mt-2 leading-7">{item.explanation}</p>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
                  {!quizChecked ? (
                    <button
                      type="button"
                      onClick={() => setQuizChecked(true)}
                      disabled={!quizStats.total}
                      className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Check quiz
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMcqAnswers({});
                      setQuizChecked(false);
                    }}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary shadow-sm"
                  >
                    Reset quiz
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/10 bg-surface-container-low/30 px-10 py-6">
        <div>
          <p className="text-xs italic text-on-surface-variant">
            Refined by TheNotes AI Curator
          </p>
          {feedback ? (
            <p className="mt-1 break-all text-xs text-secondary">{feedback}</p>
          ) : null}
        </div>

        {readOnly ? null : (
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <button type="button" onClick={onRegenerate} className="text-primary hover:underline">
              Regenerate Note
            </button>
            <div className="h-4 w-px bg-outline-variant/40" />
            <button
              type="button"
              onClick={onToggleComplete}
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              {note.completed ? "Mark as Incomplete" : "Mark as Complete"}
            </button>
            <div className="h-4 w-px bg-outline-variant/40" />
            <button
              type="button"
              onClick={onToggleArchive}
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              {note.archived ? "Restore from Archive" : "Archive Note"}
            </button>
            <div className="h-4 w-px bg-outline-variant/40" />
            <button
              type="button"
              onClick={onDelete}
              className="text-error transition-colors hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
