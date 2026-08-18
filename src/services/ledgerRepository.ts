import { initDB } from '../database/db';
import * as Crypto from 'expo-crypto';
import { getCustomersLocal } from './customerRepository';

export const getCustomersWithBalancesLocal = getCustomersLocal;

export interface LocalLedgerInput {
  id?: string;
  shopId: string;
  customerId: string;
  type: 'credit' | 'payment';
  itemName?: string;
  amount: number;
  weight?: number;
  weightUnit?: string;
  notes?: string;
  billLocalUri?: string;
  transactionDate?: string;
}

const safeStr = (val: any): string => (val === undefined || val === null ? '' : String(val));

export const createLedgerLocal = async (input: LocalLedgerInput) => {
  const db = await initDB();
  const id = input.id || Crypto.randomUUID();
  const now = new Date().toISOString();
  const txDate = input.transactionDate || now;
  const shopId = input.shopId || 'local_shop';

  await db.runAsync(
    `INSERT INTO ledger_transactions (
      id, shopId, customerId, type, itemName, amount, weight, weightUnit, notes, billLocalUri, date, transactionDate, createdAt, updatedAt, deletedAt, syncStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
    [
      safeStr(id),
      safeStr(shopId),
      safeStr(input.customerId),
      safeStr(input.type),
      input.type === 'credit' ? safeStr(input.itemName ? input.itemName.trim() : '') : '',
      Number(input.amount || 0),
      input.weight ? Number(input.weight) : null,
      safeStr(input.weightUnit ? input.weightUnit.trim() : ''),
      safeStr(input.notes ? input.notes.trim() : ''),
      safeStr(input.billLocalUri || ''),
      safeStr(txDate),
      safeStr(txDate),
      safeStr(now),
      safeStr(now),
    ]
  );

  // Add to Sync Queue
  const syncQueueId = Crypto.randomUUID();
  const payload = JSON.stringify({
    id,
    shopId,
    customerId: input.customerId,
    type: input.type,
    itemName: input.type === 'credit' ? (input.itemName ? input.itemName.trim() : '') : '',
    amount: Number(input.amount || 0),
    weight: input.weight ? Number(input.weight) : null,
    weightUnit: input.weightUnit ? input.weightUnit.trim() : '',
    notes: input.notes ? input.notes.trim() : '',
    billLocalUri: input.billLocalUri || '',
    transactionDate: txDate,
    createdAt: now,
  });

  await db.runAsync(
    `INSERT INTO sync_queue (
      id, entityType, entityId, operation, payload, createdAt, status, retryCount
    ) VALUES (?, 'ledger_transaction', ?, 'create', ?, ?, 'pending', 0);`,
    [safeStr(syncQueueId), safeStr(id), safeStr(payload), safeStr(now)]
  );

  return {
    id,
    shopId,
    customerId: input.customerId,
    type: input.type,
    itemName: input.itemName ? input.itemName.trim() : '',
    amount: Number(input.amount || 0),
    weight: input.weight ? Number(input.weight) : undefined,
    weightUnit: input.weightUnit ? input.weightUnit.trim() : '',
    notes: input.notes ? input.notes.trim() : '',
    billLocalUri: input.billLocalUri || '',
    transactionDate: txDate,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'pending',
  };
};

export const getLedgerByCustomerLocal = async (
  customerId: string,
  searchQuery: string = '',
  typeFilter: 'all' | 'credit' | 'payment' = 'all'
) => {
  const db = await initDB();

  let query = `SELECT *, COALESCE(transactionDate, date, createdAt) AS txDateNormalized FROM ledger_transactions 
               WHERE customerId = ? AND (deletedAt IS NULL OR deletedAt = '')`;
  const params: any[] = [safeStr(customerId)];

  if (typeFilter === 'credit') {
    query += ` AND type = 'credit'`;
  } else if (typeFilter === 'payment') {
    query += ` AND type = 'payment'`;
  }

  if (searchQuery.trim()) {
    query += ` AND (itemName LIKE ? OR notes LIKE ? OR transactionDate LIKE ? OR date LIKE ?)`;
    const pattern = `%${searchQuery.trim()}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  query += ` ORDER BY txDateNormalized ASC, createdAt ASC;`;

  const results = await db.getAllAsync<any>(query, params);

  // Calculate Running Balance in chronological order
  let runningBalance = 0;
  const transactionsWithBalance = results.map((tx) => {
    if (tx.type === 'credit') {
      runningBalance += (tx.amount || 0);
    } else {
      runningBalance -= (tx.amount || 0);
    }
    return {
      ...tx,
      transactionDate: tx.transactionDate || tx.date || tx.createdAt,
      runningBalance,
    };
  });

  // Return in newest-first order for display
  return transactionsWithBalance.reverse();
};

export const getCustomerBalanceSummaryLocal = async (customerId: string) => {
  const db = await initDB();
  const row = await db.getFirstAsync<any>(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) AS totalCredit,
       COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) AS totalPaid
     FROM ledger_transactions 
     WHERE customerId = ? AND (deletedAt IS NULL OR deletedAt = '');`,
    [safeStr(customerId)]
  );

  const totalCredit = row?.totalCredit || 0;
  const totalPaid = row?.totalPaid || 0;
  const balance = totalCredit - totalPaid;

  return {
    totalCredit,
    totalPaid,
    balance,
  };
};

export const getShopTotalDebtLocal = async (shopId: string) => {
  const db = await initDB();
  const cleanShopId = shopId || 'local_shop';
  
  const rows = await db.getAllAsync<any>(
    `SELECT 
       customerId,
       SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) as customerBalance
     FROM ledger_transactions
     WHERE shopId = ? AND (deletedAt IS NULL OR deletedAt = '')
     GROUP BY customerId
     HAVING customerBalance > 0;`,
    [safeStr(cleanShopId)]
  );

  const totalDebt = rows.reduce((acc, curr) => acc + (curr.customerBalance || 0), 0);
  return totalDebt;
};

export const updateLedgerLocal = async (
  id: string,
  input: {
    itemName?: string;
    amount?: number;
    weight?: number;
    weightUnit?: string;
    notes?: string;
    billLocalUri?: string;
    transactionDate?: string;
  }
) => {
  const db = await initDB();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE ledger_transactions SET 
      itemName = COALESCE(?, itemName),
      amount = COALESCE(?, amount),
      weight = COALESCE(?, weight),
      weightUnit = COALESCE(?, weightUnit),
      notes = COALESCE(?, notes),
      billLocalUri = COALESCE(NULLIF(?, ''), billLocalUri),
      date = COALESCE(?, date),
      transactionDate = COALESCE(?, transactionDate),
      updatedAt = ?,
      syncStatus = 'pending'
     WHERE id = ?;`,
    [
      input.itemName !== undefined ? safeStr(input.itemName.trim()) : null,
      input.amount !== undefined ? Number(input.amount) : null,
      input.weight !== undefined ? Number(input.weight) : null,
      input.weightUnit !== undefined ? safeStr(input.weightUnit.trim()) : null,
      input.notes !== undefined ? safeStr(input.notes.trim()) : null,
      safeStr(input.billLocalUri || ''),
      safeStr(input.transactionDate || null),
      safeStr(input.transactionDate || null),
      safeStr(now),
      safeStr(id),
    ]
  );

  // Queue Sync Operation
  const syncQueueId = Crypto.randomUUID();
  const payload = JSON.stringify({ id, ...input, updatedAt: now });

  await db.runAsync(
    `INSERT INTO sync_queue (
      id, entityType, entityId, operation, payload, createdAt, status, retryCount
    ) VALUES (?, 'ledger_transaction', ?, 'update', ?, ?, 'pending', 0);`,
    [safeStr(syncQueueId), safeStr(id), safeStr(payload), safeStr(now)]
  );
};

export const softDeleteLedgerLocal = async (id: string) => {
  const db = await initDB();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE ledger_transactions SET deletedAt = ?, syncStatus = 'pending' WHERE id = ?;`,
    [safeStr(now), safeStr(id)]
  );

  const syncQueueId = Crypto.randomUUID();
  const payload = JSON.stringify({ id, deletedAt: now });

  await db.runAsync(
    `INSERT INTO sync_queue (
      id, entityType, entityId, operation, payload, createdAt, status, retryCount
    ) VALUES (?, 'ledger_transaction', ?, 'delete', ?, ?, 'pending', 0);`,
    [safeStr(syncQueueId), safeStr(id), safeStr(payload), safeStr(now)]
  );
};
