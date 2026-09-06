import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import { ShoppingBag, MessageSquare, Image, Send, X, Clock, CheckCircle2, XCircle, HelpCircle, ShieldCheck, Lock, Eye } from "lucide-react";

const CreditHistoryPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [candidateInputText, setCandidateInputText] = useState("");
  const [sending, setSending] = useState(false);

  const socket = useSocket();
  const { user } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatMessagesContainerRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [location.search]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/credits/history`);
      const list = res.data.requests || [];
      setRequests(list);

      const queryParams = new URLSearchParams(location.search);
      const reqId = queryParams.get("requestId");
      if (reqId) {
        const found = list.find((r) => r._id === reqId);
        if (found) {
          openChat(found);
        }
      }
    } catch (err) {
      console.error("Fetch credit history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (reqObj) => {
    setActiveRequest(reqObj);
    setChatMessages(reqObj.chatMessages || []);
    setCandidateInputText("");

    if (socket) {
      socket.emit("join_room", `credit_request_${reqObj._id}`);
    }
  };

  const closeChat = () => {
    if (socket && activeRequest) {
      socket.emit("leave_room", `credit_request_${activeRequest._id}`);
    }
    setActiveRequest(null);
    setChatMessages([]);
    setCandidateInputText("");
  };

  // Socket listeners for real-time chat & status update
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (activeRequest && data.requestId === activeRequest._id) {
        setChatMessages((prev) => [...prev, data.message]);
      }
    };

    const handleStatusUpdated = (data) => {
      setRequests((prev) =>
        prev.map((r) =>
          r._id === data.requestId
            ? { ...r, status: data.status, isClosed: data.isClosed ?? r.isClosed }
            : r
        )
      );

      if (activeRequest && activeRequest._id === data.requestId) {
        setActiveRequest((prev) =>
          prev
            ? { ...prev, status: data.status, isClosed: data.isClosed ?? prev.isClosed }
            : null
        );
        if (data.message) {
          setChatMessages((prev) => [...prev, data.message]);
        }
      }
    };

    socket.on("new_chat_message", handleNewMessage);
    socket.on("credit_status_updated", handleStatusUpdated);

    return () => {
      socket.off("new_chat_message", handleNewMessage);
      socket.off("credit_status_updated", handleStatusUpdated);
    };
  }, [socket, activeRequest?._id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages, activeRequest]);

  // Turn-based check for candidate input lock
  const lastNonSystemMessage = chatMessages
    .slice()
    .reverse()
    .find((m) => m.senderType === "candidate" || m.senderType === "admin");

  const isWaitingForAdmin = lastNonSystemMessage?.senderType === "candidate";

  // Candidate message sending (free-text or image or action button)
  const sendCandidateMessage = async ({ text, image }) => {
    if (!activeRequest || sending || isWaitingForAdmin || activeRequest.isClosed) return;

    setSending(true);
    try {
      await axios.post(
        `${API_URL}/credits/request/${activeRequest._id}/message`,
        { text, image }
      );
      setCandidateInputText("");
      fetchHistory();
    } catch (err) {
      console.error("Send message error:", err);
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendTextForm = (e) => {
    e.preventDefault();
    if (!candidateInputText.trim()) return;
    sendCandidateMessage({ text: candidateInputText.trim() });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      sendCandidateMessage({ image: reader.result });
      if (e.target) e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Credit Requests &amp; Payment Support
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Credit History &amp; Support Chat
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
          Loading credit request history...
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No credit requests found</h3>
          <p className="text-xs">Purchased credit packages and live support rooms will appear here.</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Package</th>
                  <th className="p-4">Credits</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Support Chat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((reqItem) => {
                  const isHighlighted = activeRequest?._id === reqItem._id;

                  return (
                    <tr
                      key={reqItem._id}
                      className={`transition-colors ${
                        isHighlighted ? "bg-indigo-900/30 border-l-4 border-l-indigo-500" : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="p-4 font-bold text-white">{reqItem.packageSelected}</td>
                      <td className="p-4 text-amber-300 font-semibold">{reqItem.creditsRequested} Credits</td>
                      <td className="p-4 font-semibold">₹{reqItem.amount}</td>
                      <td className="p-4 text-slate-400">{new Date(reqItem.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        {reqItem.status === "approved" && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                        {reqItem.status === "rejected" && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                        {reqItem.status === "pending" && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>

                      {/* ISSUE 2 Fix: Clickable button for both active and resolved/closed requests */}
                      <td className="p-4 text-right">
                        {reqItem.isClosed ? (
                          <button
                            onClick={() => openChat(reqItem)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 shadow transition-all inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            View Chat History
                          </button>
                        ) : (
                          <button
                            onClick={() => openChat(reqItem)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition-all inline-flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Open Support Chat
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Support Chat Modal */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] h-[680px] overflow-hidden">
            
            {/* Chat Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Support Chat - {activeRequest.packageSelected} (₹{activeRequest.amount})</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Status: <strong className="capitalize text-amber-300">{activeRequest.status}</strong>
                  {activeRequest.isClosed && <span className="ml-2 text-rose-400 font-semibold">(Chat Closed &bull; Read-Only)</span>}
                </div>
              </div>
              <button
                onClick={closeChat}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Read-Only Status Banner if Closed */}
            {activeRequest.isClosed && (
              <div className="p-3 bg-slate-950/90 border-b border-slate-800 text-center text-xs space-y-0.5 shrink-0">
                <div className="font-bold text-slate-200">
                  This request was <span className={`capitalize font-extrabold ${activeRequest.status === "approved" ? "text-emerald-400" : "text-rose-400"}`}>{activeRequest.status}</span> on {new Date(activeRequest.updatedAt || activeRequest.createdAt).toLocaleDateString()} &bull; Chat is Closed
                </div>
                <p className="text-[11px] text-slate-400">Full conversation history is preserved below in read-only mode.</p>
              </div>
            )}

            {/* Messages Container */}
            <div
              ref={chatMessagesContainerRef}
              className="flex-1 max-h-[380px] overflow-y-auto p-4 space-y-4 bg-slate-950/40"
            >
              {chatMessages.map((msg, index) => {
                const isCandidate = msg.senderType === "candidate";
                const isSystem = msg.senderType === "system";

                if (isSystem) {
                  return (
                    <div key={index} className="text-center my-2">
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] inline-block">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isCandidate ? "items-end" : "items-start"}`}
                  >
                    <div className="text-[10px] text-slate-500 mb-1">
                      {msg.senderName} &bull; {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-2 ${
                        isCandidate
                          ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20"
                          : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"
                      }`}
                    >
                      {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Attachment"
                          className="rounded-xl max-h-48 w-full object-cover border border-slate-700 mt-2"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* CANDIDATE INPUT & ACTIONS FOOTER */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
              
              {activeRequest.isClosed ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 italic">
                  This chat thread is closed. No new messages can be sent.
                </div>
              ) : isWaitingForAdmin ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-300 font-semibold animate-pulse flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Waiting for admin's reply before sending another message...</span>
                </div>
              ) : (
                <>
                  {/* ISSUE 1 Fix: Free-Form Candidate Text Input + Send Button */}
                  <form onSubmit={handleSendTextForm} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={candidateInputText}
                      onChange={(e) => setCandidateInputText(e.target.value)}
                      disabled={sending || isWaitingForAdmin || activeRequest.isClosed}
                      placeholder="Type your support message..."
                      className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={sending || isWaitingForAdmin || !candidateInputText.trim() || activeRequest.isClosed}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>

                  {/* Constrained Action Buttons & Image Upload */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || isWaitingForAdmin || activeRequest.isClosed}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Image className="w-4 h-4 text-indigo-400" />
                      <span>Upload Payment Screenshot (Image)</span>
                    </button>

                    <div className="grid grid-cols-1 gap-1.5">
                      {activeRequest.status === "pending" && (
                        <button
                          type="button"
                          disabled={sending || isWaitingForAdmin || activeRequest.isClosed}
                          onClick={() =>
                            sendCandidateMessage({ text: "Why is my credit request still pending?" })
                          }
                          className="w-full py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 text-left flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Ask: "Why is my credit request still pending?"</span>
                        </button>
                      )}

                      {activeRequest.status === "rejected" && (
                        <button
                          type="button"
                          disabled={sending || isWaitingForAdmin || activeRequest.isClosed}
                          onClick={() =>
                            sendCandidateMessage({
                              text: "Why was my credit request rejected? I had done the payment",
                            })
                          }
                          className="w-full py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 text-left flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Ask: "Why was my credit request rejected? I had done the payment"</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CreditHistoryPage;
