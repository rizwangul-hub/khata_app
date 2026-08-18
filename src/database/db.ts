import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
  if (db) return db;
  
  db = await SQLite.openDatabaseAsync('khata.db');

  // 1. Create Base Tables if not exists
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS shops (
      shopId TEXT PRIMARY KEY,
      shopName TEXT NOT NULL,
      ownerName TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      shopImage TEXT,
      licenseId TEXT NOT NULL,
      shopCode TEXT NOT NULL,
      subscriptionPlan TEXT NOT NULL,
      subscriptionStartDate TEXT,
      subscriptionExpiryDate TEXT,
      accountStatus TEXT NOT NULL,
      deletedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      shopId TEXT NOT NULL,
      customerCode TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      imageLocalUri TEXT,
      imageRemoteUrl TEXT,
      balance REAL DEFAULT 0,
      isArchived INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      syncStatus TEXT DEFAULT 'pending',
      FOREIGN KEY (shopId) REFERENCES shops (shopId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ledger_transactions (
      id TEXT PRIMARY KEY,
      shopId TEXT NOT NULL,
      customerId TEXT NOT NULL,
      type TEXT NOT NULL,
      itemName TEXT,
      amount REAL NOT NULL,
      weight REAL,
      weightUnit TEXT,
      notes TEXT,
      billLocalUri TEXT,
      billRemoteUrl TEXT,
      date TEXT,
      transactionDate TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      syncStatus TEXT DEFAULT 'pending',
      FOREIGN KEY (shopId) REFERENCES shops (shopId) ON DELETE CASCADE,
      FOREIGN KEY (customerId) REFERENCES customers (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      status TEXT DEFAULT 'pending',
      retryCount INTEGER DEFAULT 0,
      lastError TEXT,
      nextRetryAt TEXT,
      deviceId TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY,
      lastSyncAt TEXT NOT NULL,
      lastSyncCursor TEXT,
      deviceId TEXT,
      syncStatus TEXT DEFAULT 'synced'
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      shopId TEXT NOT NULL,
      eventKey TEXT UNIQUE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      navPath TEXT,
      createdAt TEXT NOT NULL
    );
  `);

  // 2. Comprehensive Failsafe Column Migration System for existing SQLite databases
  const alterQueries = [
    `ALTER TABLE customers ADD COLUMN address TEXT;`,
    `ALTER TABLE customers ADD COLUMN phone TEXT;`,
    `ALTER TABLE customers ADD COLUMN name TEXT;`,
    `ALTER TABLE customers ADD COLUMN customerCode TEXT;`,
    `ALTER TABLE customers ADD COLUMN isArchived INTEGER DEFAULT 0;`,
    `ALTER TABLE customers ADD COLUMN imageRemoteUrl TEXT;`,
    `ALTER TABLE customers ADD COLUMN imageLocalUri TEXT;`,
    `ALTER TABLE customers ADD COLUMN balance REAL DEFAULT 0;`,
    `ALTER TABLE customers ADD COLUMN deletedAt TEXT;`,
    `ALTER TABLE customers ADD COLUMN syncStatus TEXT DEFAULT 'pending';`,
    `ALTER TABLE customers ADD COLUMN createdAt TEXT;`,
    `ALTER TABLE customers ADD COLUMN updatedAt TEXT;`,

    `ALTER TABLE ledger_transactions ADD COLUMN date TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN transactionDate TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN billLocalUri TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN billRemoteUrl TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN weight REAL;`,
    `ALTER TABLE ledger_transactions ADD COLUMN weightUnit TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN notes TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN itemName TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN deletedAt TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN syncStatus TEXT DEFAULT 'pending';`,
    `ALTER TABLE ledger_transactions ADD COLUMN createdAt TEXT;`,
    `ALTER TABLE ledger_transactions ADD COLUMN updatedAt TEXT;`,

    `ALTER TABLE shops ADD COLUMN deletedAt TEXT;`,
    `ALTER TABLE shops ADD COLUMN address TEXT;`,
    `ALTER TABLE shops ADD COLUMN phone TEXT;`,
    `ALTER TABLE shops ADD COLUMN ownerName TEXT;`,
    `ALTER TABLE shops ADD COLUMN shopImage TEXT;`,

    `ALTER TABLE sync_queue ADD COLUMN updatedAt TEXT;`,
    `ALTER TABLE sync_queue ADD COLUMN lastError TEXT;`,
    `ALTER TABLE sync_queue ADD COLUMN nextRetryAt TEXT;`,
    `ALTER TABLE sync_queue ADD COLUMN deviceId TEXT;`,

    `ALTER TABLE sync_metadata ADD COLUMN lastSyncCursor TEXT;`,
    `ALTER TABLE sync_metadata ADD COLUMN deviceId TEXT;`,
    `ALTER TABLE sync_metadata ADD COLUMN syncStatus TEXT DEFAULT 'synced';`,
  ];

  for (const query of alterQueries) {
    try {
      await db.execAsync(query);
    } catch {
      // Column already exists, safe to continue
    }
  }

  // 3. Failsafe Index Creation
  const indexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_customers_shopId ON customers(shopId);`,
    `CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customerCode);`,
    `CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_shopId_date ON ledger_transactions(shopId, transactionDate);`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_type ON ledger_transactions(type);`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_customerId ON ledger_transactions(customerId);`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, createdAt);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_shopId ON notifications(shopId, isRead);`,
  ];

  for (const idxQuery of indexQueries) {
    try {
      await db.execAsync(idxQuery);
    } catch (e) {
      console.warn('[DB] Index creation warning:', e);
    }
  }

  console.log('Database initialized successfully with all migrations & indexes');
  return db;
};

export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
};

export const saveShopLocal = async (shop: {
  shopId: string;
  shopName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  image?: string;
  licenseId: string;
  shopCode: string;
  subscriptionPlan: string;
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  accountStatus: string;
}) => {
  const database = await initDB();
  await database.runAsync(
    `INSERT OR REPLACE INTO shops (
      shopId, shopName, ownerName, phone, address, shopImage, licenseId, shopCode, subscriptionPlan, subscriptionStartDate, subscriptionExpiryDate, accountStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      shop.shopId,
      shop.shopName,
      shop.ownerName || '',
      shop.phone || '',
      shop.address || '',
      shop.image || '',
      shop.licenseId,
      shop.shopCode,
      shop.subscriptionPlan || 'monthly',
      shop.subscriptionStartDate || '',
      shop.subscriptionExpiryDate || '',
      shop.accountStatus || 'active',
    ]
  );
};

export const getShopLocal = async (shopId: string) => {
  const database = await initDB();
  const result = await database.getFirstAsync<any>(
    'SELECT * FROM shops WHERE shopId = ? LIMIT 1;',
    [shopId]
  );
  return result;
};
