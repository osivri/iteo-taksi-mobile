import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';

export default function PaymentResultScreen() {
  const { status, amount, id } = useLocalSearchParams<{
    status?: string;
    amount?: string;
    id?: string;
  }>();

  const success = status === 'SUCCESS';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Ödeme Sonucu',
          headerStyle: { backgroundColor: IteoColors.black },
          headerTintColor: IteoColors.white,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.emoji}>{success ? '✅' : '❌'}</Text>
        <Text style={styles.title}>{success ? 'Ödeme Başarılı' : 'Ödeme Başarısız'}</Text>
        {amount && (
          <Text style={styles.amount}>{Number(amount).toLocaleString('tr-TR')} ₺</Text>
        )}
        <Text style={styles.hint}>
          {success
            ? 'Ödemeniz kaydedildi. Dekontu ödeme detayından görüntüleyebilirsiniz.'
            : 'Ödeme tamamlanamadı. Lütfen tekrar deneyin veya oda ile iletişime geçin.'}
        </Text>

        {success && id && (
          <Pressable style={styles.primaryBtn} onPress={() => router.replace(`/payment/${id}`)}>
            <Text style={styles.primaryText}>Ödeme Detayı</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/payments')}>
          <Text style={styles.secondaryText}>Ödemelere Dön</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IteoColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: IteoColors.white, fontSize: 24, fontWeight: '800' },
  amount: { color: IteoColors.yellow, fontSize: 32, fontWeight: '800', marginTop: 12 },
  hint: { color: IteoColors.gray500, textAlign: 'center', marginTop: 16, lineHeight: 22 },
  primaryBtn: {
    marginTop: 32,
    backgroundColor: IteoColors.yellow,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  primaryText: { color: IteoColors.black, fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: IteoColors.gray500,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  secondaryText: { color: IteoColors.white, fontWeight: '600' },
});
