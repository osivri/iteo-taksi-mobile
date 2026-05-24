import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

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
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Fiş Detayı',
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
            <Text style={[styles.amount, { color: item.type === 'INCOME' ? '#16A34A' : '#DC2626' }]}>
              {item.type === 'INCOME' ? '+' : '-'}
              {item.amount.toLocaleString('tr-TR')} {item.currency}
            </Text>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18, marginTop: 8 }}>
              {item.category}
            </Text>
            <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
              {item.type === 'INCOME' ? 'Gelir' : 'Gider'} ·{' '}
              {new Date(item.recordDate).toLocaleDateString('tr-TR')}
            </Text>
            {item.description && (
              <Text style={{ color: theme.textSecondary, marginTop: 16, lineHeight: 22 }}>
                {item.description}
              </Text>
            )}
            {item.receiptImageUrl ? (
              <>
                <Text style={[styles.section, { color: theme.text }]}>Fiş Görseli</Text>
                {item.receiptOcrData && (
                  <View style={styles.ocrBox}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      Akıllı fiş okuma · %{Math.round((item.receiptOcrData.confidence ?? 0) * 100)} doğruluk
                    </Text>
                    {item.receiptOcrData.merchant && (
                      <Text style={{ color: theme.text, marginTop: 4 }}>{item.receiptOcrData.merchant}</Text>
                    )}
                  </View>
                )}
                <Image source={{ uri: item.receiptImageUrl }} style={styles.receipt} resizeMode="contain" />
                <Pressable onPress={() => Linking.openURL(item.receiptImageUrl!)}>
                  <Text style={styles.link}>Görseli tarayıcıda aç</Text>
                </Pressable>
              </>
            ) : (
              <Text style={{ color: theme.textSecondary, marginTop: 20 }}>Fiş görseli yüklenmemiş.</Text>
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
  amount: { fontSize: 32, fontWeight: '800' },
  section: { marginTop: 20, fontWeight: '700' },
  ocrBox: { marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,199,0,0.15)' },
  receipt: { width: '100%', height: 280, marginTop: 12, borderRadius: 10, backgroundColor: '#111' },
  link: { color: IteoColors.yellow, marginTop: 12, fontWeight: '600' },
});
