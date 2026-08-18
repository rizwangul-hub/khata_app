import React from 'react';
import { Text, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  weight?: 'normal' | 'medium' | 'bold';
  className?: string;
}

export const Typography: React.FC<TypographyProps> = ({ 
  variant = 'body', 
  weight = 'normal',
  className = '', 
  children, 
  ...props 
}) => {
  let baseStyle = 'text-gray-900 dark:text-gray-100';
  
  if (variant === 'h1') baseStyle += ' text-3xl font-bold mb-4';
  if (variant === 'h2') baseStyle += ' text-2xl font-bold mb-3';
  if (variant === 'h3') baseStyle += ' text-xl font-semibold mb-2';
  if (variant === 'body') baseStyle += ' text-base';
  if (variant === 'caption') baseStyle += ' text-sm text-gray-500';

  if (weight === 'bold') baseStyle = baseStyle.replace('font-normal', 'font-bold');
  if (weight === 'medium') baseStyle = baseStyle.replace('font-normal', 'font-medium');

  return (
    <Text className={`${baseStyle} ${className}`} {...props}>
      {children}
    </Text>
  );
};
