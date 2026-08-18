import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Card } from './Card';
import { Typography } from './Typography';
import { CustomerAvatar } from './CustomerAvatar';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Phone } from 'lucide-react-native';

interface CustomerBalanceCardProps {
  customer: {
    id: string;
    name: string;
    phone?: string;
    imageLocalUri?: string;
    balance?: number;
    syncStatus?: string;
  };
  onPress: () => void;
}

export const CustomerBalanceCard: React.FC<CustomerBalanceCardProps> = ({ 
  customer, 
  onPress 
}) => {
  const { t } = useTranslation();
  const balance = customer.balance || 0;

  let balanceText = `Rs. ${balance.toLocaleString()}`;
  let balanceClass = 'text-red-600 dark:text-red-400 font-extrabold';
  let balanceLabel = t('ledger.outstandingBalance');

  if (balance === 0) {
    balanceText = t('ledger.settled');
    balanceClass = 'text-green-600 dark:text-green-400 font-semibold';
    balanceLabel = t('ledger.settled');
  } else if (balance < 0) {
    balanceText = `Rs. ${Math.abs(balance).toLocaleString()}`;
    balanceClass = 'text-blue-600 dark:text-blue-400 font-semibold';
    balanceLabel = t('ledger.advance');
  }

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card className="mb-3 flex-row items-center p-4">
        <CustomerAvatar name={customer.name} imageUri={customer.imageLocalUri} size={50} />

        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row items-center justify-between mb-1">
            <Typography variant="h3" className="text-base font-bold text-gray-900 dark:text-gray-100 flex-1 mr-2" numberOfLines={1}>
              {customer.name}
            </Typography>
            {customer.syncStatus === 'pending' && (
              <StatusBadge status="pending" label={t('customer.waitingToSync')} />
            )}
          </View>

          {customer.phone ? (
            <View className="flex-row items-center">
              <Phone size={14} color="#6b7280" className="mr-1" />
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400 font-medium">
                {customer.phone}
              </Typography>
            </View>
          ) : null}
        </View>

        <View className="items-end flex-row items-center ml-2">
          <View className="items-end mr-2">
            <Typography variant="body" className={`text-base ${balanceClass}`}>
              {balanceText}
            </Typography>
            <Typography variant="caption" className="text-gray-400 uppercase font-medium">
              {balanceLabel}
            </Typography>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </Card>
    </TouchableOpacity>
  );
};
