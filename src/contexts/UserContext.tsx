import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ensureUser } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';

interface UserContextType {
  user: Tables<'users'> | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, loading: true });

const USER_ID_KEY = 'coogaih_user_id';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Tables<'users'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(USER_ID_KEY);
    ensureUser(storedId || undefined)
      .then(u => {
        localStorage.setItem(USER_ID_KEY, u.id);
        setUser(u);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
