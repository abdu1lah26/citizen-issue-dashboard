import {
    createIssue,
    getIssuesByCitizen,
    getIssueById,
    getIssueHistory,
    getIssuesByDepartment,
    getUserDepartments,
    getDepartmentPerformance,
    getGlobalDashboardStats,
    getDepartmentRanking,
    getOverdueIssues,
    getPublicIssues,
    getPublicOverdueIssues,
    getHeatmapData,
    getAllDepartments
} from "../models/issue.model.js";
import { analyzeIssue } from "../services/ai.service.js";
import cloudinary from "../config/cloudinary.js";
import pool from "../config/db.js";

export const uploadAttachment = async (req, res) => {
    try {
        const issueId = Number(req.params.id);

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded",
            });
        }

        // 🔒 Check issue exists
        const issueCheck = await pool.query(
            "SELECT id, citizen_id FROM issues WHERE id = $1",
            [issueId]
        );

        if (issueCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Issue not found",
            });
        }

        const issue = issueCheck.rows[0];

        // 🔐 Permission:
        // Citizen can upload only to their own issue
        if (req.user.role === 1 && issue.citizen_id !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden - Cannot upload to this issue",
            });
        }

        // 🚀 Upload to Cloudinary
        const result = await cloudinary.uploader.upload_stream(
            {
                resource_type: "auto",
                folder: "civic_issues",
            },
            async (error, cloudResult) => {
                if (error) {
                    console.error("Cloudinary Error:", error);
                    return res.status(500).json({
                        message: "Upload failed",
                    });
                }

                // 💾 Save attachment record
                const insertQuery = `
          INSERT INTO attachments (issue_id, uploaded_by, file_url, file_type)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

                const values = [
                    issueId,
                    req.user.id,
                    cloudResult.secure_url,
                    req.file.mimetype,
                ];

                const dbResult = await pool.query(insertQuery, values);

                return res.status(201).json({
                    message: "File uploaded successfully",
                    attachment: dbResult.rows[0],
                });
            }
        );

        result.end(req.file.buffer);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

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

        if (!title || !description || !department_id) {
            return res.status(400).json({
                message: "Title, description and department_id are required",
            });
        }

        let aiData = null;

        try {
            const aiPromise = analyzeIssue(title, description);

            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("AI Timeout")), 30000)
            );

            aiData = await Promise.race([aiPromise, timeout]);

            console.log("AI RESULT:", aiData);

        } catch (aiError) {
            console.error("AI integration failed:", aiError.message);

            aiData = {
                suggested_priority: "medium",
                suggested_department_id: null,
                confidence: 0,
                reasoning: "AI failed or timed out. Default applied.",
            };
        }

        const CONFIDENCE_THRESHOLD = 0.6;

        let finalPriority = "medium";

        if (
            aiData &&
            aiData.confidence >= CONFIDENCE_THRESHOLD
        ) {
            finalPriority = aiData.suggested_priority;
        }

        const finalDepartmentId = department_id;

        const newIssue = await createIssue(
            title,
            description,
            req.user.id,
            finalDepartmentId,
            latitude,
            longitude,
            address,
            {
                ...aiData,
                suggested_priority: finalPriority,
            }
        );

        return res.status(201).json({
            message: "Issue reported successfully",
            issue: newIssue,
            ai_suggestion: {
                priority: aiData?.suggested_priority,
                department: aiData?.suggested_department_id,
                confidence: aiData?.confidence,
            },
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

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status || null;

        const offset = (page - 1) * limit;

        // Citizens not allowed
        if (req.user.role === 1) {
            return res.status(403).json({
                message: "Forbidden - Citizens cannot access department issues",
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

        const result = await getIssuesByDepartment(
            departmentId,
            limit,
            offset,
            status
        );

        const totalRecords = result.totalRecords;
        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            page,
            limit,
            total_records: totalRecords,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1,
            issues: result.issues,
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

export const getDashboardOverview = async (req, res) => {
    try {
        // Block citizens
        if (req.user.role === 1) {
            return res.status(403).json({
                message: "Forbidden - Citizens cannot access dashboard overview",
            });
        }

        const globalStats = await getGlobalDashboardStats();
        const departmentRanking = await getDepartmentRanking();

        return res.status(200).json({
            global_stats: globalStats,
            department_ranking: departmentRanking
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getOverdueIssuesList = async (req, res) => {
    try {
        // Block citizens
        if (req.user.role === 1) {
            return res.status(403).json({
                message: "Forbidden - Citizens cannot access SLA data",
            });
        }

        const overdueIssues = await getOverdueIssues();

        return res.status(200).json({
            count: overdueIssues.length,
            overdue_issues: overdueIssues,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getPublicIssuesList = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status || null;

        const offset = (page - 1) * limit;

        const result = await getPublicIssues(limit, offset, status);

        const totalRecords = result.totalRecords;
        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            page,
            limit,
            total_records: totalRecords,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1,
            issues: result.issues,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getPublicDashboardOverview = async (req, res) => {
    try {
        const globalStats = await getGlobalDashboardStats();
        const departmentRanking = await getDepartmentRanking();

        return res.status(200).json({
            global_stats: globalStats,
            department_ranking: departmentRanking
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getPublicOverdueIssuesList = async (req, res) => {
    try {
        const overdueIssues = await getPublicOverdueIssues();

        return res.status(200).json({
            count: overdueIssues.length,
            overdue_issues: overdueIssues,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getPublicHeatmapData = async (req, res) => {
    try {
        const precision = req.query.precision || 2;

        const heatmapData = await getHeatmapData(precision);

        return res.status(200).json({
            precision: Number(precision),
            clusters: heatmapData
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getDepartmentsList = async (req, res) => {
    try {
        const departments = await getAllDepartments();

        return res.status(200).json({
            departments
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};