import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function AdminNoticeScreen() {
  const adminUrl = process.env.EXPO_PUBLIC_ADMIN_URL ?? 'http://localhost:3002/login';

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/welcome');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🏛️</Text>
        <Text style={styles.title}>Oda Yönetim Paneli</Text>
        <Text style={styles.text}>
          Yönetici hesapları mobil uygulama yerine web yönetim paneli üzerinden kullanılmalıdır.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => Linking.openURL(adminUrl)}>
          <Text style={styles.primaryText}>Web Paneline Git</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={signOut}>
          <Text style={styles.secondaryText}>Farklı hesapla giriş yap</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { color: IteoColors.white, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  text: { color: IteoColors.gray500, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: IteoColors.yellow,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  primaryText: { color: IteoColors.black, fontWeight: '700', fontSize: 16 },
  secondaryBtn: { marginTop: 14, padding: 12 },
  secondaryText: { color: IteoColors.yellow, fontWeight: '600' },
});
