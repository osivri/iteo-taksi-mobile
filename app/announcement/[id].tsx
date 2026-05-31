import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fontSize, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Badge, Card, ErrorText, Loader, useTheme } from '@/components/ui';

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
  const theme = useTheme();
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
      <Stack.Screen options={{ headerShown: true, title: 'Duyuru' }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} contentContainerStyle={styles.content}>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorText>{error}</ErrorText>
        ) : item ? (
          <Card>
            <View style={styles.badgeRow}>
              <Badge label={item.category} />
              {item.priority === 'URGENT' ? <Badge label="Acil" tone="danger" /> : null}
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            {item.publishedAt ? (
              <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: spacing.sm }}>
                {new Date(item.publishedAt).toLocaleString('tr-TR')}
              </Text>
            ) : null}
            <Text style={{ color: theme.textSecondary, marginTop: spacing.lg, lineHeight: 24, fontSize: fontSize.md }}>{item.content}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '900', marginTop: spacing.md, letterSpacing: -0.4 },
});
