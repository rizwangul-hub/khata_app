import { Linking, Alert } from 'react-native';
import { formatCurrency } from '../utils/formatters';

export class ReminderService {
  public static generateReminderMessage(input: {
    customerName: string;
    amount: number;
    shopName: string;
    language?: 'en' | 'ur';
  }): string {
    const isUrdu = input.language === 'ur';
    const formattedAmount = formatCurrency(input.amount);

    if (isUrdu) {
      return `السلام علیکم ${input.customerName}،\nآپ کے ذمہ ${input.shopName} کے ${formattedAmount} بقایا ہیں۔\nبراہ کرم سہولت کے مطابق دکان سے رابطہ کریں۔ شکریہ!`;
    }

    return `Hello ${input.customerName},\nYour outstanding amount at ${input.shopName} is ${formattedAmount}.\nPlease contact the shop when convenient. Thank you!`;
  }

  public static async sendWhatsAppReminder(input: {
    phone: string;
    customerName: string;
    amount: number;
    shopName: string;
    language?: 'en' | 'ur';
  }): Promise<boolean> {
    if (!input.phone) {
      Alert.alert('Error', 'Customer phone number is required to send WhatsApp reminder.');
      return false;
    }

    const cleanPhone = input.phone.trim().replace(/[^0-9+]/g, '');
    const message = this.generateReminderMessage(input);
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('WhatsApp Not Found', 'WhatsApp is not installed on this device.');
        return false;
      }
    } catch (e) {
      console.error('[ReminderService] Error launching WhatsApp', e);
      Alert.alert('Error', 'Could not launch WhatsApp.');
      return false;
    }
  }
}
