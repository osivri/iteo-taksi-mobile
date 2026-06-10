import * as SecureStore from 'expo-secure-store';

export type MemberCockpitTheme = 'light' | 'dark';

const STORAGE_KEY = 'iteo_member_cockpit_theme';

export async function readMemberCockpitTheme(): Promise<MemberCockpitTheme> {
  try {
    const value = await SecureStore.getItemAsync(STORAGE_KEY);
    return value === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export async function storeMemberCockpitTheme(theme: MemberCockpitTheme): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function cockpitBackground(theme: MemberCockpitTheme): string {
  return theme === 'light' ? '#ffc700' : '#0a0a0a';
}
