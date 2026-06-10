import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Link, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { usePaymentsList } from '@/hooks/queries/lists';
import { FeeConfig, useFees } from '@/hooks/queries/fees';
import { queryKeys } from '@/hooks/queries/keys';
import { api, ApiResponse } from '@/lib/api';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { Badge, Button, Card, EmptyState, ErrorText, Loader, useTheme } from '@/components/ui';

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

type PaymentType = 'DUES' | 'APP_FEE' | 'SERVICE_FEE';
type PaymentTab = 'pay' | 'history';

const paymentTabs: { id: PaymentTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'pay', label: 'Ödeme Başlat', icon: 'card' },
  { id: 'history', label: 'Ödeme Geçmişi', icon: 'receipt' },
];

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

const typeDescriptions: Record<PaymentType, string> = {
  DUES: 'Yıllık oda üyelik aidatı',
  APP_FEE: 'Dijital platform kullanım ücreti',
  SERVICE_FEE: 'Oda hizmet bedeli',
};

const typeIcons: Record<PaymentType, keyof typeof Ionicons.glyphMap> = {
  DUES: 'document-text',
  APP_FEE: 'card',
  SERVICE_FEE: 'notifications',
};

const feeOrder: PaymentType[] = ['DUES', 'APP_FEE', 'SERVICE_FEE'];

function sortFees(fees: FeeConfig[]) {
  return [...fees].sort((a, b) => feeOrder.indexOf(a.key as PaymentType) - feeOrder.indexOf(b.key as PaymentType));
}

export default function PaymentsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const paymentsQuery = usePaymentsList();
  const feesQuery = useFees();
  const items = paymentsQuery.data ?? [];
  const payableFees = useMemo(() => sortFees(feesQuery.data ?? []), [feesQuery.data]);
  const loading = paymentsQuery.isLoading && items.length === 0;
  const [tab, setTab] = useState<PaymentTab>('pay');
  const [payingType, setPayingType] = useState<PaymentType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function startPayment(type: PaymentType) {
    setPayingType(type);
    setActionError(null);
    try {
      const res = await api.post<ApiResponse<{ payment: Payment; checkoutUrl: string }>>('/payments/checkout', {
        type,
      });
      const payment = res.data?.payment;
      const checkoutUrl = res.data?.checkoutUrl;
      if (!payment || !checkoutUrl) throw new Error('Ödeme oluşturulamadı');

      await WebBrowser.openBrowserAsync(checkoutUrl);
      await queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      router.push({ pathname: '/payment/result', params: { id: payment.id } });
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setPayingType(null);
    }
  }

  const header = (
    <View style={{ gap: spacing.lg }}>
      <MemberSubpageToolbar showBack={false} />
      <ModulePageHero
        badge="Aidat & Hizmet"
        title="Ödemeler"
        description="Oda aidatı ve hizmet ücretlerinizi görüntüleyin, online ödeme yapın."
        icon="card"
      />
      <View style={[styles.tabRow, { backgroundColor: theme.scheme === 'light' ? IteoColors.gray100 : 'rgba(255,255,255,0.08)' }]}>
        {paymentTabs.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, active && styles.tabActive]}>
              <Ionicons name={t.icon} size={16} color={active ? IteoColors.black : theme.textMuted} />
              <Text style={[styles.tabText, { color: active ? IteoColors.black : theme.textMuted }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {actionError || paymentsQuery.error ? (
        <ErrorText>{actionError ?? paymentsQuery.error?.message}</ErrorText>
      ) : null}
    </View>
  );

  if (tab === 'pay') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {header}
          {feesQuery.isLoading ? (
            <Loader />
          ) : payableFees.length === 0 ? (
            <EmptyState icon="card-outline" title="Tarife bulunamadı" message="Ödeme tutarları yüklenemedi." />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {payableFees.map((fee, index) => {
                const type = fee.key as PaymentType;
                const isPrimary = index === 0;
                const label = fee.label ?? paymentTypeLabels[type] ?? type;
                return (
                  <Card
                    key={fee.key}
                    style={[
                      styles.feeCard,
                      isPrimary ? styles.feeCardPrimary : null,
                      isPrimary ? null : { borderColor: theme.border },
                    ]}>
                    {isPrimary ? (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Önerilen</Text>
                      </View>
                    ) : null}
                    <View style={styles.feeTopRow}>
                      <View style={[styles.feeIcon, isPrimary ? styles.feeIconPrimary : { backgroundColor: IteoColors.gray100 }]}>
                        <Ionicons name={typeIcons[type] ?? 'card'} size={18} color={IteoColors.black} />
                      </View>
                      <View style={styles.feeMeta}>
                        <Text style={[styles.feeTitle, { color: theme.text }]}>{label}</Text>
                        <Text style={[styles.feeDesc, { color: isPrimary ? 'rgba(10,10,10,0.65)' : theme.textMuted }]}>
                          {typeDescriptions[type]}
                        </Text>
                      </View>
                      <Text style={[styles.feeAmount, { color: theme.text }]}>
                        {fee.amount.toLocaleString('tr-TR')} {fee.currency === 'TRY' ? '₺' : fee.currency}
                      </Text>
                    </View>
                    <Button
                      title={payingType === type ? 'İşleniyor...' : 'Öde'}
                      icon="lock-closed"
                      loading={payingType === type}
                      disabled={payingType !== null}
                      onPress={() => startPayment(type)}
                      style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}
                    />
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="receipt-outline" title="Ödeme yok" message="Henüz bir ödeme kaydınız bulunmuyor." />}
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
                <Text style={[styles.rowDate, { color: theme.textMuted }]}>
                  {item.paidAt ? new Date(item.paidAt).toLocaleString('tr-TR') : 'Ödeme tarihi bekleniyor'}
                </Text>
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
  tabRow: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: IteoColors.yellow,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  feeCard: {
    position: 'relative',
    overflow: 'hidden',
    padding: spacing.md,
  },
  feeCardPrimary: {
    backgroundColor: IteoColors.yellow,
    borderColor: 'rgba(255, 214, 0, 0.4)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: IteoColors.black,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '800',
    color: IteoColors.yellow,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  feeMeta: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  feeIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeIconPrimary: {
    backgroundColor: 'rgba(10,10,10,0.1)',
  },
  feeTitle: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  feeDesc: {
    fontSize: fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  feeAmount: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  rowTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  rowDate: { fontSize: fontSize.sm, marginTop: 2 },
  rowAmount: { fontSize: fontSize.lg, fontWeight: '900' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});
