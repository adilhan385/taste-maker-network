import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, Loader2, Phone, Mail, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface Customer {
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

export default function ChefCustomersTab() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;
    
    try {
      // Get all orders for this chef
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('buyer_id, total_amount, created_at')
        .eq('chef_id', user.id)
        .neq('status', 'cancelled');

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        setCustomers([]);
        setLoading(false);
        return;
      }

      // Aggregate customer data
      const customerMap = new Map<string, { total_orders: number; total_spent: number; last_order_date: string }>();
      
      orders.forEach(order => {
        const existing = customerMap.get(order.buyer_id);
        if (existing) {
          existing.total_orders++;
          existing.total_spent += order.total_amount;
          if (new Date(order.created_at) > new Date(existing.last_order_date)) {
            existing.last_order_date = order.created_at;
          }
        } else {
          customerMap.set(order.buyer_id, {
            total_orders: 1,
            total_spent: order.total_amount,
            last_order_date: order.created_at,
          });
        }
      });

      // Fetch customer profiles
      const buyerIds = Array.from(customerMap.keys());
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', buyerIds);

      if (profilesError) throw profilesError;

      // Combine data
      const customerList: Customer[] = (profiles || []).map(profile => {
        const stats = customerMap.get(profile.user_id)!;
        return {
          user_id: profile.user_id,
          full_name: profile.full_name,
          phone: profile.phone,
          email: null, // Email not exposed for privacy
          ...stats,
        };
      });

      // Sort by total orders descending
      customerList.sort((a, b) => b.total_orders - a.total_orders);

      setCustomers(customerList);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold">Customers</h2>
        <Badge variant="secondary">{customers.length} total</Badge>
      </div>

      {customers.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 shadow-card text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No customers yet. Once you receive orders, your customers will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer, index) => (
            <motion.div
              key={customer.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {customer.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{customer.full_name}</h3>
                  {customer.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Package className="w-3 h-3" />
                  </div>
                  <p className="font-bold">{customer.total_orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="font-bold text-primary">${customer.total_spent.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Spent</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Calendar className="w-3 h-3" />
                  </div>
                  <p className="font-bold text-xs">{new Date(customer.last_order_date).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">Last</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
