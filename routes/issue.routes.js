import express from "express";
import {
  reportIssue,
  getMyIssues,
  getIssueDetails,
  changeIssueStatus,
  getIssueTimeline,
  getDepartmentIssues,
  getDepartmentPerformanceStats,
  getDashboardOverview,
  getOverdueIssuesList,
  uploadAttachment
} from "../controllers/issue.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";


const router = express.Router();

// Citizen must be logged in
router.post("/", authenticate, reportIssue);

// Get issues reported by the logged-in citizen
router.get("/my", authenticate, getMyIssues);

// Admin can change issue status
router.patch("/:id/status", authenticate, changeIssueStatus);

// Get list of overdue issues (Admin or Department Head)
router.get("/dashboard/overdue", authenticate, getOverdueIssuesList);

// Get global dashboard stats (Admin only)
router.get("/dashboard/overview", authenticate, getDashboardOverview);

// Get performance stats for a department (Admin or Department Head)
router.get("/department/:departmentId/performance", authenticate, getDepartmentPerformanceStats);

// Get issues assigned to a department (Admin or Department Head)
router.get("/department/:departmentId", authenticate, getDepartmentIssues);

// Get issue timeline (status history)
router.get("/:id/timeline", authenticate, getIssueTimeline);

// Upload attachment for an issue
router.post("/:id/attachments", authenticate, upload.single("file"), uploadAttachment);

// Get details of a specific issue
router.get("/:id", authenticate, getIssueDetails);

export default router;