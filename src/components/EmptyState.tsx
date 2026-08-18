import React from 'react';
import { View } from 'react-native';
import { Typography } from './Typography';
import { FolderOpen } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon = <FolderOpen size={48} color="#9ca3af" /> 
}) => {
  return (
    <View className="flex-1 justify-center items-center py-12 px-6">
      <View className="mb-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
        {icon}
      </View>
      <Typography variant="h3" className="text-center text-gray-800 dark:text-gray-200">
        {title}
      </Typography>
      <Typography variant="body" className="text-center text-gray-500 mt-2">
        {description}
      </Typography>
    </View>
  );
};
