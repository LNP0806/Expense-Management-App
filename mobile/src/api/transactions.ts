import { getDb } from '../database/sqlite';
import { syncAll } from '../services/syncService';

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getFormDataFields = (formData: any): any => {
  const fields: any = {};
  if (formData && formData._parts) {
    for (const [key, value] of formData._parts) {
      if (key === 'image') {
        fields.imageFile = value;
      } else {
        fields[key] = value;
      }
    }
  }
  return fields;
};

export const transactionsApi: any = {
  // 1. GET ALL: Read directly from local SQLite database
  getAll: async (params: any = {}) => {
    const db = await getDb();
    
    let query = 'SELECT * FROM local_transactions WHERE deleted_at IS NULL';
    const queryParams: any[] = [];

    if (params.type && params.type !== 'ALL') {
      query += ' AND type = ?';
      queryParams.push(params.type);
    }

    query += ' ORDER BY transaction_date DESC, created_at DESC';

    const rows = await db.getAllAsync<any>(query, queryParams);

    // Map rows to correct types matching backend structure
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

  // 2. GET BY ID: Read directly from SQLite
  getById: async (id: string) => {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM local_transactions WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!row) {
      throw new Error('Transaction not found');
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
  create: async (formData: any) => {
    const db = await getDb();
    const fields = getFormDataFields(formData);
    const id = generateUUID();
    const now = new Date().toISOString();

    const localImagePath = fields.imageFile ? fields.imageFile.uri : null;

    // A. Save to local SQLite
    await db.runAsync(
      `INSERT INTO local_transactions (
        id, category_id, title, amount, type, image_url, transaction_date, description, created_at, updated_at, _sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        fields.category_id || null,
        fields.title,
        Number(fields.amount),
        fields.type,
        localImagePath, // Save local image path so UI can render it immediately
        fields.transaction_date,
        fields.description || null,
        now,
        now,
        'created',
      ]
    );

    // B. Push mutation details to outbox
    const payload = {
      title: fields.title,
      amount: Number(fields.amount),
      type: fields.type,
      transaction_date: fields.transaction_date,
      description: fields.description || null,
      category_id: fields.category_id || null,
      image_local_uri: localImagePath, // Send local path for sync engine to upload when online
    };

    await db.runAsync(
      'INSERT INTO sync_outbox (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
      ['transactions', id, 'INSERT', JSON.stringify(payload)]
    );

    // C. Trigger background sync
    syncAll();

    return {
      data: {
        success: true,
        data: {
          id,
          ...payload,
          image_url: localImagePath,
          created_at: now,
          updated_at: now,
        },
      },
    };
  },

  // 4. UPDATE: Save to local SQLite, enqueue to outbox, trigger sync ngầm
  update: async (id: string, data: any) => {
    const db = await getDb();
    const fields = data instanceof FormData ? getFormDataFields(data) : data;
    const now = new Date().toISOString();

    // Fetch existing row to check current sync status
    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM local_transactions WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error('Transaction to update not found');
    }

    const localImagePath = fields.imageFile ? fields.imageFile.uri : (fields.hasOwnProperty('image_url') ? fields.image_url : existing.image_url);

    // A. Update local SQLite
    const updateFields: string[] = [];
    const updateParams: any[] = [];

    const keys = ['title', 'amount', 'type', 'category_id', 'transaction_date', 'description'];
    keys.forEach((key) => {
      if (fields.hasOwnProperty(key)) {
        updateFields.push(`${key} = ?`);
        updateParams.push(key === 'amount' ? Number(fields[key]) : fields[key]);
      }
    });

    // Update image_url
    if (fields.imageFile || fields.hasOwnProperty('image_url')) {
      updateFields.push('image_url = ?');
      updateParams.push(localImagePath);
    }

    updateFields.push('updated_at = ?');
    updateParams.push(now);

    // If it was already synced, mark status as 'updated'
    if (existing._sync_status === 'synced') {
      updateFields.push('_sync_status = ?');
      updateParams.push('updated');
    }

    updateParams.push(id);

    await db.runAsync(
      `UPDATE local_transactions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    // B. Push to outbox
    const payload: any = {};
    keys.forEach((key) => {
      if (fields.hasOwnProperty(key)) {
        payload[key] = key === 'amount' ? Number(fields[key]) : fields[key];
      }
    });
    if (fields.imageFile) {
      payload.image_local_uri = localImagePath;
    } else if (fields.hasOwnProperty('image_url')) {
      payload.image_url = fields.image_url;
    }

    if (existing._sync_status === 'created') {
      // If it was created offline and not synced, update the INSERT payload in outbox
      const insertAction = await db.getFirstAsync<any>(
        "SELECT * FROM sync_outbox WHERE table_name = 'transactions' AND record_id = ? AND action = 'INSERT'",
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
      // If already synced, queue UPDATE action
      await db.runAsync(
        'INSERT INTO sync_outbox (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
        ['transactions', id, 'UPDATE', JSON.stringify(payload)]
      );
    }

    // C. Trigger background sync
    syncAll();

    return {
      data: {
        success: true,
        data: {
          id,
          ...existing,
          ...payload,
          image_url: localImagePath,
          updated_at: now,
        },
      },
    };
  },

  // 5. DELETE: Mark as deleted in SQLite, enqueue delete action
  delete: async (id: string) => {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM local_transactions WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error('Transaction to delete not found');
    }

    if (existing._sync_status === 'created') {
      // If it was created offline and never synced, we can wipe it completely!
      await db.runAsync('DELETE FROM local_transactions WHERE id = ?', [id]);
      await db.runAsync(
        "DELETE FROM sync_outbox WHERE table_name = 'transactions' AND record_id = ?",
        [id]
      );
    } else {
      // Soft delete locally and add DELETE action
      await db.runAsync(
        `UPDATE local_transactions SET deleted_at = ?, _sync_status = 'deleted', updated_at = ? WHERE id = ?`,
        [now, now, id]
      );
      await db.runAsync(
        'INSERT INTO sync_outbox (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
        ['transactions', id, 'DELETE', '{}']
      );
    }

    // Trigger background sync
    syncAll();

    return {
      data: {
        success: true,
      },
    };
  },
};
