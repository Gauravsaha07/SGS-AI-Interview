import express from "express";
import {
  getCreditPackages,
  createCreditRequest,
  getCreditHistory,
  getCreditRequestById,
  sendCandidateMessage,
} from "../controllers/creditController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/packages", getCreditPackages);
router.post("/request", protect, createCreditRequest);
router.get("/history", protect, getCreditHistory);
router.get("/request/:id", protect, getCreditRequestById);
router.post("/request/:id/message", protect, sendCandidateMessage);

export default router;
