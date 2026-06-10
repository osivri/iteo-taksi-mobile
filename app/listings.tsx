import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { useListings } from '@/hooks/queries/catalog';
import { EmptyState, ErrorText, Loader, ScreenHeader, useTheme } from '@/components/ui';

export default function ListingsScreen() {
  const theme = useTheme();
  const query = useListings();
  const items = query.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<ScreenHeader eyebrow="Pazar Yeri" title="İlanlar" icon="pricetag" />}
        ListEmptyComponent={query.isLoading ? <Loader /> : <EmptyState icon="pricetag-outline" title="İlan yok" message="Şu an yayında ilan bulunmuyor." />}
        ListFooterComponent={query.error ? <ErrorText>{query.error.message}</ErrorText> : null}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => item.contactPhone && Linking.openURL(`tel:${item.contactPhone}`)}>
            <Text style={[styles.title, { color: theme.text }]}>{String(item.title ?? 'İlan')}</Text>
            <Text style={{ color: theme.textSecondary }}>{String(item.listingType ?? '')} · {String(item.district ?? '')}</Text>
            {item.price != null ? <Text style={styles.price}>{Number(item.price).toLocaleString('tr-TR')} ₺</Text> : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: fontSize.lg, fontWeight: '800' },
  price: { color: IteoColors.yellow, fontWeight: '900', marginTop: spacing.sm, fontSize: fontSize.lg },
});
