import {
    createIssue,
    getIssuesByCitizen,
    getIssueById,
    getIssueHistory,
    getIssuesByDepartment,
    getUserDepartments,
    getDepartmentPerformance
} from "../models/issue.model.js";
import pool from "../config/db.js";

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
    const client = await pool.connect();

    try {
        const issueId = req.params.id;
        const { status, remarks } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
            });
        }

        // Only admin allowed
        if (req.user.role !== 2) {
            return res.status(403).json({
                message: "Forbidden - Only admin can update status",
            });
        }

        await client.query("BEGIN");

        // Get current issue
        const issueResult = await client.query(
            "SELECT * FROM issues WHERE id = $1",
            [issueId]
        );

        const issue = issueResult.rows[0];

        if (!issue) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Issue not found",
            });
        }

        const oldStatus = issue.status;

        // Update issue
        const updateResult = await client.query(
            `
      UPDATE issues
      SET status = $1::issue_status,
          updated_at = CURRENT_TIMESTAMP,
          resolved_at = 
            CASE 
              WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP
              ELSE resolved_at
            END
      WHERE id = $2
      RETURNING *
      `,
            [status, issueId]
        );

        const updatedIssue = updateResult.rows[0];

        // Insert history
        await client.query(
            `
      INSERT INTO issue_status_history
      (issue_id, old_status, new_status, changed_by, remarks)
      VALUES ($1, $2, $3, $4, $5)
      `,
            [issueId, oldStatus, status, req.user.id, remarks || null]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Issue status updated",
            issue: updatedIssue,
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    } finally {
        client.release();
    }
};

export const getIssueTimeline = async (req, res) => {
    try {
        const issueId = req.params.id;

        const issue = await getIssueById(issueId);

        if (!issue) {
            return res.status(404).json({
                message: "Issue not found",
            });
        }

        // Ownership check
        if (req.user.role === 1 && issue.citizen_id !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden - Not your issue",
            });
        }

        const history = await getIssueHistory(issueId);

        return res.status(200).json({
            issue_id: issueId,
            timeline: history,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getDepartmentIssues = async (req, res) => {
    try {
        const departmentId = Number(req.params.departmentId);

        // Citizens not allowed
        if (req.user.role === 1) {
            return res.status(403).json({
                message: "Forbidden - Citizens cannot access department issues",
            });
        }

        // If Officer (role 3), verify department assignment
        if (req.user.role === 3) {
            const userDepartments = await getUserDepartments(req.user.id);

            if (!userDepartments.includes(departmentId)) {
                return res.status(403).json({
                    message: "Forbidden - Not assigned to this department",
                });
            }
        }

        const issues = await getIssuesByDepartment(departmentId);

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

export const getDepartmentPerformanceStats = async (req, res) => {
    try {
        const departmentId = Number(req.params.departmentId);

        // Block citizens
        if (req.user.role === 1) {
            return res.status(403).json({
                message: "Forbidden - Citizens cannot access performance stats",
            });
        }

        // Officer restriction
        if (req.user.role === 3) {
            const userDepartments = await getUserDepartments(req.user.id);

            if (!userDepartments.includes(departmentId)) {
                return res.status(403).json({
                    message: "Forbidden - Not assigned to this department",
                });
            }
        }

        const stats = await getDepartmentPerformance(departmentId);

        return res.status(200).json({
            department_id: departmentId,
            stats,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};