import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { CustomerBalanceCard } from '@/src/components/CustomerBalanceCard';
import { getCustomersWithBalancesLocal } from '@/src/services/ledgerRepository';
import { getDashboardMetrics } from '@/src/services/dashboardRepository';
import { useAuthStore } from '@/src/state/authStore';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { BookOpen, Search, ArrowUpDown } from 'lucide-react-native';

export default function KhataScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const shopId = useAuthStore(state => state.shopId);
  const [khataCustomers, setKhataCustomers] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'settled' | 'advance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState({ totalCredit: 0, totalReceived: 0, totalCustomerDebt: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const loadKhataData = async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const metrics = await getDashboardMetrics(shopId);
      setSummary({
        totalCredit: metrics.totalCredit,
        totalReceived: metrics.totalReceived,
        totalCustomerDebt: metrics.totalCustomerDebt,
      });

      const list = await getCustomersWithBalancesLocal(shopId, filter, searchQuery);
      setKhataCustomers(list);
    } catch (e) {
      console.error('Error loading khata data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKhataData();
  }, [shopId, filter, searchQuery]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      {/* Summary Header Card */}
      <Card className="p-4 mb-4 bg-white dark:bg-gray-800">
        <Typography variant="caption" className="text-gray-400 uppercase font-bold text-center mb-1">
          {t('ledger.outstandingBalance')}
        </Typography>
        <Typography variant="h1" className="text-3xl font-extrabold text-center text-red-600 dark:text-red-400 mb-3">
          Rs. {summary.totalCustomerDebt.toLocaleString()}
        </Typography>

        <View className="flex-row justify-around border-t border-gray-100 dark:border-gray-700 pt-3">
          <View className="items-center">
            <Typography variant="caption" className="text-gray-400 font-medium">
              {t('ledger.totalCredit')}
            </Typography>
            <Typography variant="body" className="font-bold text-red-500">
              Rs. {summary.totalCredit.toLocaleString()}
            </Typography>
          </View>

          <View className="w-px bg-gray-200 dark:bg-gray-700" />

          <View className="items-center">
            <Typography variant="caption" className="text-gray-400 font-medium">
              {t('ledger.totalPaid')}
            </Typography>
            <Typography variant="body" className="font-bold text-green-600">
              Rs. {summary.totalReceived.toLocaleString()}
            </Typography>
          </View>
        </View>
      </Card>

      {/* Search Input */}
      <View className="flex-row items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 mb-3">
        <Search size={20} color="#9ca3af" className="mr-2" />
        <TextInput
          className="flex-1 text-gray-900 dark:text-gray-100 text-base"
          placeholder={t('customer.searchCustomers')}
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-xl items-center border ${
            filter === 'all'
              ? 'bg-blue-600 border-blue-600'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
          onPress={() => setFilter('all')}
        >
          <Typography
            variant="caption"
            className={`font-bold ${filter === 'all' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
          >
            {t('ledger.allCustomers')}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 rounded-xl items-center border ${
            filter === 'credit'
              ? 'bg-red-600 border-red-600'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
          onPress={() => setFilter('credit')}
        >
          <Typography
            variant="caption"
            className={`font-bold ${filter === 'credit' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
          >
            {t('ledger.customersWithCredit')}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 rounded-xl items-center border ${
            filter === 'settled'
              ? 'bg-green-600 border-green-600'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
          onPress={() => setFilter('settled')}
        >
          <Typography
            variant="caption"
            className={`font-bold ${filter === 'settled' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
          >
            {t('ledger.settledCustomers')}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 rounded-xl items-center border ${
            filter === 'advance'
              ? 'bg-blue-800 border-blue-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
          onPress={() => setFilter('advance')}
        >
          <Typography
            variant="caption"
            className={`font-bold ${filter === 'advance' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
          >
            {t('ledger.advanceCustomers')}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Khata List or Empty State */}
      {khataCustomers.length === 0 && !isLoading ? (
        <View className="flex-1 justify-center items-center">
          <EmptyState
            title={t('ledger.noTransactionsYet')}
            description="No customers match the selected Khata filter."
            icon={<BookOpen size={56} color="#2563eb" />}
          />
        </View>
      ) : (
        <FlatList
          data={khataCustomers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomerBalanceCard
              customer={item}
              onPress={() => router.push(`/(app)/customer/${item.id}` as any)}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadKhataData} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}
