import { Redirect } from 'expo-router';

/** Eski birleşik oda hizmetleri — ana ekrana yönlendir */
export default function ServicesRedirectScreen() {
  return <Redirect href="/(tabs)" />;
}
