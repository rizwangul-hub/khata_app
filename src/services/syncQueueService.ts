import { initDB } from '../database/db';
import * as Crypto from 'expo-crypto';

export interface SyncQueueItem {
  id: string;
  entityType: 'customer' | 'ledger_transaction' | 'image';
  entityId: string;
  operation: 'create' | 'update' | 'delete' | 'upload_image';
  payload: string;
  createdAt: string;
  updatedAt?: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  retryCount: number;
  lastError?: string;
  nextRetryAt?: string;
  deviceId?: string;
}

export class SyncQueueService {
  public static calculateExponentialBackoff(retryCount: number): string {
    // 1st retry: 5 sec, 2nd: 15 sec, 3rd: 45 sec, max 5 min
    const delaySeconds = Math.min(300, Math.pow(3, retryCount) * 5);
    const nextRetryDate = new Date(Date.now() + delaySeconds * 1000);
    return nextRetryDate.toISOString();
  }

  public static async getPendingQueue(limit: number = 50): Promise<SyncQueueItem[]> {
    const db = await initDB();
    const nowIso = new Date().toISOString();

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM sync_queue 
       WHERE status = 'pending' 
         AND (nextRetryAt IS NULL OR nextRetryAt <= ?) 
       ORDER BY createdAt ASC 
       LIMIT ?;`,
      [nowIso, limit]
    );

    return rows;
  }

  public static async getPendingCount(): Promise<number> {
    const db = await initDB();
    const row = await db.getFirstAsync<any>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending';`
    );
    return row?.count || 0;
  }

  public static async getFailedCount(): Promise<number> {
    const db = await initDB();
    const row = await db.getFirstAsync<any>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'failed';`
    );
    return row?.count || 0;
  }

  public static async markSynced(operationIds: string[]): Promise<void> {
    if (!operationIds || operationIds.length === 0) return;
    const db = await initDB();
    const now = new Date().toISOString();
    const placeholders = operationIds.map(() => '?').join(',');

    await db.runAsync(
      `UPDATE sync_queue SET status = 'synced', updatedAt = ? WHERE id IN (${placeholders});`,
      [now, ...operationIds]
    );
  }

  public static async recordFailedOperation(
    id: string,
    errorMessage: string,
    isPermanent: boolean = false
  ): Promise<void> {
    const db = await initDB();
    const now = new Date().toISOString();

    const item = await db.getFirstAsync<any>(`SELECT retryCount FROM sync_queue WHERE id = ?;`, [id]);
    const currentRetryCount = (item?.retryCount || 0) + 1;

    if (isPermanent || currentRetryCount >= 5) {
      await db.runAsync(
        `UPDATE sync_queue SET status = 'failed', lastError = ?, updatedAt = ? WHERE id = ?;`,
        [errorMessage, now, id]
      );
    } else {
      const nextRetry = this.calculateExponentialBackoff(currentRetryCount);
      await db.runAsync(
        `UPDATE sync_queue SET 
          retryCount = ?, 
          lastError = ?, 
          nextRetryAt = ?, 
          updatedAt = ? 
         WHERE id = ?;`,
        [currentRetryCount, errorMessage, nextRetry, now, id]
      );
    }
  }

  public static async retryAllFailed(): Promise<void> {
    const db = await initDB();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE sync_queue SET status = 'pending', retryCount = 0, nextRetryAt = NULL, updatedAt = ? WHERE status = 'failed';`,
      [now]
    );
  }
}
