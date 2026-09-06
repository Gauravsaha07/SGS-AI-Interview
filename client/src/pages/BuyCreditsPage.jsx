import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";
import { Coins, Check, Sparkles, ShoppingBag, ArrowRight, ShieldCheck, Zap } from "lucide-react";

const BuyCreditsPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingPkgId, setSubmittingPkgId] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get(`${API_URL}/credits/packages`);
        setPackages(res.data.packages || []);
      } catch (err) {
        console.error("Fetch credit packages error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleBuy = async (pkgId) => {
    setSubmittingPkgId(pkgId);
    try {
      const res = await axios.post(`${API_URL}/credits/request`, {
        packageId: pkgId,
      });

      const { creditRequest } = res.data;
      setSuccessModal(creditRequest);
    } catch (err) {
      console.error("Buy credit error:", err);
      alert(err.response?.data?.message || "Failed to generate credit request");
    } finally {
      setSubmittingPkgId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Coins className="w-4 h-4 text-amber-400" />
          SGS Instant Credit Recharge
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Choose Your Practice Package
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Each credit unlocks 1 full AI interview practice session (minimum 8 tailored questions with per-answer evaluations).
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
          Loading credit package offers...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-2xl group hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    Package
                  </span>
                  {pkg.creditsRequested >= 5 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/30">
                      Popular
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">
                    {pkg.packageSelected}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-amber-300">
                      ₹{pkg.amount}
                    </span>
                    <span className="text-xs text-slate-400">total</span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{pkg.creditsRequested} Interview Practice Session(s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tailored Gemini AI Questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant Real-Time Support Chat</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={submittingPkgId === pkg.id}
                className="mt-6 w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {submittingPkgId === pkg.id ? (
                  <span>Generating Request...</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buy {pkg.packageSelected}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Credit Request Generated</h3>
              <p className="text-xs text-slate-400">
                Your request for <strong className="text-amber-300">{successModal.packageSelected}</strong> (₹{successModal.amount}) has been created.
              </p>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 text-left">
              💬 <strong>Live Admin Support Chat Opened:</strong> You can now send a payment screenshot or ask support questions directly to the admin in your credit history panel.
            </p>

            <button
              onClick={() => {
                setSuccessModal(null);
                navigate(`/credit-history?requestId=${successModal._id}`);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>Open Support Chat &amp; Payment Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BuyCreditsPage;
