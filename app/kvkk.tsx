import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { api, ApiResponse } from '@/lib/api';

export default function KvkkScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setError(null);
    try {
      await api.post<ApiResponse<unknown>>('/users/me/kvkk-consent', {});
      router.replace('/(tabs)');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>KVKK Aydınlatma Metni</Text>
        <Text style={styles.body}>
          İstanbul Taksiciler Esnaf Odası mobil uygulaması kapsamında kişisel verileriniz; üyelik
          işlemleri, randevu ve ödeme süreçleri, duyuru/bildirim hizmetleri ile muhasebe kayıtlarının
          yürütülmesi amacıyla işlenmektedir.{'\n\n'}
          Verileriniz yalnızca hizmet sunumu ve yasal yükümlülükler için kullanılır. Detaylı bilgi
          için oda ile iletişime geçebilirsiniz.{'\n\n'}
          Devam ederek aydınlatma metnini okuduğunuzu ve kabul ettiğinizi beyan edersiniz.
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.button} onPress={accept} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={IteoColors.black} />
          ) : (
            <Text style={styles.buttonText}>Okudum, Kabul Ediyorum</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { padding: 24, paddingBottom: 40 },
  title: { color: IteoColors.yellow, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  body: { color: IteoColors.white, lineHeight: 24, fontSize: 14 },
  error: { color: '#FCA5A5', marginTop: 12, textAlign: 'center' },
  button: {
    marginTop: 24,
    backgroundColor: IteoColors.yellow,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: IteoColors.black, fontSize: 16, fontWeight: '700' },
});
