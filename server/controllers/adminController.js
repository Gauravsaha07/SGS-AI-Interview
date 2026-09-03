import User from "../model/User.js";
import Interview from "../model/Interview.js";
import CreditRequest from "../model/CreditRequest.js";
import { askAdminAssistant } from "../utils/geminiService.js";

/**
 * @desc    Get live platform metrics for Admin Dashboard
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCandidates = await User.countDocuments({ userType: "candidate" });
    const totalAdmins = await User.countDocuments({ userType: "admin" });

    const totalInterviews = await Interview.countDocuments();
    const completedInterviews = await Interview.countDocuments({ status: "completed" });
    const inProgressInterviews = await Interview.countDocuments({ status: "in-progress" });

    const totalCreditRequests = await CreditRequest.countDocuments();
    const pendingCreditRequests = await CreditRequest.countDocuments({ status: "pending" });
    const approvedCreditRequests = await CreditRequest.countDocuments({ status: "approved" });
    const rejectedCreditRequests = await CreditRequest.countDocuments({ status: "rejected" });

    // Aggregate total credits requested in approved requests
    const approvedRequestsDocs = await CreditRequest.find({ status: "approved" });
    const totalCreditsDistributed = approvedRequestsDocs.reduce((acc, curr) => acc + (curr.creditsRequested || 0), 0);

    const stats = {
      totalUsers,
      totalCandidates,
      totalAdmins,
      totalInterviews,
      completedInterviews,
      inProgressInterviews,
      totalCreditRequests,
      pendingCreditRequests,
      approvedCreditRequests,
      rejectedCreditRequests,
      totalCreditsDistributed,
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error("Get admin stats error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Get all credit requests (filtered or pending)
 * @route   GET /api/admin/credit-requests
 * @access  Private (Admin)
 */
export const getAdminCreditRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const creditRequests = await CreditRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email phone qualification credits");

    return res.status(200).json({ creditRequests });
  } catch (error) {
    console.error("Get admin credit requests error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Approve or Reject a Credit Request
 * @route   POST /api/admin/credit-requests/:id/status
 * @access  Private (Admin)
 */
export const updateCreditRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const creditRequest = await CreditRequest.findById(id).populate("user");

    if (!creditRequest) {
      return res.status(404).json({ message: "Credit request not found" });
    }

    if (creditRequest.status !== "pending") {
      return res.status(400).json({ message: `Credit request is already ${creditRequest.status}` });
    }

    creditRequest.status = status;

    // Chat ONLY auto-closes on Approved. On Rejected, it STAYS OPEN.
    if (status === "approved") {
      creditRequest.isClosed = true;
    }

    let updatedCredits = creditRequest.user.credits;

    if (status === "approved") {
      // Add credits immediately to user model
      const candidateUser = await User.findById(creditRequest.user._id);
      candidateUser.credits += creditRequest.creditsRequested;
      await candidateUser.save();
      updatedCredits = candidateUser.credits;

      // Add approval message to chat
      creditRequest.chatMessages.push({
        sender: req.user._id,
        senderType: "admin",
        senderName: req.user.name || "Admin",
        text: adminNote || `Payment verified! ${creditRequest.creditsRequested} credits have been added to your account. Chat is now closed.`,
        messageType: "text",
        createdAt: new Date(),
      });
    } else {
      // Rejection message (chat stays open!)
      creditRequest.chatMessages.push({
        sender: req.user._id,
        senderType: "admin",
        senderName: req.user.name || "Admin",
        text: adminNote || "Your credit request has been rejected. You may upload a new payment screenshot or ask support below.",
        messageType: "text",
        createdAt: new Date(),
      });
    }

    await creditRequest.save();

    // Socket.io Real-time Push
    if (req.io) {
      req.io.to(`credit_request_${id}`).emit("credit_status_updated", {
        requestId: id,
        status,
        isClosed: creditRequest.isClosed,
        updatedCredits,
        candidateUserId: creditRequest.user._id.toString(),
        message: creditRequest.chatMessages[creditRequest.chatMessages.length - 1],
      });

      // Also emit directly to candidate's user room
      req.io.to(`user_${creditRequest.user._id}`).emit("credits_updated", {
        credits: updatedCredits,
        message: `Your credit request of ${creditRequest.creditsRequested} credits was ${status}.`,
      });
    }

    return res.status(200).json({
      message: `Credit request successfully ${status}`,
      creditRequest,
      updatedCredits,
    });
  } catch (error) {
    console.error("Update credit request status error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Admin manually closes/disables a chat thread at any time (Pending, Approved, or Rejected)
 * @route   POST /api/admin/credit-requests/:id/close
 * @access  Private (Admin)
 */
export const closeCreditRequestChat = async (req, res) => {
  try {
    const { id } = req.params;
    const creditRequest = await CreditRequest.findById(id);

    if (!creditRequest) {
      return res.status(404).json({ message: "Credit request not found" });
    }

    creditRequest.isClosed = true;

    creditRequest.chatMessages.push({
      sender: req.user._id,
      senderType: "admin",
      senderName: req.user.name || "Admin",
      text: "Admin has manually closed this chat thread.",
      messageType: "text",
      createdAt: new Date(),
    });

    await creditRequest.save();

    if (req.io) {
      req.io.to(`credit_request_${id}`).emit("credit_status_updated", {
        requestId: id,
        status: creditRequest.status,
        isClosed: true,
        candidateUserId: creditRequest.user.toString(),
        message: creditRequest.chatMessages[creditRequest.chatMessages.length - 1],
      });
    }

    return res.status(200).json({ message: "Chat thread closed by admin", creditRequest });
  } catch (error) {
    console.error("Close chat error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Admin sends text reply or custom uploaded QR code image to Credit Request Chat
 * @route   POST /api/admin/credit-requests/:id/message
 * @access  Private (Admin)
 */
export const sendAdminMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, image } = req.body;

    const creditRequest = await CreditRequest.findById(id);

    if (!creditRequest) {
      return res.status(404).json({ message: "Credit request not found" });
    }

    if (creditRequest.isClosed) {
      return res.status(400).json({ message: "This chat room is closed." });
    }

    if (!text && !image) {
      return res.status(400).json({ message: "Please provide a text message or image file." });
    }

    const messageType = image ? "qr_code" : "text";
    const messageImage = image || "";
    const messageText = text || (image ? "Payment QR Code uploaded by Admin." : "");

    const messageObj = {
      sender: req.user._id,
      senderType: "admin",
      senderName: req.user.name || "Admin",
      text: messageText,
      image: messageImage,
      messageType,
      createdAt: new Date(),
    };

    creditRequest.chatMessages.push(messageObj);
    await creditRequest.save();

    if (req.io) {
      req.io.to(`credit_request_${id}`).emit("new_chat_message", {
        requestId: id,
        message: messageObj,
      });
    }

    return res.status(200).json({ message: "Admin message sent successfully", creditRequest });
  } catch (error) {
    console.error("Admin message error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Admin AI Assistant Chat with live MongoDB context
 * @route   POST /api/admin/chat
 * @access  Private (Admin)
 */
export const adminAiChat = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Please enter a question for the AI Assistant" });
    }

    const totalUsers = await User.countDocuments();
    const totalCandidates = await User.countDocuments({ userType: "candidate" });
    const totalAdmins = await User.countDocuments({ userType: "admin" });
    const totalInterviews = await Interview.countDocuments();
    const completedInterviews = await Interview.countDocuments({ status: "completed" });
    const inProgressInterviews = await Interview.countDocuments({ status: "in-progress" });
    const totalCreditRequests = await CreditRequest.countDocuments();
    const pendingCreditRequests = await CreditRequest.countDocuments({ status: "pending" });
    const approvedCreditRequests = await CreditRequest.countDocuments({ status: "approved" });
    const rejectedCreditRequests = await CreditRequest.countDocuments({ status: "rejected" });

    const approvedRequestsDocs = await CreditRequest.find({ status: "approved" });
    const totalCreditsDistributed = approvedRequestsDocs.reduce((acc, curr) => acc + (curr.creditsRequested || 0), 0);

    const liveStats = {
      totalUsers,
      totalCandidates,
      totalAdmins,
      totalInterviews,
      completedInterviews,
      inProgressInterviews,
      totalCreditRequests,
      pendingCreditRequests,
      approvedCreditRequests,
      rejectedCreditRequests,
      totalCreditsDistributed,
    };

    const reply = await askAdminAssistant({ prompt, liveStats });

    return res.status(200).json({ reply, liveStats });
  } catch (error) {
    console.error("Admin AI chat error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Admin view any candidate's interviews
 * @route   GET /api/admin/users/:userId/interviews
 * @access  Private (Admin)
 */
export const getCandidateInterviews = async (req, res) => {
  try {
    const candidate = await User.findById(req.params.userId).select("-password");
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const interviews = await Interview.find({ user: candidate._id }).sort({ createdAt: -1 });

    return res.status(200).json({ candidate, interviews });
  } catch (error) {
    console.error("Get candidate interviews error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
