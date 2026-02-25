import pool from "../config/db.js";

export const createUser = async (
    fullName,
    email,
    phone,
    passwordHash,
    roleId
) => {
    const query = `
    INSERT INTO users 
    (full_name, email, phone, password_hash, role_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, full_name, email, role_id, created_at
  `;

    const values = [fullName, email, phone, passwordHash, roleId];

    const result = await pool.query(query, values);

    return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const query = `
    SELECT * FROM users WHERE email = $1
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0];
};