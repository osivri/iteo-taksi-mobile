import { useState } from 'react';
import { FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { useMyRatings } from '@/hooks/queries/catalog';
import { api, ApiResponse } from '@/lib/api';
import { Button, Card, EmptyState, ErrorText, Loader, ScreenHeader, useTheme } from '@/components/ui';

export default function RatingsScreen() {
  const theme = useTheme();
  const query = useMyRatings(true);
  const [creating, setCreating] = useState(false);
  const [tokenUrl, setTokenUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = query.data?.summary;
  const items = query.data?.items ?? [];
  const webBase = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

  async function createQrToken() {
    setCreating(true);
    setError(null);
    try {
      const res = await api.post<ApiResponse<{ id: string }>>('/ratings/token', {});
      const tokenId = res.data?.id;
      if (!tokenId) throw new Error('QR oluşturulamadı');
      const url = `${webBase}/puanla/${tokenId}`;
      setTokenUrl(url);
      await Share.share({ message: `Şoför puanlama: ${url}`, url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <ScreenHeader eyebrow="Şoför" title="Puanlarım" icon="star" />
            <Card>
              <Text style={[styles.avg, { color: theme.text }]}>{summary?.average ?? 0}</Text>
              <Text style={{ color: theme.textSecondary }}>{summary?.count ?? 0} değerlendirme</Text>
              <Button title={creating ? 'Oluşturuluyor...' : 'QR / Link Oluştur'} icon="qr-code-outline" loading={creating} onPress={createQrToken} style={{ marginTop: spacing.md }} />
              {tokenUrl ? <Text style={styles.link}>{tokenUrl}</Text> : null}
              {error ? <ErrorText>{error}</ErrorText> : null}
            </Card>
          </View>
        }
        ListEmptyComponent={query.isLoading ? <Loader /> : <EmptyState icon="star-outline" title="Henüz puan yok" message="QR kodunuzu paylaşarak müşterilerden puan alın." />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.score, { color: theme.text }]}>{String(item.score)} / 5</Text>
            {item.comment ? <Text style={{ color: theme.textSecondary, marginTop: spacing.xs }}>{String(item.comment)}</Text> : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.sm },
  avg: { fontSize: 48, fontWeight: '900', color: IteoColors.yellow },
  link: { color: '#A3A3A3', fontSize: fontSize.sm, marginTop: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  score: { fontSize: fontSize.xl, fontWeight: '900' },
});
