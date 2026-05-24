import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

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

const typeLabels: Record<string, string> = {
  DUES: 'Aidat',
  APP_FEE: 'Uygulama Ücreti',
  SERVICE_FEE: 'Hizmet Bedeli',
  OTHER: 'Diğer',
};

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Ödeme Detayı',
          headerStyle: { backgroundColor: IteoColors.black },
          headerTintColor: IteoColors.white,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
        {loading ? (
          <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 32 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : item ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.amount, { color: theme.text }]}>
              {item.amount.toLocaleString('tr-TR')} ₺
            </Text>
            <Text style={[styles.status, item.status === 'SUCCESS' ? styles.success : styles.pending]}>
              {statusLabels[item.status] ?? item.status}
            </Text>
            <View style={styles.row}>
              <Text style={{ color: theme.textSecondary }}>Tür</Text>
              <Text style={{ color: theme.text, fontWeight: '600' }}>
                {typeLabels[item.type] ?? item.type}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ color: theme.textSecondary }}>Oluşturulma</Text>
              <Text style={{ color: theme.text }}>{new Date(item.createdAt).toLocaleString('tr-TR')}</Text>
            </View>
            {item.paidAt && (
              <View style={styles.row}>
                <Text style={{ color: theme.textSecondary }}>Ödeme Tarihi</Text>
                <Text style={{ color: theme.text }}>{new Date(item.paidAt).toLocaleString('tr-TR')}</Text>
              </View>
            )}
            {item.receiptUrl && (
              <Pressable style={styles.receiptBtn} onPress={() => Linking.openURL(item.receiptUrl!)}>
                <Text style={styles.receiptText}>Ödeme Dekontunu Görüntüle</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: '#FCA5A5', textAlign: 'center', margin: 16 },
  card: { margin: 16, borderWidth: 1, borderRadius: 14, padding: 20 },
  amount: { fontSize: 36, fontWeight: '800' },
  status: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 20 },
  success: { color: '#16A34A' },
  pending: { color: IteoColors.yellow },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  receiptBtn: {
    marginTop: 20,
    backgroundColor: IteoColors.yellow,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  receiptText: { color: IteoColors.black, fontWeight: '700' },
});
