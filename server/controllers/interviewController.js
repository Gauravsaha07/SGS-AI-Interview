import Interview from "../model/Interview.js";
import User from "../model/User.js";
import {
  generateInterviewQuestions,
  reviewAnswer,
  calculateCompositeScore,
} from "../utils/geminiService.js";

/**
 * @desc    Start a new interview session (deducts 1 credit ONLY after question generation succeeds)
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

    // Retrieve candidate's full past question history across all past interviews (completed or in-progress)
    const pastInterviews = await Interview.find({ user: user._id })
      .select("questions.question")
      .lean();

    const previousQuestionsHistory = [];
    if (pastInterviews && pastInterviews.length > 0) {
      for (const inv of pastInterviews) {
        if (inv.questions && Array.isArray(inv.questions)) {
          for (const qObj of inv.questions) {
            if (qObj && qObj.question && typeof qObj.question === "string" && qObj.question.trim()) {
              previousQuestionsHistory.push(qObj.question.trim());
            }
          }
        }
      }
    }

    const uniquePreviousQuestions = Array.from(new Set(previousQuestionsHistory));

    // Call Gemini to generate dynamic, role-specific questions BEFORE deducting credit
    let questionTexts = [];
    try {
      questionTexts = await generateInterviewQuestions({
        jobField,
        jobTitle,
        experienceLevel,
        difficulty,
        interviewType,
        qualification: user.qualification,
        previousQuestionsHistory: uniquePreviousQuestions,
      });
    } catch (genErr) {
      console.error("[Gemini Question Generation Failure]:", genErr);
      return res.status(500).json({
        message: "Failed to generate interview questions. Your credit was not deducted. Please try again.",
        creditsRemaining: user.credits,
      });
    }

    if (!questionTexts || !Array.isArray(questionTexts) || questionTexts.length === 0) {
      return res.status(500).json({
        message: "Failed to generate interview questions. Your credit was not deducted. Please try again.",
        creditsRemaining: user.credits,
      });
    }

    // Deduct 1 credit ONLY after question generation succeeds
    user.credits -= 1;
    await user.save();

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
      overallScore: 0,
      overallFeedback: "Incomplete interview session",
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
 * @desc    Submit answer to a question and get immediate AI review with adaptive follow-up
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
    const nextQuestionObj = interview.questions[idx + 1];

    // Call Gemini to review answer & adapt next question
    const aiReviewResult = await reviewAnswer({
      jobField: interview.jobField,
      jobTitle: interview.jobTitle,
      question: targetQuestion.question,
      candidateAnswer: answerText,
      nextQuestionOriginal: nextQuestionObj ? nextQuestionObj.question : "",
    });

    // Save answer and review
    interview.questions[idx].candidateAnswer = answerText;
    interview.questions[idx].aiReview = {
      strengths: aiReviewResult.strengths,
      missing: aiReviewResult.missing,
      betterAnswer: aiReviewResult.betterAnswer,
      rawText: aiReviewResult.rawText || "",
      score: aiReviewResult.score || 0,
    };
    interview.questions[idx].answeredAt = new Date();

    // Adapt next question if returned by Gemini
    if (nextQuestionObj && aiReviewResult.adaptedNextQuestion) {
      interview.questions[idx + 1].question = aiReviewResult.adaptedNextQuestion;
    }

    const isLastQuestion = idx === interview.questions.length - 1;

    if (isLastQuestion) {
      const { overallScore, overallFeedback } = await calculateCompositeScore(
        interview.questions
      );
      interview.status = "completed";
      interview.overallScore = overallScore;
      interview.overallFeedback = overallFeedback;
      interview.currentQuestionIndex = idx;
    } else {
      interview.currentQuestionIndex = idx + 1;
      interview.overallScore = 0;
    }

    await interview.save();

    return res.status(200).json({
      questionIndex: idx,
      aiReview: {
        strengths: aiReviewResult.strengths,
        missing: aiReviewResult.missing,
        betterAnswer: aiReviewResult.betterAnswer,
        score: aiReviewResult.score,
      },
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

    const historySummary = interviews.map((inv) => {
      const isCompleted = inv.status === "completed";
      const askedQuestions = inv.questions.filter(
        (q) => q.candidateAnswer && q.candidateAnswer.trim() !== ""
      );

      return {
        _id: inv._id,
        jobField: inv.jobField,
        jobTitle: inv.jobTitle,
        experienceLevel: inv.experienceLevel,
        difficulty: inv.difficulty,
        interviewType: inv.interviewType,
        status: inv.status,
        overallScore: isCompleted ? inv.overallScore : 0,
        totalQuestions: isCompleted ? inv.questions.length : askedQuestions.length,
        createdAt: inv.createdAt,
      };
    });

    return res.status(200).json({ history: historySummary, count: historySummary.length });
  } catch (error) {
    console.error("Get interview history error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Get full interview session / transcript by ID
 * @route   GET /api/interviews/:id
 * @access  Private (Candidate or Admin)
 */
export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).populate("user", "name email phone qualification");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (
      req.user.userType !== "admin" &&
      interview.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this interview transcript" });
    }

    const isCompleted = interview.status === "completed";
    const resultInterview = interview.toObject();

    resultInterview.overallScore = isCompleted ? interview.overallScore : 0;
    if (!isCompleted) {
      resultInterview.overallFeedback = "Incomplete interview session (0/100). This session was abandoned or interrupted before completion.";
    }

    // Return full questions array so active interview sessions can render Question 1, 2, ..., N
    return res.status(200).json({ interview: resultInterview });
  } catch (error) {
    console.error("Get interview error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
