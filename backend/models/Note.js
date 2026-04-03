import mongoose from "mongoose";

const noteSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    quote: {
      type: String,
      default: "",
      trim: true,
    },
    icon: {
      type: String,
      default: "description",
      trim: true,
    },
  },
  { _id: false },
);

const qaPairSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const mcqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["pdf", "youtube"],
      required: true,
    },
    sourceTitle: {
      type: String,
      required: true,
      trim: true,
    },
    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },
    sourceText: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ["summary", "detailed", "exam"],
      default: "summary",
    },
    folder: {
      type: String,
      default: "General",
      trim: true,
    },
    questionCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 25,
    },
    questionTypes: {
      type: [String],
      default: [],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    readTime: {
      type: String,
      default: "5 min read",
      trim: true,
    },
    academicLevel: {
      type: String,
      default: "Study Ready",
      trim: true,
    },
    notesSections: {
      type: [noteSectionSchema],
      default: [],
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    questions: {
      longAnswer: {
        type: [qaPairSchema],
        default: [],
      },
      mediumAnswer: {
        type: [qaPairSchema],
        default: [],
      },
      shortAnswer: {
        type: [qaPairSchema],
        default: [],
      },
      oneLiners: {
        type: [qaPairSchema],
        default: [],
      },
      mcq: {
        type: [mcqSchema],
        default: [],
      },
      viva: {
        type: [String],
        default: [],
      },
      exam: {
        type: [String],
        default: [],
      },
    },
    completed: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);
