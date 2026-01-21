import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, RefreshCw, CreditCard } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import CardPaymentForm, { CardPaymentData, initialCardPaymentData, validateCardPayment } from '@/components/checkout/CardPaymentForm';

interface WalletTransaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund';
  amount: number;
  description: string | null;
  created_at: string;
}

export default function WalletPage() {
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated, profile } = useAuthContext();
  const { toast } = useToast();
  
  const [balance, setBalance] = useState<number>(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('5000');
  const [cardData, setCardData] = useState<CardPaymentData>(initialCardPaymentData);
  const [processing, setProcessing] = useState(false);

  const presetAmounts = [5000, 10000, 20000, 50000];

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

      // Get or create wallet
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

      setWalletId(wallet.id);
      setBalance(Number(wallet.balance));

      // Fetch transactions
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
      toast({
        title: t('common.error', language),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: t('wallet.invalidAmount', language), variant: 'destructive' });
      return;
    }

    const validationError = validateCardPayment(cardData, false);
    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return;
    }

    if (!walletId) return;

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update balance
      const newBalance = balance + amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', walletId);

      if (updateError) throw updateError;

      // Create transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletId,
          type: 'deposit',
          amount: amount,
          description: t('wallet.cardDeposit', language),
        });

      if (txError) throw txError;

      setBalance(newBalance);
      setTopUpDialogOpen(false);
      setCardData(initialCardPaymentData);
      setTopUpAmount('5000');
      
      toast({ title: t('wallet.topUpSuccess', language) });
      fetchWalletData();
    } catch (error) {
      console.error('Top up error:', error);
      toast({ title: t('common.error', language), variant: 'destructive' });
    } finally {
      setProcessing(false);
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
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'payment':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return t('wallet.deposit', language);
      case 'payment':
        return t('wallet.payment', language);
      case 'refund':
        return t('wallet.refund', language);
      default:
        return type;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t('wallet.title', language)}</h1>

        {/* Balance Card */}
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
            </div>
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-6">
            <Button 
              variant="secondary" 
              onClick={() => setTopUpDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('wallet.topUp', language)}
            </Button>
          </div>
        </motion.div>

        {/* Transaction History */}
        <div className="bg-card rounded-xl p-6 shadow-card">
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
                    <TableCell className="text-muted-foreground">
                      {tx.description || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      tx.type === 'deposit' || tx.type === 'refund' 
                        ? 'text-green-600' 
                        : 'text-red-600'
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

        {/* Top Up Dialog */}
        <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                {t('wallet.topUp', language)}
              </DialogTitle>
              <DialogDescription>
                {t('wallet.topUpDescription', language)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Amount Selection */}
              <div className="space-y-3">
                <Label>{t('wallet.selectAmount', language)}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {presetAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={topUpAmount === String(amount) ? 'default' : 'outline'}
                      onClick={() => setTopUpAmount(String(amount))}
                      className="h-12"
                    >
                      {formatPrice(amount)}
                    </Button>
                  ))}
                </div>
                <div>
                  <Label>{t('wallet.customAmount', language)}</Label>
                  <Input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="0"
                    min="100"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Card Form */}
              <CardPaymentForm
                language={language}
                showAddress={false}
                formData={cardData}
                onFormChange={setCardData}
              />

              <Button 
                onClick={handleTopUp} 
                disabled={processing}
                className="w-full gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {processing ? t('common.loading', language) : `${t('wallet.topUp', language)} ${formatPrice(parseFloat(topUpAmount) || 0)}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
