import pool from "../config/db.js";

export const createIssue = async (
    title,
    description,
    citizenId,
    departmentId,
    latitude,
    longitude,
    address
) => {
    const query = `
    INSERT INTO issues 
    (title, description, citizen_id, department_id, latitude, longitude, address)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;

    const values = [
        title,
        description,
        citizenId,
        departmentId,
        latitude,
        longitude,
        address,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

export const getIssuesByCitizen = async (citizenId) => {
    const query = `
    SELECT * FROM issues
    WHERE citizen_id = $1
    ORDER BY created_at DESC
  `;

    const result = await pool.query(query, [citizenId]);

    return result.rows;
};

export const getIssueById = async (issueId) => {
    const query = `
    SELECT * FROM issues
    WHERE id = $1
  `;

    const result = await pool.query(query, [issueId]);

    return result.rows[0];
};

export const updateIssueStatus = async (issueId, newStatus) => {
    const query = `
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
  `;

    const result = await pool.query(query, [newStatus, issueId]);

    return result.rows[0];
};

export const insertIssueStatusHistory = async (
    issueId,
    oldStatus,
    newStatus,
    changedBy,
    remarks
) => {
    const query = `
    INSERT INTO issue_status_history
    (issue_id, old_status, new_status, changed_by, remarks)
    VALUES ($1, $2, $3, $4, $5)
  `;

    await pool.query(query, [
        issueId,
        oldStatus,
        newStatus,
        changedBy,
        remarks,
    ]);
};

export const getIssueHistory = async (issueId) => {
    const query = `
    SELECT 
      ish.id,
      ish.old_status,
      ish.new_status,
      ish.remarks,
      ish.changed_at,
      u.full_name AS changed_by_name
    FROM issue_status_history ish
    LEFT JOIN users u
      ON ish.changed_by = u.id
    WHERE ish.issue_id = $1
    ORDER BY ish.changed_at ASC
  `;

    const result = await pool.query(query, [issueId]);

    return result.rows;
};

export const getIssuesByDepartment = async (departmentId) => {
  const query = `
    SELECT *
    FROM issues
    WHERE department_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [departmentId]);

  return result.rows;
};

export const getUserDepartments = async (userId) => {
  const query = `
    SELECT department_id
    FROM user_departments
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);

  return result.rows.map(row => row.department_id);
};

export const getDepartmentPerformance = async (departmentId) => {
  const query = `
    SELECT
      COUNT(*) AS total_issues,

      COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_issues,

      COUNT(*) FILTER (WHERE status != 'resolved') AS pending_issues,

      AVG(
        EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
      ) FILTER (WHERE status = 'resolved') 
      AS avg_resolution_hours

    FROM issues
    WHERE department_id = $1
  `;

  const result = await pool.query(query, [departmentId]);

  return result.rows[0];
};