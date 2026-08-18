import { create } from 'zustand';
import {
  createLedgerLocal,
  getLedgerByCustomerLocal,
  getCustomerBalanceSummaryLocal,
  getShopTotalDebtLocal,
  getCustomersWithBalancesLocal,
  updateLedgerLocal,
  softDeleteLedgerLocal,
  LocalLedgerInput,
} from '../services/ledgerRepository';
import { useAuthStore } from './authStore';
import { useCustomerStore } from './customerStore';

export interface LedgerTransactionItem {
  id: string;
  shopId: string;
  customerId: string;
  type: 'credit' | 'payment';
  itemName?: string;
  amount: number;
  weight?: number;
  weightUnit?: string;
  notes?: string;
  billLocalUri?: string;
  billRemoteUrl?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface CustomerBalanceSummary {
  totalCredit: number;
  totalPaid: number;
  balance: number;
}

interface LedgerState {
  customerTransactions: LedgerTransactionItem[];
  activeCustomerSummary: CustomerBalanceSummary;
  totalShopDebt: number;
  khataCustomers: any[];
  khataFilter: 'all' | 'credit' | 'settled' | 'advance';
  isLoading: boolean;
  setKhataFilter: (filter: 'all' | 'credit' | 'settled' | 'advance') => void;
  fetchCustomerLedger: (customerId: string) => Promise<void>;
  fetchKhataCustomers: (searchQuery?: string) => Promise<void>;
  fetchTotalShopDebt: () => Promise<void>;
  addCredit: (input: Omit<LocalLedgerInput, 'shopId' | 'type'>) => Promise<boolean>;
  addPayment: (input: Omit<LocalLedgerInput, 'shopId' | 'type'>) => Promise<boolean>;
  updateTransaction: (id: string, input: any) => Promise<boolean>;
  deleteTransaction: (id: string, customerId: string) => Promise<boolean>;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  customerTransactions: [],
  activeCustomerSummary: { totalCredit: 0, totalPaid: 0, balance: 0 },
  totalShopDebt: 0,
  khataCustomers: [],
  khataFilter: 'all',
  isLoading: false,

  setKhataFilter: (khataFilter) => {
    set({ khataFilter });
    get().fetchKhataCustomers();
  },

  fetchCustomerLedger: async (customerId: string) => {
    set({ isLoading: true });
    try {
      const transactions = await getLedgerByCustomerLocal(customerId);
      const summary = await getCustomerBalanceSummaryLocal(customerId);
      set({
        customerTransactions: transactions,
        activeCustomerSummary: summary,
        isLoading: false,
      });
    } catch (e) {
      console.error('Error fetching customer ledger local', e);
      set({ isLoading: false });
    }
  },

  fetchKhataCustomers: async (searchQuery: string = '') => {
    const shopId = useAuthStore.getState().shopId;
    if (!shopId) return;

    set({ isLoading: true });
    try {
      const list = await getCustomersWithBalancesLocal(shopId, get().khataFilter, searchQuery);
      set({ khataCustomers: list, isLoading: false });
    } catch (e) {
      console.error('Error fetching khata customers local', e);
      set({ isLoading: false });
    }
  },

  fetchTotalShopDebt: async () => {
    const shopId = useAuthStore.getState().shopId;
    if (!shopId) return;

    try {
      const debt = await getShopTotalDebtLocal(shopId);
      set({ totalShopDebt: debt });
    } catch (e) {
      console.error('Error calculating total shop debt local', e);
    }
  },

  addCredit: async (input) => {
    const shopId = useAuthStore.getState().shopId;
    if (!shopId) return false;

    try {
      await createLedgerLocal({ ...input, shopId, type: 'credit' });
      await get().fetchCustomerLedger(input.customerId);
      await get().fetchTotalShopDebt();
      useCustomerStore.getState().fetchCustomers();
      return true;
    } catch (e) {
      console.error('Error adding credit local', e);
      return false;
    }
  },

  addPayment: async (input) => {
    const shopId = useAuthStore.getState().shopId;
    if (!shopId) return false;

    try {
      await createLedgerLocal({ ...input, shopId, type: 'payment' });
      await get().fetchCustomerLedger(input.customerId);
      await get().fetchTotalShopDebt();
      useCustomerStore.getState().fetchCustomers();
      return true;
    } catch (e) {
      console.error('Error adding payment local', e);
      return false;
    }
  },

  updateTransaction: async (id, input) => {
    try {
      await updateLedgerLocal(id, input);
      if (input.customerId) {
        await get().fetchCustomerLedger(input.customerId);
      }
      await get().fetchTotalShopDebt();
      useCustomerStore.getState().fetchCustomers();
      return true;
    } catch (e) {
      console.error('Error updating transaction local', e);
      return false;
    }
  },

  deleteTransaction: async (id, customerId) => {
    try {
      await softDeleteLedgerLocal(id);
      await get().fetchCustomerLedger(customerId);
      await get().fetchTotalShopDebt();
      useCustomerStore.getState().fetchCustomers();
      return true;
    } catch (e) {
      console.error('Error deleting transaction local', e);
      return false;
    }
  },
}));
