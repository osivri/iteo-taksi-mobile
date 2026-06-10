import { Redirect } from 'expo-router';

/** Eski birleşik randevu sekmesi — ana modül ekranına yönlendir */
export default function AppointmentsTabRedirect() {
  return <Redirect href="/(tabs)" />;
}
