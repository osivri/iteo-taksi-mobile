import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<ApiResponse<NotificationItem> & { items: NotificationItem[] }>(
      '/notifications?limit=50',
    );
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
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Bildirim yok</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => !item.isRead && markRead(item.id)}
              style={[
                styles.card,
                {
                  backgroundColor: item.isRead ? theme.card : IteoColors.yellowLight,
                  borderColor: theme.border,
                },
              ]}>
              <View style={styles.row}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                {!item.isRead && <View style={styles.dot} />}
              </View>
              <Text style={{ color: theme.textSecondary, marginTop: 4, lineHeight: 20 }}>{item.body}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 8 }}>
                {item.type} · {new Date(item.createdAt).toLocaleString('tr-TR')}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: '#FCA5A5', textAlign: 'center', margin: 16 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: IteoColors.yellow, marginLeft: 8 },
});
