import { initDB } from '../database/db';
import * as Crypto from 'expo-crypto';

export interface LocalCustomerInput {
  id?: string;
  shopId: string;
  customerCode?: string;
  name: string;
  phone?: string;
  address?: string;
  imageLocalUri?: string;
}

const safeStr = (val: any): string => (val === undefined || val === null ? '' : String(val));

export const generateCustomerCode = (): string => {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
  return `CUS-${hex}`;
};

export const checkDuplicateCustomer = async (
  shopId: string,
  name: string,
  phone?: string
): Promise<{ duplicateName: boolean; duplicatePhone: boolean; existingCustomer?: any }> => {
  const db = await initDB();
  const cleanShopId = shopId || 'local_shop';
  const cleanName = name.trim().toLowerCase();
  const cleanPhone = phone ? phone.trim().replace(/[^0-9]/g, '') : '';

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM customers WHERE shopId = ? AND (deletedAt IS NULL OR deletedAt = '');`,
    [safeStr(cleanShopId)]
  );

  let duplicateName = false;
  let duplicatePhone = false;
  let existingCustomer: any = null;

  for (const c of rows) {
    const cName = (c.name || '').trim().toLowerCase();
    const cPhone = (c.phone || '').trim().replace(/[^0-9]/g, '');

    if (cName === cleanName) {
      duplicateName = true;
      existingCustomer = c;
    }
    if (cleanPhone && cPhone && cPhone === cleanPhone) {
      duplicatePhone = true;
      existingCustomer = c;
    }
  }

  return { duplicateName, duplicatePhone, existingCustomer };
};

export const createCustomerLocal = async (input: LocalCustomerInput) => {
  const db = await initDB();
  const id = input.id || Crypto.randomUUID();
  const shopId = input.shopId || 'local_shop';
  const customerCode = input.customerCode || generateCustomerCode();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO customers (
      id, shopId, customerCode, name, phone, address, imageLocalUri, balance, isArchived, createdAt, updatedAt, deletedAt, syncStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, NULL, 'pending');`,
    [
      safeStr(id),
      safeStr(shopId),
      safeStr(customerCode),
      safeStr(input.name.trim()),
      safeStr(input.phone ? input.phone.trim() : ''),
      safeStr(input.address ? input.address.trim() : ''),
      safeStr(input.imageLocalUri || ''),
      safeStr(now),
      safeStr(now),
    ]
  );

  // Add to Sync Queue for future background sync
  const syncQueueId = Crypto.randomUUID();
  const payload = JSON.stringify({
    id,
    shopId,
    customerCode,
    name: input.name.trim(),
    phone: input.phone ? input.phone.trim() : '',
    address: input.address ? input.address.trim() : '',
    imageLocalUri: input.imageLocalUri || '',
    createdAt: now,
  });

  await db.runAsync(
    `INSERT INTO sync_queue (
      id, entityType, entityId, operation, payload, createdAt, status, retryCount
    ) VALUES (?, 'customer', ?, 'create', ?, ?, 'pending', 0);`,
    [safeStr(syncQueueId), safeStr(id), safeStr(payload), safeStr(now)]
  );

  return {
    id,
    shopId,
    customerCode,
    name: input.name.trim(),
    phone: input.phone ? input.phone.trim() : '',
    address: input.address ? input.address.trim() : '',
    imageLocalUri: input.imageLocalUri || '',
    balance: 0,
    isArchived: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'pending',
  };
};

export const getCustomersLocal = async (
  shopId: string,
  filterOrSearch: string = 'all',
  searchOrFilter: string = '',
  sortBy: string = 'recently_active'
) => {
  const db = await initDB();
  const cleanShopId = shopId || 'local_shop';

  let searchQuery = '';
  let filter = 'all';

  if (['all', 'credit', 'settled', 'advance', 'archived'].includes(filterOrSearch)) {
    filter = filterOrSearch;
    searchQuery = searchOrFilter;
  } else {
    searchQuery = filterOrSearch;
    filter = ['all', 'credit', 'settled', 'advance', 'archived'].includes(searchOrFilter) ? searchOrFilter : 'all';
  }

  let isArchivedClause = 'AND (c.isArchived IS NULL OR c.isArchived = 0)';
  if (filter === 'archived') {
    isArchivedClause = 'AND c.isArchived = 1';
  }

  let query = `
    SELECT 
      c.*,
      COALESCE(SUM(CASE WHEN lt.type = 'credit' THEN lt.amount ELSE 0 END), 0) as totalCredit,
      COALESCE(SUM(CASE WHEN lt.type = 'payment' THEN lt.amount ELSE 0 END), 0) as totalPaid,
      (COALESCE(SUM(CASE WHEN lt.type = 'credit' THEN lt.amount ELSE 0 END), 0) - 
       COALESCE(SUM(CASE WHEN lt.type = 'payment' THEN lt.amount ELSE 0 END), 0)) as balance,
      MAX(lt.transactionDate) as lastTransactionDate
    FROM customers c
    LEFT JOIN ledger_transactions lt 
      ON c.id = lt.customerId AND (lt.deletedAt IS NULL OR lt.deletedAt = '')
    WHERE c.shopId = ? AND (c.deletedAt IS NULL OR c.deletedAt = '') ${isArchivedClause}
  `;

  const params: any[] = [safeStr(cleanShopId)];

  if (searchQuery.trim()) {
    query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.customerCode LIKE ?)`;
    const pattern = `%${searchQuery.trim()}%`;
    params.push(pattern, pattern, pattern);
  }

  query += ` GROUP BY c.id`;

  if (filter === 'credit') {
    query += ` HAVING balance > 0`;
  } else if (filter === 'settled') {
    query += ` HAVING balance = 0`;
  } else if (filter === 'advance') {
    query += ` HAVING balance < 0`;
  }

  if (sortBy === 'recently_active') {
    query += ` ORDER BY COALESCE(lastTransactionDate, c.createdAt) DESC`;
  } else if (sortBy === 'balance_desc') {
    query += ` ORDER BY balance DESC`;
  } else if (sortBy === 'balance_asc') {
    query += ` ORDER BY balance ASC`;
  } else if (sortBy === 'name_asc') {
    query += ` ORDER BY c.name ASC`;
  } else if (sortBy === 'name_desc') {
    query += ` ORDER BY c.name DESC`;
  } else if (sortBy === 'oldest') {
    query += ` ORDER BY c.createdAt ASC`;
  } else {
    query += ` ORDER BY c.createdAt DESC`;
  }

  const results = await db.getAllAsync<any>(query, params);
  return results;
};

export const getCustomerByIdLocal = async (id: string) => {
  const db = await initDB();
  const customer = await db.getFirstAsync<any>(
    `SELECT * FROM customers WHERE id = ? AND (deletedAt IS NULL OR deletedAt = '') LIMIT 1;`,
    [safeStr(id)]
  );
  return customer;
};

export const updateCustomerLocal = async (
  id: string,
  input: { name: string; phone?: string; address?: string; imageLocalUri?: string }
) => {
  const db = await initDB();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE customers SET 
      name = ?, 
      phone = ?, 
      address = ?, 
      imageLocalUri = COALESCE(NULLIF(?, ''), imageLocalUri), 
      updatedAt = ?, 
      syncStatus = 'pending' 
     WHERE id = ?;`,
    [
      safeStr(input.name.trim()),
      safeStr(input.phone ? input.phone.trim() : ''),
      safeStr(input.address ? input.address.trim() : ''),
      safeStr(input.imageLocalUri || ''),
      safeStr(now),
      safeStr(id),
    ]
  );

  const syncQueueId = Crypto.randomUUID();
  const payload = JSON.stringify({
    id,
    name: input.name.trim(),
    phone: input.phone ? input.phone.trim() : '',
    address: input.address ? input.address.trim() : '',
    imageLocalUri: input.imageLocalUri || '',
    updatedAt: now,
  });

  await db.runAsync(
    `INSERT INTO sync_queue (
      id, entityType, entityId, operation, payload, createdAt, status, retryCount
    ) VALUES (?, 'customer', ?, 'update', ?, ?, 'pending', 0);`,
    [safeStr(syncQueueId), safeStr(id), safeStr(payload), safeStr(now)]
  );
};

export const archiveCustomerLocal = async (id: string) => {
  const db = await initDB();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE customers SET isArchived = 1, updatedAt = ?, syncStatus = 'pending' WHERE id = ?;`,
    [safeStr(now), safeStr(id)]
  );

  const syncQueueId = Crypto.randomUUID();
  const payload = JSON.stringify({ id, isArchived: true, updatedAt: now });

  await db.runAsync(
    `INSERT INTO sync_queue (
      id, entityType, entityId, operation, payload, createdAt, status, retryCount
    ) VALUES (?, 'customer', ?, 'update', ?, ?, 'pending', 0);`,
    [safeStr(syncQueueId), safeStr(id), safeStr(payload), safeStr(now)]
  );
};

export const restoreCustomerLocal = async (id: string) => {
  const db = await initDB();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE customers SET isArchived = 0, updatedAt = ?, syncStatus = 'pending' WHERE id = ?;`,
    [safeStr(now), safeStr(id)]
  );

  const syncQueueId = Crypto.randomUUID();
  const payload = JSON.stringify({ id, isArchived: false, updatedAt: now });

  await db.runAsync(
    `INSERT INTO sync_queue (
      id, entityType, entityId, operation, payload, createdAt, status, retryCount
    ) VALUES (?, 'customer', ?, 'update', ?, ?, 'pending', 0);`,
    [safeStr(syncQueueId), safeStr(id), safeStr(payload), safeStr(now)]
  );
};

export const softDeleteCustomerLocal = async (id: string) => {
  const db = await initDB();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE customers SET deletedAt = ?, syncStatus = 'pending' WHERE id = ?;`,
    [safeStr(now), safeStr(id)]
  );

  const syncQueueId = Crypto.randomUUID();
  const payload = JSON.stringify({ id, deletedAt: now });

  await db.runAsync(
    `INSERT INTO sync_queue (
      id, entityType, entityId, operation, payload, createdAt, status, retryCount
    ) VALUES (?, 'customer', ?, 'delete', ?, ?, 'pending', 0);`,
    [safeStr(syncQueueId), safeStr(id), safeStr(payload), safeStr(now)]
  );
};
