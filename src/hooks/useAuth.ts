import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'buyer' | 'cook' | 'admin';

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  city?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  forcePasswordChange?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (userId: string, userEmail: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch all roles and pick the highest priority one
      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Priority: admin > cook > buyer
      const roles = rolesData?.map(r => r.role as UserRole) || [];
      let role: UserRole = 'buyer';
      if (roles.includes('admin')) {
        role = 'admin';
      } else if (roles.includes('cook')) {
        role = 'cook';
      }

      if (profileData) {
        setProfile({
          id: profileData.id,
          userId: profileData.user_id,
          email: userEmail,
          fullName: profileData.full_name,
          phone: profileData.phone || undefined,
          city: profileData.city || undefined,
          address: profileData.address || undefined,
          avatarUrl: profileData.avatar_url || undefined,
          bio: profileData.bio || undefined,
          role,
          forcePasswordChange: (profileData as any).force_password_change || false,
        });
      } else {
        // Profile not created yet (edge case)
        setProfile({
          id: '',
          userId,
          email: userEmail,
          fullName: userEmail.split('@')[0],
          role,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id, session.user.email || '');
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) {
      toast({
        title: 'Registration Error',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({
      title: 'Account created!',
      description: 'Please check your email to confirm your account.',
    });

    return { data };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Login Error',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    // Check if user is banned
    if (data.user) {
      const { data: bans } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', data.user.id);

      const activeBan = (bans || []).find(b =>
        b.banned_until === null || new Date(b.banned_until) > new Date()
      );

      if (activeBan) {
        await supabase.auth.signOut();
        const until = activeBan.banned_until
          ? `until ${new Date(activeBan.banned_until).toLocaleDateString()}`
          : 'permanently';
        toast({
          title: 'Account Banned',
          description: `Your account is banned ${until}.${activeBan.reason ? ` Reason: ${activeBan.reason}` : ''}`,
          variant: 'destructive',
        });
        return { error: { message: 'Account banned' } };
      }
    }

    toast({
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
    });

    return { data };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'email' | 'role'>>) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        phone: updates.phone,
        city: updates.city,
        address: updates.address,
        avatar_url: updates.avatarUrl,
        bio: updates.bio,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    // Refresh profile
    await fetchUserProfile(user.id, user.email || '');
    
    toast({
      title: 'Profile updated',
      description: 'Your profile has been updated successfully.',
    });

    return { success: true };
  };

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refetchProfile: () => user && fetchUserProfile(user.id, user.email || ''),
  };
}
