import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
import { ShieldCheck, Users, Award, ShoppingBag, CheckCircle2, XCircle, Clock, MessageSquare, Bot, QrCode, Send, FileText, X, AlertCircle, Lock, Upload } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [creditRequests, setCreditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");

  const [activeChatRequest, setActiveChatRequest] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [candidateInterviewsModal, setCandidateInterviewsModal] = useState(null);

  const socket = useSocket();
  const chatBottomRef = useRef(null);
  const chatMessagesContainerRef = useRef(null);
  const adminFileInputRef = useRef(null);

  useEffect(() => {
    fetchAdminData();
  }, [filterStatus]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, reqsRes] = await Promise.all([
        axios.get("http://localhost:5511/api/admin/stats"),
        axios.get(`http://localhost:5511/api/admin/credit-requests?status=${filterStatus === "all" ? "" : filterStatus}`),
      ]);
      setStats(statsRes.data.stats);
      setCreditRequests(reqsRes.data.creditRequests || []);
    } catch (err) {
      console.error("Fetch admin data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAdminChat = (reqObj) => {
    setActiveChatRequest(reqObj);
    setChatMessages(reqObj.chatMessages || []);
    if (socket) {
      socket.emit("join_room", `credit_request_${reqObj._id}`);
    }
  };

  const closeAdminChat = () => {
    if (socket && activeChatRequest) {
      socket.emit("leave_room", `credit_request_${activeChatRequest._id}`);
    }
    setActiveChatRequest(null);
    setChatMessages([]);
  };

  // Socket listener for real-time messages & status updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (activeChatRequest && data.requestId === activeChatRequest._id) {
        setChatMessages((prev) => [...prev, data.message]);
      }
    };

    const handleStatusUpdated = (data) => {
      setCreditRequests((prev) =>
        prev.map((r) =>
          r._id === data.requestId
            ? { ...r, status: data.status, isClosed: data.isClosed ?? r.isClosed }
            : r
        )
      );

      if (activeChatRequest && activeChatRequest._id === data.requestId) {
        setActiveChatRequest((prev) =>
          prev
            ? { ...prev, status: data.status, isClosed: data.isClosed ?? prev.isClosed }
            : null
        );
        if (data.message) {
          setChatMessages((prev) => [...prev, data.message]);
        }
      }

      fetchAdminData();
    };

    socket.on("new_chat_message", handleNewMessage);
    socket.on("credit_status_updated", handleStatusUpdated);

    return () => {
      socket.off("new_chat_message", handleNewMessage);
      socket.off("credit_status_updated", handleStatusUpdated);
    };
  }, [socket, activeChatRequest?._id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages, activeChatRequest]);

  const handleSendAdminMessage = async (imagePayload = null) => {
    if (!activeChatRequest || sendingMessage || activeChatRequest.isClosed) return;
    if (!imagePayload && !adminReplyText.trim()) return;

    setSendingMessage(true);
    try {
      await axios.post(
        `http://localhost:5511/api/admin/credit-requests/${activeChatRequest._id}/message`,
        {
          text: imagePayload ? "Payment QR Code uploaded by Admin. Please scan to complete payment:" : adminReplyText.trim(),
          image: imagePayload || "",
        }
      );
      if (!imagePayload) {
        setAdminReplyText("");
      }
      fetchAdminData();
    } catch (err) {
      console.error("Admin send message error:", err);
      alert("Failed to send reply");
    } finally {
      setSendingMessage(false);
    }
  };

  // Admin QR Code File Picker Upload Handler
  const handleAdminQrCodeUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload a QR code image smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleSendAdminMessage(reader.result);
      if (e.target) e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleDirectUpdateStatus = async (reqId, status) => {
    if (statusUpdating) return;
    if (!window.confirm(`Are you sure you want to set request status to ${status.toUpperCase()}?`)) return;

    setStatusUpdating(true);
    try {
      await axios.post(
        `http://localhost:5511/api/admin/credit-requests/${reqId}/status`,
        { status }
      );

      setCreditRequests((prev) =>
        prev.map((r) => (r._id === reqId ? { ...r, status, isClosed: status === "approved" ? true : r.isClosed } : r))
      );

      if (activeChatRequest && activeChatRequest._id === reqId) {
        setActiveChatRequest((prev) =>
          prev ? { ...prev, status, isClosed: status === "approved" ? true : prev.isClosed } : null
        );
      }

      fetchAdminData();
    } catch (err) {
      console.error("Direct status update error:", err);
      alert(err.response?.data?.message || "Status update failed");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeChatRequest) return;
    await handleDirectUpdateStatus(activeChatRequest._id, status);
  };

  const handleManualDisableChat = async () => {
    if (!activeChatRequest || statusUpdating) return;
    if (!window.confirm("Are you sure you want to manually disable/close this chat thread?")) return;

    setStatusUpdating(true);
    try {
      await axios.post(`http://localhost:5511/api/admin/credit-requests/${activeChatRequest._id}/close`);
      alert("Chat thread has been disabled.");
      fetchAdminData();
    } catch (err) {
      console.error("Manual disable chat error:", err);
      alert("Failed to disable chat");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleViewCandidateInterviews = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5511/api/admin/users/${userId}/interviews`);
      setCandidateInterviewsModal(res.data);
    } catch (err) {
      console.error("Fetch candidate interviews error:", err);
      alert("Failed to fetch candidate interview history");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Operations Panel
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Platform Statistics &amp; Credit Queue
          </h1>
        </div>

        <Link
          to="/admin/ai-assistant"
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-105"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Admin AI Assistant</span>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Registered Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white">{stats.totalUsers}</div>
            <div className="text-[10px] text-slate-400">
              Candidates: <strong className="text-slate-200">{stats.totalCandidates}</strong> &bull; Admins: <strong className="text-slate-200">{stats.totalAdmins}</strong>
            </div>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Interviews Conducted</span>
              <Award className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white">{stats.totalInterviews}</div>
            <div className="text-[10px] text-slate-400">
              Completed: <strong className="text-emerald-400">{stats.completedInterviews}</strong> &bull; In-Progress: <strong className="text-amber-300">{stats.inProgressInterviews}</strong>
            </div>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Credit Requests</span>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white">{stats.totalCreditRequests}</div>
            <div className="text-[10px] text-slate-400">
              Pending: <strong className="text-amber-300">{stats.pendingCreditRequests}</strong> &bull; Approved: <strong className="text-emerald-400">{stats.approvedCreditRequests}</strong>
            </div>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Credits Distributed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">{stats.totalCreditsDistributed}</div>
            <div className="text-[10px] text-slate-400">
              Approved purchases overall
            </div>
          </div>

        </div>
      )}

      {/* Credit Requests Queue Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Credit Recharge Requests Queue</h2>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === "pending"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pending ({stats?.pendingCreditRequests || 0})
            </button>
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === "all"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Requests
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Loading credit requests queue...
          </div>
        ) : creditRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No credit requests found for status "{filterStatus}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Package Requested</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {creditRequests.map((reqItem) => (
                  <tr key={reqItem._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{reqItem.user?.name}</div>
                      <div className="text-[10px] text-slate-400">{reqItem.user?.qualification}</div>
                    </td>
                    <td className="p-3 text-slate-400">
                      <div>{reqItem.user?.email}</div>
                      <div>{reqItem.user?.phone}</div>
                    </td>
                    <td className="p-3 font-bold text-amber-300">
                      {reqItem.packageSelected} ({reqItem.creditsRequested} Credits)
                    </td>
                    <td className="p-3 font-semibold">₹{reqItem.amount}</td>
                    <td className="p-3 text-slate-400">{new Date(reqItem.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
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

                    {/* Actions Column: Approve & Reject buttons ONLY when status is "pending" */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {reqItem.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleDirectUpdateStatus(reqItem._id, "approved")}
                              disabled={statusUpdating}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow inline-flex items-center gap-1 transition-all"
                              title="Approve request & add credits"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleDirectUpdateStatus(reqItem._id, "rejected")}
                              disabled={statusUpdating}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow inline-flex items-center gap-1 transition-all"
                              title="Reject request"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleViewCandidateInterviews(reqItem.user?._id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] border border-slate-700 inline-flex items-center gap-1"
                          title="View Candidate Interviews"
                        >
                          <FileText className="w-3 h-3" />
                          History
                        </button>
                        <button
                          onClick={() => openAdminChat(reqItem)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Live Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Interactive Chat & Approval Modal */}
      {activeChatRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] h-[700px] overflow-hidden">
            
            {/* Header (Fixed) */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Candidate: {activeChatRequest.user?.name}</span>
                  <span className="text-indigo-400">({activeChatRequest.packageSelected} - ₹{activeChatRequest.amount})</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Phone: {activeChatRequest.user?.phone} &bull; Email: {activeChatRequest.user?.email} &bull; Status: <strong className="capitalize text-amber-300">{activeChatRequest.status}</strong>
                  {activeChatRequest.isClosed && <span className="ml-2 text-rose-400 font-semibold">(Chat Closed)</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!activeChatRequest.isClosed && (
                  <button
                    onClick={handleManualDisableChat}
                    disabled={statusUpdating}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Manually close this chat thread"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Disable Chat</span>
                  </button>
                )}

                <button
                  onClick={closeAdminChat}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div
              ref={chatMessagesContainerRef}
              className="flex-1 max-h-[420px] overflow-y-auto p-4 space-y-4 bg-slate-950/40"
            >
              {chatMessages.map((msg, index) => {
                const isAdmin = msg.senderType === "admin";
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
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <div className="text-[10px] text-slate-500 mb-1">
                      {msg.senderName} &bull; {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-2 ${
                        isAdmin
                          ? "bg-emerald-600 text-white rounded-br-none shadow-md"
                          : "bg-indigo-600 text-white rounded-bl-none shadow-md"
                      }`}
                    >
                      {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Attachment"
                          className="rounded-xl max-h-56 w-full object-contain border border-slate-700 bg-slate-950 mt-2"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Admin Controls & Actions Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
              
              {activeChatRequest.isClosed ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 italic">
                  This chat thread is closed.
                </div>
              ) : (
                <>
                  {/* Admin File Input for QR Code Image Upload */}
                  <input
                    type="file"
                    ref={adminFileInputRef}
                    accept="image/*"
                    onChange={handleAdminQrCodeUpload}
                    className="hidden"
                  />

                  {/* Real "Upload QR Code" File Picker Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adminFileInputRef.current?.click()}
                      disabled={sendingMessage}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      <span>Upload QR Code (Image)</span>
                    </button>
                  </div>

                  {/* Reply Form */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendAdminMessage(null)}
                      placeholder="Type admin reply to candidate..."
                      className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendAdminMessage(null)}
                      disabled={sendingMessage || !adminReplyText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Approve / Reject Actions (Only visible when status is pending) */}
                  {activeChatRequest.status === "pending" && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("approved")}
                        disabled={statusUpdating}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve &amp; Add {activeChatRequest.creditsRequested} Credits</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("rejected")}
                        disabled={statusUpdating}
                        className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Credit Request</span>
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Candidate Interview History Inspector Modal */}
      {candidateInterviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Candidate Interview Records: {candidateInterviewsModal.candidate?.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Email: {candidateInterviewsModal.candidate?.email} &bull; Qualification: {candidateInterviewsModal.candidate?.qualification}
                </p>
              </div>
              <button
                onClick={() => setCandidateInterviewsModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {candidateInterviewsModal.interviews?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Candidate has not conducted any interviews yet.
              </div>
            ) : (
              <div className="space-y-4">
                {candidateInterviewsModal.interviews?.map((inv) => (
                  <div key={inv._id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{inv.jobTitle} ({inv.jobField})</span>
                      <span className="text-emerald-400">Score: {inv.overallScore}/100</span>
                    </div>
                    <div className="text-slate-400">
                      Difficulty: {inv.difficulty} &bull; Exp: {inv.experienceLevel} &bull; Date: {new Date(inv.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-slate-300 italic">
                      "{inv.overallFeedback}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
