import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Bot, ShieldCheck, Zap, Award, CheckCircle2, ArrowRight, Mic } from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-bounce">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI-Powered Real-Time Interview Simulation &amp; Instant Feedback</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Master Every Job Interview with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              SGS AI Practice Platform
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-400 mb-10 leading-relaxed">
            Tailor-made technical, behavioral, and domain interviews tailored to your exact target role, experience level, and educational background. Get instant per-question AI evaluations and speech recognition dictation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to={user.userType === "admin" ? "/admin/dashboard" : "/dashboard"}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105"
                >
                  Get 5 Free Credits &amp; Start Practice
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-800 flex items-center justify-center gap-2 transition-all"
                >
                  Existing User Sign In
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Adaptive Gemini AI</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generates a minimum of 8 questions custom-tailored to Tech, Medical, SSB, Finance, or Management roles considering your degree &amp; experience.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Speech Voice Input</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dictate your answers hands-free using browser Web Speech recognition for natural vocal interview practice.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Detailed Answer Reviews</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Get immediate feedback on what you did well, missing technical concepts, and an optimized sample response after each question.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default LandingPage;
