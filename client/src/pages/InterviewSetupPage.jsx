import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_URL } from "../config/api";
import { Sparkles, Play, AlertTriangle, Layers, Briefcase, Award, Gauge, Building2, Coins } from "lucide-react";

const JOB_FIELDS = [
  "Tech & Software Development",
  "Medical & Healthcare",
  "SSB / Defence Services",
  "Management & Business",
  "Design & UI/UX",
  "Marketing & Sales",
  "Finance & Banking",
  "Education & Teaching",
];

const EXPERIENCE_LEVELS = [
  "Fresher",
  "1 year",
  "2 years",
  "3 years",
  "4 years",
  "5+ years",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const INTERVIEW_TYPES = [
  "Top Tech Giant / MNC",
  "Fast-Growing Startup",
  "Government / Public Sector",
  "Hospital / Clinical",
  "School / University",
  "Armed Forces Board",
];

const InterviewSetupPage = () => {
  const { user, credits, updateCredits } = useAuth();
  const navigate = useNavigate();

  const [jobField, setJobField] = useState(JOB_FIELDS[0]);
  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVELS[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [interviewType, setInterviewType] = useState(INTERVIEW_TYPES[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (credits < 1) {
      setError("Insufficient credits — please buy more");
      return;
    }

    if (!jobTitle.trim()) {
      setError("Please enter a target Job Title / Role");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/interviews/start`, {
        jobField,
        jobTitle: jobTitle.trim(),
        experienceLevel,
        difficulty,
        interviewType,
      });

      if (typeof res.data.creditsRemaining === "number") {
        updateCredits(res.data.creditsRemaining);
      }

      // Navigate to interview session
      navigate(`/interview/session/${res.data.interviewId}`);
    } catch (err) {
      console.error("Start interview setup error:", err);
      setError(err.response?.data?.message || "Failed to initialize interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl space-y-8">
        
        {/* Header */}
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Interview Configuration
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Configure Your AI Interview Session
          </h1>
          <p className="text-xs text-slate-400">
            Gemini AI will analyze your qualification (<strong className="text-slate-200">{user?.qualification}</strong>) and generate a minimum of 8 custom questions.
          </p>
        </div>

        {/* Insufficient credits warning banner */}
        {credits < 1 ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Insufficient credits — please buy more to start an interview.</span>
            </div>
            <Link
              to="/buy-credits"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow"
            >
              Buy Credits (1 Credit = ₹99)
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
            <span className="text-slate-300">
              1 Credit will be deducted upon starting this session.
            </span>
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              {credits} Credits Available
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Job Field */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              1. Job Field / Sector
            </label>
            <select
              value={jobField}
              onChange={(e) => setJobField(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            >
              {JOB_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Job Title / Role */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              2. Job Title / Specific Role
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Full Stack Developer, AI/ML Engineer, Air Force Pilot, Staff Nurse"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* 3. Experience level */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              3. Experience Level
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {EXPERIENCE_LEVELS.map((exp) => (
                <button
                  type="button"
                  key={exp}
                  onClick={() => setExperienceLevel(exp)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    experienceLevel === exp
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Difficulty */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              4. Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border text-center transition-all ${
                    difficulty === diff
                      ? diff === "Hard"
                        ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/30"
                        : diff === "Medium"
                        ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30"
                        : "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Interview Type */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              5. Interview Setting / Environment Type
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            >
              {INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || credits < 1}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <span>Generating AI Questions with Gemini...</span>
            ) : credits < 1 ? (
              <span>Insufficient Credits — Please Buy More</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Practice Session (-1 Credit)</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};

export default InterviewSetupPage;
