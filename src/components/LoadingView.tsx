import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';
import { useTranslation } from 'react-i18next';

interface LoadingViewProps {
  message?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message }) => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 justify-center items-center bg-transparent">
      <ActivityIndicator size="large" color="#2563eb" />
      <Typography variant="body" className="text-gray-500 mt-4">
        {message || t('common.loading')}
      </Typography>
    </View>
  );
};
