import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fontSize, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Badge, Button, Card, ErrorText, Loader, useTheme } from '@/components/ui';

interface OhsDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  body: string | null;
  videoUrl: string | null;
}

export default function OhsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [item, setItem] = useState<OhsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ApiResponse<OhsDetail>>(`/ohs/contents/${id}`)
      .then((res) => setItem(res.data ?? null))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'İSG İçerik' }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} contentContainerStyle={styles.content}>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorText>{error}</ErrorText>
        ) : item ? (
          <Card>
            <Badge label={`${item.type} · ${item.category}`} />
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            {item.description ? (
              <Text style={{ color: theme.textSecondary, marginTop: spacing.sm, lineHeight: 22 }}>{item.description}</Text>
            ) : null}
            {item.body ? (
              <Text style={{ color: theme.textSecondary, marginTop: spacing.lg, lineHeight: 24 }}>{item.body}</Text>
            ) : null}
            {item.videoUrl ? (
              <Button title="Videoyu Aç" icon="play-circle" onPress={() => Linking.openURL(item.videoUrl!)} style={{ marginTop: spacing.lg }} />
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '900', marginTop: spacing.md, letterSpacing: -0.4 },
});
