import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

interface Profile {
  user_id: string;
  preferred_name: string | null;
  timezone: string;
  study_language: string;
  education_level: string | null;
  institution: string | null;
  year_of_study: string | null;
  primary_goal: string | null;
  preferred_guidance_style: string;
  notification_opt_in: boolean;
  typical_available_minutes_weekday: number;
  typical_available_minutes_weekend: number;
  preferred_session_length_minutes: number;
  peak_focus_time: string;
  study_environment: string;
  distraction_risk_self_rating: number;
  self_reported_strength: string;
  common_failure_mode: string[];
  confidence_style: string;
  persistence_style: string;
  preferred_feedback_tone: string;
  telemetry_level: string;
  allow_notes_indexing: boolean;
  allow_ai_use_of_debrief: boolean;
  data_retention_days: number;
  delete_data_on_request: boolean;
  profile_completion: number;
  onboarding_completed: boolean;
  avatar_id: string;
}

interface UserContextType {
  user: Tables<'users'> | null;
  profile: Profile | null;
  authUser: any | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  authUser: null,
  loading: true,
  isAuthenticated: false,
  isOnboarded: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Tables<'users'> | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (authId: string, email: string | undefined) => {
    // Check if user record exists
    let { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authId)
      .maybeSingle();

    if (!existingUser) {
      // Create user record
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id: authId,
          display_name: email?.split('@')[0] || 'User',
          email: email || null,
          auth_provider: 'email',
        } as any)
        .select()
        .single();
      if (error) {
        console.error('Error creating user:', error);
        return;
      }
      existingUser = newUser;
    }

    setUser(existingUser);

    // Load profile
    let { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authId)
      .maybeSingle();

    if (!existingProfile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ user_id: authId } as any)
        .select()
        .single();
      existingProfile = newProfile;
    }

    setProfile(existingProfile as any);
  };

  const refreshProfile = async () => {
    if (!authUser?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (data) setProfile(data as any);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setAuthUser(null);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            loadUserData(session.user.id, session.user.email ?? undefined);
          }, 0);
        } else {
          setAuthUser(null);
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        loadUserData(session.user.id, session.user.email ?? undefined);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      profile,
      authUser,
      loading,
      isAuthenticated: !!authUser,
      isOnboarded: !!profile?.onboarding_completed,
      signOut,
      refreshProfile,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
