import { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { setOnboardingDone } from '@/lib/onboarding';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'İTEO Mobil\'e Hoş Geldiniz',
    description: 'İstanbul Taksiciler Esnaf Odası\'nın dijital hizmet platformu.',
    emoji: '🚕',
  },
  {
    title: 'Muhasebe & Ödemeler',
    description: 'Gelir-gider takibi, aidat ödemeleri ve fiş yükleme tek uygulamada.',
    emoji: '💰',
  },
  {
    title: 'Randevu & İSG',
    description: 'Otel ve oto servis talepleri, İSG eğitimleri ve dijital danışman desteği.',
    emoji: '🦺',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  async function finish() {
    await setOnboardingDone();
    router.replace('/role-selection');
  }

  function next() {
    if (index < slides.length - 1) {
      const nextIndex = index + 1;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setIndex(nextIndex);
    } else {
      finish();
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>{index === slides.length - 1 ? 'Başla' : 'Devam'}</Text>
        </Pressable>
        {index < slides.length - 1 && (
          <Pressable onPress={finish}>
            <Text style={styles.skip}>Atla</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  logo: { width: 64, height: 64, borderRadius: 14, alignSelf: 'center', marginTop: 24 },
  slide: { paddingHorizontal: 32, paddingTop: 48, alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { color: IteoColors.white, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  description: { color: IteoColors.gray500, fontSize: 15, textAlign: 'center', marginTop: 16, lineHeight: 22 },
  footer: { padding: 24, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333333' },
  dotActive: { backgroundColor: IteoColors.yellow, width: 24 },
  button: { backgroundColor: IteoColors.yellow, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: IteoColors.black, fontSize: 16, fontWeight: '700' },
  skip: { color: IteoColors.gray500, textAlign: 'center' },
});
