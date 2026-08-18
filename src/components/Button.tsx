import React from 'react';
import { TouchableOpacity, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { Typography } from './Typography';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled, 
  ...props 
}) => {
  let bgClass = 'bg-blue-600';
  let textClass = 'text-white';

  if (variant === 'secondary') {
    bgClass = 'bg-gray-200 dark:bg-gray-800';
    textClass = 'text-gray-900 dark:text-gray-100';
  } else if (variant === 'outline') {
    bgClass = 'bg-transparent border-2 border-blue-600';
    textClass = 'text-blue-600';
  }

  if (disabled || isLoading) {
    bgClass += ' opacity-60';
  }

  return (
    <TouchableOpacity 
      className={`rounded-xl py-4 px-6 flex-row justify-center items-center ${bgClass} ${className}`} 
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#2563eb' : '#ffffff'} className="mr-2" />
      ) : null}
      <Typography weight="medium" className={`text-center text-lg ${textClass}`}>
        {title}
      </Typography>
    </TouchableOpacity>
  );
};
