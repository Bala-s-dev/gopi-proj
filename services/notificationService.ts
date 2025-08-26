import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // For web, we'll use browser notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const sendPriceUpdateNotification = async (goldPrice: number, silverPrice: number) => {
  try {
    if (Platform.OS === 'web') {
      // For web, use browser notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('RM Jewellers - Price Update', {
          body: `New prices: Gold ₹${goldPrice.toFixed(2)}/g, Silver ₹${silverPrice.toFixed(2)}/g`,
          icon: '/assets/images/icon.png',
        });
      }
    } else {
      // For mobile, use Expo notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'RM Jewellers - Price Update',
          body: `New prices: Gold ₹${goldPrice.toFixed(2)}/g, Silver ₹${silverPrice.toFixed(2)}/g`,
          data: { goldPrice, silverPrice },
        },
        trigger: null, // Send immediately
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendTransactionNotification = async (userName: string, grams: number, amount: number) => {
  try {
    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('RM Jewellers - New Transaction', {
          body: `${userName} purchased ${grams}g gold for ₹${amount.toFixed(2)}`,
          icon: '/assets/images/icon.png',
        });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'RM Jewellers - New Transaction',
          body: `${userName} purchased ${grams}g gold for ₹${amount.toFixed(2)}`,
          data: { userName, grams, amount },
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Error sending transaction notification:', error);
  }
};