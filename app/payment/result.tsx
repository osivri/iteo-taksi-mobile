import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui';

export default function PaymentResultScreen() {
  const { status, amount, id } = useLocalSearchParams<{ status?: string; amount?: string; id?: string }>();
  const success = status === 'SUCCESS';

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Ödeme Sonucu' }} />
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: success ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)' }]}>
          <Ionicons name={success ? 'checkmark-circle' : 'close-circle'} size={88} color={success ? IteoColors.success : IteoColors.error} />
        </View>
        <Text style={styles.title}>{success ? 'Ödeme Başarılı' : 'Ödeme Başarısız'}</Text>
        {amount ? <Text style={styles.amount}>{Number(amount).toLocaleString('tr-TR')} ₺</Text> : null}
        <Text style={styles.hint}>
          {success
            ? 'Ödemeniz kaydedildi. Dekontu ödeme detayından görüntüleyebilirsiniz.'
            : 'Ödeme tamamlanamadı. Lütfen tekrar deneyin veya oda ile iletişime geçin.'}
        </Text>

        <View style={styles.actions}>
          {success && id ? (
            <Button title="Ödeme Detayı" icon="receipt" onPress={() => router.replace(`/payment/${id}`)} />
          ) : null}
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
