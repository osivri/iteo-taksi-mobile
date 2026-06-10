import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { MemberLauncherHeaderActions } from '@/components/MemberLauncherHeaderActions';

interface Props {
  showBack?: boolean;
}

export function MemberSubpageToolbar({ showBack = true }: Props) {
  return (
    <View style={styles.bar}>
      {showBack && router.canGoBack() ? (
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={IteoColors.black} />
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <MemberLauncherHeaderActions />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(10,10,10,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 40 },
});
