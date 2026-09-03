import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Coins, LogOut, History, ShoppingBag, LayoutDashboard, Bot, ShieldCheck, CreditCard } from "lucide-react";

const Navbar = () => {
  const { user, credits, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                SGS AI
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-indigo-400 font-semibold -mt-1">
                Interview Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links & User Actions */}
          {user ? (
            <div className="flex items-center gap-4">
              
              {/* Candidate Nav Links */}
              {user.userType === "candidate" && (
                <div className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive("/dashboard")
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>

                  <Link
                    to="/history"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive("/history")
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    Interview History
                  </Link>

                  <Link
                    to="/buy-credits"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive("/buy-credits")
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Buy Credits
                  </Link>

                  <Link
                    to="/credit-history"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive("/credit-history")
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Credit History
                  </Link>
                </div>
              )}

              {/* Admin Nav Links */}
              {user.userType === "admin" && (
                <div className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive("/admin/dashboard")
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Admin Panel
                  </Link>

                  <Link
                    to="/admin/ai-assistant"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive("/admin/ai-assistant")
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    AI Assistant
                  </Link>
                </div>
              )}

              {/* Credit Balance Counter (Candidates only) */}
              {user.userType === "candidate" && (
                <Link
                  to="/buy-credits"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-xs hover:bg-amber-500/20 transition-all cursor-pointer shadow-inner"
                  title="Click to top up credits"
                >
                  <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>{credits} Credits</span>
                </Link>
              )}

              {/* User Profile Badge & Logout */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{user.userType}</div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                Register
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
