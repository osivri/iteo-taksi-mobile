import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Badge, Button, Card, EmptyState, ErrorText, Loader, ScreenHeader, SectionTitle, useTheme } from '@/components/ui';

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  SUCCESS: 'Başarılı',
  FAILED: 'Başarısız',
  CANCELLED: 'İptal',
  REFUNDED: 'İade',
};

const statusTone: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  SUCCESS: 'success',
  FAILED: 'danger',
  CANCELLED: 'danger',
  PENDING: 'warning',
  REFUNDED: 'neutral',
};

const paymentTypeLabels: Record<string, string> = {
  DUES: 'Oda Aidatı',
  APP_FEE: 'Uygulama Ücreti',
  SERVICE_FEE: 'Hizmet Bedeli',
  OTHER: 'Diğer',
};

export default function PaymentsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<ApiResponse<Payment> & { items: Payment[] }>('/payments');
    setItems(res.items ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((e) => setError((e as Error).message))
        .finally(() => setLoading(false));
    }, [load]),
  );

  async function startPayment() {
    setPaying(true);
    setError(null);
    try {
      const res = await api.post<ApiResponse<{ payment: Payment; checkoutUrl: string }>>('/payments/checkout', {
        type: 'DUES',
        amount: 150,
      });
      const payment = res.data?.payment;
      if (!payment) throw new Error('Ödeme oluşturulamadı');

      await api.post('/payments/webhook', { paymentId: payment.id, status: 'SUCCESS', webhookSecret: 'dev-webhook-secret' });

      router.push({ pathname: '/payment/result', params: { status: 'SUCCESS', amount: String(payment.amount), id: payment.id } });
    } catch (e) {
      setError((e as Error).message);
      router.push({ pathname: '/payment/result', params: { status: 'FAILED' } });
    } finally {
      setPaying(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <ScreenHeader eyebrow="Aidat & Hizmet" title="Ödemeler" icon="card" />
            <Card style={styles.duesCard}>
              <View style={styles.duesIcon}>
                <Ionicons name="card" size={24} color={IteoColors.black} />
              </View>
              <Text style={[styles.duesTitle, { color: theme.text }]}>Oda Aidatı</Text>
              <Text style={[styles.duesAmount, { color: theme.text }]}>150 ₺</Text>
              <Button title={paying ? 'İşleniyor...' : 'Hemen Öde'} icon="lock-closed" loading={paying} onPress={startPayment} style={{ marginTop: spacing.md }} />
            </Card>
            {error ? <ErrorText>{error}</ErrorText> : null}
            <SectionTitle>Ödeme Geçmişi</SectionTitle>
          </View>
        }
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="card-outline" title="Ödeme yok" message="Henüz bir ödeme kaydınız bulunmuyor." />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Link href={`/payment/${item.id}`} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.card, borderColor: theme.border },
                theme.scheme === 'light' ? shadow.card : null,
                pressed ? styles.pressed : null,
              ]}>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{paymentTypeLabels[item.type] ?? item.type}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  <Badge label={paymentStatusLabels[item.status] ?? item.status} tone={statusTone[item.status] ?? 'neutral'} />
                </View>
              </View>
              <Text style={[styles.rowAmount, { color: theme.text }]}>{item.amount.toLocaleString('tr-TR')} ₺</Text>
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET },
  duesCard: { alignItems: 'center' },
  duesIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: IteoColors.yellow, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  duesTitle: { fontSize: fontSize.md, fontWeight: '700' },
  duesAmount: { fontSize: fontSize.hero, fontWeight: '900', letterSpacing: -1, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  rowTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  rowAmount: { fontSize: fontSize.lg, fontWeight: '900' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});
