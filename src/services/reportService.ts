import { initDB } from '../database/db';

export interface ShopSummaryReport {
  totalCustomers: number;
  totalCredit: number;
  totalReceived: number;
  totalOutstanding: number;
  totalAdvance: number;
  settledCustomersCount: number;
}

export interface PeriodActivityReport {
  periodCredit: number;
  periodReceived: number;
  periodNewCustomers: number;
  periodTransactionsCount: number;
  creditCount: number;
  paymentCount: number;
}

export interface CustomerBalanceItem {
  id: string;
  name: string;
  phone?: string;
  balance: number;
  lastTransactionDate?: string;
}

export interface DailyTrendItem {
  date: string;
  credit: number;
  received: number;
}

export class ReportService {
  public static async getSummary(shopId: string): Promise<ShopSummaryReport> {
    const db = await initDB();

    // 1. Total Customers Count & Settled & Advance
    const customerAgg = await db.getAllAsync<any>(
      `SELECT 
        COUNT(*) as totalCount,
        SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as totalAdvance,
        SUM(CASE WHEN balance = 0 THEN 1 ELSE 0 END) as settledCount
       FROM customers WHERE shopId = ?;`,
      [shopId]
    );

    const custRow = customerAgg[0] || {};
    const totalCustomers = custRow.totalCount || 0;
    const totalAdvance = custRow.totalAdvance || 0;
    const settledCustomersCount = custRow.settledCount || 0;

    // 2. Total Credit & Total Received from Transactions
    const txAgg = await db.getAllAsync<any>(
      `SELECT 
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as totalCredit,
        SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as totalReceived
       FROM ledger_transactions WHERE shopId = ?;`,
      [shopId]
    );

    const txRow = txAgg[0] || {};
    const totalCredit = txRow.totalCredit || 0;
    const totalReceived = txRow.totalReceived || 0;
    const totalOutstanding = Math.max(0, totalCredit - totalReceived);

    return {
      totalCustomers,
      totalCredit,
      totalReceived,
      totalOutstanding,
      totalAdvance,
      settledCustomersCount,
    };
  }

  public static async getPeriodActivity(
    shopId: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<PeriodActivityReport> {
    const db = await initDB();

    let txWhere = 'WHERE shopId = ?';
    let custWhere = 'WHERE shopId = ?';
    const txParams: any[] = [shopId];
    const custParams: any[] = [shopId];

    if (startDateStr && endDateStr) {
      txWhere += ' AND date >= ? AND date <= ?';
      custWhere += ' AND createdAt >= ? AND createdAt <= ?';
      txParams.push(startDateStr, endDateStr);
      custParams.push(startDateStr, endDateStr);
    }

    const [txResult, custResult] = await Promise.all([
      db.getAllAsync<any>(
        `SELECT 
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as periodCredit,
          SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as periodReceived,
          COUNT(*) as totalTx,
          SUM(CASE WHEN type = 'credit' THEN 1 ELSE 0 END) as creditCount,
          SUM(CASE WHEN type = 'payment' THEN 1 ELSE 0 END) as paymentCount
         FROM ledger_transactions ${txWhere};`,
        txParams
      ),
      db.getAllAsync<any>(
        `SELECT COUNT(*) as newCustomers FROM customers ${custWhere};`,
        custParams
      ),
    ]);

    const txRow = txResult[0] || {};
    const custRow = custResult[0] || {};

    return {
      periodCredit: txRow.periodCredit || 0,
      periodReceived: txRow.periodReceived || 0,
      periodNewCustomers: custRow.newCustomers || 0,
      periodTransactionsCount: txRow.totalTx || 0,
      creditCount: txRow.creditCount || 0,
      paymentCount: txRow.paymentCount || 0,
    };
  }

  public static async getTopDebtors(shopId: string, limit: number = 5): Promise<CustomerBalanceItem[]> {
    const db = await initDB();
    const rows = await db.getAllAsync<any>(
      `SELECT id, name, phone, balance, updatedAt as lastTransactionDate
       FROM customers
       WHERE shopId = ? AND balance > 0
       ORDER BY balance DESC
       LIMIT ?;`,
      [shopId, limit]
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      balance: r.balance,
      lastTransactionDate: r.lastTransactionDate,
    }));
  }

  public static async getTopAdvanceCustomers(shopId: string, limit: number = 5): Promise<CustomerBalanceItem[]> {
    const db = await initDB();
    const rows = await db.getAllAsync<any>(
      `SELECT id, name, phone, ABS(balance) as balance, updatedAt as lastTransactionDate
       FROM customers
       WHERE shopId = ? AND balance < 0
       ORDER BY ABS(balance) DESC
       LIMIT ?;`,
      [shopId, limit]
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      balance: r.balance,
      lastTransactionDate: r.lastTransactionDate,
    }));
  }

  public static async getDailyTrendData(
    shopId: string,
    startDateStr: string,
    endDateStr: string
  ): Promise<DailyTrendItem[]> {
    const db = await initDB();
    const rows = await db.getAllAsync<any>(
      `SELECT 
        substr(date, 1, 10) as dateDay,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as credit,
        SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as received
       FROM ledger_transactions
       WHERE shopId = ? AND date >= ? AND date <= ?
       GROUP BY dateDay
       ORDER BY dateDay ASC;`,
      [shopId, startDateStr, endDateStr]
    );

    return rows.map((r) => ({
      date: r.dateDay,
      credit: r.credit || 0,
      received: r.received || 0,
    }));
  }
}
