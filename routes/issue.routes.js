import express from "express";
import {
    reportIssue,
    getMyIssues,
    getIssueDetails,
    changeIssueStatus
} from "../controllers/issue.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Citizen must be logged in
router.post("/", authenticate, reportIssue);
// Get issues reported by the logged-in citizen
router.get("/my", authenticate, getMyIssues);
// Admin can change issue status
router.patch("/:id/status", authenticate, changeIssueStatus);
// Get details of a specific issue
router.get("/:id", authenticate, getIssueDetails);

export default router;