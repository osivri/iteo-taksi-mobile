import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

interface OhsDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  body: string | null;
  videoUrl: string | null;
}

export default function OhsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [item, setItem] = useState<OhsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ApiResponse<OhsDetail>>(`/ohs/contents/${id}`)
      .then((res) => setItem(res.data ?? null))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'İSG İçerik',
          headerStyle: { backgroundColor: IteoColors.black },
          headerTintColor: IteoColors.white,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
        {loading ? (
          <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 32 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : item ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.badge}>{item.type} · {item.category}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            {item.description && (
              <Text style={{ color: theme.textSecondary, marginTop: 8, lineHeight: 22 }}>{item.description}</Text>
            )}
            {item.body && (
              <Text style={{ color: theme.textSecondary, marginTop: 16, lineHeight: 24 }}>{item.body}</Text>
            )}
            {item.videoUrl && (
              <Pressable style={styles.videoBtn} onPress={() => Linking.openURL(item.videoUrl!)}>
                <Text style={styles.videoText}>Videoyu Aç</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: '#FCA5A5', textAlign: 'center', margin: 16 },
  card: { margin: 16, borderWidth: 1, borderRadius: 14, padding: 20 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: IteoColors.yellowLight,
    color: IteoColors.black,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  title: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  videoBtn: {
    marginTop: 20,
    backgroundColor: IteoColors.yellow,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  videoText: { color: IteoColors.black, fontWeight: '700' },
});
