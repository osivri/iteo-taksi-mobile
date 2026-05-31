import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'iteo_onboarding_done';

export async function isOnboardingDone(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return value === 'true';
}

export async function setOnboardingDone(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
}

export function needsProfileSetup(profile: {
  firstName?: string;
  lastName?: string;
  status?: string;
}): boolean {
  return !profile.firstName?.trim() || !profile.lastName?.trim();
}

export function needsKvkkAcceptance(profile: { kvkkAcceptedAt?: string | null }): boolean {
  return !profile.kvkkAcceptedAt;
}

export function needsAddressSetup(profile: {
  city?: string | null;
  district?: string | null;
  addressLine?: string | null;
}): boolean {
  return !profile.city?.trim() || !profile.district?.trim() || !profile.addressLine?.trim();
}
