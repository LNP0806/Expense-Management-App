import { getDb } from '../database/sqlite';
import { syncAll } from '../services/syncService';

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const categoriesApi: any = {
  getAll: async (params: any = {}) => {
    const db = await getDb();
    let query = "SELECT * FROM local_categories WHERE deleted_at IS NULL AND (user_id IS NOT NULL OR _sync_status = 'created')";
    const queryParams: any[] = [];

    if (params.keyword) {
      query += ' AND name LIKE ?';
      queryParams.push(`%${params.keyword}%`);
    }

    query += ' ORDER BY name ASC';

    const rows = await db.getAllAsync<any>(query, queryParams);

    return {
      data: {
        success: true,
        data: rows,
      },
    };
  },

  create: async (data: any) => {
    const db = await getDb();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO local_categories (
        id, name, description, user_id, created_at, updated_at, _sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.description || null, null, now, now, 'created']
    );

    const payload = {
      name: data.name,
      description: data.description || null,
    };

    await db.runAsync(
      'INSERT INTO sync_outbox (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
      ['categories', id, 'INSERT', JSON.stringify(payload)]
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

  update: async (id: string, data: any) => {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM local_categories WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error('Category to update not found');
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [];

    const keys = ['name', 'description'];
    keys.forEach((key) => {
      if (data.hasOwnProperty(key)) {
        updateFields.push(`${key} = ?`);
        updateParams.push(data[key]);
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
      `UPDATE local_categories SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    const payload: any = {};
    keys.forEach((key) => {
      if (data.hasOwnProperty(key)) {
        payload[key] = data[key];
      }
    });

    if (existing._sync_status === 'created') {
      const insertAction = await db.getFirstAsync<any>(
        "SELECT * FROM sync_outbox WHERE table_name = 'categories' AND record_id = ? AND action = 'INSERT'",
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
        ['categories', id, 'UPDATE', JSON.stringify(payload)]
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

  delete: async (id: string) => {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM local_categories WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error('Category to delete not found');
    }

    if (existing._sync_status === 'created') {
      await db.runAsync('DELETE FROM local_categories WHERE id = ?', [id]);
      await db.runAsync(
        "DELETE FROM sync_outbox WHERE table_name = 'categories' AND record_id = ?",
        [id]
      );
    } else {
      await db.runAsync(
        `UPDATE local_categories SET deleted_at = ?, _sync_status = 'deleted', updated_at = ? WHERE id = ?`,
        [now, now, id]
      );
      await db.runAsync(
        'INSERT INTO sync_outbox (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
        ['categories', id, 'DELETE', '{}']
      );
    }

    syncAll();

    return {
      data: {
        success: true,
      },
    };
  },
};
