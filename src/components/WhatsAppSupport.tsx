import React from 'react';
import { TouchableOpacity, Linking } from 'react-native';
import { Typography } from './Typography';
import { useTranslation } from 'react-i18next';
// Using generic lucide icon as whatsapp icon placeholder if missing
import { MessageCircle } from 'lucide-react-native';

const SUPPORT_WHATSAPP_NUMBER = '+1234567890'; // TODO: Move to Env Config

interface WhatsAppSupportProps {
  message?: string;
  className?: string;
}

export const WhatsAppSupport: React.FC<WhatsAppSupportProps> = ({ 
  message = "Hello Admin, I need help with Universal Shop Khata.",
  className = '' 
}) => {
  const { t } = useTranslation();

  const handlePress = () => {
    const url = `whatsapp://send?phone=${SUPPORT_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback or alert
        console.log('WhatsApp not installed');
      }
    });
  };

  return (
    <TouchableOpacity 
      className={`flex-row items-center justify-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 ${className}`}
      onPress={handlePress}
    >
      <MessageCircle size={20} color="#16a34a" />
      <Typography variant="body" className="text-green-700 dark:text-green-400 ml-2 font-medium">
        {t('common.contactSupport')}
      </Typography>
    </TouchableOpacity>
  );
};
