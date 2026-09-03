import express from "express";
import {
  startInterview,
  submitAnswer,
  getInterviewHistory,
  getInterviewById,
} from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/start", protect, startInterview);
router.post("/:id/answer", protect, submitAnswer);
router.get("/history", protect, getInterviewHistory);
router.get("/:id", protect, getInterviewById);

export default router;
