import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  publishedAt: string | null;
}

export default function AnnouncementsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: IteoColors.black }]}>
        <Text style={styles.headerTitle}>Duyurular</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(cat)}
            style={[styles.chip, category === cat && styles.chipActive]}>
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Duyuru yok</Text>}
          renderItem={({ item }) => (
            <Link href={`/announcement/${item.id}`} asChild>
              <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.badgeRow}>
                  <Text style={styles.badge}>{item.category}</Text>
                  {item.priority === 'URGENT' && <Text style={styles.urgent}>Acil</Text>}
                </View>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={{ color: theme.textSecondary, marginTop: 6, lineHeight: 20 }} numberOfLines={4}>
                  {item.content}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: IteoColors.white, fontSize: 20, fontWeight: '700' },
  filters: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: IteoColors.blackSoft,
    marginRight: 8,
  },
  chipActive: { backgroundColor: IteoColors.yellow },
  chipText: { color: IteoColors.white, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: IteoColors.black },
  error: { color: '#FCA5A5', textAlign: 'center', margin: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16 },
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
  title: { fontSize: 16, fontWeight: '700' },
});
