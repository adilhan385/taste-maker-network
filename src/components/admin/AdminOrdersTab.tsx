import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Loader2, XCircle, RotateCcw, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { t, formatPrice } from '@/lib/i18n';

interface Order {
  id: string;
  buyer_id: string;
  chef_id: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_type: string;
  payment_method: string;
  buyer_name?: string;
  chef_name?: string;
}

interface Props {
  searchQuery: string;
}

export default function AdminOrdersTab({ searchQuery }: Props) {
  const { toast } = useToast();
  const { language } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refundDialog, setRefundDialog] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = new Set<string>();
      (data || []).forEach(o => {
        userIds.add(o.buyer_id);
        if (o.chef_id) userIds.add(o.chef_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', [...userIds]);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      setOrders((data || []).map(o => ({
        ...o,
        buyer_name: profileMap.get(o.buyer_id) || 'Unknown',
        chef_name: o.chef_id ? profileMap.get(o.chef_id) || 'Unknown' : '-',
      })));
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);
      if (error) throw error;
      toast({ title: t('admin.orderCancelled', language) });
      fetchOrders();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundDialog) return;
    setActionLoading(true);
    try {
      // Find buyer's wallet
      const { data: wallet, error: wErr } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', refundDialog.buyer_id)
        .single();
      
      if (wErr || !wallet) {
        toast({ title: t('common.error', language), description: t('admin.walletNotFound', language), variant: 'destructive' });
        return;
      }

      // Update wallet balance
      const { error: updateErr } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance + refundDialog.total_amount })
        .eq('id', wallet.id);
      if (updateErr) throw updateErr;

      // Create transaction record
      const { error: txErr } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          amount: refundDialog.total_amount,
          type: 'refund',
          description: `${t('admin.refundFor', language)} #${refundDialog.id.slice(0, 8)}`,
          order_id: refundDialog.id,
        });
      if (txErr) throw txErr;

      // Cancel order
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', refundDialog.id);

      toast({ title: t('admin.refundSuccess', language), description: formatPrice(refundDialog.total_amount) });
      setRefundDialog(null);
      fetchOrders();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      accepted: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      cooking: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      ready: 'bg-green-500/10 text-green-600 border-green-500/30',
      delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
    };
    return <Badge variant="outline" className={colors[status] || ''}>{t(`orders.status.${status}`, language)}</Badge>;
  };

  const filtered = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o =>
      o.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.chef_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary">{orders.length} {t('admin.totalOrders', language)}</Badge>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all', language)}</SelectItem>
            <SelectItem value="pending">{t('orders.status.pending', language)}</SelectItem>
            <SelectItem value="accepted">{t('orders.status.accepted', language)}</SelectItem>
            <SelectItem value="cooking">{t('orders.status.cooking', language)}</SelectItem>
            <SelectItem value="ready">{t('orders.status.ready', language)}</SelectItem>
            <SelectItem value="delivered">{t('orders.status.delivered', language)}</SelectItem>
            <SelectItem value="cancelled">{t('orders.status.cancelled', language)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('admin.noOrders', language)}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(order => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-4 shadow-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">#{order.id.slice(0, 8)}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.buyer', language)}: {order.buyer_name} • {t('orders.chef', language)}: {order.chef_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(order.total_amount)} • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {(order as any).payment_receipt_url && (
                    <Button variant="outline" size="sm" onClick={() => window.open((order as any).payment_receipt_url, '_blank')}>
                      <ImageIcon className="w-4 h-4 mr-1" />{t('orders.viewReceipt', language)}
                    </Button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order)} disabled={actionLoading}>
                      <XCircle className="w-4 h-4 mr-1" />{t('admin.cancel', language)}
                    </Button>
                  )}
                  {order.status !== 'cancelled' && (
                    <Button variant="outline" size="sm" onClick={() => setRefundDialog(order)} disabled={actionLoading}>
                      <RotateCcw className="w-4 h-4 mr-1" />{t('admin.refund', language)}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!refundDialog} onOpenChange={() => setRefundDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.confirmRefund', language)}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {t('admin.refundConfirmText', language)} {refundDialog && formatPrice(refundDialog.total_amount)} {t('admin.toWallet', language)} {refundDialog?.buyer_name}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(null)}>{t('common.cancel', language)}</Button>
            <Button onClick={handleRefund} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {t('admin.refund', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
