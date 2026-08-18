import { initDB } from '../database/db';

export interface DashboardMetrics {
  totalCustomerDebt: number;
  totalCustomers: number;
  totalCredit: number;
  totalReceived: number;
  todayCredit: number;
  todayReceived: number;
}

export const getDashboardMetrics = async (shopId: string): Promise<DashboardMetrics> => {
  const db = await initDB();

  // 1. Total Customers Count
  const customerCountRow = await db.getFirstAsync<any>(
    `SELECT COUNT(*) as count FROM customers WHERE shopId = ? AND (deletedAt IS NULL OR deletedAt = '');`,
    [shopId]
  );
  const totalCustomers = customerCountRow?.count || 0;

  // 2. Total Credit Sum (All credit transactions)
  const creditSumRow = await db.getFirstAsync<any>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM ledger_transactions WHERE shopId = ? AND type = 'credit' AND (deletedAt IS NULL OR deletedAt = '');`,
    [shopId]
  );
  const totalCredit = creditSumRow?.total || 0;

  // 3. Total Received Sum (All payment transactions)
  const paymentSumRow = await db.getFirstAsync<any>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM ledger_transactions WHERE shopId = ? AND type = 'payment' AND (deletedAt IS NULL OR deletedAt = '');`,
    [shopId]
  );
  const totalReceived = paymentSumRow?.total || 0;

  // 4. Total Customer Debt (Sum of positive customer balances ONLY)
  const positiveBalancesRows = await db.getAllAsync<any>(
    `SELECT 
       customerId,
       (COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0)) as customerBalance
     FROM ledger_transactions
     WHERE shopId = ? AND (deletedAt IS NULL OR deletedAt = '')
     GROUP BY customerId
     HAVING customerBalance > 0;`,
    [shopId]
  );

  const totalCustomerDebt = positiveBalancesRows.reduce((acc, curr) => acc + (curr.customerBalance || 0), 0);

  // 5. Today's Summary
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todaySummaryRow = await db.getFirstAsync<any>(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as todayCredit,
       COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as todayReceived
     FROM ledger_transactions
     WHERE shopId = ? AND (deletedAt IS NULL OR deletedAt = '') AND transactionDate LIKE ?;`,
    [shopId, `${todayStr}%`]
  );

  return {
    totalCustomerDebt,
    totalCustomers,
    totalCredit,
    totalReceived,
    todayCredit: todaySummaryRow?.todayCredit || 0,
    todayReceived: todaySummaryRow?.todayReceived || 0,
  };
};

export const getTopDebtors = async (shopId: string, limit: number = 5) => {
  const db = await initDB();
  const results = await db.getAllAsync<any>(
    `SELECT 
       c.id, c.name, c.phone, c.imageLocalUri,
       (COALESCE(SUM(CASE WHEN lt.type = 'credit' THEN lt.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN lt.type = 'payment' THEN lt.amount ELSE 0 END), 0)) as balance
     FROM customers c
     JOIN ledger_transactions lt ON c.id = lt.customerId AND (lt.deletedAt IS NULL OR lt.deletedAt = '')
     WHERE c.shopId = ? AND (c.deletedAt IS NULL OR c.deletedAt = '')
     GROUP BY c.id
     HAVING balance > 0
     ORDER BY balance DESC
     LIMIT ?;`,
    [shopId, limit]
  );
  return results;
};

export const getRecentActivity = async (shopId: string, limit: number = 5) => {
  const db = await initDB();
  const results = await db.getAllAsync<any>(
    `SELECT 
       lt.*, c.name as customerName, c.imageLocalUri as customerImage
     FROM ledger_transactions lt
     LEFT JOIN customers c ON lt.customerId = c.id
     WHERE lt.shopId = ? AND (lt.deletedAt IS NULL OR lt.deletedAt = '')
     ORDER BY lt.transactionDate DESC, lt.createdAt DESC
     LIMIT ?;`,
    [shopId, limit]
  );
  return results;
};
