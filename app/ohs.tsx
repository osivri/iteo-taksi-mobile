import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

interface OhsContent {
  id: string;
  title: string;
  type: string;
  category: string;
}

export default function OhsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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
      <View style={[styles.chatBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="İSG konusunda sorunuzu yazın"
          placeholderTextColor={theme.textSecondary}
          value={question}
          onChangeText={setQuestion}
        />
        <Pressable style={styles.askBtn} onPress={askChatbot} disabled={asking}>
          <Text style={styles.askBtnText}>{asking ? 'Yanıtlanıyor...' : 'İSG Danışmanına Sor'}</Text>
        </Pressable>
        {answer && <Text style={[styles.answer, { color: theme.text }]}>{answer}</Text>}
        {sources.length > 0 && (
          <View style={{ marginTop: 8, gap: 4 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600' }}>Kaynak içerikler</Text>
            {sources.map((s, i) => (
              <Text key={`${s.title}-${i}`} style={{ color: theme.textSecondary, fontSize: 11 }}>
                · {s.title} ({s.type})
              </Text>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListHeaderComponent={<Text style={[styles.section, { color: theme.text }]}>Eğitim İçerikleri</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/ohs/${item.id}`)}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={{ color: IteoColors.yellow, fontSize: 11, fontWeight: '700' }}>{item.type}</Text>
              <Text style={{ color: theme.text, fontWeight: '600', marginTop: 4 }}>{item.title}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatBox: { margin: 16, borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  askBtn: { backgroundColor: IteoColors.black, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  askBtnText: { color: IteoColors.white, fontWeight: '700' },
  answer: { lineHeight: 20, fontSize: 14 },
  section: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
});
