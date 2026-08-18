import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_LOCK_ENABLED_KEY = '@khata_app_lock_enabled';
const APP_LOCK_PIN_KEY = '@khata_app_lock_pin';

export class AppLockService {
  public static async isLockEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(APP_LOCK_ENABLED_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  }

  public static async enableLock(pin: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(APP_LOCK_PIN_KEY, pin);
      await AsyncStorage.setItem(APP_LOCK_ENABLED_KEY, 'true');
      return true;
    } catch {
      return false;
    }
  }

  public static async disableLock(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(APP_LOCK_PIN_KEY);
      await AsyncStorage.setItem(APP_LOCK_ENABLED_KEY, 'false');
      return true;
    } catch {
      return false;
    }
  }

  public static async verifyPin(inputPin: string): Promise<boolean> {
    try {
      const savedPin = await AsyncStorage.getItem(APP_LOCK_PIN_KEY);
      return savedPin === inputPin;
    } catch {
      return false;
    }
  }
}
