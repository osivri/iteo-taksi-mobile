import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { useNotificationsList } from '@/hooks/queries/lists';
import { queryKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import { EmptyState, ErrorText, Loader, useTheme } from '@/components/ui';

export default function NotificationsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const notificationsQuery = useNotificationsList();
  const items = notificationsQuery.data ?? [];
  const loading = notificationsQuery.isLoading && items.length === 0;

  async function markRead(id: string) {
    queryClient.setQueryData(queryKeys.notifications, (current: typeof items | undefined) =>
      current?.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
    try {
      await api.patch(`/notifications/${id}/read`, {});
    } catch (e) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      throw e;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {notificationsQuery.error ? <ErrorText>{notificationsQuery.error.message}</ErrorText> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="notifications-outline" title="Bildirim yok" message="Yeni bildirimler burada görünecek." />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !item.isRead && markRead(item.id)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.card, borderColor: item.isRead ? theme.border : IteoColors.yellow },
              theme.scheme === 'light' ? shadow.card : null,
              pressed ? styles.pressed : null,
            ]}>
            <View style={[styles.icon, { backgroundColor: item.isRead ? theme.backgroundSecondary : IteoColors.yellowLight }]}>
              <Ionicons name={item.isRead ? 'notifications-outline' : 'notifications'} size={18} color={IteoColors.black} />
            </View>
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                {!item.isRead ? <View style={styles.dot} /> : null}
              </View>
              <Text style={{ color: theme.textSecondary, marginTop: 3, lineHeight: 20 }}>{item.body}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: spacing.sm }}>
                {new Date(item.createdAt).toLocaleString('tr-TR')}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  card: { flexDirection: 'row', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: '800', flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: IteoColors.yellow, marginLeft: spacing.sm },
  pressed: { opacity: 0.9 },
});
