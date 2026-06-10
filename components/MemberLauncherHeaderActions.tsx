import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { useMemberCockpitTheme } from '@/providers/MemberCockpitThemeProvider';
import { logoutSession } from '@/lib/auth';
import { router } from 'expo-router';

export function MemberLauncherHeaderActions() {
  const { theme, toggleTheme, ready } = useMemberCockpitTheme();
  const isLight = theme === 'light';

  async function logout() {
    await logoutSession();
    router.replace('/welcome');
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggleTheme}
        disabled={!ready}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      >
        <Ionicons name={isLight ? 'moon' : 'sunny'} size={16} color={IteoColors.yellow} />
        <Text style={styles.btnText}>{isLight ? 'Koyu' : 'Açık'}</Text>
      </Pressable>
      <Pressable onPress={logout} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
        <Ionicons name="log-out-outline" size={16} color={IteoColors.yellow} />
        <Text style={styles.btnText}>Çıkış</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IteoColors.black,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...shadow.raised,
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  btnText: { color: IteoColors.white, fontWeight: '800', fontSize: fontSize.sm },
});
