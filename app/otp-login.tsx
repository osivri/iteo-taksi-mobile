import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import { Button, ErrorText, Field } from '@/components/ui';
import { requestOtp, verifyOtp } from '@/lib/auth';

export default function OtpLoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    setLoading(true);
    setError(null);
    try {
      await requestOtp(phone.trim());
      setStep('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp() {
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone.trim(), code.trim());
      router.replace('/(tabs)');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Telefon ile Giriş</Text>
          <Text style={styles.subtitle}>SMS ile gönderilen kodu girin.</Text>
          {error ? <ErrorText>{error}</ErrorText> : null}
          {step === 'phone' ? (
            <>
              <Field label="Telefon" icon="call-outline" placeholder="5XX XXX XX XX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Button title={loading ? 'Gönderiliyor...' : 'Kod Gönder'} loading={loading} onPress={sendOtp} />
            </>
          ) : (
            <>
              <Field label="Doğrulama Kodu" icon="key-outline" placeholder="6 haneli kod" value={code} onChangeText={setCode} keyboardType="number-pad" />
              <Button title={loading ? 'Doğrulanıyor...' : 'Giriş Yap'} loading={loading} onPress={confirmOtp} />
              <Button title="Kodu Tekrar Gönder" variant="ghost" onPress={() => setStep('phone')} />
            </>
          )}
          <Button title="E-posta ile giriş" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { padding: spacing.xl, gap: spacing.md },
  title: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900' },
  subtitle: { color: '#A3A3A3', marginBottom: spacing.md },
});
