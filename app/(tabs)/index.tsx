import { useCallback, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';
import { getQuickActionsForRole, roleDashboardTitles, UserRole } from '@/lib/dashboard';
import { FinancePeriod, getPeriodRange } from '@/lib/date-ranges';
import { DriverHome } from '@/components/dashboards/DriverHome';
import { PlateOwnerHome } from '@/components/dashboards/PlateOwnerHome';
import { MemberHome } from '@/components/dashboards/MemberHome';
import type { FinanceSummary } from '@/components/dashboards/types';

interface Profile {
  firstName: string;
  lastName: string;
  role: UserRole;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const range = getPeriodRange(period);
  const summaryQueryString = range.from ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to!)}` : '';

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<Profile>>('/users/me').then((r) => r.data!),
  });

  const summaryQuery = useQuery({
    queryKey: ['finance-summary', period],
    queryFn: () =>
      api.get<ApiResponse<FinanceSummary>>(`/finance/summary${summaryQueryString}`).then((r) => r.data!),
    enabled: profileQuery.data?.role === 'DRIVER' || profileQuery.data?.role === 'PLATE_OWNER',
  });

  useFocusEffect(
    useCallback(() => {
      profileQuery.refetch();
      summaryQuery.refetch();
    }, [profileQuery, summaryQuery]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([profileQuery.refetch(), summaryQuery.refetch()]);
    setRefreshing(false);
  }

  const profile = profileQuery.data;
  const summary = summaryQuery.data;
  const role = profile?.role ?? 'USER';
  const quickActions = getQuickActionsForRole(role);
  const error = profileQuery.error?.message ?? summaryQuery.error?.message ?? null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: IteoColors.black }]}>
        <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerSubtitle}>İstanbul Taksiciler Esnaf Odası</Text>
          <Text style={styles.headerTitle}>
            {profile ? `${profile.firstName} · ${roleDashboardTitles[role]}` : 'İTEO Mobil'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={IteoColors.yellow} />}
        showsVerticalScrollIndicator={false}>
        {role === 'DRIVER' && (
          <DriverHome
            theme={theme}
            period={period}
            onPeriodChange={setPeriod}
            summary={summary}
            error={error}
          />
        )}

        {role === 'PLATE_OWNER' && (
          <PlateOwnerHome
            theme={theme}
            period={period}
            onPeriodChange={setPeriod}
            summary={summary}
            error={error}
          />
        )}

        {role === 'USER' && <MemberHome theme={theme} />}

        {(role === 'DRIVER' || role === 'PLATE_OWNER') && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Diğer İşlemler</Text>
            <View style={styles.grid}>
              {quickActions
                .filter((a) => !['Gelir Ekle', 'Gider Ekle', 'Plakalarım'].includes(a.title))
                .map((action) => (
                  <Link key={`${action.href}-${action.title}`} href={action.href} asChild>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionCard,
                        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                      ]}>
                      <Text style={styles.actionEmoji}>{action.emoji}</Text>
                      <Text style={[styles.actionTitle, { color: theme.text }]}>{action.title}</Text>
                      <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>{action.subtitle}</Text>
                    </Pressable>
                  </Link>
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12 },
  headerTextWrap: { flex: 1 },
  headerSubtitle: { color: IteoColors.yellow, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  headerTitle: { color: IteoColors.white, fontSize: 18, fontWeight: '700', marginTop: 2 },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 16, minHeight: 110 },
  actionEmoji: { fontSize: 24, marginBottom: 8 },
  actionTitle: { fontSize: 15, fontWeight: '700' },
  actionSubtitle: { fontSize: 12, marginTop: 4 },
});
