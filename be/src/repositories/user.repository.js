const pool = require("../config/db");

const getUserbyEmail = async (email) => {
  const result = await pool.query(
    `
    SELECT id, fullname, email, password, created_at, updated_at
    FROM users
    WHERE email = $1
    `,
    [email.trim().toLowerCase()],
  );

  if (!result.rows[0]) return null;

  return result.rows[0];
};

const createUser = async (payload) => {
  const result = await pool.query(
    `
    INSERT INTO users (fullname, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, fullname, email, password, created_at, updated_at
    `,
    [
      payload.fullname.trim(),
      payload.email.trim().toLowerCase(),
      payload.password,
    ],
  );

  return result.rows[0];
};

module.exports = {
  getUserbyEmail,
  createUser,
};
