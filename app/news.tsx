import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Badge, EmptyState, ErrorText, Loader, useTheme } from '@/components/ui';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string | null;
}

interface NewsDetail extends NewsItem {
  content: string;
}

export default function NewsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [selected, setSelected] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setSelected(null);
      api
        .get<ApiResponse<NewsItem> & { items: NewsItem[] }>('/news')
        .then((res) => {
          setItems(res.items ?? []);
          setError(null);
        })
        .catch((e) => setError((e as Error).message))
        .finally(() => setLoading(false));
    }, []),
  );

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await api.get<ApiResponse<NewsDetail>>(`/news/${id}`);
      setSelected(res.data ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }

  if (selected) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setSelected(null)} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={IteoColors.yellowDark} />
          <Text style={styles.backText}>Haberlere dön</Text>
        </Pressable>
        <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.scheme === 'light' ? shadow.card : null]}>
          <Badge label={selected.category} />
          <Text style={[styles.detailTitle, { color: theme.text }]}>{selected.title}</Text>
          {selected.publishedAt ? (
            <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>
              {new Date(selected.publishedAt).toLocaleDateString('tr-TR')}
            </Text>
          ) : null}
          <Text style={{ color: theme.text, marginTop: spacing.md, lineHeight: 22, fontWeight: '700' }}>{selected.summary}</Text>
          <Text style={{ color: theme.textSecondary, marginTop: spacing.lg, lineHeight: 24 }}>{selected.content}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={loading || detailLoading ? [] : items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading || detailLoading ? <Loader /> : <EmptyState icon="newspaper-outline" title="Haber yok" message="Yeni haberler burada listelenecek." />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openDetail(item.id)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              theme.scheme === 'light' ? shadow.card : null,
              pressed ? styles.pressed : null,
            ]}>
            <Badge label={item.category} />
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            <Text style={{ color: theme.textSecondary, marginTop: spacing.sm, lineHeight: 20 }} numberOfLines={2}>
              {item.summary}
            </Text>
            {item.publishedAt ? (
              <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: spacing.sm }}>
                {new Date(item.publishedAt).toLocaleDateString('tr-TR')}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: '800' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  backText: { color: IteoColors.yellowDark, fontWeight: '800', fontSize: fontSize.md },
  detailCard: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.xs },
  detailTitle: { fontSize: fontSize.xxl, fontWeight: '900', marginTop: spacing.sm, letterSpacing: -0.4 },
});
