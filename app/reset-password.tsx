import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, spacing } from '@/constants/theme';
import { Button, ErrorText, Field } from '@/components/ui';
import { api } from '@/lib/api';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { password });
      router.replace('/(tabs)');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Yeni Şifre</Text>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Field label="Yeni Şifre" icon="lock-closed-outline" placeholder="En az 8 karakter" value={password} onChangeText={setPassword} secureTextEntry />
        <Field label="Şifre Tekrar" icon="lock-closed-outline" placeholder="Şifreyi tekrar girin" value={confirm} onChangeText={setConfirm} secureTextEntry />
        <Button title={loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'} loading={loading} onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { padding: spacing.xl, gap: spacing.md },
  title: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900' },
});
