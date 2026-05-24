import { useEffect, useState } from 'react';
import { getAccessToken, logoutSession } from '@/lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccessToken().then((token) => {
      setIsAuthenticated(!!token);
      setLoading(false);
    });
  }, []);

  async function signOut() {
    await logoutSession();
    setIsAuthenticated(false);
  }

  return { loading, isAuthenticated, signOut };
}
