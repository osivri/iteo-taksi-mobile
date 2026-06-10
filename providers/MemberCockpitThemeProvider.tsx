import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  readMemberCockpitTheme,
  storeMemberCockpitTheme,
  type MemberCockpitTheme,
} from '@/lib/member-cockpit-theme';

interface Value {
  theme: MemberCockpitTheme;
  ready: boolean;
  toggleTheme: () => void;
  setTheme: (theme: MemberCockpitTheme) => void;
}

const MemberCockpitThemeContext = createContext<Value | null>(null);

export function MemberCockpitThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<MemberCockpitTheme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readMemberCockpitTheme().then((stored) => {
      setThemeState(stored);
      setReady(true);
    });
  }, []);

  const setTheme = useCallback((next: MemberCockpitTheme) => {
    setThemeState(next);
    void storeMemberCockpitTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      void storeMemberCockpitTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, ready, toggleTheme, setTheme }), [theme, ready, toggleTheme, setTheme]);

  return <MemberCockpitThemeContext.Provider value={value}>{children}</MemberCockpitThemeContext.Provider>;
}

export function useMemberCockpitTheme(): Value {
  const ctx = useContext(MemberCockpitThemeContext);
  if (!ctx) throw new Error('useMemberCockpitTheme must be used within MemberCockpitThemeProvider');
  return ctx;
}
