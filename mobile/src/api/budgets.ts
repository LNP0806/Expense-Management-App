import { getDb } from '../database/sqlite';
import { syncAll } from '../services/syncService';

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const budgetsApi: any = {
  // 1. GET ALL: Read from SQLite
  getAll: async (params: any = {}) => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM local_budgets WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );

    const mapped = rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));

    return {
      data: {
        success: true,
        data: mapped,
      },
    };
  },

  // 2. GET BY ID: Read from SQLite
  getById: async (id: string) => {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM local_budgets WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!row) {
      throw new Error('Budget not found');
    }

    return {
      data: {
        success: true,
        data: {
          ...row,
          amount: Number(row.amount),
        },
      },
    };
  },

  // 3. CREATE: Save to local SQLite, enqueue to outbox, trigger sync ngầm
  create: async (data: any) => {
    const db = await getDb();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO local_budgets (
        id, category_id, title, amount, start_date, end_date, description, created_at, updated_at, _sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.category_id || null,
        data.title,
        Number(data.amount),
        data.start_date,
        data.end_date,
        data.description || null,
        now,
        now,
        'created',
      ]
    );

    const payload = {
      title: data.title,
      amount: Number(data.amount),
      start_date: data.start_date,
      end_date: data.end_date,
      description: data.description || null,
      category_id: data.category_id || null,
    };

    await db.runAsync(
      'INSERT INTO sync_outbox (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
      ['budgets', id, 'INSERT', JSON.stringify(payload)]
    );

    syncAll();

    return {
      data: {
        success: true,
        data: {
          id,
          ...payload,
          created_at: now,
          updated_at: now,
        },
      },
    };
  },

  // 4. UPDATE: Save to SQLite, enqueue to outbox, trigger sync
  update: async (id: string, data: any) => {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM local_budgets WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error('Budget to update not found');
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [];

    const keys = ['title', 'amount', 'start_date', 'end_date', 'description', 'category_id'];
    keys.forEach((key) => {
      if (data.hasOwnProperty(key)) {
        updateFields.push(`${key} = ?`);
        updateParams.push(key === 'amount' ? Number(data[key]) : data[key]);
      }
    });

    updateFields.push('updated_at = ?');
    updateParams.push(now);

    if (existing._sync_status === 'synced') {
      updateFields.push('_sync_status = ?');
      updateParams.push('updated');
    }

    updateParams.push(id);

    await db.runAsync(
      `UPDATE local_budgets SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    const payload: any = {};
    keys.forEach((key) => {
      if (data.hasOwnProperty(key)) {
        payload[key] = key === 'amount' ? Number(data[key]) : data[key];
      }
    });

    if (existing._sync_status === 'created') {
      const insertAction = await db.getFirstAsync<any>(
        "SELECT * FROM sync_outbox WHERE table_name = 'budgets' AND record_id = ? AND action = 'INSERT'",
        [id]
      );
      if (insertAction) {
        const oldPayload = JSON.parse(insertAction.payload);
        const mergedPayload = { ...oldPayload, ...payload };
        await db.runAsync(
          'UPDATE sync_outbox SET payload = ? WHERE id = ?',
          [JSON.stringify(mergedPayload), insertAction.id]
        );
      }
    } else {
      await db.runAsync(
        'INSERT INTO sync_outbox (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
        ['budgets', id, 'UPDATE', JSON.stringify(payload)]
      );
    }

    syncAll();

    return {
      data: {
        success: true,
        data: {
          id,
          ...existing,
          ...payload,
          updated_at: now,
        },
      },
    };
  },

  // 5. DELETE: Save to SQLite, enqueue to outbox, trigger sync
  delete: async (id: string) => {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM local_budgets WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error('Budget to delete not found');
    }

    if (existing._sync_status === 'created') {
      await db.runAsync('DELETE FROM local_budgets WHERE id = ?', [id]);
      await db.runAsync(
        "DELETE FROM sync_outbox WHERE table_name = 'budgets' AND record_id = ?",
        [id]
      );
    } else {
      await db.runAsync(
        `UPDATE local_budgets SET deleted_at = ?, _sync_status = 'deleted', updated_at = ? WHERE id = ?`,
        [now, now, id]
      );
      await db.runAsync(
        'INSERT INTO sync_outbox (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
        ['budgets', id, 'DELETE', '{}']
      );
    }

    syncAll();

    return {
      data: {
        success: true,
      },
    };
  },

  // 6. GET SPENT: Calculate total expenses matching category and date range offline using SQLite!
  getSpent: async () => {
    const db = await getDb();
    
    // SQLite SQL query to sum expense transactions within budget category & date bounds
    const query = `
      SELECT 
        b.id as budget_id,
        COALESCE(SUM(t.amount), 0) as spent
      FROM local_budgets b
      LEFT JOIN local_transactions t ON 
        (b.category_id IS NULL OR t.category_id = b.category_id)
        AND t.transaction_date >= b.start_date
        AND t.transaction_date <= b.end_date
        AND t.type = 'EXPENSE'
        AND t.deleted_at IS NULL
      WHERE b.deleted_at IS NULL
      GROUP BY b.id
    `;

    const rows = await db.getAllAsync<any>(query);

    // Backend format expected: array of { budget_id: string, spent: number }
    const mapped = rows.map((r) => ({
      budget_id: r.budget_id,
      spent: Number(r.spent),
    }));

    return {
      data: {
        success: true,
        data: mapped,
      },
    };
  },
};
