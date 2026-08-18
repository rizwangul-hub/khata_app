import React from 'react';
import { View } from 'react-native';
import { Typography } from './Typography';
import { AlertCircle } from 'lucide-react-native';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <View className="flex-row items-center bg-red-50 p-4 rounded-xl border border-red-100 dark:bg-red-900/20 dark:border-red-900/50">
      <AlertCircle size={20} color="#ef4444" />
      <Typography variant="body" className="text-red-600 dark:text-red-400 ml-3 flex-1">
        {message}
      </Typography>
    </View>
  );
};
