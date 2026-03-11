import express from "express";
import {
    getPublicIssuesList,
    getPublicDashboardOverview,
    getPublicOverdueIssuesList,
    getPublicHeatmapData,
    getDepartmentsList
} from "../controllers/issue.controller.js";
const router = express.Router();

// No authentication middleware
router.get("/issues", getPublicIssuesList);
router.get("/dashboard", getPublicDashboardOverview);
router.get("/overdue", getPublicOverdueIssuesList);
router.get("/heatmap", getPublicHeatmapData);
router.get("/departments", getDepartmentsList);

export default router;