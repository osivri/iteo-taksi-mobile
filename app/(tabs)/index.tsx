import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IteoColors } from '@/constants/Colors';
import { api, ApiResponse } from '@/lib/api';
import { toMemberRole, type UserRole } from '@/lib/dashboard';
import { cockpitBackground } from '@/lib/member-cockpit-theme';
import { SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { ModuleLauncherGrid } from '@/components/ModuleLauncherGrid';
import { useMemberCockpitTheme } from '@/providers/MemberCockpitThemeProvider';

interface Profile {
  firstName: string;
  lastName: string;
  role: UserRole;
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useMemberCockpitTheme();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<Profile>>('/users/me').then((r) => r.data!),
  });

  async function onRefresh() {
    setRefreshing(true);
    await profileQuery.refetch();
    setRefreshing(false);
  }

  const profile = profileQuery.data;
  const role = toMemberRole(profile?.role);
  const bg = cockpitBackground(theme);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme === 'light' ? IteoColors.black : IteoColors.yellow}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {profile ? (
          <ModuleLauncherGrid role={role} firstName={profile.firstName} lastName={profile.lastName} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: SCREEN_BOTTOM_INSET },
});
