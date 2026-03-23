import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Package, TrendingUp, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { t, formatPrice } from '@/lib/i18n';

interface AdminAnalytics {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  topChefs: { name: string; revenue: number; orders: number }[];
}

export default function AdminAnalyticsTab() {
  const { language } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, chef_id, status')
        .neq('status', 'cancelled');

      if (error) throw error;

      const allOrders = orders || [];

      const todayOrders = allOrders.filter(o => o.created_at >= startOfDay);
      const weekOrders = allOrders.filter(o => o.created_at >= startOfWeek);
      const monthOrders = allOrders.filter(o => o.created_at >= startOfMonth);

      // Top chefs
      const chefRevenue = new Map<string, { revenue: number; orders: number }>();
      allOrders.forEach(o => {
        if (!o.chef_id) return;
        const existing = chefRevenue.get(o.chef_id) || { revenue: 0, orders: 0 };
        existing.revenue += o.total_amount;
        existing.orders++;
        chefRevenue.set(o.chef_id, existing);
      });

      const chefIds = [...chefRevenue.keys()];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', chefIds.length > 0 ? chefIds : ['none']);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      const topChefs = Array.from(chefRevenue.entries())
        .map(([id, stats]) => ({ name: profileMap.get(id) || 'Unknown', ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setAnalytics({
        todayRevenue: todayOrders.reduce((s, o) => s + o.total_amount, 0),
        todayOrders: todayOrders.length,
        weekRevenue: weekOrders.reduce((s, o) => s + o.total_amount, 0),
        weekOrders: weekOrders.length,
        monthRevenue: monthOrders.reduce((s, o) => s + o.total_amount, 0),
        monthOrders: monthOrders.length,
        topChefs,
      });
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.todayRevenue', language)}</CardTitle>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatPrice(analytics.todayRevenue)}</div>
              <p className="text-xs text-muted-foreground">{analytics.todayOrders} {t('admin.ordersToday', language)}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.weekRevenue', language)}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(analytics.weekRevenue)}</div>
              <p className="text-xs text-muted-foreground">{analytics.weekOrders} {t('admin.ordersThisWeek', language)}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.monthRevenue', language)}</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(analytics.monthRevenue)}</div>
              <p className="text-xs text-muted-foreground">{analytics.monthOrders} {t('admin.ordersThisMonth', language)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />{t('admin.topChefs', language)}</CardTitle></CardHeader>
        <CardContent>
          {analytics.topChefs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('admin.noData', language)}</p>
          ) : (
            <div className="space-y-4">
              {analytics.topChefs.map((chef, i) => (
                <motion.div key={chef.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">{i + 1}</Badge>
                    <span className="font-medium">{chef.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(chef.revenue)}</p>
                    <p className="text-sm text-muted-foreground">{chef.orders} {t('admin.totalOrders', language)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
