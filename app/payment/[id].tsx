import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fontSize, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Badge, Button, Card, ErrorText, Loader, useTheme } from '@/components/ui';

interface PaymentDetail {
  id: string;
  type: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  currency: string;
  receiptUrl: string | null;
}

const statusLabels: Record<string, string> = {
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

const typeLabels: Record<string, string> = {
  DUES: 'Aidat',
  APP_FEE: 'Uygulama Ücreti',
  SERVICE_FEE: 'Hizmet Bedeli',
  OTHER: 'Diğer',
};

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [item, setItem] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ApiResponse<PaymentDetail>>(`/payments/${id}`)
      .then((res) => setItem(res.data ?? null))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Ödeme Detayı' }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} contentContainerStyle={styles.content}>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorText>{error}</ErrorText>
        ) : item ? (
          <Card>
            <Text style={[styles.amount, { color: theme.text }]}>{item.amount.toLocaleString('tr-TR')} ₺</Text>
            <View style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
              <Badge label={statusLabels[item.status] ?? item.status} tone={statusTone[item.status] ?? 'neutral'} />
            </View>
            <Row label="Tür" value={typeLabels[item.type] ?? item.type} theme={theme} />
            <Row label="Oluşturulma" value={new Date(item.createdAt).toLocaleString('tr-TR')} theme={theme} />
            {item.paidAt ? <Row label="Ödeme Tarihi" value={new Date(item.paidAt).toLocaleString('tr-TR')} theme={theme} /> : null}
            {item.receiptUrl ? (
              <Button title="Dekontu Görüntüle" icon="document-text" onPress={() => Linking.openURL(item.receiptUrl!)} style={{ marginTop: spacing.lg }} />
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
    </>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: theme.textSecondary }}>{label}</Text>
      <Text style={{ color: theme.text, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  amount: { fontSize: fontSize.hero, fontWeight: '900', letterSpacing: -1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
});
