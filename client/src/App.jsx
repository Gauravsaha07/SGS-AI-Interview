import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import CandidateDashboard from "./pages/CandidateDashboard";
import InterviewSetupPage from "./pages/InterviewSetupPage";
import InterviewSessionPage from "./pages/InterviewSessionPage";
import InterviewHistoryPage from "./pages/InterviewHistoryPage";
import BuyCreditsPage from "./pages/BuyCreditsPage";
import CreditHistoryPage from "./pages/CreditHistoryPage";

import AdminDashboard from "./pages/AdminDashboard";
import AdminAiChatPage from "./pages/AdminAiChatPage";

const CandidateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType === "admin") return <Navigate to="/admin/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-xs font-semibold text-slate-400">Loading SGS Platform...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <CandidateRoute>
                <CandidateDashboard />
              </CandidateRoute>
            }
          />
          <Route
            path="/interview/setup"
            element={
              <CandidateRoute>
                <InterviewSetupPage />
              </CandidateRoute>
            }
          />
          <Route
            path="/interview/session/:id"
            element={
              <CandidateRoute>
                <InterviewSessionPage />
              </CandidateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <CandidateRoute>
                <InterviewHistoryPage />
              </CandidateRoute>
            }
          />
          <Route
            path="/buy-credits"
            element={
              <CandidateRoute>
                <BuyCreditsPage />
              </CandidateRoute>
            }
          />
          <Route
            path="/credit-history"
            element={
              <CandidateRoute>
                <CreditHistoryPage />
              </CandidateRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/ai-assistant"
            element={
              <AdminRoute>
                <AdminAiChatPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
