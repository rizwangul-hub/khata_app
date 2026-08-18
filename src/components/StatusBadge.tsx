import React from 'react';
import { View } from 'react-native';
import { Typography } from './Typography';

interface StatusBadgeProps {
  status: 'active' | 'expired' | 'suspended' | 'pending' | 'synced' | 'failed';
  label: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  let bgColor = 'bg-gray-100 dark:bg-gray-800';
  let textColor = 'text-gray-600 dark:text-gray-400';

  if (status === 'active' || status === 'synced') {
    bgColor = 'bg-green-100 dark:bg-green-900/30';
    textColor = 'text-green-700 dark:text-green-400';
  } else if (status === 'expired' || status === 'failed') {
    bgColor = 'bg-red-100 dark:bg-red-900/30';
    textColor = 'text-red-700 dark:text-red-400';
  } else if (status === 'suspended' || status === 'pending') {
    bgColor = 'bg-orange-100 dark:bg-orange-900/30';
    textColor = 'text-orange-700 dark:text-orange-400';
  }

  return (
    <View className={`px-2 py-1 rounded-md ${bgColor} self-start`}>
      <Typography variant="caption" className={`font-medium ${textColor}`}>
        {label}
      </Typography>
    </View>
  );
};
