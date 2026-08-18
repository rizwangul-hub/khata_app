import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Typography } from '@/src/components/Typography';
import { StatusBadge } from '@/src/components/StatusBadge';
import { CustomerBalanceCard } from '@/src/components/CustomerBalanceCard';
import { CustomerSelectorModal } from '@/src/components/CustomerSelectorModal';
import { WhatsAppSupport } from '@/src/components/WhatsAppSupport';
import { useAuthStore } from '@/src/state/authStore';
import { useAppStore } from '@/src/state/appStore';
import {
  getDashboardMetrics,
  getTopDebtors,
  getRecentActivity,
  DashboardMetrics,
} from '@/src/services/dashboardRepository';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  Users,
  Store,
  ShieldAlert,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Plus,
  Lock,
} from 'lucide-react-native';

export default function Dashboard() {
  const { t } = useTranslation();
  const router = useRouter();

  const shop = useAuthStore(state => state.shop);
  const subscription = useAuthStore(state => state.subscription);
  const shopId = useAuthStore(state => state.shopId);
  const logout = useAuthStore(state => state.logout);
  const syncStatus = useAppStore(state => state.syncStatus);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomerDebt: 0,
    totalCustomers: 0,
    totalCredit: 0,
    totalReceived: 0,
    todayCredit: 0,
    todayReceived: 0,
  });
  const [topDebtors, setTopDebtors] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action Modal states
  const [modalMode, setModalMode] = useState<'credit' | 'payment' | null>(null);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const loadDashboardData = async () => {
    if (!shopId) return;
    setRefreshing(true);
    try {
      const data = await getDashboardMetrics(shopId);
      const debtors = await getTopDebtors(shopId, 5);
      const activity = await getRecentActivity(shopId, 5);

      setMetrics(data);
      setTopDebtors(debtors);
      setRecentActivity(activity);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [shopId]);

  // Handle Expired or Suspended Account Block
  const isAccountBlocked = subscription?.status === 'expired' || subscription?.status === 'suspended';

  if (isAccountBlocked) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-slate-50 dark:bg-slate-900">
        <Card className="p-6 items-center w-full">
          <View className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full items-center justify-center mb-4">
            <Lock size={36} color="#ef4444" />
          </View>
          <Typography variant="h2" className="text-red-600 text-center mb-2">
            {subscription?.status === 'suspended'
              ? 'Account Suspended'
              : t('subscription.expired')}
          </Typography>
          <Typography variant="body" className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {subscription?.status === 'suspended'
              ? t('auth.accountSuspended')
              : t('auth.planExpired')}
          </Typography>
          <WhatsAppSupport
            className="mb-4"
            message="Hello Admin, my Universal Shop Khata plan has expired. Please help renew it."
          />
          <Button title={t('common.logout')} variant="secondary" onPress={logout} />
        </Card>
      </View>
    );
  }

  const isWarningVisible = subscription && subscription.daysRemaining <= 7 && subscription.status === 'active';

  const handleSelectCustomerForQuickAction = (selectedCustomerId: string) => {
    if (modalMode === 'credit') {
      router.push({ pathname: '/(app)/add-credit', params: { customerId: selectedCustomerId } } as any);
    } else if (modalMode === 'payment') {
      router.push({ pathname: '/(app)/add-payment', params: { customerId: selectedCustomerId } } as any);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} />}
    >
      {/* Header Section */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 mr-2">
          <Typography variant="caption" className="text-blue-600 font-bold uppercase tracking-wider">
            {getTimeGreeting()}, {shop?.ownerName || 'Shopkeeper'}
          </Typography>
          <Typography variant="h2" numberOfLines={1}>
            {shop?.shopName || 'Universal Store'}
          </Typography>
        </View>

        <View className="items-end">
          <StatusBadge status={syncStatus as any} label={t(`status.${syncStatus}`)} />
        </View>
      </View>

      {/* Subscription Expiry Warning Banner */}
      {isWarningVisible && (
        <Card className="mb-4 bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <ShieldAlert size={20} color="#f97316" className="mr-2" />
            <Typography variant="caption" className="text-orange-800 dark:text-orange-300 font-medium">
              {t('subscription.expiryWarning', { count: subscription.daysRemaining })}
            </Typography>
          </View>
          <Button
            title="Renew"
            variant="secondary"
            className="py-1 px-3"
            onPress={() => router.push('/(app)/subscription' as any)}
          />
        </Card>
      )}

      {/* DOMINANT MAIN CARD: Total Customer Credit */}
      <Card className="p-6 mb-4 bg-blue-600 dark:bg-blue-700 shadow-xl rounded-2xl">
        <Typography variant="caption" className="text-blue-100 font-bold uppercase tracking-widest text-center mb-1">
          {t('dashboard.totalCustomerCredit')}
        </Typography>

        <Typography variant="h1" className="text-white text-4xl font-extrabold text-center my-2">
          Rs. {metrics.totalCustomerDebt.toLocaleString()}
        </Typography>

        <Typography variant="caption" className="text-blue-200 text-center font-medium">
          Total money to collect from customers
        </Typography>
      </Card>

      {/* Secondary Metrics Grid */}
      <View className="flex-row mb-6 gap-3">
        <Card className="flex-1 items-center justify-center py-4 bg-white dark:bg-gray-800">
          <Users size={24} color="#2563eb" className="mb-1" />
          <Typography variant="h3">{metrics.totalCustomers}</Typography>
          <Typography variant="caption" className="text-gray-500 font-medium text-center">
            {t('dashboard.totalCustomers')}
          </Typography>
        </Card>

        <Card className="flex-1 items-center justify-center py-4 bg-white dark:bg-gray-800">
          <Typography variant="h3" className="text-red-500 mb-1">
            Rs. {metrics.totalCredit.toLocaleString()}
          </Typography>
          <Typography variant="caption" className="text-gray-500 font-medium text-center">
            {t('dashboard.totalCredit')}
          </Typography>
        </Card>

        <Card className="flex-1 items-center justify-center py-4 bg-white dark:bg-gray-800">
          <Typography variant="h3" className="text-green-600 mb-1">
            Rs. {metrics.totalReceived.toLocaleString()}
          </Typography>
          <Typography variant="caption" className="text-gray-500 font-medium text-center">
            {t('dashboard.totalReceived')}
          </Typography>
        </Card>
      </View>

      {/* Quick Action Bar */}
      <Card className="mb-6 p-4">
        <Typography variant="h3" className="mb-3">
          {t('dashboard.quickActions')}
        </Typography>
        <View className="flex-row gap-2">
          <Button
            title={`+ ${t('customer.addCustomer')}`}
            className="flex-1 py-3 bg-blue-600"
            onPress={() => router.push('/(app)/add-customer' as any)}
          />
          <Button
            title={`+ ${t('dashboard.quickAddCredit')}`}
            className="flex-1 py-3 bg-red-600"
            onPress={() => setModalMode('credit')}
          />
          <Button
            title={`+ ${t('dashboard.quickAddPayment')}`}
            className="flex-1 py-3 bg-green-600"
            onPress={() => setModalMode('payment')}
          />
        </View>
      </Card>

      {/* Top Debtors Section */}
      <View className="flex-row items-center justify-between mb-3">
        <Typography variant="h3">{t('dashboard.topDebtors')}</Typography>
        {topDebtors.length > 0 && (
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.push('/(app)/debtors' as any)}
          >
            <Typography variant="caption" className="text-blue-600 font-bold mr-1">
              {t('dashboard.viewAll')}
            </Typography>
            <ChevronRight size={16} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>

      {topDebtors.length === 0 ? (
        <Card className="p-6 mb-6 items-center">
          <Typography variant="body" className="text-gray-500 text-center">
            {metrics.totalCustomers === 0
              ? t('dashboard.addFirstCustomer')
              : t('dashboard.allAccountsSettled')}
          </Typography>
        </Card>
      ) : (
        <View className="mb-6">
          {topDebtors.map((debtor) => (
            <CustomerBalanceCard
              key={debtor.id}
              customer={debtor}
              onPress={() => router.push(`/(app)/customer/${debtor.id}` as any)}
            />
          ))}
        </View>
      )}

      {/* Recent Activity Section */}
      {recentActivity.length > 0 && (
        <View className="mb-8">
          <Typography variant="h3" className="mb-3">
            {t('dashboard.recentActivity')}
          </Typography>

          <Card className="p-2">
            {recentActivity.map((act) => {
              const isCredit = act.type === 'credit';
              return (
                <TouchableOpacity
                  key={act.id}
                  className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  onPress={() => router.push(`/(app)/transaction/${act.id}` as any)}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
                        isCredit ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight size={18} color="#ef4444" />
                      ) : (
                        <ArrowDownLeft size={18} color="#16a34a" />
                      )}
                    </View>

                    <View className="flex-1">
                      <Typography variant="body" className="font-bold" numberOfLines={1}>
                        {act.customerName || 'Customer'}
                      </Typography>
                      <Typography variant="caption" className="text-gray-400">
                        {isCredit ? act.itemName || t('ledger.credit') : t('ledger.payment')} • {formatDate(act.transactionDate)}
                      </Typography>
                    </View>
                  </View>

                  <Typography
                    variant="body"
                    className={`font-extrabold ${isCredit ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {isCredit ? '+' : '-'} Rs. {act.amount.toLocaleString()}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>
      )}

      {/* Search & Select Customer Modal for Quick Actions */}
      <CustomerSelectorModal
        visible={Boolean(modalMode)}
        title={modalMode === 'credit' ? t('ledger.addCredit') : t('ledger.addPayment')}
        onSelectCustomer={handleSelectCustomerForQuickAction}
        onClose={() => setModalMode(null)}
      />
    </ScrollView>
  );
}
