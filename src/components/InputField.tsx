import React, { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  error, 
  isPassword = false, 
  className = '', 
  ...props 
}) => {
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View className={`mb-4 ${className}`}>
      <Typography variant="caption" className="mb-2 uppercase font-medium">
        {label}
      </Typography>
      <View className="relative justify-center">
        <TextInput 
          className={`border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${isPassword ? 'pr-12' : ''}`}
          placeholderTextColor="#9ca3af"
          secureTextEntry={isSecure}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity 
            className="absolute right-4"
            onPress={() => setIsSecure(!isSecure)}
          >
            {isSecure ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Typography variant="caption" className="text-red-500 mt-1">
          {error}
        </Typography>
      ) : null}
    </View>
  );
};
