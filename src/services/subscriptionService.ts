import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/apiClient';

const SUBSCRIPTION_CACHE_KEY = '@shop_khata_subscription_cache';
const LAST_SERVER_TIME_KEY = '@shop_khata_last_server_time';

export interface MobileSubscriptionStatus {
  plan: string;
  status: 'active' | 'expired' | 'suspended';
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  serverTime: string;
  isClockTampered?: boolean;
}

export class MobileSubscriptionService {
  public static async fetchSubscriptionStatus(): Promise<MobileSubscriptionStatus | null> {
    try {
      const response = await apiClient.get('/auth/subscription');
      if (response.data?.success && response.data?.subscription) {
        const sub: MobileSubscriptionStatus = response.data.subscription;
        await this.cacheSubscriptionStatus(sub);
        return sub;
      }
      return await this.getCachedSubscriptionStatus();
    } catch (error) {
      console.warn('[SubscriptionService] Network fetch failed, reading local cache', error);
      return await this.getCachedSubscriptionStatus();
    }
  }

  public static async cacheSubscriptionStatus(sub: MobileSubscriptionStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(sub));
      if (sub.serverTime) {
        await AsyncStorage.setItem(LAST_SERVER_TIME_KEY, sub.serverTime);
      }
    } catch (e) {
      console.error('[SubscriptionService] Cache write error', e);
    }
  }

  public static async getCachedSubscriptionStatus(): Promise<MobileSubscriptionStatus | null> {
    try {
      const cached = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
      const lastServerTimeStr = await AsyncStorage.getItem(LAST_SERVER_TIME_KEY);

      if (!cached) return null;

      const sub: MobileSubscriptionStatus = JSON.parse(cached);
      const now = new Date();

      // Anti-Tamper Clock Guard: Check if current device time is BEFORE last recorded server time
      if (lastServerTimeStr) {
        const lastServerTime = new Date(lastServerTimeStr);
        if (now.getTime() < lastServerTime.getTime()) {
          console.warn('[SubscriptionService] Device clock manipulation detected!');
          sub.isClockTampered = true;
          sub.status = 'expired'; // Restrict usage until online verification
          return sub;
        }
      }

      // Check against local cached expiry
      const expiry = new Date(sub.expiryDate);
      if (now.getTime() >= expiry.getTime()) {
        sub.status = 'expired';
        sub.daysRemaining = 0;
      }

      return sub;
    } catch (e) {
      return null;
    }
  }
}
