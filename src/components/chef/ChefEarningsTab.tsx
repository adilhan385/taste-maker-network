import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calendar, Loader2, CreditCard, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface EarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  pendingPayouts: number;
  completedOrders: number;
  monthlyBreakdown: { month: string; earnings: number }[];
}

export default function ChefEarningsTab() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    pendingPayouts: 0,
    completedOrders: 0,
    monthlyBreakdown: [],
  });

  useEffect(() => {
    if (user) fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('chef_id', user.id)
        .eq('status', 'delivered');

      if (error) throw error;

      if (!orders || orders.length === 0) {
        setLoading(false);
        return;
      }

      const totalEarnings = orders.reduce((sum, o) => sum + o.total_amount, 0);
      const completedOrders = orders.length;

      // This month's earnings
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEarnings = orders
        .filter(o => new Date(o.created_at) >= startOfMonth)
        .reduce((sum, o) => sum + o.total_amount, 0);

      // Monthly breakdown (last 6 months)
      const monthlyMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en', { month: 'short', year: '2-digit' });
        monthlyMap.set(key, 0);
      }

      orders.forEach(order => {
        const date = new Date(order.created_at);
        const key = date.toLocaleDateString('en', { month: 'short', year: '2-digit' });
        if (monthlyMap.has(key)) {
          monthlyMap.set(key, (monthlyMap.get(key) || 0) + order.total_amount);
        }
      });

      const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([month, earnings]) => ({
        month,
        earnings,
      }));

      setEarnings({
        totalEarnings,
        thisMonthEarnings,
        pendingPayouts: 0, // Would need a separate payouts table for real implementation
        completedOrders,
        monthlyBreakdown,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxMonthlyEarnings = Math.max(...earnings.monthlyBreakdown.map(m => m.earnings), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold">Earnings & Payouts</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${earnings.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{earnings.completedOrders} orders delivered</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${earnings.thisMonthEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payout</CardTitle>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${earnings.pendingPayouts.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Order</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${earnings.completedOrders > 0 
                  ? (earnings.totalEarnings / earnings.completedOrders).toFixed(2) 
                  : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Average order value</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <CardDescription>Your earnings over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {earnings.monthlyBreakdown.every(m => m.earnings === 0) ? (
              <p className="text-center text-muted-foreground py-8">No earnings data yet</p>
            ) : (
              <div className="space-y-4">
                {earnings.monthlyBreakdown.map((month, i) => (
                  <div key={month.month} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-16">{month.month}</span>
                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(month.earnings / maxMonthlyEarnings) * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      />
                    </div>
                    <span className="font-bold w-24 text-right">${month.earnings.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payout Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payout Settings
            </CardTitle>
            <CardDescription>Configure how you receive your earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Payout Method</p>
                <p className="text-sm text-muted-foreground">No payout method configured</p>
              </div>
              <Button variant="outline">
                Add Payment Method
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Payouts are processed weekly. Set up your payment method to start receiving earnings.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
