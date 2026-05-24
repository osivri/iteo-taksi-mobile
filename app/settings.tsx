import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Bildirim Tercihleri</Text>
        <View style={styles.row}>
          <Text style={{ color: theme.text, flex: 1 }}>Anlık bildirimler</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ true: IteoColors.yellow, false: theme.border }}
          />
        </View>
        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={{ color: theme.text, flex: 1 }}>SMS bildirimleri</Text>
          <Switch
            value={smsEnabled}
            onValueChange={setSmsEnabled}
            trackColor={{ true: IteoColors.yellow, false: theme.border }}
          />
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 12 }}>
          Anlık bildirimler için cihazınızdan izin vermeniz gerekir.
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Hesap</Text>
        <Link href="/(tabs)/profile" asChild>
          <Pressable style={styles.linkRow}>
            <Text style={{ color: theme.text }}>Profil bilgilerim</Text>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </Pressable>
        </Link>
        <Link href="/help" asChild>
          <Pressable style={styles.linkRow}>
            <Text style={{ color: theme.text }}>Yardım & Destek</Text>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </Pressable>
        </Link>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Uygulama</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>İTEO Mobil v1.0.0</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
          İstanbul Taksiciler Esnaf Odası
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  section: { borderWidth: 1, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
});
