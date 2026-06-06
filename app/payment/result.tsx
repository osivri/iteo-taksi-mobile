import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Button, ErrorText, Loader } from '@/components/ui';

interface PaymentStatus {
  id: string;
  amount: number;
  status: string;
}

export default function PaymentResultScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Ödeme kaydı bulunamadı.');
      setLoading(false);
      return;
    }

    api
      .get<ApiResponse<PaymentStatus>>(`/payments/${id}`)
      .then((res) => setPayment(res.data ?? null))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Ödeme Sonucu' }} />
        <View style={styles.container}>
          <Loader />
        </View>
      </>
    );
  }

  if (error || !payment) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Ödeme Sonucu' }} />
        <View style={styles.container}>
          <ErrorText>{error ?? 'Ödeme kaydı bulunamadı.'}</ErrorText>
          <Button title="Ödemelere Dön" variant="ghost" onPress={() => router.replace('/(tabs)/payments')} style={styles.outlineDark} />
        </View>
      </>
    );
  }

  const success = payment.status === 'SUCCESS';
  const pending = payment.status === 'PENDING';

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Ödeme Sonucu' }} />
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: success ? 'rgba(22,163,74,0.15)' : pending ? 'rgba(255,199,0,0.15)' : 'rgba(220,38,38,0.15)' }]}>
          <Ionicons
            name={success ? 'checkmark-circle' : pending ? 'time' : 'close-circle'}
            size={88}
            color={success ? IteoColors.success : pending ? IteoColors.yellow : IteoColors.error}
          />
        </View>
        <Text style={styles.title}>
          {success ? 'Ödeme Başarılı' : pending ? 'Ödeme Bekleniyor' : 'Ödeme Başarısız'}
        </Text>
        <Text style={styles.amount}>{payment.amount.toLocaleString('tr-TR')} ₺</Text>
        <Text style={styles.hint}>
          {success
            ? 'Ödemeniz kaydedildi. Dekontu ödeme detayından görüntüleyebilirsiniz.'
            : pending
              ? 'Ödeme henüz tamamlanmadı. Birkaç dakika sonra tekrar kontrol edin.'
              : 'Ödeme tamamlanamadı. Lütfen tekrar deneyin veya oda ile iletişime geçin.'}
        </Text>

        <View style={styles.actions}>
          <Button title="Ödeme Detayı" icon="receipt" onPress={() => router.replace(`/payment/${payment.id}`)} />
          <Button title="Ödemelere Dön" variant="ghost" onPress={() => router.replace('/(tabs)/payments')} style={styles.outlineDark} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: IteoColors.black, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  iconCircle: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  title: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900', letterSpacing: -0.5 },
  amount: { color: IteoColors.yellow, fontSize: fontSize.hero, fontWeight: '900', marginTop: spacing.md, letterSpacing: -1 },
  hint: { color: '#A3A3A3', textAlign: 'center', marginTop: spacing.lg, lineHeight: 22, fontSize: fontSize.md },
  actions: { width: '100%', marginTop: spacing.xxl, gap: spacing.md },
  outlineDark: { borderWidth: 1.5, borderColor: '#404040' },
});
