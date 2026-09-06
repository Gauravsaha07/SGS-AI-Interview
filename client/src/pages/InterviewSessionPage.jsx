import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";
import VoiceInput from "../components/VoiceInput";
import { Sparkles, Send, CheckCircle2, ArrowRight, Trophy, AlertCircle, Award, Lightbulb, MessageSquareQuote, Check } from "lucide-react";

const InterviewSessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [reviewData, setReviewData] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [finalSummary, setFinalSummary] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await axios.get(`${API_URL}/interviews/${id}`);
        const inv = res.data.interview;
        setInterview(inv);
        setCurrentQuestionIndex(inv.currentQuestionIndex || 0);

        if (inv.status === "completed") {
          setFinalSummary({
            overallScore: inv.overallScore,
            overallFeedback: inv.overallFeedback,
          });
        }
      } catch (err) {
        console.error("Fetch interview session error:", err);
        setError("Failed to load interview session");
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  const currentQuestion = interview?.questions?.[currentQuestionIndex];
  const totalQuestions = interview?.questions?.length || 0;

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/interviews/${id}/answer`, {
        questionIndex: currentQuestionIndex,
        answerText: answerText.trim(),
      });

      const { aiReview, isLastQuestion, overallScore, overallFeedback, nextQuestionIndex } = res.data;

      setReviewData(aiReview);
      setShowReviewModal(true);

      if (isLastQuestion) {
        setFinalSummary({
          overallScore,
          overallFeedback,
        });
      }

    } catch (err) {
      console.error("Submit answer error:", err);
      setError(err.response?.data?.message || "Failed to evaluate answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestionTransition = () => {
    setShowReviewModal(false);
    setAnswerText("");
    setIsTransitioning(true);

    setTimeout(() => {
      setIsTransitioning(false);
      if (finalSummary) {
        // Interview finished
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-sm font-semibold">Loading AI Interview Session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 rounded-3xl border border-rose-500/30 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Interview Session Error</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link to="/dashboard" className="inline-block px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Finished summary view
  if (finalSummary && !showReviewModal) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-slate-900/90 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl text-center space-y-8">
          
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Interview Practice Completed!
            </h1>
            <p className="text-sm text-slate-400">
              Role: <strong className="text-slate-200">{interview.jobTitle}</strong> &bull; Sector: <strong className="text-slate-200">{interview.jobField}</strong>
            </p>
          </div>

          {/* Overall Score Badge */}
          <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 inline-block max-w-sm mx-auto w-full">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Overall Composite Score</div>
            <div className="text-5xl font-black bg-gradient-to-r from-amber-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {finalSummary.overallScore} / 100
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-left space-y-2">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Performance Feedback Summary
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {finalSummary.overallFeedback}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/history"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" />
              View Full Word-for-Word Transcript
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Session Progress Header */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            {interview.jobField} &bull; {interview.jobTitle}
          </div>
          <div className="text-xs text-slate-400">
            {interview.difficulty} difficulty &bull; {interview.interviewType}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-300">
            Question <span className="text-indigo-400 font-extrabold text-base">{currentQuestionIndex + 1}</span> of {totalQuestions}
          </div>
          <div className="w-24 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Transition Line display */}
      {isTransitioning && (
        <div className="p-6 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-center animate-pulse space-y-2">
          <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
          <p className="text-sm font-bold text-indigo-200 italic">
            "Okay, let's move to the next question..."
          </p>
        </div>
      )}

      {/* Main Question & Answer Card */}
      {!isTransitioning && currentQuestion && (
        <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Question Text */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
              <MessageSquareQuote className="w-4 h-4 text-indigo-400" />
              AI Interviewer Question #{currentQuestion.questionNumber}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Form with Text & Voice Input */}
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Your Answer
                </label>
                <VoiceInput onTranscript={setAnswerText} textValue={answerText} />
              </div>

              <textarea
                rows={5}
                required
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer here, or click 'Voice Input' above to dictate using your microphone..."
                className="w-full p-4 bg-slate-950/90 border border-slate-800 rounded-2xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || !answerText.trim()}
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105"
              >
                {submitting ? (
                  <span>Evaluating Answer with Gemini...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Per-Question AI Review Modal / Popup */}
      {showReviewModal && reviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Sparkles className="w-5 h-5" />
                AI Answer Review
              </div>
              <div className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-extrabold text-xs border border-indigo-500/30">
                Score: {reviewData.score} / 100
              </div>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Strengths */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  What Was Good (Strengths)
                </div>
                <p className="text-slate-300 leading-relaxed">{reviewData.strengths}</p>
              </div>

              {/* Missing */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  What Was Missing / Improvement Areas
                </div>
                <p className="text-slate-300 leading-relaxed">{reviewData.missing}</p>
              </div>

              {/* Better Answer */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  A Better Way to Answer
                </div>
                <p className="text-slate-300 leading-relaxed italic">{reviewData.betterAnswer}</p>
              </div>

            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleNextQuestionTransition}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <span>Okay, let's move to the next question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InterviewSessionPage;
