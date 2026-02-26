import express from "express";
import { 
   getPublicIssuesList,
  getPublicDashboardOverview,
  getPublicOverdueIssuesList
} from "../controllers/issue.controller.js";
const router = express.Router();

// No authentication middleware
router.get("/issues", getPublicIssuesList);
router.get("/dashboard", getPublicDashboardOverview);
router.get("/overdue", getPublicOverdueIssuesList);

export default router;