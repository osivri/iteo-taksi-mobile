import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { Button, Card, SectionTitle, useTheme } from '@/components/ui';

const faqs = [
  { q: 'Aidat ödememi nasıl yaparım?', a: 'Ödemeler ekranından oda aidatınızı güvenle ödeyebilirsiniz. Ödeme sonrası dekont uygulama içinde saklanır.' },
  { q: 'Hesabım neden doğrulanmadı?', a: 'Kayıt sonrası oda yönetimi profilinizi kontrol eder. Doğrulama tamamlanınca profil ekranındaki uyarı kalkar.' },
  { q: 'Plaka nasıl eklerim?', a: 'Profil > Plaka / Araçlarım menüsünden yeni plaka kaydı oluşturabilirsiniz.' },
  { q: 'Fiş yükleyemiyorum', a: 'Galeri izni verdiğinizden emin olun. Dosya JPG/PNG formatında ve 5 MB altında olmalıdır.' },
];

export default function HelpScreen() {
  const theme = useTheme();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>İTEO İletişim</Text>
        <Text style={{ color: theme.textSecondary, marginTop: spacing.sm, lineHeight: 22 }}>
          İstanbul Taksiciler Esnaf Odası{'\n'}Destek: hafta içi 09:00 – 17:00
        </Text>
        <Button title="Odayı Ara" icon="call" onPress={() => Linking.openURL('tel:+902125555555')} style={{ marginTop: spacing.lg }} />
        <Button title="E-posta Gönder" variant="outline" icon="mail" onPress={() => Linking.openURL('mailto:destek@iteo.org.tr')} style={{ marginTop: spacing.sm }} />
      </Card>

      <SectionTitle style={{ marginTop: spacing.xl }}>Sık Sorulan Sorular</SectionTitle>
      <View style={{ gap: spacing.sm }}>
        {faqs.map((faq) => {
          const expanded = open === faq.q;
          return (
            <Pressable
              key={faq.q}
              onPress={() => setOpen(expanded ? null : faq.q)}
              style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.scheme === 'light' ? shadow.card : null]}>
              <View style={styles.faqHead}>
                <Text style={[styles.faqQ, { color: theme.text }]}>{faq.q}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
              </View>
              {expanded ? <Text style={{ color: theme.textSecondary, marginTop: spacing.sm, lineHeight: 20 }}>{faq.a}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: { fontSize: fontSize.xl, fontWeight: '900' },
  faqCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  faqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  faqQ: { fontWeight: '800', fontSize: fontSize.md, flex: 1 },
});
