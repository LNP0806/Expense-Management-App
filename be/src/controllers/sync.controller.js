const pool = require("../config/db");
const { successResponse } = require("../utils/api-response");

const syncData = async (req, res, next) => {
  const userId = req.user.id;
  
  // Default to epoch time if lastSyncedAt is not provided or invalid
  let lastSyncedAt = new Date(0).toISOString();
  if (req.query.lastSyncedAt) {
    const parsedDate = new Date(req.query.lastSyncedAt);
    if (!isNaN(parsedDate.getTime())) {
      lastSyncedAt = parsedDate.toISOString();
    }
  }

  // 1. Fetch categories (user specific + system categories)
  const categoriesQuery = `
    SELECT id, name, description, user_id, created_at, updated_at, deleted_at
    FROM categories
    WHERE (user_id = $1 OR user_id IS NULL) AND updated_at > $2
  `;

  // 2. Fetch transactions (user specific only)
  const transactionsQuery = `
    SELECT id, category_id, title, amount, type, image_url, transaction_date, description, created_at, updated_at, deleted_at
    FROM transactions
    WHERE user_id = $1 AND updated_at > $2
  `;

  // 3. Fetch budgets (user specific only)
  const budgetsQuery = `
    SELECT id, category_id, title, amount, start_date, end_date, description, created_at, updated_at, deleted_at
    FROM budgets
    WHERE user_id = $1 AND updated_at > $2
  `;

  const [categoriesResult, transactionsResult, budgetsResult] = await Promise.all([
    pool.query(categoriesQuery, [userId, lastSyncedAt]),
    pool.query(transactionsQuery, [userId, lastSyncedAt]),
    pool.query(budgetsQuery, [userId, lastSyncedAt]),
  ]);

  return successResponse(res, "Sync data retrieved successfully", {
    categories: categoriesResult.rows,
    transactions: transactionsResult.rows,
    budgets: budgetsResult.rows,
    serverTime: new Date().toISOString() // Return server time to client to use as next lastSyncedAt
  });
};

module.exports = {
  syncData,
};
