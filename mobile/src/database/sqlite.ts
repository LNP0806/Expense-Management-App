import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('smartspend.db');
  }
  return dbInstance;
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDb();

  // Create tables DDL
  const ddl = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS local_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      _sync_status TEXT DEFAULT 'synced',
      _last_synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS local_transactions (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
      transaction_date TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      _sync_status TEXT DEFAULT 'synced',
      _last_synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS local_budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      _sync_status TEXT DEFAULT 'synced',
      _last_synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
      payload TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await db.execAsync(ddl);
  console.log('SQLite Local Database initialized successfully');
};

// Helper: Clear all tables (used on user logout)
export const clearDatabase = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS local_transactions;
    DROP TABLE IF EXISTS local_budgets;
    DROP TABLE IF EXISTS local_categories;
    DROP TABLE IF EXISTS sync_outbox;
  `);
  await initDatabase();
  console.log('SQLite Local Database dropped and reinitialized successfully');
};
