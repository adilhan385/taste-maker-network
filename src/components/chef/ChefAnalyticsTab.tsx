import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, Wallet, Users, Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { t, formatPrice } from '@/lib/i18n';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  uniqueCustomers: number;
  avgOrderValue: number;
  topDishes: { name: string; count: number; revenue: number }[];
  ordersByStatus: Record<string, number>;
  recentOrders: { date: string; count: number; revenue: number }[];
}

export default function ChefAnalyticsTab() {
  const { user } = useAuthContext();
  const { language } = useApp();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`id, buyer_id, status, total_amount, created_at, order_items (product_name, quantity, price)`)
        .eq('chef_id', user.id);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        setAnalytics({
          totalOrders: 0, totalRevenue: 0, uniqueCustomers: 0, avgOrderValue: 0,
          topDishes: [], ordersByStatus: {}, recentOrders: [],
        });
        setLoading(false);
        return;
      }

      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status !== 'cancelled');
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const uniqueCustomers = new Set(orders.map(o => o.buyer_id)).size;
      const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      const ordersByStatus: Record<string, number> = {};
      orders.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      const dishStats = new Map<string, { count: number; revenue: number }>();
      orders.forEach(order => {
        order.order_items?.forEach(item => {
          const existing = dishStats.get(item.product_name) || { count: 0, revenue: 0 };
          existing.count += item.quantity;
          existing.revenue += item.price * item.quantity;
          dishStats.set(item.product_name, existing);
        });
      });

      const topDishes = Array.from(dishStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const last7Days = new Map<string, { count: number; revenue: number }>();
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.set(date.toISOString().split('T')[0], { count: 0, revenue: 0 });
      }

      completedOrders.forEach(order => {
        const dateStr = order.created_at.split('T')[0];
        const existing = last7Days.get(dateStr);
        if (existing) { existing.count++; existing.revenue += order.total_amount; }
      });

      const recentOrders = Array.from(last7Days.entries()).map(([date, stats]) => ({ date, ...stats }));

      setAnalytics({ totalOrders, totalRevenue, uniqueCustomers, avgOrderValue, topDishes, ordersByStatus, recentOrders });
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!analytics) return null;

  const statusLabels: Record<string, string> = {
    pending: t('orders.status.pending', language),
    accepted: t('orders.status.accepted', language),
    cooking: t('orders.status.cooking', language),
    ready: t('orders.status.ready', language),
    delivered: t('orders.status.delivered', language),
    cancelled: t('orders.status.cancelled', language),
  };

  const maxDailyOrders = Math.max(...analytics.recentOrders.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold">{t('nav.analytics', language)}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('chef.totalOrders', language)}</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{analytics.totalOrders}</div></CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('chef.totalRevenue', language)}</CardTitle>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-primary">{formatPrice(analytics.totalRevenue)}</div></CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('nav.customers', language)}</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{analytics.uniqueCustomers}</div></CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('chef.avgPerOrder', language)}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatPrice(analytics.avgOrderValue)}</div></CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />{t('chef.last7days', language)}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentOrders.every(d => d.count === 0) ? (
              <p className="text-center text-muted-foreground py-8">{t('chef.noOrdersLast7', language)}</p>
            ) : (
              <div className="space-y-3">
                {analytics.recentOrders.map((day, i) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16">
                      {new Date(day.date).toLocaleDateString(language === 'ru' ? 'ru' : language === 'kz' ? 'kk' : 'en', { weekday: 'short' })}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(day.count / maxDailyOrders) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.5 }} className="h-full bg-primary rounded-full" />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                    <span className="text-sm text-muted-foreground w-20 text-right">{formatPrice(day.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('chef.topDishes', language)}</CardTitle></CardHeader>
          <CardContent>
            {analytics.topDishes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('chef.noDishData', language)}</p>
            ) : (
              <div className="space-y-4">
                {analytics.topDishes.map((dish, i) => (
                  <motion.div key={dish.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">{i + 1}</Badge>
                      <span className="font-medium">{dish.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{dish.count} {t('chef.sold', language)}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(dish.revenue)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('chef.ordersByStatus', language)}</CardTitle></CardHeader>
        <CardContent>
          {Object.keys(analytics.ordersByStatus).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t('chef.noOrderData', language)}</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-sm py-2 px-4">
                  {statusLabels[status] || status}: <span className="font-bold ml-1">{count}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
