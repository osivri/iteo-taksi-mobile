import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { Button, Field, SegmentedControl } from '@/components/ui';
import { memberLogin, memberRegister } from '@/lib/auth';
import { getLoginIntent, loginPortalCopy, setLoginIntent, type MemberLoginRole } from '@/lib/login-intent';

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid') || m.includes('credentials')) {
    return 'E-posta veya şifre hatalı.';
  }
  if (m.includes('network request failed') || m.includes('failed to fetch') || m.includes('network')) {
    return 'Bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edin.';
  }
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
    return 'Bu e-posta adresiyle kayıtlı bir hesap var.';
  }
  if (m.includes('password') || m.includes('şifre')) {
    return 'Şifre en az 6 karakter olmalı.';
  }
  return message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const [portalRole, setPortalRole] = useState<MemberLoginRole>('DRIVER');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre alanlarını doldurun.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === 'login') {
        await memberLogin(email.trim(), password);
        router.replace('/(tabs)');
        return;
      }
      const result = await memberRegister(email.trim(), password, portalRole);
      if ('accessToken' in result && result.accessToken) {
        router.replace('/(tabs)');
        return;
      }
      const message = 'message' in result ? result.message : undefined;
      setSuccess(message ?? 'Kayıt oluşturuldu. E-postanızı kontrol ettikten sonra giriş yapabilirsiniz.');
      setMode('login');
      setPassword('');
    } catch (err) {
      setError(friendlyAuthError((err as Error).message));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.replace('/welcome')} style={styles.backLink}>
            <Ionicons name="chevron-back" size={18} color={IteoColors.yellow} />
            <Text style={styles.backText}>Giriş türünü değiştir</Text>
          </Pressable>

          <View style={styles.hero}>
            <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
            <Text style={styles.badge}>{copy.badge}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View style={styles.formCard}>
            <SegmentedControl
              value={mode}
              onChange={switchMode}
              options={[
                { value: 'login', label: 'Giriş Yap' },
                { value: 'register', label: 'Kayıt Ol' },
              ]}
              style={{ marginBottom: spacing.lg }}
            />

            {error ? (
              <View style={[styles.banner, styles.bannerError]}>
                <Ionicons name="alert-circle" size={18} color={IteoColors.error} />
                <Text style={styles.bannerErrorText}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={[styles.banner, styles.bannerSuccess]}>
                <Ionicons name="checkmark-circle" size={18} color={IteoColors.success} />
                <Text style={styles.bannerSuccessText}>{success}</Text>
              </View>
            ) : null}

            <Field
              label="E-posta"
              icon="mail-outline"
              placeholder="ornek@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Şifre"
              icon="lock-closed-outline"
              placeholder="En az 6 karakter"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button
              title={mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              icon={mode === 'login' ? 'log-in-outline' : 'person-add-outline'}
              loading={loading}
              onPress={handleSubmit}
              style={{ marginTop: spacing.xs }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  backLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { color: IteoColors.yellow, fontSize: fontSize.md, fontWeight: '700' },
  hero: { borderRadius: radius.xxl, padding: spacing.xxl, marginBottom: spacing.lg, backgroundColor: '#141414', borderWidth: 1, borderColor: '#262626', alignItems: 'center' },
  logo: { width: 80, height: 80, borderRadius: 22, marginBottom: spacing.lg },
  badge: { color: IteoColors.black, backgroundColor: IteoColors.yellow, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, fontSize: fontSize.xs, fontWeight: '800', marginBottom: spacing.md },
  title: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: '#A3A3A3', fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },
  formCard: { backgroundColor: IteoColors.white, borderRadius: radius.xxl, padding: spacing.xl, ...shadow.floating },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  bannerError: { backgroundColor: '#FEE2E2' },
  bannerErrorText: { color: '#991B1B', flex: 1, fontWeight: '600', fontSize: fontSize.sm },
  bannerSuccess: { backgroundColor: '#DCFCE7' },
  bannerSuccessText: { color: '#166534', flex: 1, fontWeight: '600', fontSize: fontSize.sm, lineHeight: 18 },
});
