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