const pool = require("../config/db");

const getBudgetByUser = async (user_id, payload) => {
  const { limit, offset } = payload;

  const values = [user_id];
  let paramIndex = 2;

  let query = `SELECT id, user_id, category_id, title, description, amount, start_date, end_date, created_at, updated_at
    FROM budgets
    WHERE user_id = $1 AND deleted_at IS NULL
    ORDER BY id ASC`;

  const countItems = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM budgets
    WHERE user_id = $1 AND deleted_at IS NULL
    `,
    [user_id],
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

const getBudgetById = async (user_id, id) => {
  const result = await pool.query(
    `
    SELECT id, user_id, category_id, title, description, amount, start_date, end_date, created_at, updated_at
    FROM budgets
    WHERE user_id = $1 AND id = $2
    `,
    [user_id, id],
  );

  return result.rows[0];
};

const createBudget = async (user_id, payload) => {
  const { id, title, description, category_id, amount, start_date, end_date } =
    payload;

  const result = await pool.query(
    `
    INSERT INTO budgets (id, user_id, title, description, category_id, amount, start_date, end_date)
    VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, user_id, category_id, title, description, amount, start_date, end_date, created_at, updated_at
    `,
    [
      id || null,
      user_id,
      title,
      description ? description.trim() : null,
      category_id,
      amount,
      start_date,
      end_date,
    ],
  );

  return result.rows[0];
};

const updateBudget = async (user_id, id, payload) => {
  const { title, description, category_id, amount, start_date, end_date } =
    payload;

  const values = [];
  const fields = [];
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

  if (amount) {
    fields.push(`amount = $${paramIndex}`);
    values.push(amount);
    paramIndex++;
  }

  if (start_date) {
    fields.push(`start_date = $${paramIndex}`);
    values.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    fields.push(`end_date = $${paramIndex}`);
    values.push(end_date);
    paramIndex++;
  }

  values.push(id);

  const result = await pool.query(
    `
    UPDATE budgets
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING id,
    user_id,
    category_id,
    title, 
    description,
    amount,
    start_date,
    end_date,
    created_at,
    updated_at
    `,
    values,
  );

  return result.rows[0];
};

const deleteBudget = async (id) => {
  const result = await pool.query(
    `
    UPDATE budgets
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id,
    user_id,
    category_id,
    title, 
    description,
    amount,
    start_date,
    end_date,
    created_at,
    updated_at,
    deleted_at
    `,
    [id],
  );

  return result.rows[0];
};

const isBudgetBelongToUser = async (user_id, budget_id) => {
  const result = await pool.query(
    `
    SELECT * FROM budgets
    WHERE user_id = $1 AND id = $2
    `,
    [user_id, budget_id],
  );

  return result.rows[0] || null;
};

const getBudgetProgress = async (user_id) => {
  const result = await pool.query(
    `
    SELECT 
    b.id, 
    b.title, 
    b.amount, 
    COALESCE(SUM(t.amount), 0) AS spent
    FROM budgets b
    LEFT JOIN transactions t ON (b.category_id IS NULL OR t.category_id = b.category_id)
              AND t.user_id = b.user_id
              AND t.type = 'EXPENSE'
              AND t.transaction_date BETWEEN b.start_date AND b.end_date
    WHERE b.user_id = $1 AND b.deleted_at IS NUll
    GROUP BY b.id, b.title, b.amount, b.start_date
    ORDER BY b.start_date DESC;
    `,
    [user_id],
  );

  return result.rows;
};

module.exports = {
  getBudgetByUser,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  isBudgetBelongToUser,
  getBudgetProgress,
};
