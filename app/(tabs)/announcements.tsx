import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Badge, Chip, EmptyState, ErrorText, Loader, ScreenHeader, useTheme } from '@/components/ui';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  publishedAt: string | null;
}

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const [allItems, setAllItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('Tümü');

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api
        .get<ApiResponse<Announcement> & { items: Announcement[] }>('/announcements?limit=50')
        .then((res) => {
          setAllItems(res.items ?? []);
          setError(null);
        })
        .catch((e) => setError((e as Error).message))
        .finally(() => setLoading(false));
    }, []),
  );

  const categories = useMemo(() => {
    const set = new Set(allItems.map((i) => i.category));
    return ['Tümü', ...Array.from(set).sort()];
  }, [allItems]);

  const items = useMemo(
    () => (category === 'Tümü' ? allItems : allItems.filter((i) => i.category === category)),
    [allItems, category],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader eyebrow="Oda İletişimi" title="Duyurular" icon="megaphone" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {categories.map((cat) => (
                <Chip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
              ))}
            </ScrollView>
            {error ? <ErrorText>{error}</ErrorText> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? <Loader /> : <EmptyState icon="megaphone-outline" title="Duyuru yok" message="Bu kategoride henüz duyuru bulunmuyor." />
        }
        renderItem={({ item }) => (
          <Link href={`/announcement/${item.id}`} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                theme.scheme === 'light' ? shadow.card : null,
                pressed ? styles.pressed : null,
              ]}>
              <View style={styles.badgeRow}>
                <Badge label={item.category} />
                {item.priority === 'URGENT' ? <Badge label="Acil" tone="danger" /> : null}
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={3}>
                {item.content}
              </Text>
              {item.publishedAt ? (
                <Text style={[styles.date, { color: theme.textSecondary }]}>
                  {new Date(item.publishedAt).toLocaleDateString('tr-TR')}
                </Text>
              ) : null}
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.md },
  filters: { gap: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: '800' },
  preview: { marginTop: spacing.sm, lineHeight: 20, fontSize: fontSize.md },
  date: { fontSize: fontSize.xs, marginTop: spacing.md },
});
