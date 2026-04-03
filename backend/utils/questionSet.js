export const DEFAULT_QUESTION_COUNT = 12;
export const MAX_QUESTION_COUNT = 25;
export const EXAM_QUESTION_TYPES = [
  "longAnswer",
  "mediumAnswer",
  "oneLiners",
  "mcq",
];

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

function uniqueInDeclaredOrder(values) {
  return EXAM_QUESTION_TYPES.filter((type) => values.includes(type));
}

function ensureCount(values, desiredCount, fallbackBuilder) {
  const next = [...values];

  while (next.length < desiredCount) {
    next.push(fallbackBuilder(next.length));
  }

  return next.slice(0, desiredCount);
}

function buildFallbackPoint(keyPoints, index) {
  const point = keyPoints[index % Math.max(keyPoints.length, 1)];
  return punctuate(point || `Key takeaway ${index + 1}`);
}

function buildFallbackQaPair(kind, title, keyPoints, index) {
  const safeTitle = cleanString(title) || "this topic";
  const point = buildFallbackPoint(keyPoints, index);

  if (kind === "longAnswer") {
    return {
      question: `Explain ${point.replace(/[.?!]$/, "").toLowerCase()} in the context of ${safeTitle}.`,
      answer: `${point} Use the source summary, major concepts, and supporting details to build a complete answer.`,
    };
  }

  if (kind === "mediumAnswer") {
    return {
      question: `What is the importance of ${point.replace(/[.?!]$/, "").toLowerCase()}?`,
      answer: `${point} This is a strong medium-length revision answer from ${safeTitle}.`,
    };
  }

  return {
    question: `State one key fact about ${safeTitle}.`,
    answer: point,
  };
}

function buildFallbackMcq(title, keyPoints, index) {
  const safeTitle = cleanString(title) || "this topic";
  const correctAnswer = buildFallbackPoint(keyPoints, index);

  return {
    question: `Which option best matches an important idea from ${safeTitle}?`,
    options: [
      correctAnswer,
      `A minor point not supported by ${safeTitle}.`,
      `A statement that contradicts the source material.`,
      `An unrelated idea from another topic.`,
    ],
    correctAnswer,
    explanation: `${correctAnswer} This option matches the note content most closely.`,
  };
}

function normalizeQaItems(items, desiredCount, kind, title, keyPoints) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (typeof item === "string") {
        return buildFallbackQaPair(kind, title, [item, ...keyPoints], index);
      }

      const question = cleanString(item?.question);
      const answer = punctuate(item?.answer);

      if (!question || !answer) {
        return buildFallbackQaPair(kind, title, keyPoints, index);
      }

      return {
        question,
        answer,
      };
    })
    .filter((item) => item.question && item.answer);

  return ensureCount(normalized, desiredCount, (index) =>
    buildFallbackQaPair(kind, title, keyPoints, index),
  );
}

function normalizeMcqItems(items, desiredCount, title, keyPoints) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const question = cleanString(item?.question);
      const options = Array.isArray(item?.options)
        ? [...new Set(item.options.map((option) => punctuate(option)).filter(Boolean))]
        : [];
      const correctAnswer = punctuate(item?.correctAnswer);
      const explanation = punctuate(item?.explanation);

      if (
        !question ||
        !correctAnswer ||
        !explanation ||
        options.length < 4 ||
        !options.includes(correctAnswer)
      ) {
        return buildFallbackMcq(title, keyPoints, index);
      }

      return {
        question,
        options: options.slice(0, 4),
        correctAnswer,
        explanation,
      };
    })
    .filter(Boolean);

  return ensureCount(normalized, desiredCount, (index) =>
    buildFallbackMcq(title, keyPoints, index),
  );
}

function inferQuestionTypesFromQuestions(questions) {
  const inferred = [];

  if (Array.isArray(questions?.longAnswer) && questions.longAnswer.length) {
    inferred.push("longAnswer");
  }

  if (
    (Array.isArray(questions?.mediumAnswer) && questions.mediumAnswer.length) ||
    (Array.isArray(questions?.shortAnswer) && questions.shortAnswer.length) ||
    (Array.isArray(questions?.viva) && questions.viva.length)
  ) {
    inferred.push("mediumAnswer");
  }

  if (Array.isArray(questions?.oneLiners) && questions.oneLiners.length) {
    inferred.push("oneLiners");
  }

  if (Array.isArray(questions?.mcq) && questions.mcq.length) {
    inferred.push("mcq");
  }

  return uniqueInDeclaredOrder(inferred);
}

export function resolveQuestionTypes({ mode, questionTypes, questions, fallback = [] }) {
  if (mode !== "exam") {
    return [];
  }

  return normalizeQuestionTypes(
    questionTypes,
    inferQuestionTypesFromQuestions(questions).length
      ? inferQuestionTypesFromQuestions(questions)
      : fallback,
  );
}

export function getEmptyQuestionSet() {
  return {
    longAnswer: [],
    mediumAnswer: [],
    oneLiners: [],
    mcq: [],
  };
}

export function normalizeQuestionTypes(questionTypes, fallback = []) {
  const rawValues = Array.isArray(questionTypes)
    ? questionTypes
    : typeof questionTypes === "string"
      ? questionTypes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const normalized = uniqueInDeclaredOrder(rawValues);

  if (normalized.length) {
    return normalized;
  }

  return uniqueInDeclaredOrder(Array.isArray(fallback) ? fallback : []);
}

export function clampQuestionCount(value, minimum = 1) {
  const parsed = Number(value);
  const safeMinimum = Math.min(MAX_QUESTION_COUNT, Math.max(1, Math.round(Number(minimum) || 1)));

  if (!Number.isFinite(parsed)) {
    return Math.max(DEFAULT_QUESTION_COUNT, safeMinimum);
  }

  return Math.min(MAX_QUESTION_COUNT, Math.max(safeMinimum, Math.round(parsed)));
}

export function getQuestionPlan(questionTypes, questionCount) {
  const selectedTypes = normalizeQuestionTypes(questionTypes);
  const counts = getEmptyQuestionSet();

  if (!selectedTypes.length) {
    return counts;
  }

  const total = clampQuestionCount(questionCount, selectedTypes.length);
  const baseCount = Math.floor(total / selectedTypes.length);
  let remainder = total % selectedTypes.length;

  selectedTypes.forEach((type) => {
    counts[type] = baseCount;

    if (remainder > 0) {
      counts[type] += 1;
      remainder -= 1;
    }
  });

  return counts;
}

export function resolveQuestionCount({ mode, questionCount, questionTypes, questions }) {
  if (mode !== "exam") {
    return 0;
  }

  const normalizedTypes = normalizeQuestionTypes(
    questionTypes,
    inferQuestionTypesFromQuestions(questions),
  );

  if (!normalizedTypes.length) {
    return 0;
  }

  const explicitCount = Number(questionCount);

  if (Number.isFinite(explicitCount) && explicitCount >= normalizedTypes.length) {
    return clampQuestionCount(explicitCount, normalizedTypes.length);
  }

  const inferredCount = normalizedTypes.reduce((sum, type) => {
    if (type === "mediumAnswer") {
      return sum + Math.max(
        questions?.mediumAnswer?.length || 0,
        questions?.shortAnswer?.length || 0,
        questions?.viva?.length || 0,
      );
    }

    return sum + (questions?.[type]?.length || 0);
  }, 0);

  if (inferredCount >= normalizedTypes.length) {
    return clampQuestionCount(inferredCount, normalizedTypes.length);
  }

  return clampQuestionCount(DEFAULT_QUESTION_COUNT, normalizedTypes.length);
}

export function normalizeQuestionSet({
  questions,
  keyPoints = [],
  questionCount,
  mode,
  title,
  questionTypes = [],
}) {
  if (mode !== "exam") {
    return getEmptyQuestionSet();
  }

  const fallbackTypes = inferQuestionTypesFromQuestions(questions);
  const normalizedTypes = normalizeQuestionTypes(questionTypes, fallbackTypes);

  if (!normalizedTypes.length) {
    return getEmptyQuestionSet();
  }

  const plan = getQuestionPlan(normalizedTypes, questionCount);
  const normalizedKeyPoints = Array.isArray(keyPoints)
    ? keyPoints.map((point) => punctuate(point)).filter(Boolean)
    : [];
  const longAnswerSource = questions?.longAnswer || questions?.exam;
  const mediumAnswerSource =
    questions?.mediumAnswer || questions?.shortAnswer || questions?.viva;
  const oneLinerSource = questions?.oneLiners;
  const mcqSource = questions?.mcq;

  return {
    longAnswer: normalizedTypes.includes("longAnswer")
      ? normalizeQaItems(
          longAnswerSource,
          plan.longAnswer,
          "longAnswer",
          title,
          normalizedKeyPoints,
        )
      : [],
    mediumAnswer: normalizedTypes.includes("mediumAnswer")
      ? normalizeQaItems(
          mediumAnswerSource,
          plan.mediumAnswer,
          "mediumAnswer",
          title,
          normalizedKeyPoints,
        )
      : [],
    oneLiners: normalizedTypes.includes("oneLiners")
      ? normalizeQaItems(
          oneLinerSource,
          plan.oneLiners,
          "oneLiners",
          title,
          normalizedKeyPoints,
        )
      : [],
    mcq: normalizedTypes.includes("mcq")
      ? normalizeMcqItems(mcqSource, plan.mcq, title, normalizedKeyPoints)
      : [],
  };
}
