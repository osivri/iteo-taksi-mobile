import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthGate } from '@/components/AuthGate';
import { IteoColors } from '@/constants/Colors';
import { QueryProvider } from '@/providers/QueryProvider';
import { MemberCockpitThemeProvider } from '@/providers/MemberCockpitThemeProvider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'welcome',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const stackScreens: Array<{ name: string; title: string }> = [
    { name: 'ohs', title: 'İSG' },
    { name: 'news', title: 'Haberler' },
    { name: 'notifications', title: 'Bildirimler' },
    { name: 'settings', title: 'Ayarlar' },
    { name: 'help', title: 'Yardım & Destek' },
    { name: 'forgotten-items', title: 'Unutulan Eşya' },
    { name: 'services', title: 'Oda Hizmetleri' },
    { name: 'service-tow', title: 'Çekici' },
    { name: 'service-insurance', title: 'Sigorta' },
    { name: 'service-complaint', title: 'Şikayet' },
    { name: 'service-pirate-report', title: 'Korsan İhbar' },
    { name: 'service-petition', title: 'Dilekçe' },
    { name: 'address', title: 'Adres Bilgileri' },
    { name: 'otp-login', title: 'Telefon ile Giriş' },
    { name: 'forgot-password', title: 'Şifremi Unuttum' },
    { name: 'reset-password', title: 'Yeni Şifre' },
    { name: 'listings', title: 'İlanlar' },
    { name: 'stands', title: 'Duraklar' },
    { name: 'spare-parts', title: 'Yedek Parça' },
    { name: 'ratings', title: 'Puanlarım' },
    { name: 'documents', title: 'Belgelerim' },
    { name: 'find-driver', title: 'Şoför Bul' },
    { name: 'find-vehicle', title: 'Araç Bul' },
    { name: 'hotel-appointments', title: 'Otel Konaklama' },
    { name: 'service-appointments', title: 'Servis Randevu' },
    { name: 'listing/[id]', title: 'İlan Detayı' },
  ];

  return (
    <QueryProvider>
      <MemberCockpitThemeProvider>
        <AuthGate />
        <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: IteoColors.black },
          headerTintColor: IteoColors.white,
          headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          headerShadowVisible: false,
          headerBackTitle: '',
          contentStyle: { backgroundColor: IteoColors.gray100 },
        }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="admin-notice" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="kvkk" />
        <Stack.Screen name="(tabs)" />
        {stackScreens.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            options={{ presentation: 'card', headerShown: false, title: screen.title }}
          />
        ))}
        </Stack>
        <StatusBar style="light" />
      </MemberCockpitThemeProvider>
    </QueryProvider>
  );
}
