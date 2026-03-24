import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export function usePresence() {
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) return;

    const upsertPresence = async () => {
      await supabase
        .from('user_presence')
        .upsert(
          { user_id: user.id, last_seen_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
    };

    // Initial heartbeat
    upsertPresence();

    // Heartbeat every 60 seconds
    const interval = setInterval(upsertPresence, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);
}
