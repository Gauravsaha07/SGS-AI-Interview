import CreditRequest from "../model/CreditRequest.js";
import User from "../model/User.js";

export const CREDIT_PACKAGES = [
  { id: "pkg_1", packageSelected: "1 Credit", creditsRequested: 1, amount: 99 },
  { id: "pkg_3", packageSelected: "3 Credits", creditsRequested: 3, amount: 249 },
  { id: "pkg_5", packageSelected: "5 Credits", creditsRequested: 5, amount: 399 },
  { id: "pkg_10", packageSelected: "10 Credits", creditsRequested: 10, amount: 849 },
];

/**
 * @desc    Get available credit packages
 * @route   GET /api/credits/packages
 * @access  Public / Private
 */
export const getCreditPackages = (req, res) => {
  return res.status(200).json({ packages: CREDIT_PACKAGES });
};

/**
 * @desc    Generate a new credit request
 * @route   POST /api/credits/request
 * @access  Private (Candidate)
 */
export const createCreditRequest = async (req, res) => {
  try {
    const { packageId } = req.body;

    const selectedPkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!selectedPkg) {
      return res.status(400).json({ message: "Invalid credit package selected" });
    }

    const initialSystemMessage = {
      sender: req.user._id,
      senderType: "system",
      senderName: "SGS System",
      text: `Credit request created for ${selectedPkg.packageSelected} (₹${selectedPkg.amount}). Scan the QR code provided by admin or upload your payment screenshot.`,
      messageType: "text",
      createdAt: new Date(),
    };

    const creditRequest = await CreditRequest.create({
      user: req.user._id,
      packageSelected: selectedPkg.packageSelected,
      creditsRequested: selectedPkg.creditsRequested,
      amount: selectedPkg.amount,
      status: "pending",
      chatMessages: [initialSystemMessage],
      isClosed: false,
    });

    return res.status(201).json({
      message: "Credit request generated",
      creditRequest,
    });
  } catch (error) {
    console.error("Create credit request error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Get credit history for candidate (strictly scoped to req.user._id)
 * @route   GET /api/credits/history
 * @access  Private (Candidate)
 */
export const getCreditHistory = async (req, res) => {
  try {
    const requests = await CreditRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("user", "name email phone");

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Get credit history error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Get single credit request details and chat history
 * @route   GET /api/credits/request/:id
 * @access  Private
 */
export const getCreditRequestById = async (req, res) => {
  try {
    const creditRequest = await CreditRequest.findById(req.params.id)
      .populate("user", "name email phone credits")
      .populate("chatMessages.sender", "name userType");

    if (!creditRequest) {
      return res.status(404).json({ message: "Credit request not found" });
    }

    if (
      req.user.userType !== "admin" &&
      creditRequest.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this request" });
    }

    return res.status(200).json({ creditRequest });
  } catch (error) {
    console.error("Get credit request error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Candidate sends chat message (free-text or image) with turn-lock enforcement
 * @route   POST /api/credits/request/:id/message
 * @access  Private (Candidate)
 */
export const sendCandidateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, image } = req.body;

    const creditRequest = await CreditRequest.findById(id);

    if (!creditRequest) {
      return res.status(404).json({ message: "Credit request not found" });
    }

    if (creditRequest.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (creditRequest.isClosed) {
      return res.status(400).json({ message: "This chat room is closed." });
    }

    const lastMsg = creditRequest.chatMessages
      .slice()
      .reverse()
      .find((m) => m.senderType === "candidate" || m.senderType === "admin");

    if (lastMsg && lastMsg.senderType === "candidate") {
      return res.status(400).json({ message: "Waiting for admin's reply before sending another message." });
    }

    if (!text && !image) {
      return res.status(400).json({ message: "Please enter a message or select an image file." });
    }

    const messageObj = {
      sender: req.user._id,
      senderType: "candidate",
      senderName: req.user.name,
      text: text ? text.trim() : (image ? "Uploaded payment screenshot." : ""),
      image: image || "",
      messageType: image ? "screenshot" : "text",
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

    return res.status(200).json({ message: "Message sent successfully", creditRequest });
  } catch (error) {
    console.error("Candidate message error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
