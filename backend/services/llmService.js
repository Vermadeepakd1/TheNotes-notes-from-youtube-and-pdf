import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  clampQuestionCount,
  EXAM_QUESTION_TYPES,
  getQuestionPlan,
  normalizeQuestionSet,
  normalizeQuestionTypes,
} from "../utils/questionSet.js";
import { estimateReadTime, extractJsonPayload } from "../utils/text.js";

const qaPairSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(5),
});

const mcqSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).min(4).max(4),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(5),
});

const noteSchema = z.object({
  title: z.string().min(5).max(180),
  summary: z.string().min(20),
  readTime: z.string().optional(),
  academicLevel: z.string().optional(),
  notesSections: z
    .array(
      z.object({
        title: z.string().min(3),
        body: z.string().min(30),
        quote: z.string().optional().nullable(),
        icon: z.string().optional().nullable(),
      }),
    )
    .min(2)
    .max(6),
  keyPoints: z.array(z.string().min(5)).min(3).max(10),
  questions: z.object({
    longAnswer: z.array(qaPairSchema).max(25),
    mediumAnswer: z.array(qaPairSchema).max(25),
    oneLiners: z.array(qaPairSchema).max(25),
    mcq: z.array(mcqSchema).max(25),
  }),
});

const MODE_PROFILES = {
  summary: {
    noteGoal: "a clear summary of the full source for fast revision",
    sectionInstruction:
      "Create 3 to 4 sections that collectively summarize the entire source in clear, well-ordered language.",
    summaryInstruction:
      "Write one clear summary that covers the full source from start to finish and explains the main flow in simple words.",
    audienceInstruction:
      "Assume the reader wants clarity first. Explain the topic in plain language and briefly explain hard terms instead of leaving jargon unexplained.",
    bodyLengthInstruction:
      "Keep each section focused and informative, around 70 to 120 words.",
    summaryLengthInstruction:
      "Keep the summary around 110 to 170 words and make it understandable on its own.",
    keyPointTarget: 5,
    sectionCount: 3,
  },
  detailed: {
    noteGoal:
      "a beginner-friendly, very detailed explanation of the full source for deeper understanding",
    sectionInstruction:
      "Create 5 to 6 sections that explain the topic from the very beginning and then gradually move into deeper details in a logical order.",
    summaryInstruction:
      "Write a fuller summary that explains what the topic is, why it matters, and how the ideas connect step by step.",
    audienceInstruction:
      "Teach like you are explaining to a curious 10-year-old. Start from zero, define unfamiliar words in simple language, never skip steps, and use gentle examples or analogies when helpful.",
    bodyLengthInstruction:
      "Make each section rich and detailed, around 130 to 220 words, so the learner feels the topic is being taught from scratch.",
    summaryLengthInstruction:
      "Make the summary fuller, around 140 to 220 words, and easy for a beginner to follow.",
    keyPointTarget: 7,
    sectionCount: 5,
  },
  exam: {
    noteGoal: "exam-oriented notes plus targeted question practice",
    sectionInstruction:
      "Create 3 to 5 high-yield sections that help with revision and answer writing.",
    summaryInstruction:
      "Write a revision-focused summary that highlights what a student should retain for assessment.",
    audienceInstruction:
      "Focus on high-yield concepts, answer-writing structure, and revision value.",
    bodyLengthInstruction:
      "Keep section bodies concise but meaningful, around 80 to 140 words.",
    summaryLengthInstruction:
      "Keep the summary around 100 to 160 words and make it revision-oriented.",
    keyPointTarget: 5,
    sectionCount: 3,
  },
};

const MIN_SUMMARY_LENGTH = {
  summary: 110,
  detailed: 150,
  exam: 100,
};

const MIN_SECTION_BODY_LENGTH = {
  summary: 70,
  detailed: 130,
  exam: 80,
};

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function punctuate(value) {
  const text = cleanString(value);

  if (!text) {
    return "";
  }

  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function splitIntoSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildExamQuestionInstructions(questionTypes, questionCount) {
  const normalizedQuestionTypes = normalizeQuestionTypes(questionTypes, EXAM_QUESTION_TYPES);
  const plan = getQuestionPlan(
    normalizedQuestionTypes,
    clampQuestionCount(questionCount, normalizedQuestionTypes.length || 1),
  );
  const lines = [
    "- Generate questions only for the selected exam formats below.",
    "- Any unselected question array must be returned as an empty array.",
  ];

  if (plan.longAnswer) {
    lines.push(
      `- Generate exactly ${plan.longAnswer} long-format questions with detailed answers.`,
    );
  } else {
    lines.push('- Return "longAnswer" as an empty array.');
  }

  if (plan.mediumAnswer) {
    lines.push(
      `- Generate exactly ${plan.mediumAnswer} medium-length questions with balanced model answers.`,
    );
  } else {
    lines.push('- Return "mediumAnswer" as an empty array.');
  }

  if (plan.oneLiners) {
    lines.push(
      `- Generate exactly ${plan.oneLiners} one-liner questions with one-sentence answers.`,
    );
  } else {
    lines.push('- Return "oneLiners" as an empty array.');
  }

  if (plan.mcq) {
    lines.push(
      `- Generate exactly ${plan.mcq} MCQs with 4 options, one correct answer, and a brief explanation.`,
    );
  } else {
    lines.push('- Return "mcq" as an empty array.');
  }

  return lines.join("\n");
}

function buildPrompt({
  sourceType,
  sourceTitle,
  sourceText,
  mode,
  questionCount,
  questionTypes,
}) {
  const profile = MODE_PROFILES[mode] || MODE_PROFILES.summary;
  const truncatedText = sourceText.slice(0, 32000);
  const questionInstruction =
    mode === "exam"
      ? buildExamQuestionInstructions(questionTypes, questionCount)
      : '- Return "questions" with all arrays empty because this mode does not include question generation.';

  return `
You are generating structured study notes for students.

Return strict JSON only. Do not use markdown fences.

Required JSON shape:
{
  "title": "string",
  "summary": "string",
  "readTime": "string",
  "academicLevel": "string",
  "notesSections": [
    {
      "title": "string",
      "body": "string",
      "quote": "string",
      "icon": "string"
    }
  ],
  "keyPoints": ["string"],
  "questions": {
    "longAnswer": [
      { "question": "string", "answer": "string" }
    ],
    "mediumAnswer": [
      { "question": "string", "answer": "string" }
    ],
    "oneLiners": [
      { "question": "string", "answer": "string" }
    ],
    "mcq": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": "string",
        "explanation": "string"
      }
    ]
  }
}

Instructions:
- Source type: ${sourceType}
- Source title: ${sourceTitle}
- Mode: ${mode}
- Goal: ${profile.noteGoal}
- ${profile.sectionInstruction}
- ${profile.summaryInstruction}
- ${profile.audienceInstruction}
- ${profile.bodyLengthInstruction}
- ${profile.summaryLengthInstruction}
- Cover the source faithfully and avoid hallucinating facts not supported by the source text.
- Organize the explanation in the order a learner should understand it, not just in random topic fragments.
- Keep icons short and material-symbol friendly, like "hub", "description", "lightbulb", "school", "psychology", "quiz".
- Include 4 to 8 sharp key points.
- The summary must be self-contained, easy to understand, and clearly explain the important ideas without vague phrases.
${questionInstruction}

Source text:
${truncatedText}
`;
}

function buildRepairPrompt(rawText) {
  const truncated = rawText.slice(0, 24000);

  return `
Repair the following invalid JSON.

Return valid JSON only.
Do not add markdown fences.
Preserve the original meaning as closely as possible.
Ensure all arrays and strings are valid JSON values.

Invalid JSON:
${truncated}
`;
}

function buildFallbackSummary(sourceText, mode) {
  const collapsed = sourceText.replace(/\s+/g, " ").trim();
  const summaryLength = mode === "detailed" ? 380 : 260;
  const summary = collapsed.slice(0, summaryLength);

  if (summary.length >= 20) {
    return punctuate(summary);
  }

  return "This source has been converted into a study-ready note for quick revision and understanding.";
}

function buildFallbackSections(sourceText, title, mode) {
  const sentences = splitIntoSentences(sourceText);
  const chunks = sentences.length
    ? [
        sentences.slice(0, 2).join(" "),
        sentences.slice(2, 5).join(" "),
        sentences.slice(5, 8).join(" "),
        sentences.slice(8, 11).join(" "),
      ]
    : [];

  const lastTitle =
    mode === "exam"
      ? "Exam View"
      : mode === "detailed"
        ? "Detailed Understanding"
        : "Revision Focus";

  return [
    {
      title: "Overview",
      body:
        cleanString(chunks[0]) ||
        `${title} has been organized into a clear overview so the learner can understand the topic quickly.`,
      quote: "",
      icon: "description",
    },
    {
      title: "Core Concepts",
      body:
        cleanString(chunks[1]) ||
        "The main ideas from the source are grouped here so the learner can grasp the central concepts accurately.",
      quote: "",
      icon: "lightbulb",
    },
    {
      title: "Key Details",
      body:
        cleanString(chunks[2]) ||
        "Important supporting details from the source are retained here to improve understanding and recall.",
      quote: "",
      icon: "hub",
    },
    {
      title: lastTitle,
      body:
        cleanString(chunks[3]) ||
        "This section highlights what should be retained for revision, explanation, and answer writing.",
      quote: "",
      icon: mode === "exam" ? "quiz" : "school",
    },
  ].map((section) => ({
    ...section,
    body:
      cleanString(section.body).length >= 30
        ? cleanString(section.body)
        : `${cleanString(section.body)} This helps the learner revise the material with confidence.`,
  }));
}

function ensureItems(values, minimum, fallbackBuilder) {
  const next = [...values];

  while (next.length < minimum) {
    next.push(fallbackBuilder(next.length));
  }

  return next;
}

function coerceGeneratedNote(
  parsed,
  sourceText,
  sourceTitle,
  mode,
  questionCount,
  questionTypes,
) {
  const profile = MODE_PROFILES[mode] || MODE_PROFILES.summary;
  const fallbackSections = buildFallbackSections(sourceText, sourceTitle, mode);
  const fallbackSummary = buildFallbackSummary(sourceText, mode);
  const minimumSectionLength = MIN_SECTION_BODY_LENGTH[mode] || 70;
  const minimumSummaryLength = MIN_SUMMARY_LENGTH[mode] || 100;

  const sections = Array.isArray(parsed?.notesSections)
    ? parsed.notesSections
        .map((section, index) => ({
          title:
            cleanString(section?.title) ||
            fallbackSections[index]?.title ||
            `Section ${index + 1}`,
          body:
            cleanString(section?.body).length >= minimumSectionLength
              ? cleanString(section.body)
              : fallbackSections[index]?.body || fallbackSummary,
          quote: cleanString(section?.quote),
          icon:
            cleanString(section?.icon) ||
            fallbackSections[index]?.icon ||
            "description",
        }))
        .filter((section) => section.body)
        .slice(0, 6)
    : [];

  const normalizedSections = ensureItems(
    sections,
    profile.sectionCount,
    (index) => fallbackSections[index % fallbackSections.length],
  ).slice(0, 6);

  const keyPoints = ensureItems(
    (Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [])
      .map((point) => punctuate(point))
      .filter((point) => point.length >= 5),
    profile.keyPointTarget,
    (index) => punctuate(normalizedSections[index % normalizedSections.length]?.body.slice(0, 120)),
  ).slice(0, 10);

  const normalizedTitle =
    cleanString(parsed?.title) ||
    `${mode === "exam" ? "Exam Prep for" : "Study Notes for"} ${sourceTitle}`;

  return {
    title: normalizedTitle,
    summary:
      cleanString(parsed?.summary).length >= minimumSummaryLength
        ? cleanString(parsed.summary)
        : fallbackSummary,
    readTime: cleanString(parsed?.readTime) || estimateReadTime(sourceText),
    academicLevel: cleanString(parsed?.academicLevel) || "Study Ready",
    notesSections: normalizedSections,
    keyPoints,
    questions: normalizeQuestionSet({
      questions: parsed?.questions,
      keyPoints,
      questionCount,
      mode,
      title: normalizedTitle,
      questionTypes,
    }),
  };
}

async function generateWithGemini(prompt) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error("Gemini client is not configured");
  }

  const geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });

  const response = await geminiClient.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  return response.text;
}

async function generateWithGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API key not configured");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: {
        type: "json_object",
      },
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseModelJson(rawText) {
  return JSON.parse(extractJsonPayload(rawText));
}

async function generateAndParseWithProvider(provider, prompt) {
  const generate = provider === "groq" ? generateWithGroq : generateWithGemini;
  const rawText = await generate(prompt);

  try {
    return parseModelJson(rawText);
  } catch {
    const repairedText = await generate(buildRepairPrompt(rawText));
    return parseModelJson(repairedText);
  }
}

export async function generateStructuredNotes({
  sourceType,
  sourceTitle,
  sourceText,
  mode,
  questionCount = 0,
  questionTypes = [],
}) {
  const normalizedQuestionTypes =
    mode === "exam"
      ? normalizeQuestionTypes(questionTypes, EXAM_QUESTION_TYPES)
      : [];
  const normalizedQuestionCount =
    mode === "exam"
      ? clampQuestionCount(questionCount, normalizedQuestionTypes.length || 1)
      : 0;
  const prompt = buildPrompt({
    sourceType,
    sourceTitle,
    sourceText,
    mode,
    questionCount: normalizedQuestionCount,
    questionTypes: normalizedQuestionTypes,
  });

  let parsed;

  try {
    parsed = await generateAndParseWithProvider("gemini", prompt);
  } catch (geminiError) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error(`Gemini request failed: ${geminiError.message}`);
    }

    console.warn("Gemini failed, trying Groq fallback", geminiError.message);

    try {
      parsed = await generateAndParseWithProvider("groq", prompt);
    } catch (groqError) {
      throw new Error(
        `Gemini request failed: ${geminiError.message}. Groq fallback failed: ${groqError.message}`,
      );
    }
  }

  const coerced = coerceGeneratedNote(
    parsed,
    sourceText,
    sourceTitle,
    mode,
    normalizedQuestionCount,
    normalizedQuestionTypes,
  );

  return noteSchema.parse(coerced);
}
