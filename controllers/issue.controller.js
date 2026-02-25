import {
    createIssue,
    getIssuesByCitizen,
    getIssueById,
    updateIssueStatus
} from "../models/issue.model.js";

export const reportIssue = async (req, res) => {
    try {
        const {
            title,
            description,
            department_id,
            latitude,
            longitude,
            address,
        } = req.body;

        // Basic validation
        if (!title || !description || !department_id) {
            return res.status(400).json({
                message: "Title, description and department_id are required",
            });
        }

        const newIssue = await createIssue(
            title,
            description,
            req.user.id,       // citizen_id from JWT
            department_id,
            latitude,
            longitude,
            address
        );

        return res.status(201).json({
            message: "Issue reported successfully",
            issue: newIssue,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getMyIssues = async (req, res) => {
    try {
        const citizenId = req.user.id;

        const issues = await getIssuesByCitizen(citizenId);

        return res.status(200).json({
            count: issues.length,
            issues,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getIssueDetails = async (req, res) => {
    try {
        const issueId = req.params.id;

        const issue = await getIssueById(issueId);

        if (!issue) {
            return res.status(404).json({
                message: "Issue not found",
            });
        }

        // If citizen, ensure ownership
        if (req.user.role === 1 && issue.citizen_id !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden - Not your issue",
            });
        }

        return res.status(200).json(issue);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const changeIssueStatus = async (req, res) => {
    try {
        const issueId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
            });
        }

        // Only admin allowed (role_id = 2)
        if (req.user.role !== 2) {
            return res.status(403).json({
                message: "Forbidden - Only admin can update status",
            });
        }

        const existingIssue = await getIssueById(issueId);

        if (!existingIssue) {
            return res.status(404).json({
                message: "Issue not found",
            });
        }

        const updatedIssue = await updateIssueStatus(issueId, status);

        return res.status(200).json({
            message: "Issue status updated",
            issue: updatedIssue,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};