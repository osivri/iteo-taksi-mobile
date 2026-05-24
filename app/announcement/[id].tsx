import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

interface AnnouncementDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  publishedAt: string | null;
}

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [item, setItem] = useState<AnnouncementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ApiResponse<AnnouncementDetail>>(`/announcements/${id}`)
      .then((res) => setItem(res.data ?? null))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Duyuru',
          headerStyle: { backgroundColor: IteoColors.black },
          headerTintColor: IteoColors.white,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
        {loading ? (
          <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 32 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : item ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>{item.category}</Text>
              {item.priority === 'URGENT' && <Text style={styles.urgent}>Acil</Text>}
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            {item.publishedAt && (
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 6 }}>
                {new Date(item.publishedAt).toLocaleString('tr-TR')}
              </Text>
            )}
            <Text style={{ color: theme.textSecondary, marginTop: 20, lineHeight: 24, fontSize: 15 }}>
              {item.content}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: '#FCA5A5', textAlign: 'center', margin: 16 },
  card: { margin: 16, borderWidth: 1, borderRadius: 14, padding: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: {
    backgroundColor: IteoColors.yellowLight,
    color: IteoColors.black,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  urgent: { color: '#DC2626', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800' },
});
