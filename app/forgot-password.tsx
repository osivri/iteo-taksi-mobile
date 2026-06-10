import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, spacing } from '@/constants/theme';
import { Button, ErrorText, Field } from '@/components/ui';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Şifremi Unuttum</Text>
        {error ? <ErrorText>{error}</ErrorText> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <Field label="E-posta" icon="mail-outline" placeholder="ornek@mail.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Button title={loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'} loading={loading} onPress={submit} />
        <Button title="Girişe Dön" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { padding: spacing.xl, gap: spacing.md },
  title: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900' },
  success: { color: IteoColors.success, fontSize: fontSize.md },
});
