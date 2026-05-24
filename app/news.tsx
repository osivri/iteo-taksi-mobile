import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

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
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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
      <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
        <Pressable onPress={() => setSelected(null)} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.badge}>{selected.category}</Text>
          <Text style={[styles.detailTitle, { color: theme.text }]}>{selected.title}</Text>
          {selected.publishedAt && (
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
              {new Date(selected.publishedAt).toLocaleDateString('tr-TR')}
            </Text>
          )}
          <Text style={{ color: theme.textSecondary, marginTop: 12, lineHeight: 22, fontWeight: '600' }}>
            {selected.summary}
          </Text>
          <Text style={{ color: theme.textSecondary, marginTop: 16, lineHeight: 24 }}>
            {selected.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {loading || detailLoading ? (
        <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Haber yok</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openDetail(item.id)}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.badge}>{item.category}</Text>
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={{ color: theme.textSecondary, marginTop: 6, lineHeight: 20 }} numberOfLines={2}>
                {item.summary}
              </Text>
              {item.publishedAt && (
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 8 }}>
                  {new Date(item.publishedAt).toLocaleDateString('tr-TR')}
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: '#FCA5A5', textAlign: 'center', margin: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: IteoColors.yellowLight,
    color: IteoColors.black,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '700' },
  backBtn: { padding: 16 },
  backText: { color: IteoColors.yellow, fontWeight: '700' },
  detailCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 14, padding: 20 },
  detailTitle: { fontSize: 20, fontWeight: '700', marginTop: 8 },
});
