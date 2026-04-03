import multer from "multer";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Note } from "../models/Note.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeNote } from "../utils/noteSerializer.js";
import {
  clampQuestionCount,
  EXAM_QUESTION_TYPES,
  normalizeQuestionTypes,
  resolveQuestionTypes,
} from "../utils/questionSet.js";
import { extractSourceContent } from "../services/extractionService.js";
import { generateStructuredNotes } from "../services/llmService.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const generateSchema = z.object({
  url: z.string().trim().url().optional().or(z.literal("")),
  mode: z.enum(["summary", "detailed", "exam"]).default("summary"),
  folder: z.string().trim().max(80).optional(),
  questionCount: z.preprocess(
    (value) => (value === undefined || value === "" ? undefined : value),
    z.coerce.number().int().min(1).max(25).optional(),
  ),
  questionTypes: z.preprocess((value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (!trimmed) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {}

      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }, z.array(z.enum(EXAM_QUESTION_TYPES)).default([])),
});

const listSchema = z.object({
  search: z.string().trim().optional(),
  archived: z.enum(["true", "false"]).optional(),
  completed: z.enum(["true", "false"]).optional(),
});

export const listNotes = asyncHandler(async (request, response) => {
  const query = listSchema.parse(request.query);
  const filter = {
    user: request.user._id,
  };

  if (query.archived) {
    filter.archived = query.archived === "true";
  }

  if (query.completed) {
    filter.completed = query.completed === "true";
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { summary: { $regex: query.search, $options: "i" } },
      { sourceTitle: { $regex: query.search, $options: "i" } },
    ];
  }

  const notes = await Note.find(filter).sort({ updatedAt: -1 });
  response.json({
    notes: notes.map(serializeNote),
  });
});

export const getNote = asyncHandler(async (request, response) => {
  const note = await Note.findOne({
    _id: request.params.noteId,
    user: request.user._id,
  });

  if (!note) {
    response.status(404).json({
      error: "Note not found",
    });
    return;
  }

  response.json({
    note: serializeNote(note),
  });
});

export const generateNote = asyncHandler(async (request, response) => {
  const payload = generateSchema.parse(request.body);
  const questionTypes =
    payload.mode === "exam"
      ? normalizeQuestionTypes(payload.questionTypes, EXAM_QUESTION_TYPES)
      : [];
  const questionCount =
    payload.mode === "exam" ? clampQuestionCount(payload.questionCount, questionTypes.length) : 0;
  const extracted = await extractSourceContent({
    file: request.file,
    url: payload.url || "",
  });

  const generatedNote = await generateStructuredNotes({
    ...extracted,
    mode: payload.mode,
    questionCount,
    questionTypes,
  });

  const note = await Note.create({
    user: request.user._id,
    sourceType: extracted.sourceType,
    sourceTitle: extracted.sourceTitle,
    sourceUrl: extracted.sourceUrl,
    sourceText: extracted.sourceText,
    mode: payload.mode,
    folder: payload.folder || "General",
    questionCount,
    questionTypes,
    shareId: nanoid(12),
    ...generatedNote,
  });

  response.status(201).json({
    note: serializeNote(note),
  });
});

export const regenerateNote = asyncHandler(async (request, response) => {
  const note = await Note.findOne({
    _id: request.params.noteId,
    user: request.user._id,
  });

  if (!note) {
    response.status(404).json({
      error: "Note not found",
    });
    return;
  }

  const resolvedQuestionTypes =
    note.mode === "exam"
      ? resolveQuestionTypes({
          mode: note.mode,
          questionTypes: note.questionTypes,
          questions: note.questions,
          fallback: EXAM_QUESTION_TYPES,
        })
      : [];
  const resolvedQuestionCount =
    note.mode === "exam"
      ? clampQuestionCount(note.questionCount, resolvedQuestionTypes.length || 1)
      : 0;

  const generatedNote = await generateStructuredNotes({
    sourceType: note.sourceType,
    sourceTitle: note.sourceTitle,
    sourceText: note.sourceText,
    mode: note.mode,
    questionCount: resolvedQuestionCount,
    questionTypes: resolvedQuestionTypes,
  });

  note.title = generatedNote.title;
  note.summary = generatedNote.summary;
  note.readTime = generatedNote.readTime;
  note.academicLevel = generatedNote.academicLevel;
  note.notesSections = generatedNote.notesSections;
  note.keyPoints = generatedNote.keyPoints;
  note.questions = generatedNote.questions;
  note.questionTypes = resolvedQuestionTypes;
  note.questionCount = resolvedQuestionCount;
  await note.save();

  response.json({
    note: serializeNote(note),
  });
});

export const toggleComplete = asyncHandler(async (request, response) => {
  const note = await Note.findOne({
    _id: request.params.noteId,
    user: request.user._id,
  });

  if (!note) {
    response.status(404).json({
      error: "Note not found",
    });
    return;
  }

  note.completed = !note.completed;
  await note.save();

  response.json({
    note: serializeNote(note),
  });
});

export const toggleArchive = asyncHandler(async (request, response) => {
  const note = await Note.findOne({
    _id: request.params.noteId,
    user: request.user._id,
  });

  if (!note) {
    response.status(404).json({
      error: "Note not found",
    });
    return;
  }

  note.archived = !note.archived;
  await note.save();

  response.json({
    note: serializeNote(note),
  });
});

export const deleteNote = asyncHandler(async (request, response) => {
  const note = await Note.findOneAndDelete({
    _id: request.params.noteId,
    user: request.user._id,
  });

  if (!note) {
    response.status(404).json({
      error: "Note not found",
    });
    return;
  }

  response.json({
    success: true,
  });
});
