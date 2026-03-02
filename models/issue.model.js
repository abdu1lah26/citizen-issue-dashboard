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

export const getIssuesByDepartment = async (
    departmentId,
    limit,
    offset,
    status
) => {
    let baseCondition = `WHERE department_id = $1`;
    const values = [departmentId];
    let paramIndex = 2;

    if (status) {
        baseCondition += ` AND status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
    }

    // 1️⃣ Total count query
    const countQuery = `
    SELECT COUNT(*) 
    FROM issues
    ${baseCondition}
  `;

    const countResult = await pool.query(countQuery, values);
    const totalRecords = Number(countResult.rows[0].count);

    // 2️⃣ Data query
    const dataQuery = `
    SELECT *
    FROM issues
    ${baseCondition}
    ORDER BY created_at DESC
    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
  `;

    const dataValues = [...values, limit, offset];

    const dataResult = await pool.query(dataQuery, dataValues);

    return {
        totalRecords,
        issues: dataResult.rows,
    };
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

export const getGlobalDashboardStats = async () => {
    const query = `
    SELECT
      COUNT(*) AS total_issues,

      COUNT(*) FILTER (WHERE status = 'resolved') AS total_resolved,

      COUNT(*) FILTER (WHERE status != 'resolved') AS total_pending,

      AVG(
        EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
      ) FILTER (WHERE status = 'resolved') 
      AS avg_resolution_hours

    FROM issues
  `;

    const result = await pool.query(query);

    return result.rows[0];
};

export const getDepartmentRanking = async () => {
    const query = `
    SELECT
      d.id,
      d.name,

      COUNT(i.id) AS total_issues,

      COUNT(i.id) FILTER (WHERE i.status = 'resolved') AS resolved_issues,

      AVG(
        EXTRACT(EPOCH FROM (i.resolved_at - i.created_at)) / 3600
      ) FILTER (WHERE i.status = 'resolved')
      AS avg_resolution_hours

    FROM departments d
    LEFT JOIN issues i
      ON d.id = i.department_id

    GROUP BY d.id, d.name

    ORDER BY resolved_issues DESC NULLS LAST
  `;

    const result = await pool.query(query);

    return result.rows;
};

export const getOverdueIssues = async () => {
    const query = `
    SELECT
      id,
      title,
      priority,
      status,
      created_at,

      EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 
        AS hours_since_created,

      CASE
        WHEN priority = 'high' THEN 24
        WHEN priority = 'medium' THEN 72
        WHEN priority = 'low' THEN 120
      END AS sla_hours,

      (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) -
      CASE
        WHEN priority = 'high' THEN 24
        WHEN priority = 'medium' THEN 72
        WHEN priority = 'low' THEN 120
      END AS hours_overdue,

      CASE
        WHEN (
          (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) -
          CASE
            WHEN priority = 'high' THEN 24
            WHEN priority = 'medium' THEN 72
            WHEN priority = 'low' THEN 120
          END
        ) > 48 THEN 'critical'

        WHEN (
          (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) -
          CASE
            WHEN priority = 'high' THEN 24
            WHEN priority = 'medium' THEN 72
            WHEN priority = 'low' THEN 120
          END
        ) > 12 THEN 'moderate'

        ELSE 'minor'
      END AS severity

    FROM issues

    WHERE status != 'resolved'
    AND (
      (priority = 'high' AND NOW() > created_at + INTERVAL '24 hours')
      OR
      (priority = 'medium' AND NOW() > created_at + INTERVAL '72 hours')
      OR
      (priority = 'low' AND NOW() > created_at + INTERVAL '120 hours')
    )

    ORDER BY hours_overdue DESC
  `;

    const result = await pool.query(query);

    return result.rows;
};

export const getPublicIssues = async (limit, offset, status) => {
  let baseCondition = `WHERE visibility = true`;
  const values = [];
  let paramIndex = 1;

  if (status) {
    baseCondition += ` AND status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  const countQuery = `
    SELECT COUNT(*)
    FROM issues
    ${baseCondition}
  `;

  const countResult = await pool.query(countQuery, values);
  const totalRecords = Number(countResult.rows[0].count);

  const dataQuery = `
    SELECT id, title, description, status, priority,
           department_id, created_at, resolved_at
    FROM issues
    ${baseCondition}
    ORDER BY created_at DESC
    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
  `;

  const dataValues = [...values, limit, offset];

  const dataResult = await pool.query(dataQuery, dataValues);

  return {
    totalRecords,
    issues: dataResult.rows
  };
};

export const getPublicOverdueIssues = async () => {
  const query = `
    SELECT
      id,
      title,
      priority,
      department_id,
      created_at,

      EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 
        AS hours_since_created,

      CASE
        WHEN priority = 'high' THEN 24
        WHEN priority = 'medium' THEN 72
        WHEN priority = 'low' THEN 120
      END AS sla_hours,

      (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) -
      CASE
        WHEN priority = 'high' THEN 24
        WHEN priority = 'medium' THEN 72
        WHEN priority = 'low' THEN 120
      END AS hours_overdue,

      CASE
        WHEN (
          (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) -
          CASE
            WHEN priority = 'high' THEN 24
            WHEN priority = 'medium' THEN 72
            WHEN priority = 'low' THEN 120
          END
        ) > 48 THEN 'critical'
        WHEN (
          (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) -
          CASE
            WHEN priority = 'high' THEN 24
            WHEN priority = 'medium' THEN 72
            WHEN priority = 'low' THEN 120
          END
        ) > 12 THEN 'moderate'
        ELSE 'minor'
      END AS severity

    FROM issues

    WHERE visibility = true
    AND status != 'resolved'
    AND (
      (priority = 'high' AND NOW() > created_at + INTERVAL '24 hours')
      OR
      (priority = 'medium' AND NOW() > created_at + INTERVAL '72 hours')
      OR
      (priority = 'low' AND NOW() > created_at + INTERVAL '120 hours')
    )

    ORDER BY hours_overdue DESC
  `;

  const result = await pool.query(query);

  return result.rows;
};

export const getHeatmapData = async () => {
  const query = `
    SELECT
      ROUND(latitude::numeric, 2) AS lat_bucket,
      ROUND(longitude::numeric, 2) AS lng_bucket,
      COUNT(*) AS issue_count
    FROM issues
    WHERE visibility = true
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    GROUP BY lat_bucket, lng_bucket
    ORDER BY issue_count DESC
  `;

  const result = await pool.query(query);

  return result.rows;
};