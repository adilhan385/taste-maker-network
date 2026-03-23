import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle, Truck, XCircle, Loader2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  buyer_id: string;
  status: string;
  total_amount: number;
  delivery_type: string;
  delivery_address: string | null;
  payment_method: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  buyer_profile?: {
    full_name: string;
    phone: string | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any>; next?: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-700', icon: Clock, next: 'accepted' },
  accepted: { label: 'Accepted', color: 'bg-blue-500/20 text-blue-700', icon: CheckCircle, next: 'cooking' },
  cooking: { label: 'Cooking', color: 'bg-orange-500/20 text-orange-700', icon: Package, next: 'ready' },
  ready: { label: 'Ready', color: 'bg-green-500/20 text-green-700', icon: CheckCircle, next: 'delivered' },
  delivered: { label: 'Delivered', color: 'bg-primary/20 text-primary', icon: Truck },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};

export default function ChefOrdersTab() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('chef_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch buyer profiles separately
      const buyerIds = [...new Set((data || []).map(o => o.buyer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', buyerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      const ordersWithProfiles = (data || []).map(order => ({
        ...order,
        buyer_profile: profileMap.get(order.buyer_id)
      }));

      setOrders(ordersWithProfiles);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  type OrderStatus = 'pending' | 'accepted' | 'cooking' | 'ready' | 'delivered' | 'cancelled';
  
  const updateOrderStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      
      toast({ title: `Order ${newStatus}` });
      fetchOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const cancelOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', notes: cancelReason || selectedOrder.notes })
        .eq('id', selectedOrder.id);

      if (error) throw error;
      
      toast({ title: 'Order cancelled' });
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-serif font-bold">Orders</h2>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'accepted', 'cooking', 'ready', 'delivered', 'cancelled'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label || status}
            </Button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 shadow-card text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No orders {statusFilter !== 'all' ? `with status "${statusConfig[statusFilter]?.label}"` : 'yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOrders.map(order => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card rounded-2xl shadow-card overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                            <Badge className={config.color}>{config.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.buyer_profile?.full_name || 'Customer'} • {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg">{Number(order.total_amount).toLocaleString()} ₸</span>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Customer:</span>
                              <p className="font-medium">{order.buyer_profile?.full_name || 'N/A'}</p>
                              {order.buyer_profile?.phone && <p>{order.buyer_profile.phone}</p>}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Delivery:</span>
                              <p className="font-medium capitalize">{order.delivery_type}</p>
                              {order.delivery_address && <p>{order.delivery_address}</p>}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Payment:</span>
                              <p className="font-medium capitalize">{order.payment_method}</p>
                            </div>
                            {order.notes && (
                              <div>
                                <span className="text-muted-foreground">Notes:</span>
                                <p className="font-medium">{order.notes}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="text-sm text-muted-foreground">Items:</span>
                            <div className="mt-2 space-y-2">
                              {order.order_items.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-muted/30 rounded-lg p-2">
                                  <span>{item.product_name} × {item.quantity}</span>
                                  <span className="font-medium">{(item.price * item.quantity).toLocaleString()} ₸</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap pt-2">
                            {/* View receipt */}
                            {(order as any).payment_receipt_url && (
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.open((order as any).payment_receipt_url, '_blank'); }}>
                                <ImageIcon className="w-4 h-4 mr-1" />
                                View Receipt
                              </Button>
                            )}
                            {config.next && order.status !== 'cancelled' && (
                              <Button 
                                variant="hero" 
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); updateOrderStatus(order, config.next as OrderStatus); }}
                              >
                                Mark as {statusConfig[config.next as string]?.label}
                              </Button>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setCancelDialogOpen(true); }}
                                className="text-destructive"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Chat
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for cancellation (optional):
            </p>
            <Textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Keep Order</Button>
            <Button variant="destructive" onClick={cancelOrder}>Cancel Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
