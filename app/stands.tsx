import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { useStands } from '@/hooks/queries/catalog';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { EmptyState, ErrorText, Loader, useTheme } from '@/components/ui';

export default function StandsScreen() {
  const theme = useTheme();
  const query = useStands();
  const items = query.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <MemberSubpageToolbar />
            <ModulePageHero badge="Rehber" title="Duraklar" description="İstanbul taksi durakları rehberi ve konum bilgileri." icon="location" />
          </View>
        }
        ListEmptyComponent={query.isLoading ? <Loader /> : <EmptyState icon="location-outline" title="Durak yok" message="Kayıtlı durak bulunamadı." />}
        ListFooterComponent={query.error ? <ErrorText>{query.error.message}</ErrorText> : null}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}>
            <Text style={[styles.title, { color: theme.text }]}>{String(item.name ?? 'Durak')}</Text>
            <Text style={{ color: theme.textSecondary }}>{String(item.district ?? '')} · {String(item.address ?? '')}</Text>
            {item.phone ? (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
                <Text style={{ color: theme.text }}>{String(item.phone)}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: fontSize.lg, fontWeight: '800' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
