import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import { Card, ListRow, useTheme } from '@/components/ui';

export default function SettingsScreen() {
  const theme = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Bildirim Tercihleri</Text>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Anlık bildirimler</Text>
            <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>Cihaz izni gerektirir.</Text>
          </View>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: IteoColors.yellow, false: theme.border }} thumbColor={IteoColors.white} />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.text, flex: 1 }]}>SMS bildirimleri</Text>
          <Switch value={smsEnabled} onValueChange={setSmsEnabled} trackColor={{ true: IteoColors.yellow, false: theme.border }} thumbColor={IteoColors.white} />
        </View>
      </Card>

      <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>HESAP</Text>
      <View style={styles.menu}>
        <ListRow title="Profil bilgilerim" icon="person-outline" onPress={() => router.push('/(tabs)/profile')} />
        <ListRow title="Yardım & Destek" icon="help-circle-outline" onPress={() => router.push('/help')} />
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.appRow}>
          <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
          <View style={styles.flex}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>İTEO Mobil v1.0.0</Text>
            <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: 2 }}>İstanbul Taksiciler Esnaf Odası</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '900', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  rowLabel: { fontSize: fontSize.md, fontWeight: '700' },
  divider: { height: 1, marginVertical: spacing.md },
  groupLabel: { fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: 2 },
  menu: { gap: spacing.sm },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
