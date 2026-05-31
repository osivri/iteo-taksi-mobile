import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { EmptyState, ErrorText, Loader, useTheme } from '@/components/ui';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<ApiResponse<NotificationItem> & { items: NotificationItem[] }>('/notifications?limit=50');
    setItems(res.items ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((e) => setError((e as Error).message))
        .finally(() => setLoading(false));
    }, [load]),
  );

  async function markRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={loading ? [] : items}
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
            <View
              style={[styles.icon, { backgroundColor: item.isRead ? theme.backgroundSecondary : IteoColors.yellowLight }]}>
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
