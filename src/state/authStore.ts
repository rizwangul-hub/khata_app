import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/apiClient';
import { saveShopLocal, getShopLocal } from '../database/db';
import { MobileSubscriptionService } from '../services/subscriptionService';

export interface ShopInfo {
  id: string;
  shopName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  image?: string;
  licenseId: string;
  shopCode: string;
}

export interface SubscriptionInfo {
  planType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'suspended';
  daysRemaining: number;
  isClockTampered?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  licenseId: string | null;
  shopId: string | null;
  token: string | null;
  shop: ShopInfo | null;
  subscription: SubscriptionInfo | null;
  error: string | null;
  loginApi: (licenseId: string, password: string) => Promise<{ success: boolean; errorCode?: string; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  updateShopInfo: (shop: ShopInfo) => void;
  clearError: () => void;
}

const SECURE_STORE_KEYS = {
  LICENSE_ID: 'licenseId',
  TOKEN: 'token',
  SHOP_ID: 'shopId',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  licenseId: null,
  shopId: null,
  token: null,
  shop: null,
  subscription: null,
  error: null,

  clearError: () => set({ error: null }),

  updateShopInfo: (updatedShop: ShopInfo) => {
    set({ shop: updatedShop });
  },

  loginApi: async (licenseIdInput: string, passwordInput: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', {
        licenseId: licenseIdInput,
        password: passwordInput,
      });

      const { token, shop, subscription } = response.data;

      // Save securely
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.LICENSE_ID, shop.licenseId);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.TOKEN, token);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.SHOP_ID, shop.id);

      // Save to local SQLite for offline resilience
      await saveShopLocal({
        shopId: shop.id,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        phone: shop.phone,
        address: shop.address,
        image: shop.image,
        licenseId: shop.licenseId,
        shopCode: shop.shopCode,
        subscriptionPlan: subscription.planType,
        subscriptionStartDate: subscription.startDate,
        subscriptionExpiryDate: subscription.expiryDate,
        accountStatus: subscription.status,
      });

      // Cache Mobile Subscription Service
      await MobileSubscriptionService.cacheSubscriptionStatus({
        plan: subscription.planType,
        status: subscription.status,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        daysRemaining: subscription.daysRemaining,
        serverTime: new Date().toISOString(),
      });

      set({
        isAuthenticated: true,
        isLoading: false,
        token,
        licenseId: shop.licenseId,
        shopId: shop.id,
        shop: {
          id: shop.id,
          shopName: shop.shopName,
          ownerName: shop.ownerName,
          phone: shop.phone,
          address: shop.address,
          image: shop.image,
          licenseId: shop.licenseId,
          shopCode: shop.shopCode,
        },
        subscription: {
          planType: subscription.planType,
          startDate: subscription.startDate,
          expiryDate: subscription.expiryDate,
          status: subscription.status,
          daysRemaining: subscription.daysRemaining,
        },
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      if (err.response) {
        const data = err.response.data;
        const code = data?.code || 'SERVER_ERROR';
        const message = data?.message || 'Authentication failed';
        set({ error: code });
        return { success: false, errorCode: code, message };
      } else if (err.request) {
        set({ error: 'NETWORK_ERROR' });
        return { success: false, errorCode: 'NETWORK_ERROR' };
      } else {
        set({ error: 'UNKNOWN_ERROR' });
        return { success: false, errorCode: 'UNKNOWN_ERROR' };
      }
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.LICENSE_ID);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.SHOP_ID);
    } catch (e) {
      console.error('Error clearing secure store on logout', e);
    }

    set({
      isAuthenticated: false,
      isLoading: false,
      licenseId: null,
      shopId: null,
      token: null,
      shop: null,
      subscription: null,
      error: null,
    });
  },

  refreshSubscription: async () => {
    const sub = await MobileSubscriptionService.fetchSubscriptionStatus();
    if (sub) {
      set((state) => ({
        subscription: {
          planType: (sub.plan as any) || state.subscription?.planType || 'monthly',
          startDate: sub.startDate || state.subscription?.startDate,
          expiryDate: sub.expiryDate || state.subscription?.expiryDate,
          status: sub.status,
          daysRemaining: sub.daysRemaining,
          isClockTampered: sub.isClockTampered,
        },
      }));
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.TOKEN);
      const licenseId = await SecureStore.getItemAsync(SECURE_STORE_KEYS.LICENSE_ID);
      const shopId = await SecureStore.getItemAsync(SECURE_STORE_KEYS.SHOP_ID);

      if (token && licenseId && shopId) {
        let cachedShop = await getShopLocal(shopId);

        let shopObj: ShopInfo = {
          id: shopId,
          shopName: cachedShop?.shopName || 'My Shop',
          ownerName: cachedShop?.ownerName || '',
          phone: cachedShop?.phone || '',
          address: cachedShop?.address || '',
          image: cachedShop?.shopImage || '',
          licenseId: cachedShop?.licenseId || licenseId,
          shopCode: cachedShop?.shopCode || 'SHOP-00000',
        };

        let subObj: SubscriptionInfo = {
          planType: cachedShop?.subscriptionPlan || 'monthly',
          startDate: cachedShop?.subscriptionStartDate || '',
          expiryDate: cachedShop?.subscriptionExpiryDate || '',
          status: (cachedShop?.accountStatus as any) || 'active',
          daysRemaining: 30,
        };

        // Anti-tamper & cache check
        const mobileSub = await MobileSubscriptionService.getCachedSubscriptionStatus();
        if (mobileSub) {
          subObj.status = mobileSub.status;
          subObj.daysRemaining = mobileSub.daysRemaining;
          subObj.isClockTampered = mobileSub.isClockTampered;
        }

        set({
          isAuthenticated: true,
          isLoading: false,
          token,
          licenseId,
          shopId,
          shop: shopObj,
          subscription: subObj,
        });

        // Background update if online
        MobileSubscriptionService.fetchSubscriptionStatus().then((res) => {
          if (res) {
            set((state) => ({
              subscription: {
                planType: (res.plan as any) || state.subscription?.planType || 'monthly',
                startDate: res.startDate || state.subscription?.startDate,
                expiryDate: res.expiryDate || state.subscription?.expiryDate,
                status: res.status,
                daysRemaining: res.daysRemaining,
                isClockTampered: res.isClockTampered,
              },
            }));
          }
        });

        return true;
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
          token: null,
          licenseId: null,
          shopId: null,
          shop: null,
          subscription: null,
        });
        return false;
      }
    } catch (e) {
      set({ isAuthenticated: false, isLoading: false });
      return false;
    }
  },
}));
