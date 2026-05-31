import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(enabled = true) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    async function register() {
      if (!Device.isDevice) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Bildirimler',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId ??
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

      if (!projectId) return;

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      try {
        await api.post('/users/me/push-token', {
          token: tokenData.data,
          platform,
        });
      } catch {
        // Token kaydı sessizce atlanır; oturum henüz hazır olmayabilir
      }
    }

    register().catch(() => undefined);
  }, [enabled]);
}
