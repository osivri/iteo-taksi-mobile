import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
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

function navigateFromNotificationData(data: Record<string, unknown> | undefined) {
  if (!data) return;
  const screen = typeof data.screen === 'string' ? data.screen : null;
  const type = typeof data.type === 'string' ? data.type : null;

  if (screen) {
    router.push(screen as never);
    return;
  }

  if (type === 'APPOINTMENT') router.push('/(tabs)/appointments');
  else if (type === 'PAYMENT') router.push('/(tabs)/payments');
  else if (type === 'REMINDER') router.push('/(tabs)/vehicles');
  else router.push('/notifications');
}

function handleDeepLink(url: string) {
  const parsed = Linking.parse(url);
  if (parsed.path === 'payment/result' && parsed.queryParams?.id) {
    router.push({ pathname: '/payment/result', params: { id: String(parsed.queryParams.id) } });
  } else if (parsed.path === 'reset-password') {
    router.push('/reset-password');
  }
}

export function usePushNotifications(enabled = true) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromNotificationData(response.notification.request.content.data as Record<string, unknown>);
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

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
        // Token kaydı sessizce atlanır
      }
    }

    register().catch(() => undefined);

    return () => {
      responseSub.remove();
      linkSub.remove();
    };
  }, [enabled]);
}
