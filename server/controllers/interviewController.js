import Interview from "../model/Interview.js";
import User from "../model/User.js";
import {
  generateInterviewQuestions,
  reviewAnswer,
  calculateCompositeScore,
} from "../utils/geminiService.js";

/**
 * @desc    Start a new interview session (deducts 1 credit immediately)
 * @route   POST /api/interviews/start
 * @access  Private (Candidate)
 */
export const startInterview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.credits < 1) {
      return res
        .status(400)
        .json({ message: "Insufficient credits — please buy more" });
    }

    const { jobField, jobTitle, experienceLevel, difficulty, interviewType } =
      req.body;

    if (
      !jobField ||
      !jobTitle ||
      !experienceLevel ||
      !difficulty ||
      !interviewType
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required interview settings" });
    }

    // Deduct 1 credit
    user.credits -= 1;
    await user.save();

    // Call Gemini to generate a MINIMUM of 8 tailored questions
    const questionTexts = await generateInterviewQuestions({
      jobField,
      jobTitle,
      experienceLevel,
      difficulty,
      interviewType,
      qualification: user.qualification,
    });

    const formattedQuestions = questionTexts.map((qText, index) => ({
      questionNumber: index + 1,
      question: qText,
      candidateAnswer: "",
      aiReview: {
        strengths: "",
        missing: "",
        betterAnswer: "",
        rawText: "",
        score: 0,
      },
    }));

    const interview = await Interview.create({
      user: user._id,
      jobField,
      jobTitle,
      experienceLevel,
      difficulty,
      interviewType,
      candidateQualification: user.qualification,
      status: "in-progress",
      currentQuestionIndex: 0,
      questions: formattedQuestions,
    });

    return res.status(201).json({
      interviewId: interview._id,
      totalQuestions: interview.questions.length,
      currentQuestionIndex: 0,
      currentQuestion: interview.questions[0],
      creditsRemaining: user.credits,
    });
  } catch (error) {
    console.error("Start interview error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Submit answer to a question and get immediate AI review
 * @route   POST /api/interviews/:id/answer
 * @access  Private (Candidate)
 */
export const submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex, answerText } = req.body;

    const interview = await Interview.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    if (interview.status === "completed") {
      return res.status(400).json({ message: "This interview has already been completed" });
    }

    const idx = Number(questionIndex);
    if (idx < 0 || idx >= interview.questions.length) {
      return res.status(400).json({ message: "Invalid question index" });
    }

    const targetQuestion = interview.questions[idx];

    // Call Gemini to review answer
    const aiReviewResult = await reviewAnswer({
      jobField: interview.jobField,
      jobTitle: interview.jobTitle,
      question: targetQuestion.question,
      candidateAnswer: answerText,
    });

    // Save answer and review
    interview.questions[idx].candidateAnswer = answerText;
    interview.questions[idx].aiReview = aiReviewResult;
    interview.questions[idx].answeredAt = new Date();

    const isLastQuestion = idx === interview.questions.length - 1;

    if (isLastQuestion) {
      // Calculate overall score
      const { overallScore, overallFeedback } = await calculateCompositeScore(
        interview.questions
      );
      interview.status = "completed";
      interview.overallScore = overallScore;
      interview.overallFeedback = overallFeedback;
      interview.currentQuestionIndex = idx;
    } else {
      interview.currentQuestionIndex = idx + 1;
    }

    await interview.save();

    return res.status(200).json({
      questionIndex: idx,
      aiReview: aiReviewResult,
      isLastQuestion,
      nextQuestionIndex: isLastQuestion ? null : idx + 1,
      nextQuestion: isLastQuestion ? null : interview.questions[idx + 1],
      overallScore: interview.overallScore,
      overallFeedback: interview.overallFeedback,
    });
  } catch (error) {
    console.error("Submit answer error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Get candidate's interview history
 * @route   GET /api/interviews/history
 * @access  Private (Candidate)
 */
export const getInterviewHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("jobField jobTitle experienceLevel difficulty interviewType status overallScore createdAt questions");

    const historySummary = interviews.map((inv) => ({
      _id: inv._id,
      jobField: inv.jobField,
      jobTitle: inv.jobTitle,
      experienceLevel: inv.experienceLevel,
      difficulty: inv.difficulty,
      interviewType: inv.interviewType,
      status: inv.status,
      overallScore: inv.overallScore,
      totalQuestions: inv.questions.length,
      createdAt: inv.createdAt,
    }));

    return res.status(200).json({ history: historySummary, count: historySummary.length });
  } catch (error) {
    console.error("Get interview history error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Get full interview transcript by ID
 * @route   GET /api/interviews/:id
 * @access  Private (Candidate or Admin)
 */
export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).populate("user", "name email phone qualification");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Candidate can only view their own interview unless admin
    if (
      req.user.userType !== "admin" &&
      interview.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this interview transcript" });
    }

    return res.status(200).json({ interview });
  } catch (error) {
    console.error("Get interview error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
