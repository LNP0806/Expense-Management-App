const pool = require("../config/db");

const { withTx } = require("../utils/db-transaction");

const getAllCategories = async (user_id, payload) => {
  const { keyword, limit, offset } = payload;

  const values = [];
  values.push(user_id);

  let query = `
    SELECT id, user_id, name, description, created_at, updated_at FROM categories
    WHERE user_id = $1 AND deleted_at IS NULL
  `;

  let conditions = `user_id = $1 AND deleted_at IS NULL`;

  let paramIndex = 2;

  if (keyword) {
    query += ` AND name ILIKE $${paramIndex}`;
    conditions += ` AND name ILIKE $${paramIndex}`;
    values.push(`%${keyword}%`);
    paramIndex += 1;
  }

  query += ` ORDER BY id ASC`;

  if (limit) {
    query += ` LIMIT $${paramIndex}`;
    values.push(limit);
    paramIndex += 1;
  }

  if (offset) {
    query += ` OFFSET $${paramIndex}`;
    values.push(offset);
  }

  const result = await pool.query(query, values);

  const countValues = [user_id];
  if (keyword) {
    countValues.push(`%${keyword}%`);
  }

  const countItems = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM categories
    WHERE ${conditions}
    `,
    countValues,
  );

  return {
    data: result.rows,
    total: countItems.rows[0]?.total || 0,
  };
};

const getCategoryById = async (id) => {
  const result = await pool.query(
    `
    SELECT id, user_id, name, description, created_at, updated_at FROM categories
    WHERE id = $1
    ORDER BY id ASC
    `,
    [id],
  );

  return result.rows[0];
};

const createCategory = async (user_id, payload) => {
  const result = await pool.query(
    `
    INSERT INTO categories (user_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, name, description, created_at, updated_at
    `,
    [user_id, payload.name.trim(), payload.description.trim()],
  );

  return result.rows[0];
};

const updateCategory = async (id, payload) => {
  const { name, description } = payload;

  const values = [];
  const fields = [];

  let paramIndex = 1;

  if (name) {
    values.push(name.trim());
    fields.push(`name = $${paramIndex}`);
    paramIndex += 1;
  }

  if (description) {
    values.push(description.trim());
    fields.push(`description = $${paramIndex}`);
    paramIndex += 1;
  }

  values.push(id);

  const result = await pool.query(
    `
    UPDATE categories
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING id, user_id, name, description, created_at, updated_at
    `,
    values,
  );

  return result.rows[0];
};

const deleteCategory = async (user_id, id) => {
  return withTx(async (client) => {
    const result = await client.query(
      `
    UPDATE categories
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id,user_id, name, description, created_at, updated_at, deleted_at
    `,
      [id],
    );

    const deletedCategory = result.rows[0];

    if (!deletedCategory) {
      return null;
    }

    await client.query(
      `
      UPDATE transactions
      SET category_id = NULL
      WHERE category_id = $1 AND user_id = $2
      `,
      [id, user_id],
    );

    return deletedCategory;
  });
};

const isCategoryBelongToUser = async (user_id, id) => {
  const result = await pool.query(
    `
    SELECT * FROM categories
    WHERE user_id = $1 AND id = $2
    `,
    [user_id, id],
  );

  return result.rows[0];
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  isCategoryBelongToUser,
};
