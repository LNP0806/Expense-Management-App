import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import apiClient from '../api/client';
import { getDb } from '../database/sqlite';

const LAST_SYNCED_KEY = 'lastSyncedAt';

export const getLocalLastSyncedAt = async (): Promise<string> => {
  const time = await SecureStore.getItemAsync(LAST_SYNCED_KEY);
  return time || new Date(0).toISOString();
};

export const setLocalLastSyncedAt = async (time: string): Promise<void> => {
  await SecureStore.setItemAsync(LAST_SYNCED_KEY, time);
};

export const clearLocalLastSyncedAt = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(LAST_SYNCED_KEY);
};

// 1. PUSH local changes from outbox to backend
export const pushLocalChanges = async (): Promise<void> => {
  const db = await getDb();
  
  // Fetch pending actions in order
  const pendingActions = await db.getAllAsync<any>(
    'SELECT * FROM sync_outbox ORDER BY created_at ASC'
  );

  if (pendingActions.length === 0) return;

  console.log(`Pushing ${pendingActions.length} local changes to backend...`);

  for (const action of pendingActions) {
    const payload = JSON.parse(action.payload);
    const { table_name, record_id, action: verb } = action;

    try {
      if (table_name === 'categories') {
        if (verb === 'INSERT') {
          // Categories create: POST /categories
          await apiClient.post('/categories', { id: record_id, ...payload });
        } else if (verb === 'UPDATE') {
          // Categories update: PATCH /categories/:id
          await apiClient.patch(`/categories/${record_id}`, payload);
        } else if (verb === 'DELETE') {
          // Categories delete: DELETE /categories/:id
          await apiClient.delete(`/categories/${record_id}`);
        }
      } else if (table_name === 'transactions') {
        if (verb === 'INSERT') {
          let res;
          if (payload.image_local_uri) {
            const formData = new FormData();
            formData.append('id', record_id);
            formData.append('title', payload.title);
            formData.append('amount', String(payload.amount));
            formData.append('type', payload.type);
            formData.append('transaction_date', payload.transaction_date);
            if (payload.category_id) formData.append('category_id', payload.category_id);
            if (payload.description) formData.append('description', payload.description);

            let uri = payload.image_local_uri;
            if (Platform.OS === 'ios' && !uri.startsWith('file://') && !uri.startsWith('ph://')) {
              uri = `file://${uri}`;
            }
            const filename = uri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('image', {
              uri,
              name: filename,
              type: mimeType,
            } as any);

            res = await apiClient.post('/transactions', formData, {
              headers: { 'Content-Type': undefined },
            });
          } else {
            const jsonPayload = { ...payload };
            delete jsonPayload.image_local_uri;
            res = await apiClient.post('/transactions', { id: record_id, ...jsonPayload });
          }

          const remoteTx = res.data?.data?.newTransaction || res.data?.data?.new_transaction || res.data?.data;
          if (remoteTx?.image_url) {
            await db.runAsync(
              'UPDATE local_transactions SET image_url = ? WHERE id = ?',
              [remoteTx.image_url, record_id]
            );
          }
        } else if (verb === 'UPDATE') {
          let res;
          if (payload.image_local_uri) {
            const formData = new FormData();
            if (payload.title) formData.append('title', payload.title);
            if (payload.amount) formData.append('amount', String(payload.amount));
            if (payload.type) formData.append('type', payload.type);
            if (payload.transaction_date) formData.append('transaction_date', payload.transaction_date);
            if (payload.category_id) formData.append('category_id', payload.category_id);
            if (payload.description) formData.append('description', payload.description);

            let uri = payload.image_local_uri;
            if (Platform.OS === 'ios' && !uri.startsWith('file://') && !uri.startsWith('ph://')) {
              uri = `file://${uri}`;
            }
            const filename = uri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('image', {
              uri,
              name: filename,
              type: mimeType,
            } as any);

            res = await apiClient.patch(`/transactions/${record_id}`, formData, {
              headers: { 'Content-Type': undefined },
            });
          } else {
            const jsonPayload = { ...payload };
            delete jsonPayload.image_local_uri;
            res = await apiClient.patch(`/transactions/${record_id}`, jsonPayload);
          }

          const remoteTx = res.data?.data?.updatedTransaction || res.data?.data?.updated_transaction || res.data?.data;
          if (remoteTx?.image_url) {
            await db.runAsync(
              'UPDATE local_transactions SET image_url = ? WHERE id = ?',
              [remoteTx.image_url, record_id]
            );
          }
        } else if (verb === 'DELETE') {
          await apiClient.delete(`/transactions/${record_id}`);
        }
      } else if (table_name === 'budgets') {
        if (verb === 'INSERT') {
          await apiClient.post('/budgets', { id: record_id, ...payload });
        } else if (verb === 'UPDATE') {
          await apiClient.patch(`/budgets/${record_id}`, payload);
        } else if (verb === 'DELETE') {
          await apiClient.delete(`/budgets/${record_id}`);
        }
      }

      // If API succeeded, update local sync_status and remove from outbox
      if (verb !== 'DELETE') {
        const localTable = `local_${table_name}`;
        await db.runAsync(
          `UPDATE ${localTable} SET _sync_status = 'synced', _last_synced_at = ? WHERE id = ?`,
          [new Date().toISOString(), record_id]
        );
      } else {
        // For local deleted items, make sure we clean them from SQLite completely
        const localTable = `local_${table_name}`;
        await db.runAsync(`DELETE FROM ${localTable} WHERE id = ?`, [record_id]);
      }

      // Remove the resolved outbox item
      await db.runAsync('DELETE FROM sync_outbox WHERE id = ?', [action.id]);

    } catch (error: any) {
      console.error(`Failed to sync action ID ${action.id} for table ${table_name}:`, error.message);
      // If server returned 404/400 (bad request/invalid record), it might be unresolvable
      // We skip it to prevent locking the queue, but for network errors (502/503/timeout), we break to retry later.
      if (error.response && error.response.status >= 500) {
        break; // Retry later on network recovery
      } else if (!error.response) {
        break; // Network disconnect, retry later
      } else {
        // Skip bad payloads/already deleted records
        await db.runAsync('DELETE FROM sync_outbox WHERE id = ?', [action.id]);
      }
    }
  }
};

// 2. PULL updates from backend since lastSyncedAt
export const pullServerChanges = async (): Promise<void> => {
  const db = await getDb();
  const lastSyncedAt = await getLocalLastSyncedAt();

  console.log(`Pulling server updates since: ${lastSyncedAt}`);
  
  const res = await apiClient.get('/sync', { params: { lastSyncedAt } });
  
  if (!res.data.success) {
    throw new Error('Sync API pull returned failure');
  }

  const { categories, transactions, budgets, serverTime } = res.data.data;

  // Process categories
  for (const cat of categories) {
    if (cat.deleted_at) {
      await db.runAsync('DELETE FROM local_categories WHERE id = ?', [cat.id]);
    } else {
      const existing = await db.getFirstAsync<any>(
        'SELECT * FROM local_categories WHERE id = ?',
        [cat.id]
      );
      if (!existing) {
        await db.runAsync(
          'INSERT OR REPLACE INTO local_categories (id, name, description, user_id, created_at, updated_at, _sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cat.id, cat.name, cat.description || null, cat.user_id || null, cat.created_at, cat.updated_at, 'synced']
        );
      } else {
        if (new Date(cat.updated_at) > new Date(existing.updated_at)) {
          await db.runAsync(
            'UPDATE local_categories SET name = ?, description = ?, user_id = ?, updated_at = ?, _sync_status = ? WHERE id = ?',
            [cat.name, cat.description || null, cat.user_id || null, cat.updated_at, 'synced', cat.id]
          );
        } else if (existing._sync_status !== 'synced') {
          await db.runAsync(
            'UPDATE local_categories SET user_id = ?, _sync_status = ? WHERE id = ?',
            [cat.user_id || null, 'synced', cat.id]
          );
        }
      }
    }
  }

  // Process transactions
  for (const tx of transactions) {
    if (tx.deleted_at) {
      await db.runAsync('DELETE FROM local_transactions WHERE id = ?', [tx.id]);
    } else {
      const existing = await db.getFirstAsync<any>(
        'SELECT * FROM local_transactions WHERE id = ?',
        [tx.id]
      );
      if (!existing) {
        await db.runAsync(
          'INSERT OR REPLACE INTO local_transactions (id, category_id, title, amount, type, image_url, transaction_date, description, created_at, updated_at, _sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [tx.id, tx.category_id || null, tx.title, Number(tx.amount), tx.type, tx.image_url || null, tx.transaction_date, tx.description || null, tx.created_at, tx.updated_at, 'synced']
        );
      } else {
        if (new Date(tx.updated_at) > new Date(existing.updated_at)) {
          await db.runAsync(
            'UPDATE local_transactions SET category_id = ?, title = ?, amount = ?, type = ?, image_url = ?, transaction_date = ?, description = ?, updated_at = ?, _sync_status = ? WHERE id = ?',
            [tx.category_id || null, tx.title, Number(tx.amount), tx.type, tx.image_url || null, tx.transaction_date, tx.description || null, tx.updated_at, 'synced', tx.id]
          );
        } else if (existing._sync_status !== 'synced') {
          await db.runAsync(
            'UPDATE local_transactions SET _sync_status = ? WHERE id = ?',
            ['synced', tx.id]
          );
        }
      }
    }
  }

  // Process budgets
  for (const b of budgets) {
    if (b.deleted_at) {
      await db.runAsync('DELETE FROM local_budgets WHERE id = ?', [b.id]);
    } else {
      const existing = await db.getFirstAsync<any>(
        'SELECT * FROM local_budgets WHERE id = ?',
        [b.id]
      );
      if (!existing) {
        await db.runAsync(
          'INSERT OR REPLACE INTO local_budgets (id, category_id, title, amount, start_date, end_date, description, created_at, updated_at, _sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [b.id, b.category_id || null, b.title, Number(b.amount), b.start_date, b.end_date, b.description || null, b.created_at, b.updated_at, 'synced']
        );
      } else {
        if (new Date(b.updated_at) > new Date(existing.updated_at)) {
          await db.runAsync(
            'UPDATE local_budgets SET category_id = ?, title = ?, amount = ?, start_date = ?, end_date = ?, description = ?, updated_at = ?, _sync_status = ? WHERE id = ?',
            [b.category_id || null, b.title, Number(b.amount), b.start_date, b.end_date, b.description || null, b.updated_at, 'synced', b.id]
          );
        } else if (existing._sync_status !== 'synced') {
          await db.runAsync(
            'UPDATE local_budgets SET _sync_status = ? WHERE id = ?',
            ['synced', b.id]
          );
        }
      }
    }
  }

  // Set the new synced timestamp
  await setLocalLastSyncedAt(serverTime);
  console.log(`Sync Pull complete. Local state updated to: ${serverTime}`);
};

let isSyncing = false;

// 3. Coordinate PUSH & PULL inside single Sync Cycle
export const syncAll = async (): Promise<boolean> => {
  if (isSyncing) {
    console.log('Sync already in progress, skipping concurrent call...');
    return false;
  }
  isSyncing = true;

  try {
    const netState = await NetInfo.fetch();
    
    if (!netState.isConnected) {
      console.log('Sync cancelled: Device is offline');
      isSyncing = false;
      return false;
    }

    // A. Push local offline edits
    await pushLocalChanges();
    // B. Pull remote server edits
    await pullServerChanges();
    
    isSyncing = false;

    try {
      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('sync-completed', { success: true });
    } catch (e) {
      console.warn('Failed to emit sync-completed event:', e);
    }

    return true;
  } catch (error: any) {
    console.error('Offline Sync Cycle failed:', error.message);
    isSyncing = false;
    return false;
  }
};
