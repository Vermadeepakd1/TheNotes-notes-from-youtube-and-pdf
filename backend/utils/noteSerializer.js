import { buildMarkdownFromNote } from "./text.js";
import {
  normalizeQuestionSet,
  resolveQuestionTypes,
  resolveQuestionCount,
} from "./questionSet.js";

export function serializeNote(note) {
  const questionTypes = resolveQuestionTypes({
    mode: note.mode,
    questionTypes: note.questionTypes,
    questions: note.questions,
  });
  const questionCount = resolveQuestionCount({
    mode: note.mode,
    questionCount: note.questionCount,
    questionTypes,
    questions: note.questions,
  });
  const questions = normalizeQuestionSet({
    questions: note.questions,
    keyPoints: note.keyPoints,
    questionCount,
    mode: note.mode,
    title: note.title,
    questionTypes,
  });
  const serialized = {
    id: note._id.toString(),
    sourceType: note.sourceType,
    sourceTitle: note.sourceTitle,
    sourceUrl: note.sourceUrl,
    mode: note.mode,
    folder: note.folder,
    questionCount,
    questionTypes,
    title: note.title,
    summary: note.summary,
    readTime: note.readTime,
    academicLevel: note.academicLevel,
    notesSections: note.notesSections,
    keyPoints: note.keyPoints,
    questions,
    completed: note.completed,
    archived: note.archived,
    shareId: note.shareId,
    shareUrl: `${process.env.FRONTEND_URL || "http://127.0.0.1:5173"}/shared/${note.shareId}`,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };

  serialized.markdown = buildMarkdownFromNote(serialized);

  return serialized;
}
