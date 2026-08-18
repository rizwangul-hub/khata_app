import React from 'react';
import { View, Image } from 'react-native';
import { Typography } from './Typography';
import { User } from 'lucide-react-native';

interface CustomerAvatarProps {
  name: string;
  imageUri?: string | null;
  size?: number;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({ 
  name, 
  imageUri, 
  size = 48 
}) => {
  // Extract initials (e.g. "Muhammad Ali" -> "MA", "Tariq" -> "T")
  const getInitials = (str: string) => {
    if (!str) return '?';
    const parts = str.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const containerStyle = { width: size, height: size, borderRadius: size / 2 };

  if (imageUri && imageUri.trim() !== '') {
    return (
      <Image 
        source={{ uri: imageUri }} 
        style={containerStyle} 
        className="bg-gray-200 dark:bg-gray-700" 
      />
    );
  }

  return (
    <View 
      style={containerStyle} 
      className="bg-blue-100 dark:bg-blue-900/50 items-center justify-center border border-blue-200 dark:border-blue-800"
    >
      {initials ? (
        <Typography 
          style={{ fontSize: size * 0.4 }} 
          className="font-bold text-blue-600 dark:text-blue-400"
        >
          {initials}
        </Typography>
      ) : (
        <User size={size * 0.5} color="#2563eb" />
      )}
    </View>
  );
};
