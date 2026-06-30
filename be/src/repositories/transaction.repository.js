const pool = require("../config/db");

const getTransactionByUser = async (user_id, payload) => {
  const { limit, offset, keyword, type } = payload;

  let query = `
    SELECT id,
    user_id,
    category_id,
    title, 
    description,
    amount,
    type,
    image_url,
    transaction_date,
    created_at,
    updated_at
    FROM transactions
    WHERE user_id = $1 AND deleted_at IS NULL
    `;

  let conditions = `user_id = $1 AND deleted_at IS NULL`;

  const values = [user_id];
  let paramIndex = 2;

  if (type) {
    query += ` AND type = $${paramIndex}`;
    conditions += ` AND type = $${paramIndex}`;
    values.push(type);
    paramIndex++;
  }

  if (keyword) {
    query += ` AND title ILIKE $${paramIndex}`;
    conditions += ` AND title ILIKE $${paramIndex}`;
    values.push(`%${keyword}%`);
    paramIndex++;
  }

  query += ` ORDER BY id ASC`;

  const countItems = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM transactions
    WHERE ${conditions}
    `,
    values,
  );

  if (limit) {
    query += ` LIMIT $${paramIndex}`;
    values.push(limit);
    paramIndex++;
  }

  if (offset) {
    query += ` OFFSET $${paramIndex}`;
    values.push(offset);
  }

  const result = await pool.query(query, values);

  return {
    data: result.rows,
    total: countItems.rows[0]?.total || 0,
  };
};

const getTransactionById = async (user_id, id) => {
  const result = await pool.query(
    `
    SELECT id,
    user_id,
    category_id,
    title, 
    description,
    amount,
    type,
    image_url,
    transaction_date,
    created_at,
    updated_at
    FROM transactions
    WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL
    `,
    [user_id, id],
  );

  return result.rows[0];
};

const createTransaction = async (user_id, payload) => {
  const { title, description, category_id, type, amount, transaction_date } =
    payload;

  const result = await pool.query(
    `
    INSERT INTO transactions (user_id, title, description, category_id, type, amount, transaction_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id,
    user_id,
    category_id,
    title, 
    description,
    amount,
    type,
    image_url,
    transaction_date,
    created_at,
    updated_at
    `,
    [
      user_id,
      title.trim(),
      description ? description.trim() : null,
      category_id,
      type,
      amount,
      transaction_date,
    ],
  );

  return result.rows[0];
};

const isTransactionBelongToUser = async (user_id, transaction_id) => {
  const result = await pool.query(
    `
    SELECT * FROM transactions
    WHERE user_id = $1 AND id = $2
    `,
    [user_id, transaction_id],
  );

  return result.rows[0];
};

const updateTransaction = async (id, payload) => {
  const { title, description, category_id, type, amount, transaction_date } =
    payload;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (title) {
    fields.push(`title = $${paramIndex}`);
    values.push(title.trim());
    paramIndex++;
  }

  if (description) {
    fields.push(`description = $${paramIndex}`);
    values.push(description.trim());
    paramIndex++;
  }

  if (category_id) {
    fields.push(`category_id = $${paramIndex}`);
    values.push(category_id);
    paramIndex++;
  }

  if (type) {
    fields.push(`type = $${paramIndex}`);
    values.push(type.trim());
    paramIndex++;
  }

  if (amount) {
    fields.push(`amount = $${paramIndex}`);
    values.push(amount);
    paramIndex++;
  }

  if (transaction_date) {
    fields.push(`transaction_date = $${paramIndex}`);
    values.push(transaction_date);
    paramIndex++;
  }

  values.push(id);

  const result = await pool.query(
    `
    UPDATE transactions
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING id,
    user_id,
    category_id,
    title, 
    description,
    amount,
    type,
    image_url,
    transaction_date,
    created_at,
    updated_at
    `,
    values,
  );

  return result.rows[0];
};

const deleteTransaction = async (id) => {
  const result = await pool.query(
    `
    UPDATE transactions
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id,
    user_id,
    category_id,
    title, 
    description,
    amount,
    type,
    image_url,
    transaction_date,
    created_at,
    updated_at,
    deleted_at
    `,
    [id],
  );

  return result.rows[0];
};

module.exports = {
  getTransactionByUser,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  isTransactionBelongToUser,
};
