import { create } from 'zustand';
import {
  createCustomerLocal,
  getCustomersLocal,
  updateCustomerLocal,
  softDeleteCustomerLocal,
  LocalCustomerInput,
} from '../services/customerRepository';
import { useAuthStore } from './authStore';

export type CustomerSortOption = 'recently_active' | 'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest';

export interface CustomerItem {
  id: string;
  shopId: string;
  customerCode?: string;
  name: string;
  phone?: string;
  address?: string;
  imageLocalUri?: string;
  imageRemoteUrl?: string;
  isArchived?: number | boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncStatus: 'pending' | 'synced' | 'failed';
}

interface CustomerState {
  customers: CustomerItem[];
  searchQuery: string;
  sortBy: CustomerSortOption;
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: CustomerSortOption) => void;
  fetchCustomers: () => Promise<void>;
  addCustomer: (input: Omit<LocalCustomerInput, 'shopId'>) => Promise<CustomerItem | null>;
  updateCustomer: (id: string, input: { name: string; phone?: string; address?: string; imageLocalUri?: string }) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  searchQuery: '',
  sortBy: 'recently_active',
  isLoading: false,

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().fetchCustomers();
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get().fetchCustomers();
  },

  fetchCustomers: async () => {
    const shopId = useAuthStore.getState().shopId || 'local_shop';

    set({ isLoading: true });
    try {
      const list = await getCustomersLocal(shopId, get().searchQuery, 'all', get().sortBy);
      set({ customers: list, isLoading: false });
    } catch (e) {
      console.error('Error fetching customers local', e);
      set({ isLoading: false });
    }
  },

  addCustomer: async (input) => {
    const shopId = useAuthStore.getState().shopId || 'local_shop';

    try {
      const created = await createCustomerLocal({ ...input, shopId });
      await get().fetchCustomers();
      return created as CustomerItem;
    } catch (e) {
      console.error('Error creating customer local', e);
      return null;
    }
  },

  updateCustomer: async (id, input) => {
    try {
      await updateCustomerLocal(id, input);
      await get().fetchCustomers();
      return true;
    } catch (e) {
      console.error('Error updating customer local', e);
      return false;
    }
  },

  deleteCustomer: async (id) => {
    try {
      await softDeleteCustomerLocal(id);
      await get().fetchCustomers();
      return true;
    } catch (e) {
      console.error('Error soft deleting customer local', e);
      return false;
    }
  },
}));
