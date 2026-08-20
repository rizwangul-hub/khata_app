import { initDB } from '../database/db';
import { apiClient } from '../api/apiClient';
import { useAppStore } from '../state/appStore';
import { useCustomerStore } from '../state/customerStore';
import { useLedgerStore } from '../state/ledgerStore';
import { SyncQueueService } from './syncQueueService';
import { ConflictService } from './conflictService';
import { RestoreService, RestoreProgress } from './restoreService';

const safeStr = (val: any): string => (val === undefined || val === null ? '' : String(val));

export class SyncService {
  private static isSyncing = false;

  public static async hasPendingSync(): Promise<boolean> {
    const count = await SyncQueueService.getPendingCount();
    return count > 0;
  }

  public static async bootstrapNewDevice(
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<boolean> {
    return await RestoreService.bootstrapNewDevice(onProgress);
  }

  public static async pushPendingQueue(): Promise<boolean> {
    const pendingOps = await SyncQueueService.getPendingQueue(50);
    if (pendingOps.length === 0) return true;

    try {
      const response = await apiClient.post('/sync/push', {
        operations: pendingOps,
      });

      if (response.data?.success) {
        const { processedOperationIds } = response.data;
        if (Array.isArray(processedOperationIds) && processedOperationIds.length > 0) {
          await SyncQueueService.markSynced(processedOperationIds);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('[SyncService] Push paused - session unauthorized (401).');
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.warn('[SyncService] Offline mode active - push queued for when server becomes reachable.');
      } else {
        console.warn('[SyncService] Push notice:', error?.message || error);
      }
      return false;
    }
  }

  public static async pullIncrementalChanges(): Promise<boolean> {
    const db = await initDB();

    let lastSyncRow = await db.getFirstAsync<any>(
      `SELECT lastSyncAt, lastSyncCursor FROM sync_metadata LIMIT 1;`
    );
    const lastSyncAt = lastSyncRow?.lastSyncCursor || lastSyncRow?.lastSyncAt || '1970-01-01T00:00:00.000Z';

    try {
      const response = await apiClient.get(`/sync/pull?lastSyncAt=${encodeURIComponent(lastSyncAt)}`);
      if (response.data?.success) {
        const { customers, transactions, serverTime } = response.data;

        // 1. Upsert Customers with Conflict Merge
        if (Array.isArray(customers) && customers.length > 0) {
          for (const c of customers) {
            const localCust = await db.getFirstAsync<any>(
              `SELECT * FROM customers WHERE id = ? LIMIT 1;`,
              [safeStr(c._id || c.id)]
            );

            const merged = ConflictService.mergeCustomerRecord(localCust, c);

            await db.runAsync(
              `INSERT OR REPLACE INTO customers (
                id, shopId, customerCode, name, phone, address, imageLocalUri, imageRemoteUrl, balance, isArchived, createdAt, updatedAt, deletedAt, syncStatus
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced');`,
              [
                safeStr(merged.id || merged._id),
                safeStr(merged.shopId),
                safeStr(merged.customerCode || ''),
                safeStr(merged.name),
                safeStr(merged.phone || ''),
                safeStr(merged.address || ''),
                safeStr(merged.imageLocalUri || ''),
                safeStr(merged.imageRemoteUrl || merged.image || ''),
                Number(merged.balance || 0),
                merged.isArchived ? 1 : 0,
                safeStr(merged.createdAt || new Date().toISOString()),
                safeStr(merged.updatedAt || new Date().toISOString()),
                merged.deletedAt ? new Date(merged.deletedAt).toISOString() : null,
              ]
            );
          }
        }

        // 2. Upsert Ledger Transactions (Append-Only Safe)
        if (Array.isArray(transactions) && transactions.length > 0) {
          for (const tx of transactions) {
            const txDateIso = tx.transactionDate ? new Date(tx.transactionDate).toISOString() : new Date().toISOString();
            await db.runAsync(
              `INSERT OR REPLACE INTO ledger_transactions (
                id, shopId, customerId, type, itemName, amount, weight, weightUnit, notes, billRemoteUrl, date, transactionDate, createdAt, updatedAt, deletedAt, syncStatus
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced');`,
              [
                safeStr(tx._id || tx.id),
                safeStr(tx.shopId),
                safeStr(tx.customerId),
                safeStr(tx.type),
                safeStr(tx.itemName || ''),
                Number(tx.amount || 0),
                tx.weight ? Number(tx.weight) : null,
                safeStr(tx.weightUnit || ''),
                safeStr(tx.notes || ''),
                safeStr(tx.billImage || ''),
                safeStr(txDateIso),
                safeStr(txDateIso),
                safeStr(tx.createdAt || new Date().toISOString()),
                safeStr(tx.updatedAt || new Date().toISOString()),
                tx.deletedAt ? new Date(tx.deletedAt).toISOString() : null,
              ]
            );
          }
        }

        // 3. Update Sync Cursor Metadata
        const now = serverTime || new Date().toISOString();
        await db.runAsync(
          `INSERT OR REPLACE INTO sync_metadata (id, lastSyncAt, lastSyncCursor, syncStatus) VALUES (1, ?, ?, 'synced');`,
          [safeStr(now), safeStr(now)]
        );

        return true;
      }
      return false;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('[SyncService] Session unauthenticated (401). Skipping background sync.');
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.warn('[SyncService] Offline mode active - pull postponed.');
      } else {
        console.warn('[SyncService] Pull notice:', error?.message || error);
      }
      return false;
    }
  }

  public static async fullSync(): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;
    useAppStore.getState().setSyncStatus('syncing');

    try {
      await this.pushPendingQueue();
      await this.pullIncrementalChanges();

      useAppStore.getState().setSyncStatus('synced');
      await useCustomerStore.getState().fetchCustomers();
      await useLedgerStore.getState().fetchTotalShopDebt();
      this.isSyncing = false;
      return true;
    } catch (e) {
      useAppStore.getState().setSyncStatus('synced');
      this.isSyncing = false;
      return false;
    }
  }
}
