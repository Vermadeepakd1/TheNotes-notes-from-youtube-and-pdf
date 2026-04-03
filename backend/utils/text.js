import { normalizeQuestionSet } from "./questionSet.js";

export function cleanExtractedText(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();
}

export function extractJsonPayload(value) {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("AI response did not contain valid JSON");
  }

  return trimmed.slice(start, end + 1);
}

export function estimateReadTime(text) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

export function buildMarkdownFromNote(note) {
  const questions = normalizeQuestionSet({
    questions: note.questions,
    keyPoints: note.keyPoints,
    questionCount: note.questionCount,
    mode: note.mode,
    title: note.title,
    questionTypes: note.questionTypes,
  });

  const sections = note.notesSections
    .map((section) => {
      const quoteBlock = section.quote ? `\n> ${section.quote}\n` : "";
      return `## ${section.title}\n\n${section.body}${quoteBlock}`;
    })
    .join("\n");

  const keyPoints = note.keyPoints.map((point) => `- ${point}`).join("\n");
  const questionSections = [];

  if (questions.longAnswer.length) {
    questionSections.push(
      `## Long Format Questions and Answers\n\n${questions.longAnswer
        .map(
          (item, index) =>
            `${index + 1}. Question: ${item.question}\n   Answer: ${item.answer}`,
        )
        .join("\n")}`,
    );
  }

  if (questions.mediumAnswer.length) {
    questionSections.push(
      `## Medium Length Questions and Answers\n\n${questions.mediumAnswer
        .map(
          (item, index) =>
            `${index + 1}. Question: ${item.question}\n   Answer: ${item.answer}`,
        )
        .join("\n")}`,
    );
  }

  if (questions.oneLiners.length) {
    questionSections.push(
      `## One Liner Questions and Answers\n\n${questions.oneLiners
        .map(
          (item, index) =>
            `${index + 1}. Question: ${item.question}\n   Answer: ${item.answer}`,
        )
        .join("\n")}`,
    );
  }

  if (questions.mcq.length) {
    questionSections.push(
      `## MCQ Quiz\n\n${questions.mcq
        .map(
          (item, index) =>
            `${index + 1}. ${item.question}\n   - ${item.options[0]}\n   - ${item.options[1]}\n   - ${item.options[2]}\n   - ${item.options[3]}\n   Correct Answer: ${item.correctAnswer}\n   Explanation: ${item.explanation}`,
        )
        .join("\n")}`,
    );
  }

  const questionBlock = questionSections.length ? `\n\n${questionSections.join("\n\n")}` : "";

  return `# ${note.title}\n\n${note.summary}\n\n${sections}\n\n## Key Points\n\n${keyPoints}${questionBlock}`;
}
