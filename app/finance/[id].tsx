import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { openSafeUrl } from '@/lib/safe-url';
import { Badge, Card, ErrorText, Loader, useTheme } from '@/components/ui';

interface FinanceRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  recordDate: string;
  description: string | null;
  receiptImageUrl: string | null;
  receiptOcrData?: {
    amount: number | null;
    merchant: string | null;
    category: string | null;
    confidence: number;
    provider: string;
    rawText?: string;
  } | null;
}

export default function FinanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [item, setItem] = useState<FinanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ApiResponse<FinanceRecord>>(`/finance/records/${id}`)
      .then((res) => setItem(res.data ?? null))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const isIncome = item?.type === 'INCOME';

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Fiş Detayı' }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} contentContainerStyle={styles.content}>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorText>{error}</ErrorText>
        ) : item ? (
          <Card>
            <Badge label={isIncome ? 'Gelir' : 'Gider'} tone={isIncome ? 'success' : 'danger'} />
            <Text style={[styles.amount, { color: isIncome ? IteoColors.success : IteoColors.error }]}>
              {isIncome ? '+' : '-'}
              {item.amount.toLocaleString('tr-TR')} {item.currency}
            </Text>
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: fontSize.xl, marginTop: spacing.sm }}>{item.category}</Text>
            <Text style={{ color: theme.textSecondary, marginTop: spacing.xs }}>
              {new Date(item.recordDate).toLocaleDateString('tr-TR')}
            </Text>
            {item.description ? (
              <Text style={{ color: theme.textSecondary, marginTop: spacing.lg, lineHeight: 22 }}>{item.description}</Text>
            ) : null}
            {item.receiptImageUrl ? (
              <>
                <Text style={[styles.section, { color: theme.text }]}>Fiş Görseli</Text>
                {item.receiptOcrData ? (
                  <View style={styles.ocrBox}>
                    <Text style={{ color: IteoColors.black, fontSize: fontSize.sm, fontWeight: '700' }}>
                      Akıllı fiş okuma · %{Math.round((item.receiptOcrData.confidence ?? 0) * 100)} doğruluk
                    </Text>
                    {item.receiptOcrData.merchant ? (
                      <Text style={{ color: IteoColors.black, marginTop: 4 }}>{item.receiptOcrData.merchant}</Text>
                    ) : null}
                  </View>
                ) : null}
                <Image source={{ uri: item.receiptImageUrl }} style={styles.receipt} resizeMode="contain" />
                <Pressable
                  onPress={async () => {
                    const opened = await openSafeUrl(item.receiptImageUrl!);
                    if (!opened) Alert.alert('Bağlantı engellendi', 'Bu görsel bağlantısı güvenli değil.');
                  }}
                  hitSlop={8}>
                  <Text style={styles.link}>Görseli tarayıcıda aç</Text>
                </Pressable>
              </>
            ) : (
              <Text style={{ color: theme.textSecondary, marginTop: spacing.lg }}>Fiş görseli yüklenmemiş.</Text>
            )}
          </Card>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  amount: { fontSize: fontSize.hero, fontWeight: '900', marginTop: spacing.md, letterSpacing: -1 },
  section: { marginTop: spacing.xl, fontWeight: '900', fontSize: fontSize.md },
  ocrBox: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: IteoColors.yellowLight },
  receipt: { width: '100%', height: 280, marginTop: spacing.md, borderRadius: radius.md, backgroundColor: '#111' },
  link: { color: IteoColors.yellowDark, marginTop: spacing.md, fontWeight: '800' },
});
