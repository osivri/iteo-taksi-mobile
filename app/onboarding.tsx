import { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { setOnboardingDone } from '@/lib/onboarding';

const { width } = Dimensions.get('window');

const slides: Array<{ title: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = [
  {
    title: 'İTEO Mobil\'e Hoş Geldiniz',
    description: 'İstanbul Taksiciler Esnaf Odası\'nın dijital hizmet platformu.',
    icon: 'car-sport',
  },
  {
    title: 'Muhasebe & Ödemeler',
    description: 'Gelir-gider takibi, aidat ödemeleri ve fiş yükleme tek uygulamada.',
    icon: 'wallet',
  },
  {
    title: 'Randevu & İSG',
    description: 'Otel ve oto servis talepleri, İSG eğitimleri ve dijital danışman desteği.',
    icon: 'shield-checkmark',
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
      <View style={styles.topBar}>
        <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
        <Text style={styles.brand}>İTEO Mobil</Text>
      </View>
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
            <View style={styles.illustration}>
              <Ionicons name={item.icon} size={72} color={IteoColors.yellow} />
            </View>
            <View style={styles.copyCard}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
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
  topBar: { paddingTop: 20, alignItems: 'center' },
  logo: { width: 66, height: 66, borderRadius: 18 },
  brand: { color: IteoColors.yellow, fontWeight: '800', marginTop: 12, letterSpacing: 1.2 },
  slide: { paddingHorizontal: 24, paddingTop: 36, alignItems: 'center', justifyContent: 'center' },
  illustration: {
    width: 164,
    height: 164,
    borderRadius: 48,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  copyCard: {
    width: '100%',
    backgroundColor: IteoColors.white,
    borderRadius: 28,
    padding: 24,
  },
  title: { color: IteoColors.black, fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.4 },
  description: { color: IteoColors.gray500, fontSize: 15, textAlign: 'center', marginTop: 14, lineHeight: 22 },
  footer: { padding: 24, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333333' },
  dotActive: { backgroundColor: IteoColors.yellow, width: 24 },
  button: { backgroundColor: IteoColors.yellow, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: IteoColors.black, fontSize: 16, fontWeight: '700' },
  skip: { color: IteoColors.gray500, textAlign: 'center' },
});
