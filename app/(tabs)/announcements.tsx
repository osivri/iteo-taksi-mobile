import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { useAnnouncementsList } from '@/hooks/queries/lists';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { Badge, Chip, EmptyState, ErrorText, Loader, useTheme } from '@/components/ui';

function excerpt(text: string, max = 140) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const announcementsQuery = useAnnouncementsList();
  const allItems = announcementsQuery.data ?? [];
  const loading = announcementsQuery.isLoading && allItems.length === 0;
  const [category, setCategory] = useState<string>('Tümü');

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
            <MemberSubpageToolbar showBack={false} />
            <ModulePageHero badge="Oda İletişimi" title="Duyurular" description="Resmi bildirimler, uyarılar ve oda duyuruları." icon="megaphone" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {categories.map((cat) => (
                <Chip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
              ))}
            </ScrollView>
            {announcementsQuery.error ? <ErrorText>{announcementsQuery.error.message}</ErrorText> : null}
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
                {excerpt(item.content)}
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
