import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const faqs = [
  {
    q: 'Aidat ödememi nasıl yaparım?',
    a: 'Ödemeler ekranından oda aidatınızı güvenle ödeyebilirsiniz. Ödeme sonrası dekont uygulama içinde saklanır.',
  },
  {
    q: 'Hesabım neden doğrulanmadı?',
    a: 'Kayıt sonrası oda yönetimi profilinizi kontrol eder. Doğrulama tamamlanınca profil ekranındaki uyarı kalkar.',
  },
  {
    q: 'Plaka nasıl eklerim?',
    a: 'Profil > Plaka / Araçlarım menüsünden yeni plaka kaydı oluşturabilirsiniz.',
  },
  {
    q: 'Fiş yükleyemiyorum',
    a: 'Galeri izni verdiğinizden emin olun. Dosya JPG/PNG formatında ve 5 MB altında olmalıdır.',
  },
];

export default function HelpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Yardım & Destek',
          headerStyle: { backgroundColor: IteoColors.black },
          headerTintColor: IteoColors.white,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>İTEO İletişim</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 8, lineHeight: 22 }}>
            İstanbul Taksiciler Esnaf Odası{'\n'}
            Destek: hafta içi 09:00 – 17:00
          </Text>
          <Pressable style={styles.contactBtn} onPress={() => Linking.openURL('tel:+902125555555')}>
            <Text style={styles.contactText}>📞 Odayı Ara</Text>
          </Pressable>
          <Pressable
            style={[styles.contactBtn, { marginTop: 8 }]}
            onPress={() => Linking.openURL('mailto:destek@iteo.org.tr')}>
            <Text style={styles.contactText}>✉️ E-posta Gönder</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sık Sorulan Sorular</Text>
        {faqs.map((faq) => (
          <View
            key={faq.q}
            style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.faqQ, { color: theme.text }]}>{faq.q}</Text>
            <Text style={{ color: theme.textSecondary, marginTop: 8, lineHeight: 20 }}>{faq.a}</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 20, marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700' },
  contactBtn: {
    marginTop: 16,
    backgroundColor: IteoColors.yellow,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactText: { color: IteoColors.black, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  faqCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 10 },
  faqQ: { fontWeight: '700', fontSize: 15 },
});
