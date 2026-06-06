import { Redirect, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

const PUBLIC_ROUTES = new Set([
  'welcome',
  'login',
  'admin-notice',
  'onboarding',
  'role-selection',
  'kvkk',
  'modal',
]);

export function AuthGate() {
  const { loading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const root = segments[0];

  if (loading || !root || PUBLIC_ROUTES.has(root)) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  return null;
}
