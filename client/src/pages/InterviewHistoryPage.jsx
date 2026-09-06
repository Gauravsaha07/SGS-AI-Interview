import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import { History, ChevronDown, ChevronUp, Trophy, Calendar, Briefcase, Award, Sparkles, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

const InterviewHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/interviews/history`);
      setHistory(res.data.history || []);
    } catch (err) {
      console.error("Fetch history error:", err);
      setError("Failed to fetch interview history");
    } finally {
      setLoading(false);
    }
  };

  const loadTranscript = async (id) => {
    if (selectedInterview?._id === id) {
      setSelectedInterview(null);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/interviews/${id}`);
      setSelectedInterview(res.data.interview);
    } catch (err) {
      console.error("Load transcript error:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            Interview Transcripts &amp; Archives
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Interview History
          </h1>
        </div>

        <div className="text-xs font-semibold text-slate-400 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          Total Recorded Sessions: <span className="text-indigo-400 font-bold">{history.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
          Loading past interview sessions...
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
          <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No interview records found</h3>
          <p className="text-xs">Start a practice session from your candidate dashboard to build your transcript history.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const isExpanded = selectedInterview?._id === item._id;
            const isCompleted = item.status === "completed";

            return (
              <div
                key={item._id}
                className="bg-slate-900/80 rounded-3xl border border-slate-800/80 overflow-hidden transition-all shadow-xl"
              >
                
                {/* Header Row */}
                <button
                  onClick={() => loadTranscript(item._id)}
                  className="w-full p-6 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-indigo-400 uppercase tracking-wider">{item.jobField}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-slate-400">{item.interviewType}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                      <span>{item.jobTitle}</span>
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 text-[10px] inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Incomplete
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Exp: {item.experienceLevel}</span>
                      <span>&bull;</span>
                      <span>Difficulty: {item.difficulty}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Overall Score</div>
                      <div className={`text-xl font-extrabold ${isCompleted ? "text-emerald-400" : "text-amber-400"}`}>
                        {isCompleted ? item.overallScore : 0} / 100
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Full Word-for-Word Transcript */}
                {isExpanded && selectedInterview && (
                  <div className="p-6 border-t border-slate-800 bg-slate-950/60 space-y-6">
                    
                    {/* Top Overall Score Banner */}
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                          <span>Interview Session Transcript</span>
                          {!isCompleted && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
                              Session Incomplete / Abandoned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{selectedInterview.overallFeedback}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl font-black text-lg border shrink-0 ${
                        isCompleted ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}>
                        Overall Score: {isCompleted ? selectedInterview.overallScore : 0} / 100
                      </div>
                    </div>

                    {/* Word-for-Word Transcript Format (ONLY Asked & Answered Questions) */}
                    {selectedInterview.questions.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-900 rounded-2xl border border-slate-800">
                        No questions were answered during this session.
                      </div>
                    ) : (
                      <div className="space-y-8 font-mono text-xs">
                        {selectedInterview.questions.map((q, idx) => {
                          const num = String(idx + 1).padStart(2, "0");

                          return (
                            <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                              
                              {/* AI Generated Question XX */}
                              <div className="space-y-1">
                                <div className="text-indigo-400 font-bold uppercase tracking-wider">
                                  AI Generated Question {num}:
                                </div>
                                <div className="text-slate-100 text-sm font-sans font-medium pl-3 border-l-2 border-indigo-500">
                                  {q.question}
                                </div>
                              </div>

                              {/* Candidate Answer XX */}
                              <div className="space-y-1">
                                <div className="text-cyan-400 font-bold uppercase tracking-wider">
                                  Candidate Answer {num}:
                                </div>
                                <div className="text-slate-300 text-sm font-sans pl-3 border-l-2 border-cyan-500 bg-slate-950/60 p-3 rounded-r-xl">
                                  {q.candidateAnswer || "(No answer recorded)"}
                                </div>
                              </div>

                              {/* AI Review on Candidate Answer XX */}
                              <div className="space-y-2">
                                <div className="text-amber-400 font-bold uppercase tracking-wider">
                                  AI Review on Candidate Answer {num}:
                                </div>
                                <div className="space-y-2 font-sans text-xs bg-slate-950/90 p-4 rounded-xl border border-slate-800">
                                  <div className="text-emerald-400 font-semibold">
                                    <strong>Strengths:</strong> {q.aiReview?.strengths || "Good clear response."}
                                  </div>
                                  <div className="text-amber-300 font-semibold">
                                    <strong>Missing Points:</strong> {q.aiReview?.missing || "Could elaborate with deeper technical metrics."}
                                  </div>
                                  <div className="text-indigo-300 font-semibold">
                                    <strong>Better Way to Answer:</strong> {q.aiReview?.betterAnswer || "Structure response using STAR format."}
                                  </div>
                                  {q.aiReview?.score > 0 && (
                                    <div className="text-slate-400 pt-1 border-t border-slate-800 font-mono">
                                      Question Score: <strong className="text-white">{q.aiReview.score}/100</strong>
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default InterviewHistoryPage;
