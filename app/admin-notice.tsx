import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { getAdminWebUrl } from '@/lib/config';
import { logoutSession } from '@/lib/auth';

export default function AdminNoticeScreen() {
  const adminUrl = getAdminWebUrl();

  async function signOut() {
    await logoutSession();
    router.replace('/welcome');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconBubble}>
            <Ionicons name="business" size={48} color={IteoColors.black} />
          </View>
          <Text style={styles.title}>Oda Yönetimi</Text>
          <Text style={styles.text}>
            Yönetici hesapları mobil uygulama yerine oda yönetimi sayfasından kullanılmalıdır.
          </Text>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={() => Linking.openURL(adminUrl)}>
            <Text style={styles.primaryText}>Yönetim Sayfasına Git</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={signOut}>
            <Text style={styles.secondaryText}>Farklı hesapla giriş yap</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { flex: 1, padding: 22, justifyContent: 'center' },
  card: { backgroundColor: IteoColors.white, borderRadius: 28, padding: 24, alignItems: 'center' },
  iconBubble: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: IteoColors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { color: IteoColors.black, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  text: { color: IteoColors.gray500, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: IteoColors.yellow,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  pressed: { opacity: 0.84 },
  primaryText: { color: IteoColors.black, fontWeight: '700', fontSize: 16 },
  secondaryBtn: { marginTop: 14, padding: 12 },
  secondaryText: { color: IteoColors.black, fontWeight: '700' },
});
