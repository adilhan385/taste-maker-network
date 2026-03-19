import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, MessageSquare, Filter, Star } from 'lucide-react';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import OrderProgressTracker from '@/components/orders/OrderProgressTracker';
import ReviewDialog from '@/components/orders/ReviewDialog';
import { useNavigate } from 'react-router-dom';
import { Tables } from '@/integrations/supabase/types';

type OrderStatus = 'pending' | 'accepted' | 'cooking' | 'ready' | 'delivered' | 'cancelled';
type OrderFilter = 'all' | 'active' | 'completed' | 'cancelled';

interface OrderWithItems extends Tables<'orders'> {
  order_items: Tables<'order_items'>[];
}

interface ChefProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
}

export default function Orders() {
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated, user } = useAuthContext();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [chefProfiles, setChefProfiles] = useState<Record<string, ChefProfile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    productId: string;
    productName: string;
    orderId: string;
  }>({ open: false, productId: '', productName: '', orderId: '' });

  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
      return;
    }
    
    setOrders(data || []);
    
    // Fetch chef profiles
    const chefIds = [...new Set((data || []).map(o => o.chef_id).filter(Boolean))] as string[];
    if (chefIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, phone')
        .in('user_id', chefIds);
      
      if (profiles) {
        const profileMap: Record<string, ChefProfile> = {};
        profiles.forEach(p => {
          profileMap[p.user_id] = p;
        });
        setChefProfiles(profileMap);
      }
    }
    
    // Fetch user's existing reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('product_id, order_id')
      .eq('user_id', user.id);
    
    if (reviewsData) {
      const reviewedSet = new Set(reviewsData.map(r => `${r.product_id}_${r.order_id}`));
      setReviewedItems(reviewedSet);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('my-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${user.id}`
        },
        (payload) => {
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id 
              ? { ...order, ...payload.new } 
              : order
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const status = order.status as OrderStatus;
    switch (filter) {
      case 'active':
        return ['pending', 'accepted', 'cooking', 'ready'].includes(status);
      case 'completed':
        return status === 'delivered';
      case 'cancelled':
        return status === 'cancelled';
      default:
        return true;
    }
  });

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'card': return t('cart.payByCard', language);
      case 'wallet': return t('cart.payByWallet', language);
      case 'cash': return t('cart.payCash', language);
      default: return method;
    }
  };

  const getDeliveryTypeLabel = (type: string) => {
    return type === 'delivery' ? t('cart.delivery', language) : t('cart.pickup', language);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('nav.orders', language)}</h1>
            <p className="text-muted-foreground mb-8">{t('orders.loginPrompt', language)}</p>
            <Button variant="hero" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>{t('nav.login', language)}</Button>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-serif font-bold">{t('nav.orders', language)}</h1>
              
              {/* Filter buttons */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {(['all', 'active', 'completed', 'cancelled'] as OrderFilter[]).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {t(`orders.filter.${f}`, language)}
                  </Button>
                ))}
              </div>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('orders.empty', language)}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const chef = order.chef_id ? chefProfiles[order.chef_id] : null;
                  const status = order.status as OrderStatus;
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {t('orders.orderNumber', language)}{order.id.slice(0, 8).toUpperCase()}
                                </h3>
                                <Badge variant={status === 'cancelled' ? 'destructive' : status === 'delivered' ? 'default' : 'secondary'}>
                                  {t(`orders.status.${status}`, language)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}
                                </span>
                                <span>•</span>
                                <span>{getDeliveryTypeLabel(order.delivery_type)}</span>
                                <span>•</span>
                                <span>{getPaymentMethodLabel(order.payment_method)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                {Number(order.total_amount).toLocaleString()} ₸
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6 space-y-6">
                          {/* Progress tracker */}
                          <OrderProgressTracker status={status} />
                          
                          {/* Chef info */}
                          {chef && (
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  {chef.avatar_url ? (
                                    <img src={chef.avatar_url} alt={chef.full_name} className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <span className="text-primary font-medium">{chef.full_name.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{chef.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{t('orders.chef', language)}</p>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate('/chat')}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                {t('orders.chatWithChef', language)}
                              </Button>
                            </div>
                          )}
                          
                          {/* Order items */}
                          <div>
                            <h4 className="font-medium mb-3">{t('orders.items', language)}</h4>
                            <div className="space-y-2">
                              {order.order_items.map((item) => {
                                const isReviewed = item.product_id ? reviewedItems.has(`${item.product_id}_${order.id}`) : false;
                                return (
                                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm bg-muted px-2 py-1 rounded">{item.quantity}x</span>
                                    <span>{item.product_name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">{Number(item.price * item.quantity).toLocaleString()} ₸</span>
                                    {status === 'delivered' && item.product_id && (
                                      isReviewed ? (
                                        <Badge variant="secondary" className="gap-1">
                                          <Star className="w-3 h-3 fill-current" />
                                          {t('reviews.reviewed', language)}
                                        </Badge>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setReviewDialog({
                                            open: true,
                                            productId: item.product_id!,
                                            productName: item.product_name,
                                            orderId: order.id,
                                          })}
                                        >
                                          <Star className="w-4 h-4 mr-1" />
                                          {t('reviews.leaveReview', language)}
                                        </Button>
                                      )
                                    )}
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Delivery address */}
                          {order.delivery_address && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">{t('payment.deliveryAddress', language)}: </span>
                              <span>{order.delivery_address}</span>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {order.notes && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">{t('payment.notes', language)}: </span>
                              <span>{order.notes}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
