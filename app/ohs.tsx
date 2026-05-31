import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Button, Card, Field, Loader, SectionTitle, useTheme } from '@/components/ui';

interface OhsContent {
  id: string;
  title: string;
  type: string;
  category: string;
}

export default function OhsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<OhsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; type: string; category: string }>>([]);
  const [asking, setAsking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api
        .get<ApiResponse<OhsContent> & { items: OhsContent[] }>('/ohs/contents')
        .then((res) => setItems(res.items ?? []))
        .finally(() => setLoading(false));
    }, []),
  );

  async function askChatbot() {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const res = await api.post<
        ApiResponse<{ answer: string; sources?: Array<{ title: string; type: string; category: string }> }>
      >('/ohs/chat', { message: question });
      setAnswer(res.data?.answer ?? 'Yanıt alınamadı');
      setSources(res.data?.sources ?? []);
    } catch (e) {
      setAnswer((e as Error).message);
    } finally {
      setAsking(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Card>
              <View style={styles.chatHead}>
                <View style={styles.chatIcon}>
                  <Ionicons name="shield-checkmark" size={20} color={IteoColors.black} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.chatTitle, { color: theme.text }]}>İSG Danışmanı</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>İş sağlığı ve güvenliği sorularınızı yanıtlar.</Text>
                </View>
              </View>
              <Field placeholder="İSG konusunda sorunuzu yazın" value={question} onChangeText={setQuestion} icon="chatbubble-ellipses-outline" />
              <Button title={asking ? 'Yanıtlanıyor...' : 'Danışmana Sor'} variant="dark" icon="send" loading={asking} onPress={askChatbot} />
              {answer ? (
                <View style={[styles.answerBox, { backgroundColor: theme.backgroundSecondary }]}>
                  <Text style={{ color: theme.text, lineHeight: 21 }}>{answer}</Text>
                  {sources.length > 0 ? (
                    <View style={{ marginTop: spacing.sm, gap: 3 }}>
                      <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, fontWeight: '800' }}>KAYNAK İÇERİKLER</Text>
                      {sources.map((s, i) => (
                        <Text key={`${s.title}-${i}`} style={{ color: theme.textSecondary, fontSize: fontSize.xs }}>
                          · {s.title} ({s.type})
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </Card>
            <SectionTitle style={{ marginTop: spacing.lg }}>Eğitim İçerikleri</SectionTitle>
          </View>
        }
        ListEmptyComponent={loading ? <Loader /> : null}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/ohs/${item.id}`)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              theme.scheme === 'light' ? shadow.card : null,
              pressed ? styles.pressed : null,
            ]}>
            <View style={styles.cardIcon}>
              <Ionicons name="document-text-outline" size={18} color={IteoColors.black} />
            </View>
            <View style={styles.flex}>
              <Text style={{ color: IteoColors.yellowDark, fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 0.5 }}>
                {item.type}
              </Text>
              <Text style={{ color: theme.text, fontWeight: '800', marginTop: 2, fontSize: fontSize.md }}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
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
  chatHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  chatIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: IteoColors.yellow, alignItems: 'center', justifyContent: 'center' },
  chatTitle: { fontSize: fontSize.lg, fontWeight: '900' },
  answerBox: { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  cardIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: IteoColors.yellowLight, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});
