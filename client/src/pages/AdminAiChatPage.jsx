import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import { Bot, Send, Sparkles, User, Database, RefreshCw } from "lucide-react";

const AdminAiChatPage = () => {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello Admin! I am your SGS AI Assistant connected directly to your MongoDB database. Ask me any question regarding your platform's live stats, interview metrics, or user activity.",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveStats, setLiveStats] = useState(null);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendPrompt = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsg = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { sender: "admin", text: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/admin/chat`, {
        prompt: userMsg,
      });

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: res.data.reply },
      ]);
      setLiveStats(res.data.liveStats);
    } catch (err) {
      console.error("Admin AI Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Apologies, I encountered an error connecting to live metrics." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Admin AI Assistant</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20">
                Live MongoDB Integration
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Unlimited natural language queries powered by Gemini AI with live platform context
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[550px]">
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/40">
          {messages.map((msg, idx) => {
            const isAi = msg.sender === "ai";

            return (
              <div
                key={idx}
                className={`flex gap-3 ${isAi ? "items-start" : "items-end flex-row-reverse"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isAi
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    isAi
                      ? "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none shadow-md"
                      : "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <span>Querying MongoDB live context &amp; generating answer...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        <form onSubmit={handleSendPrompt} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI e.g. 'how many active users right now' or 'how many interviews total'..."
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-all"
          />

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

      </div>

    </div>
  );
};

export default AdminAiChatPage;
