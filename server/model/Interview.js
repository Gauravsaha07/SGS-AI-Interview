import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionNumber: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    candidateAnswer: {
      type: String,
      default: "",
    },
    aiReview: {
      strengths: { type: String, default: "" },
      missing: { type: String, default: "" },
      betterAnswer: { type: String, default: "" },
      rawText: { type: String, default: "" },
      score: { type: Number, default: 0 },
    },
    answeredAt: {
      type: Date,
    },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobField: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
    },
    interviewType: {
      type: String,
      required: true,
    },
    candidateQualification: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    questions: [questionSchema],
    overallScore: {
      type: Number,
      default: 0,
    },
    overallFeedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;
