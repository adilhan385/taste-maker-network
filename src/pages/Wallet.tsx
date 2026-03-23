import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatPrice, t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

interface WalletTransaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund';
  amount: number;
  description: string | null;
  created_at: string;
}

export default function WalletPage() {
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated } = useAuthContext();
  const { toast } = useToast();
  
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchWalletData();
  }, [isAuthenticated]);

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) throw walletError;

      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, balance: 0 })
          .select('id, balance')
          .single();
        if (createError) throw createError;
        wallet = newWallet;
      }

      setBalance(Number(wallet.balance));

      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txError) throw txError;
      setTransactions((txData || []).map(tx => ({
        ...tx,
        type: tx.type as 'deposit' | 'payment' | 'refund'
      })));
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast({ title: t('common.error', language), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('wallet.pleaseLogin', language)}</h2>
            <p className="text-muted-foreground mb-6">{t('wallet.loginSubtitle', language)}</p>
            <Button onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>
              {t('auth.logIn', language)}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'payment': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'refund': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit': return t('wallet.deposit', language);
      case 'payment': return t('wallet.payment', language);
      case 'refund': return t('wallet.refund', language);
      default: return type;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t('wallet.title', language)}</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 mb-2">{t('wallet.balance', language)}</p>
              <p className="text-4xl font-bold">
                {loading ? '...' : formatPrice(balance)}
              </p>
              <p className="text-sm text-primary-foreground/60 mt-2">{t('wallet.refundOnly', language)}</p>
            </div>
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">{t('wallet.history', language)}</h2>
          
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('wallet.noTransactions', language)}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('wallet.type', language)}</TableHead>
                  <TableHead>{t('wallet.description', language)}</TableHead>
                  <TableHead>{t('wallet.date', language)}</TableHead>
                  <TableHead className="text-right">{t('wallet.amount', language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span>{getTransactionLabel(tx.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.description || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}
                      {formatPrice(Math.abs(tx.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
}
