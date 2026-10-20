import express from "express";
import {
  getAdminStats,
  getAdminCreditRequests,
  updateCreditRequestStatus,
  closeCreditRequestChat,
  sendAdminMessage,
  adminAiChat,
  getCandidateInterviews,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getAdminStats);
router.get("/credit-requests", getAdminCreditRequests);
router.post("/credit-requests/:id/status", updateCreditRequestStatus);
router.post("/credit-requests/:id/close", closeCreditRequestChat);
router.post("/credit-requests/:id/message", sendAdminMessage);
router.post("/chat", adminAiChat);
router.get("/users/:userId/interviews", getCandidateInterviews);

export default router;
