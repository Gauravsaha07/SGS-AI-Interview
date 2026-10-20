import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_URL } from "../config/api";
import { Play, History, Coins, Sparkles, Trophy, Award, ArrowRight, UserCheck, ShieldAlert, CreditCard } from "lucide-react";

const CandidateDashboard = () => {
  const { user, credits } = useAuth();
  const [historyCount, setHistoryCount] = useState(0);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/interviews/history`);
        setHistoryCount(res.data.count || 0);
        setRecentInterviews((res.data.history || []).slice(0, 3));
      } catch (err) {
        console.error("Fetch dashboard interview history error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Candidate Practice Center
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Qualification: <strong className="text-slate-200">{user?.qualification}</strong> &bull; Location: <strong className="text-slate-200">{user?.location}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Coins className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">Available Credits</div>
              <div className="text-2xl font-extrabold text-amber-300">{credits} Credits</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 ml-2">
              <Link
                to="/credit-history"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-slate-700 transition-all text-center"
              >
                Credit History
              </Link>
              <Link
                to="/buy-credits"
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all text-center"
              >
                Buy More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm animate-pulse">
          Loading your dashboard statistics...
        </div>
      ) : historyCount === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">You have not given any interviews yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Kickstart your career preparation! Practice custom AI interview questions tailored to your field and qualification.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4">
            <Link
              to="/interview/setup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Interview Practice
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sessions</div>
                <div className="text-3xl font-extrabold text-white">{historyCount} Session(s) Recorded</div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/history"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
                >
                  <History className="w-4 h-4" />
                  Check History
                </Link>
                <Link
                  to="/interview/setup"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start New Interview
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white mb-1">Top Up Practice Credits</h4>
                <p className="text-xs text-slate-400">1 Interview Session costs 1 Credit. Get instant packages starting at ₹99.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Link
                  to="/credit-history"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-slate-700 transition-all"
                >
                  Credit History
                </Link>
                <Link
                  to="/buy-credits"
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition-all"
                >
                  View Packages
                </Link>
              </div>
            </div>

          </div>

          {recentInterviews.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Recent Interview Practice Sessions</h3>
                <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentInterviews.map((inv) => {
                  const isCompleted = inv.status === "completed";

                  return (
                    <Link
                      key={inv._id}
                      to="/history"
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all block group"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-semibold text-indigo-400">{inv.jobField}</span>
                        <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                        {inv.jobTitle}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{inv.experienceLevel} &bull; {inv.difficulty}</span>
                        <span className={`px-2 py-0.5 rounded-lg font-extrabold border ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}>
                          {isCompleted ? `${inv.overallScore}/100` : "0/100"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CandidateDashboard;
