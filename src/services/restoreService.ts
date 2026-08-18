import { initDB } from '../database/db';
import { apiClient } from '../api/apiClient';
import { useCustomerStore } from '../state/customerStore';

export interface RestoreProgress {
  step: 'authenticating' | 'downloading_shop' | 'restoring_customers' | 'restoring_transactions' | 'completed' | 'error';
  customersCount: number;
  transactionsCount: number;
  message: string;
}

const safeStr = (val: any): string => (val === undefined || val === null ? '' : String(val));

export class RestoreService {
  public static async bootstrapNewDevice(
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<boolean> {
    const db = await initDB();

    try {
      if (onProgress) {
        onProgress({
          step: 'downloading_shop',
          customersCount: 0,
          transactionsCount: 0,
          message: 'Downloading shop credentials & cloud backup...',
        });
      }

      const response = await apiClient.get('/sync/bootstrap');
      if (!response.data?.success) {
        if (onProgress) {
          onProgress({ step: 'error', customersCount: 0, transactionsCount: 0, message: 'Server restore response failed.' });
        }
        return false;
      }

      const { shop, subscription, customers, transactions, serverTime } = response.data;

      // 1. Restore Shop Metadata
      if (shop && subscription) {
        await db.runAsync(
          `INSERT OR REPLACE INTO shops (
            shopId, shopName, ownerName, phone, address, shopImage, licenseId, shopCode, subscriptionPlan, subscriptionStartDate, subscriptionExpiryDate, accountStatus
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            safeStr(shop.id),
            safeStr(shop.shopName),
            safeStr(shop.ownerName || ''),
            safeStr(shop.phone || ''),
            safeStr(shop.address || ''),
            safeStr(shop.image || ''),
            safeStr(shop.licenseId),
            safeStr(shop.shopCode),
            safeStr(subscription.planType || 'monthly'),
            safeStr(subscription.startDate || ''),
            safeStr(subscription.expiryDate || ''),
            safeStr(subscription.status || 'active'),
          ]
        );
      }

      // 2. Safe Batched Upsert of Customers
      const totalCust = Array.isArray(customers) ? customers.length : 0;
      if (onProgress) {
        onProgress({
          step: 'restoring_customers',
          customersCount: totalCust,
          transactionsCount: 0,
          message: `Restoring ${totalCust} customers...`,
        });
      }

      if (Array.isArray(customers) && totalCust > 0) {
        for (let i = 0; i < totalCust; i++) {
          const c = customers[i];
          await db.runAsync(
            `INSERT OR REPLACE INTO customers (
              id, shopId, customerCode, name, phone, address, imageRemoteUrl, balance, isArchived, createdAt, updatedAt, deletedAt, syncStatus
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced');`,
            [
              safeStr(c._id || c.id),
              safeStr(c.shopId),
              safeStr(c.customerCode || ''),
              safeStr(c.name),
              safeStr(c.phone || ''),
              safeStr(c.address || ''),
              safeStr(c.image || ''),
              Number(c.balance || 0),
              c.isArchived ? 1 : 0,
              safeStr(c.createdAt || new Date().toISOString()),
              safeStr(c.updatedAt || new Date().toISOString()),
              c.deletedAt ? new Date(c.deletedAt).toISOString() : null,
            ]
          );
        }
      }

      // 3. Safe Batched Upsert of Ledger Transactions
      const totalTx = Array.isArray(transactions) ? transactions.length : 0;
      if (onProgress) {
        onProgress({
          step: 'restoring_transactions',
          customersCount: totalCust,
          transactionsCount: totalTx,
          message: `Restoring ${totalTx} financial transactions...`,
        });
      }

      if (Array.isArray(transactions) && totalTx > 0) {
        for (let j = 0; j < totalTx; j++) {
          const tx = transactions[j];
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

      // 4. Update local sync metadata cursor
      const now = serverTime || new Date().toISOString();
      await db.runAsync(
        `INSERT OR REPLACE INTO sync_metadata (id, lastSyncAt, lastSyncCursor, syncStatus) VALUES (1, ?, ?, 'synced');`,
        [safeStr(now), safeStr(now)]
      );

      // Refresh stores
      await useCustomerStore.getState().fetchCustomers();

      if (onProgress) {
        onProgress({
          step: 'completed',
          customersCount: totalCust,
          transactionsCount: totalTx,
          message: 'Your shop restoration is complete!',
        });
      }

      return true;
    } catch (e: any) {
      console.error('[RestoreService] Error during new device restore', e);
      if (onProgress) {
        onProgress({ step: 'error', customersCount: 0, transactionsCount: 0, message: e.message || 'Restoration failed' });
      }
      return false;
    }
  }
}
