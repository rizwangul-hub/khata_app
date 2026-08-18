import { initDB } from '../database/db';
import * as Crypto from 'expo-crypto';

export interface NotificationItem {
  id: string;
  shopId: string;
  eventKey: string;
  title: string;
  message: string;
  type: 'subscription' | 'sync' | 'security' | 'reminder' | 'system';
  isRead: number;
  navPath?: string;
  createdAt: string;
}

export class NotificationService {
  public static async createNotification(input: {
    shopId: string;
    eventKey?: string;
    title: string;
    message: string;
    type: 'subscription' | 'sync' | 'security' | 'reminder' | 'system';
    navPath?: string;
  }): Promise<void> {
    const db = await initDB();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const eventKey = input.eventKey || `${input.type}_${Date.now()}`;

    // Duplicate Prevention by eventKey
    const existing = await db.getFirstAsync<any>(
      `SELECT id FROM notifications WHERE eventKey = ? LIMIT 1;`,
      [eventKey]
    );

    if (existing) return;

    await db.runAsync(
      `INSERT INTO notifications (
        id, shopId, eventKey, title, message, type, isRead, navPath, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?);`,
      [id, input.shopId, eventKey, input.title, input.message, input.type, input.navPath || '', now]
    );
  }

  public static async getNotifications(shopId: string): Promise<NotificationItem[]> {
    const db = await initDB();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM notifications WHERE shopId = ? ORDER BY createdAt DESC LIMIT 100;`,
      [shopId]
    );
    return rows;
  }

  public static async getUnreadCount(shopId: string): Promise<number> {
    const db = await initDB();
    const row = await db.getFirstAsync<any>(
      `SELECT COUNT(*) as count FROM notifications WHERE shopId = ? AND isRead = 0;`,
      [shopId]
    );
    return row?.count || 0;
  }

  public static async markAsRead(id: string): Promise<void> {
    const db = await initDB();
    await db.runAsync(`UPDATE notifications SET isRead = 1 WHERE id = ?;`, [id]);
  }

  public static async markAllAsRead(shopId: string): Promise<void> {
    const db = await initDB();
    await db.runAsync(`UPDATE notifications SET isRead = 1 WHERE shopId = ?;`, [shopId]);
  }

  public static async generateSubscriptionAlerts(
    shopId: string,
    daysRemaining: number,
    isUrdu: boolean = false
  ): Promise<void> {
    if (daysRemaining <= 0) {
      await this.createNotification({
        shopId,
        eventKey: `sub_expired_${new Date().toISOString().substring(0, 10)}`,
        type: 'subscription',
        title: isUrdu ? 'پلان ختم ہو گیا ہے' : 'Subscription Expired',
        message: isUrdu
          ? 'آپ کا سبسکریپشن پلان ختم ہو گیا ہے۔ براے مہربانی ایڈمن سے رابطہ کریں۔'
          : 'Your subscription plan has expired. Please contact admin to renew.',
        navPath: '/(app)/subscription',
      });
    } else if (daysRemaining <= 3) {
      await this.createNotification({
        shopId,
        eventKey: `sub_expiry_3d_${new Date().toISOString().substring(0, 10)}`,
        type: 'subscription',
        title: isUrdu ? 'پلان جلد ختم ہونے والا ہے' : 'Subscription Expiring Soon',
        message: isUrdu
          ? `آپ کا پلان ${daysRemaining} دنوں میں ختم ہو جائے گا۔`
          : `Your subscription plan will expire in ${daysRemaining} days.`,
        navPath: '/(app)/subscription',
      });
    }
  }
}
