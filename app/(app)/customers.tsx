import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { CustomerAvatar } from '@/src/components/CustomerAvatar';
import { StatusBadge } from '@/src/components/StatusBadge';
import { getCustomersLocal } from '@/src/services/customerRepository';
import { useAuthStore } from '@/src/state/authStore';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  Search,
  Plus,
  Users,
  ArrowUpDown,
  ChevronRight,
  Phone,
  Tag,
  CheckCircle,
  AlertCircle,
  Archive,
  X,
  Filter,
} from 'lucide-react-native';

export type CustomerFilter = 'all' | 'credit' | 'settled' | 'advance' | 'archived';
export type CustomerSort = 'recently_active' | 'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest';

export default function CustomersScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const shopId = useAuthStore((state) => state.shopId);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [sortBy, setSortBy] = useState<CustomerSort>('recently_active');
  const [isLoading, setIsLoading] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const isUrdu = i18n.language === 'ur';

  const loadCustomers = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const list = await getCustomersLocal(shopId, searchQuery, filter, sortBy);
      setCustomers(list);
    } catch (e) {
      console.error('Error loading customers', e);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, searchQuery, filter, sortBy]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filterTabs: { key: CustomerFilter; label: string; urdu: string }[] = [
    { key: 'all', label: 'All', urdu: 'تمام' },
    { key: 'credit', label: 'Outstanding', urdu: 'بقایا' },
    { key: 'settled', label: 'Settled', urdu: 'حساب برابر' },
    { key: 'advance', label: 'Advance', urdu: 'ایڈوانس' },
    { key: 'archived', label: 'Archived', urdu: 'محفوظ شدہ' },
  ];

  const sortOptions: { key: CustomerSort; label: string }[] = [
    { key: 'recently_active', label: 'Recently Active (حال ہی میں فعال)' },
    { key: 'balance_desc', label: 'Highest Outstanding (سب سے زیادہ ادھار)' },
    { key: 'balance_asc', label: 'Lowest Outstanding (سب سے کم ادھار)' },
    { key: 'name_asc', label: 'Name A-Z (نام الف تا ے)' },
    { key: 'name_desc', label: 'Name Z-A (نام ے تا الف)' },
    { key: 'newest', label: 'Newest Customer (نیا گاہک)' },
    { key: 'oldest', label: 'Oldest Customer (پرانا گاہک)' },
  ];

  const renderCustomerItem = ({ item }: { item: any }) => {
    const balance = item.balance || 0;

    let balanceText = `Rs. ${balance.toLocaleString()}`;
    let balanceClass = 'text-red-600 dark:text-red-400 font-extrabold';
    let statusLabel = isUrdu ? 'بقایا' : 'Outstanding';
    let statusBg = 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';

    if (balance === 0) {
      balanceText = `Rs. 0 (${isUrdu ? 'حساب برابر' : 'Settled'})`;
      balanceClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
      statusLabel = isUrdu ? 'حساب برابر' : 'Settled';
      statusBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
    } else if (balance < 0) {
      balanceText = `${isUrdu ? 'ایڈوانس' : 'Advance'}: Rs. ${Math.abs(balance).toLocaleString()}`;
      balanceClass = 'text-indigo-600 dark:text-indigo-400 font-bold';
      statusLabel = isUrdu ? 'ایڈوانس' : 'Advance';
      statusBg = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300';
    }

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/customer/${item.id}` as any)}
      >
        <Card className="mb-3 p-4 flex-row items-center">
          <CustomerAvatar name={item.name} imageUri={item.imageLocalUri} size={52} />

          <View className="flex-1 ml-3.5 justify-center">
            <View className="flex-row items-center justify-between mb-1">
              <Typography variant="h3" className="text-base font-bold text-gray-900 dark:text-gray-100 flex-1 mr-2" numberOfLines={1}>
                {item.name}
              </Typography>

              {item.isArchived ? (
                <View className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md flex-row items-center">
                  <Archive size={12} color="#6b7280" className="mr-1" />
                  <Typography variant="caption" className="text-gray-500 font-bold text-xs">
                    {isUrdu ? 'محفوظ' : 'Archived'}
                  </Typography>
                </View>
              ) : (
                <View className={`px-2 py-0.5 rounded-md ${statusBg}`}>
                  <Typography variant="caption" className="font-extrabold text-xs">
                    {statusLabel}
                  </Typography>
                </View>
              )}
            </View>

            <View className="flex-row items-center flex-wrap gap-2 mb-1">
              {item.customerCode ? (
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  <Tag size={11} color="#6b7280" className="mr-1" />
                  <Typography variant="caption" className="text-gray-600 dark:text-gray-400 font-mono text-xs font-semibold">
                    {item.customerCode}
                  </Typography>
                </View>
              ) : null}

              {item.phone ? (
                <View className="flex-row items-center">
                  <Phone size={12} color="#6b7280" className="mr-1" />
                  <Typography variant="caption" className="text-gray-600 dark:text-gray-400 font-medium">
                    {item.phone}
                  </Typography>
                </View>
              ) : null}
            </View>

            <Typography variant="body" className={`text-base mt-0.5 ${balanceClass}`}>
              {balanceText}
            </Typography>
          </View>

          <ChevronRight size={20} color="#9ca3af" className="ml-2" />
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      {/* Prominent Search Bar & Sort Toggle */}
      <View className="flex-row items-center mb-3 gap-2">
        <View className="flex-1 flex-row items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3.5 py-2.5 shadow-sm">
          <Search size={20} color="#9ca3af" className="mr-2" />
          <TextInput
            className="flex-1 text-gray-900 dark:text-gray-100 text-base"
            placeholder={isUrdu ? 'گاہک تلاش کریں (نام، فون، یا کوڈ)...' : 'Search customer by name, phone, code...'}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-2xl items-center justify-center shadow-sm"
          onPress={() => setShowSortModal(true)}
        >
          <ArrowUpDown size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Tabs */}
      <View className="mb-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const isActive = filter === item.key;
            return (
              <TouchableOpacity
                className={`px-4 py-2 rounded-xl mr-2 flex-row items-center border ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
                onPress={() => setFilter(item.key)}
              >
                <Typography
                  variant="caption"
                  className={`font-bold ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {isUrdu ? item.urdu : item.label}
                </Typography>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Customer List or Empty Search Result State */}
      {customers.length === 0 && !isLoading ? (
        <View className="flex-1 justify-center items-center p-4">
          <EmptyState
            title={searchQuery ? (isUrdu ? 'کوئی گاہک نہیں ملا' : 'No Customer Found') : t('customer.noCustomersYet')}
            description={
              searchQuery
                ? (isUrdu ? `"${searchQuery}" کے نام سے کوئی گاہک موجود نہیں ہے۔` : `No matching customer for "${searchQuery}".`)
                : t('customer.noCustomersSubtitle')
            }
            icon={<Users size={56} color="#2563eb" />}
          />
          <Button
            title={
              searchQuery
                ? `+ ${isUrdu ? 'نیا گاہک بنائیں' : 'Add New Customer'} "${searchQuery}"`
                : t('customer.addCustomer')
            }
            className="w-4/5 mt-4 py-3.5 bg-blue-600"
            onPress={() =>
              router.push({
                pathname: '/add-customer',
                params: { prefillName: searchQuery },
              } as any)
            }
          />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadCustomers} />}
          contentContainerStyle={{ paddingBottom: 90 }}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg active:opacity-90"
        onPress={() => router.push('/add-customer' as any)}
        activeOpacity={0.8}
      >
        <Plus size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Sorting Menu Modal */}
      <Modal visible={showSortModal} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View className="bg-white dark:bg-gray-800 rounded-t-3xl p-6 space-y-3">
            <View className="flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 mb-2">
              <Typography variant="h3">Sort Customers</Typography>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {sortOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                  sortBy === opt.key
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-500'
                    : 'border-gray-100 dark:border-gray-700'
                }`}
                onPress={() => {
                  setSortBy(opt.key);
                  setShowSortModal(false);
                }}
              >
                <Typography
                  variant="body"
                  className={`font-semibold ${sortBy === opt.key ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-800 dark:text-gray-200'}`}
                >
                  {opt.label}
                </Typography>
                {sortBy === opt.key && <CheckCircle size={18} color="#2563eb" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
