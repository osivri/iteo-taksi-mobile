import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { useSpareParts } from '@/hooks/queries/catalog';
import { queryKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import { Button, EmptyState, ErrorText, Loader, ScreenHeader, useTheme } from '@/components/ui';

export default function SparePartsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const partsQuery = useSpareParts();
  const items = partsQuery.data ?? [];
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function orderPart(partId: string) {
    setOrderingId(partId);
    setMessage(null);
    try {
      await api.post('/spare-parts/orders', { partId, quantity: 1 });
      setMessage('Sipariş talebiniz alındı.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.spareParts });
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setOrderingId(null);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <ScreenHeader eyebrow="Servis" title="Yedek Parça" icon="construct" />
            {message ? <Text style={{ color: theme.text }}>{message}</Text> : null}
          </View>
        }
        ListEmptyComponent={partsQuery.isLoading ? <Loader /> : <EmptyState icon="construct-outline" title="Parça yok" message="Katalogda ürün bulunamadı." />}
        ListFooterComponent={partsQuery.error ? <ErrorText>{partsQuery.error.message}</ErrorText> : null}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{String(item.name ?? 'Parça')}</Text>
            <Text style={{ color: theme.textSecondary }}>{String(item.category ?? '')}</Text>
            <Text style={styles.price}>{Number(item.price ?? 0).toLocaleString('tr-TR')} ₺</Text>
            <Button title="Sipariş Ver" loading={orderingId === String(item.id)} onPress={() => orderPart(String(item.id))} style={{ marginTop: spacing.sm }} />
          </View>
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
  price: { fontWeight: '900', marginTop: spacing.sm, fontSize: fontSize.lg },
});
