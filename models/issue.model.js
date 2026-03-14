import pool from "../config/db.js";

export const createIssue = async (
  title,
  description,
  citizenId,
  departmentId,
  latitude,
  longitude,
  address,
  aiData = null
) => {
  const query = `
    INSERT INTO issues 
    (title, description, citizen_id, department_id, latitude, longitude, address,
     priority, ai_priority, ai_department_id, ai_confidence, ai_reasoning)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
    aiData?.suggested_priority || 'medium',
    aiData?.suggested_priority || null,
    aiData?.suggested_department_id || null,
    aiData?.confidence || null,
    aiData?.reasoning || null,
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

export const getIssueAttachments = async (issueId) => {
  const query = `
    SELECT id, file_url, file_type
    FROM attachments
    WHERE issue_id = $1
  `;

  const result = await pool.query(query, [issueId]);

  return result.rows;
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
  let baseCondition = `WHERE i.department_id = $1`;
  const values = [departmentId];
  let paramIndex = 2;

  if (status) {
    baseCondition += ` AND i.status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  // 1️⃣ Total count query
  const countQuery = `
    SELECT COUNT(*) 
    FROM issues i
    ${baseCondition}
  `;

  const countResult = await pool.query(countQuery, values);
  const totalRecords = Number(countResult.rows[0].count);

  // 2️⃣ Data query with department name
  const dataQuery = `
    SELECT i.*, d.name AS department_name
    FROM issues i
    JOIN departments d ON d.id = i.department_id
    ${baseCondition}
    ORDER BY i.created_at DESC
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
    SELECT ud.department_id AS id, d.name
    FROM user_departments ud
    JOIN departments d ON d.id = ud.department_id
    WHERE ud.user_id = $1
    ORDER BY d.name ASC
  `;

  const result = await pool.query(query, [userId]);

  return result.rows;
};

// Returns just IDs for authorization checks
export const getUserDepartmentIds = async (userId) => {
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
      d.id AS department_id,
      d.name AS department_name,

      COUNT(i.id) AS total_issues,

      COUNT(i.id) FILTER (WHERE i.status = 'resolved') AS resolved_issues,

      COUNT(i.id) FILTER (WHERE i.status != 'resolved') AS pending_issues,

      AVG(
        EXTRACT(EPOCH FROM (i.resolved_at - i.created_at)) / 3600
      ) FILTER (WHERE i.status = 'resolved') 
      AS avg_resolution_hours

    FROM departments d
    LEFT JOIN issues i ON i.department_id = d.id
    WHERE d.id = $1
    GROUP BY d.id, d.name
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
      i.id,
      i.title,
      i.priority,
      i.status,
      i.department_id,
      d.name AS department_name,
      i.created_at,

      EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600 
        AS hours_since_created,

      CASE
        WHEN i.priority = 'critical' THEN 12
        WHEN i.priority = 'high' THEN 24
        WHEN i.priority = 'medium' THEN 72
        WHEN i.priority = 'low' THEN 120
      END AS sla_hours,

      (EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600) -
      CASE
        WHEN i.priority = 'critical' THEN 12
        WHEN i.priority = 'high' THEN 24
        WHEN i.priority = 'medium' THEN 72
        WHEN i.priority = 'low' THEN 120
      END AS hours_overdue,

      CASE
        WHEN (
          (EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600) -
          CASE
            WHEN i.priority = 'critical' THEN 12
            WHEN i.priority = 'high' THEN 24
            WHEN i.priority = 'medium' THEN 72
            WHEN i.priority = 'low' THEN 120
          END
        ) > 48 THEN 'critical'

        WHEN (
          (EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600) -
          CASE
            WHEN i.priority = 'critical' THEN 12
            WHEN i.priority = 'high' THEN 24
            WHEN i.priority = 'medium' THEN 72
            WHEN i.priority = 'low' THEN 120
          END
        ) > 12 THEN 'moderate'

        ELSE 'minor'
      END AS severity

    FROM issues i
    JOIN departments d ON d.id = i.department_id

    WHERE i.status != 'resolved'
    AND (
      (i.priority = 'critical' AND NOW() > i.created_at + INTERVAL '12 hours')
      OR
      (i.priority = 'high' AND NOW() > i.created_at + INTERVAL '24 hours')
      OR
      (i.priority = 'medium' AND NOW() > i.created_at + INTERVAL '72 hours')
      OR
      (i.priority = 'low' AND NOW() > i.created_at + INTERVAL '120 hours')
    )

    ORDER BY hours_overdue DESC
  `;

  const result = await pool.query(query);

  return result.rows;
};

export const getPublicIssues = async (limit, offset, status) => {
  let baseCondition = `WHERE i.visibility = true`;
  const values = [];
  let paramIndex = 1;

  if (status) {
    baseCondition += ` AND i.status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  const countQuery = `
    SELECT COUNT(*)
    FROM issues i
    ${baseCondition}
  `;

  const countResult = await pool.query(countQuery, values);
  const totalRecords = Number(countResult.rows[0].count);

  const dataQuery = `
    SELECT i.id, i.title, i.description, i.status, i.priority,
           i.department_id, d.name AS department_name,
           i.created_at, i.resolved_at
    FROM issues i
    JOIN departments d ON d.id = i.department_id
    ${baseCondition}
    ORDER BY i.created_at DESC
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
      i.id,
      i.title,
      i.priority,
      i.department_id,
      d.name AS department_name,
      i.created_at,

      EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600 
        AS hours_since_created,

      CASE
        WHEN i.priority = 'critical' THEN 12
        WHEN i.priority = 'high' THEN 24
        WHEN i.priority = 'medium' THEN 72
        WHEN i.priority = 'low' THEN 120
      END AS sla_hours,

      (EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600) -
      CASE
        WHEN i.priority = 'critical' THEN 12
        WHEN i.priority = 'high' THEN 24
        WHEN i.priority = 'medium' THEN 72
        WHEN i.priority = 'low' THEN 120
      END AS hours_overdue,

      CASE
        WHEN (
          (EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600) -
          CASE
            WHEN i.priority = 'critical' THEN 12
            WHEN i.priority = 'high' THEN 24
            WHEN i.priority = 'medium' THEN 72
            WHEN i.priority = 'low' THEN 120
          END
        ) > 48 THEN 'critical'
        WHEN (
          (EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600) -
          CASE
            WHEN i.priority = 'critical' THEN 12
            WHEN i.priority = 'high' THEN 24
            WHEN i.priority = 'medium' THEN 72
            WHEN i.priority = 'low' THEN 120
          END
        ) > 12 THEN 'moderate'
        ELSE 'minor'
      END AS severity

    FROM issues i
    JOIN departments d ON d.id = i.department_id

    WHERE i.visibility = true
    AND i.status != 'resolved'
    AND (
      (i.priority = 'critical' AND NOW() > i.created_at + INTERVAL '12 hours')
      OR
      (i.priority = 'high' AND NOW() > i.created_at + INTERVAL '24 hours')
      OR
      (i.priority = 'medium' AND NOW() > i.created_at + INTERVAL '72 hours')
      OR
      (i.priority = 'low' AND NOW() > i.created_at + INTERVAL '120 hours')
    )

    ORDER BY hours_overdue DESC
  `;

  const result = await pool.query(query);

  return result.rows;
};

export const getHeatmapData = async (precision = 2, dateRange = null, departmentId = null) => {
  let whereClauses = [
    'visibility = true',
    'latitude IS NOT NULL',
    'longitude IS NOT NULL'
  ];
  const values = [precision];
  let paramIdx = 2;

  if (dateRange) {
    if (dateRange === 'today') {
      whereClauses.push(`created_at >= CURRENT_DATE`);
    } else if (dateRange === 'week') {
      whereClauses.push(`created_at >= CURRENT_DATE - INTERVAL '7 days'`);
    } else if (dateRange === 'month') {
      whereClauses.push(`created_at >= CURRENT_DATE - INTERVAL '1 month'`);
    }
  }
  if (departmentId) {
    whereClauses.push(`department_id = $${paramIdx}`);
    values.push(departmentId);
    paramIdx++;
  }

  const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  const query = `
    SELECT
      ROUND(latitude::numeric, $1) AS lat_bucket,
      ROUND(longitude::numeric, $1) AS lng_bucket,
      COUNT(*) AS issue_count
    FROM issues
    ${where}
    GROUP BY lat_bucket, lng_bucket
    ORDER BY issue_count DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getAllDepartments = async () => {
  const query = `
    SELECT id, name
    FROM departments
    ORDER BY name ASC
  `;

  const result = await pool.query(query);

  return result.rows;
};