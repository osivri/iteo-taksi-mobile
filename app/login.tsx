import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { requestOtp, verifyOtp } from '@/lib/auth';
import {
  getLoginIntent,
  loginPortalCopy,
  setLoginIntent,
  type MemberLoginRole,
} from '@/lib/login-intent';

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid') || m.includes('expired') || m.includes('otp')) {
    return 'Doğrulama kodu hatalı veya süresi dolmuş.';
  }
  if (m.includes('phone') || m.includes('sms')) {
    return 'Telefon numaranız doğrulanamadı. Lütfen tekrar deneyin.';
  }
  return message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const [portalRole, setPortalRole] = useState<MemberLoginRole>('DRIVER');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIntent() {
      const fromParams = params.role;
      if (fromParams === 'DRIVER' || fromParams === 'PLATE_OWNER' || fromParams === 'USER') {
        setPortalRole(fromParams);
        await setLoginIntent(fromParams);
        return;
      }
      const stored = await getLoginIntent();
      if (stored) setPortalRole(stored);
    }
    loadIntent();
  }, [params.role]);

  const copy = loginPortalCopy[portalRole];

  async function handleRequestOtp() {
    setLoading(true);
    setError(null);
    const formatted = phone.startsWith('+') ? phone : `+90${phone.replace(/\D/g, '')}`;

    try {
      await requestOtp(formatted);
      setStep('otp');
    } catch (err) {
      setError(friendlyAuthError((err as Error).message));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setLoading(true);
    setError(null);
    const formatted = phone.startsWith('+') ? phone : `+90${phone.replace(/\D/g, '')}`;

    try {
      await verifyOtp(formatted, code);
      router.replace('/(tabs)');
    } catch (err) {
      setError(friendlyAuthError((err as Error).message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <Pressable onPress={() => router.replace('/welcome')} style={styles.backLink}>
          <Text style={styles.backText}>← Giriş türü seç</Text>
        </Pressable>

        <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
        <Text style={styles.badge}>{copy.badge}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {step === 'phone' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="5XX XXX XX XX"
              placeholderTextColor={IteoColors.gray500}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Pressable style={styles.button} onPress={handleRequestOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={IteoColors.black} />
              ) : (
                <Text style={styles.buttonText}>Doğrulama Kodu Gönder</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="6 haneli kod"
              placeholderTextColor={IteoColors.gray500}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />
            <Pressable style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={IteoColors.black} />
              ) : (
                <Text style={styles.buttonText}>Giriş Yap</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStep('phone')}>
              <Text style={styles.link}>Numarayı değiştir</Text>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  backLink: { position: 'absolute', top: 8, left: 0, zIndex: 1 },
  backText: { color: IteoColors.gray500, fontSize: 14 },
  logo: { width: 88, height: 88, borderRadius: 18, alignSelf: 'center', marginBottom: 16 },
  badge: {
    alignSelf: 'center',
    color: IteoColors.black,
    backgroundColor: IteoColors.yellow,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: { color: IteoColors.white, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: IteoColors.gray500, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  input: {
    backgroundColor: IteoColors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: IteoColors.yellow,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: IteoColors.black, fontSize: 16, fontWeight: '700' },
  error: { color: '#FCA5A5', marginBottom: 12, textAlign: 'center' },
  link: { color: IteoColors.yellow, textAlign: 'center', marginTop: 16 },
});
