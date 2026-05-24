import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { api, ApiResponse } from '@/lib/api';
import { setOnboardingDone } from '@/lib/onboarding';
import { getLoginIntent, loginPortalCopy, type MemberLoginRole } from '@/lib/login-intent';

const roleLabels: Record<MemberLoginRole, string> = {
  DRIVER: 'Şoför Paneli',
  PLATE_OWNER: 'Mal Sahibi Paneli',
  USER: 'Üye Paneli',
};

export default function RoleSelectionScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<MemberLoginRole>('DRIVER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLoginIntent().then((intent) => {
      if (intent) setRole(intent);
    });
  }, []);

  async function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Ad ve soyad zorunludur.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post<ApiResponse<unknown>>('/users/me/onboarding', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      });
      await setOnboardingDone();
      router.replace('/kvkk');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const portalCopy = loginPortalCopy[role];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
        <Text style={styles.badge}>{roleLabels[role]}</Text>
        <Text style={styles.title}>Profilinizi Tamamlayın</Text>
        <Text style={styles.subtitle}>
          Ad ve soyad bilgilerinizi girin; {portalCopy.badge.toLowerCase()} hemen kullanıma açılır.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Ad"
          placeholderTextColor={IteoColors.gray500}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Soyad"
          placeholderTextColor={IteoColors.gray500}
          value={lastName}
          onChangeText={setLastName}
        />

        <Pressable style={styles.button} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={IteoColors.black} />
          ) : (
            <Text style={styles.buttonText}>Devam Et</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { padding: 24, paddingBottom: 40 },
  logo: { width: 72, height: 72, borderRadius: 16, alignSelf: 'center', marginBottom: 20 },
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
  title: { color: IteoColors.white, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: IteoColors.gray500, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
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
    marginTop: 16,
  },
  buttonText: { color: IteoColors.black, fontSize: 16, fontWeight: '700' },
  error: { color: '#FCA5A5', marginBottom: 12, textAlign: 'center' },
});
