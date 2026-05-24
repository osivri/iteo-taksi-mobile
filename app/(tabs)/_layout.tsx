import { SymbolView } from 'expo-symbols';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';

import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { api, ApiResponse } from '@/lib/api';
import { isOnboardingDone, needsKvkkAcceptance, needsProfileSetup } from '@/lib/onboarding';

interface Profile {
  firstName: string;
  lastName: string;
  status: string;
  role: string;
  kvkkAcceptedAt: string | null;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { loading, isAuthenticated } = useAuth();
  const [gateLoading, setGateLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [profileOk, setProfileOk] = useState<boolean | null>(null);
  const [kvkkOk, setKvkkOk] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  usePushNotifications(isAuthenticated && kvkkOk === true);

  useEffect(() => {
    if (!isAuthenticated) {
      setGateLoading(false);
      return;
    }

    async function checkGate() {
      const done = await isOnboardingDone();
      setOnboardingDone(done);

      if (!done) {
        setGateLoading(false);
        return;
      }

      try {
        const res = await api.get<ApiResponse<Profile>>('/users/me');
        const profile = res.data ?? ({} as Profile);

        if (profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN') {
          setIsAdmin(true);
          setGateLoading(false);
          return;
        }

        setProfileOk(!needsProfileSetup(profile));
        setKvkkOk(!needsKvkkAcceptance(profile));
      } catch {
        setProfileOk(false);
        setKvkkOk(false);
      } finally {
        setGateLoading(false);
      }
    }

    checkGate();
  }, [isAuthenticated]);

  if (loading || gateLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: IteoColors.black }}>
        <ActivityIndicator color={IteoColors.yellow} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  if (isAdmin) {
    return <Redirect href="/admin-notice" />;
  }

  if (onboardingDone === false) {
    return <Redirect href="/onboarding" />;
  }

  if (profileOk === false) {
    return <Redirect href="/role-selection" />;
  }

  if (kvkkOk === false) {
    return <Redirect href="/kvkk" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: IteoColors.yellow,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? IteoColors.blackSoft : IteoColors.white,
          borderTopColor: Colors[colorScheme].border,
        },
        headerShown: useClientOnlyValue(false, false),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Muhasebe',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Duyurular',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
