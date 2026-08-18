export type SyncStatus = 'pending' | 'synced' | 'failed';
export type SubscriptionPlan = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended';

export interface BaseEntity {
  id: string; // UUID
  shopId: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  syncStatus: SyncStatus;
}

export interface Shop {
  shopId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  shopImage?: string;
  licenseId: string;
  shopCode: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStartDate: string;
  subscriptionExpiryDate: string;
  accountStatus: SubscriptionStatus;
}

export interface Customer extends BaseEntity {
  name: string;
  phone?: string;
  balance: number;
}

export interface LedgerTransaction extends BaseEntity {
  customerId: string;
  type: 'credit' | 'payment';
  amount: number;
  description?: string;
  date: string;
  receiptImage?: string;
}

export interface SyncQueue {
  id: string;
  entityType: 'customer' | 'ledger_transaction';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: string; // JSON string of the entity
  createdAt: string;
  status: SyncStatus;
  retryCount: number;
}

export interface SyncMetadata {
  id: string; // shopId
  lastSyncAt: string; // ISO string
}
