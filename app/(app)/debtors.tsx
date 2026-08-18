import React, { useEffect, useState } from 'react';
import { View, FlatList, TextInput, RefreshControl } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { CustomerBalanceCard } from '@/src/components/CustomerBalanceCard';
import { EmptyState } from '@/src/components/EmptyState';
import { getCustomersWithBalancesLocal } from '@/src/services/ledgerRepository';
import { useAuthStore } from '@/src/state/authStore';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Search, Users } from 'lucide-react-native';

export default function DebtorsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const shopId = useAuthStore(state => state.shopId);
  const [debtors, setDebtors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadDebtors = async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const list = await getCustomersWithBalancesLocal(shopId, 'credit', search);
      setDebtors(list);
    } catch (e) {
      console.error('Error loading debtors', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDebtors();
  }, [shopId, search]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      {/* Search Input */}
      <View className="flex-row items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 mb-4">
        <Search size={20} color="#9ca3af" className="mr-2" />
        <TextInput
          className="flex-1 text-gray-900 dark:text-gray-100 text-base"
          placeholder={t('customer.searchCustomers')}
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Debtors List or Empty State */}
      {debtors.length === 0 && !isLoading ? (
        <View className="flex-1 justify-center items-center">
          <EmptyState
            title={t('dashboard.allAccountsSettled')}
            description="No customers with outstanding credit found."
            icon={<Users size={56} color="#16a34a" />}
          />
        </View>
      ) : (
        <FlatList
          data={debtors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomerBalanceCard
              customer={item}
              onPress={() => router.push(`/(app)/customer/${item.id}` as any)}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadDebtors} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}
