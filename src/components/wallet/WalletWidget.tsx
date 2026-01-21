import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/i18n';

export default function WalletWidget() {
  const { isAuthenticated, profile } = useAuthContext();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !profile) {
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching wallet:', error);
          return;
        }

        if (data) {
          setBalance(Number(data.balance));
        } else {
          // Create wallet if doesn't exist
          const { data: newWallet } = await supabase
            .from('wallets')
            .insert({ user_id: user.id, balance: 0 })
            .select('balance')
            .single();
          
          if (newWallet) {
            setBalance(Number(newWallet.balance));
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [isAuthenticated, profile]);

  if (!isAuthenticated || !profile || profile.role === 'admin') {
    return null;
  }

  return (
    <Link 
      to="/wallet" 
      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
    >
      <Wallet className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-primary">
        {loading ? '...' : formatPrice(balance)}
      </span>
    </Link>
  );
}
