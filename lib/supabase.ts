import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function uploadFile(
  bucket: 'receipts' | 'profile-images' | 'content-images',
  uri: string,
  mimeType: string,
) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const ext = mimeType.split('/')[1] ?? 'jpg';
  const path = `${(await supabase.auth.getUser()).data.user?.id}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { path: data.path, url: urlData.publicUrl };
}
