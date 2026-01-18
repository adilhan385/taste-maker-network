import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, ChefHat, MapPin, Star, MessageCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { formatPrice, t } from '@/lib/i18n';

type OrderStatus = 'pending' | 'accepted' | 'cooking' | 'ready' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  dishName: string;
  dishImage: string;
  chef: {
    name: string;
    avatar: string;
  };
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date;
  estimatedDelivery?: Date;
}

const sampleOrders: Order[] = [
  {
    id: 'ORD-001',
    dishName: 'Homemade Beshbarmak',
    dishImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop',
    chef: { name: 'Aisha K.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop' },
    quantity: 2,
    totalPrice: 31.98,
    status: 'cooking',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    estimatedDelivery: new Date(Date.now() + 1000 * 60 * 30),
  },
  {
    id: 'ORD-002',
    dishName: 'Authentic Plov',
    dishImage: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop',
    chef: { name: 'Rustam M.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop' },
    quantity: 1,
    totalPrice: 12.99,
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 'ORD-003',
    dishName: 'Georgian Khinkali',
    dishImage: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop',
    chef: { name: 'Nino G.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop' },
    quantity: 3,
    totalPrice: 32.97,
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  accepted: { label: 'Accepted', color: 'bg-info/20 text-info' },
  cooking: { label: 'Cooking', color: 'bg-warning/20 text-warning-foreground' },
  ready: { label: 'Ready', color: 'bg-success/20 text-success' },
  delivered: { label: 'Delivered', color: 'bg-success/20 text-success' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/20 text-destructive' },
};

function OrderCard({ order, currency }: { order: Order; currency: 'USD' | 'RUB' | 'KZT' }) {
  const status = statusConfig[order.status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 shadow-card"
    >
      <div className="flex gap-4">
        <img 
          src={order.dishImage} 
          alt={order.dishName}
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold">{order.dishName}</h3>
              <p className="text-sm text-muted-foreground">× {order.quantity} portions</p>
            </div>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <img 
              src={order.chef.avatar} 
              alt={order.chef.name}
              className="w-5 h-5 rounded-full"
            />
            <span>{order.chef.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary">{formatPrice(order.totalPrice, currency)}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <MessageCircle className="w-4 h-4" />
                Chat
              </Button>
              {order.status === 'delivered' && (
                <Button variant="outline" size="sm" className="gap-1">
                  <Star className="w-4 h-4" />
                  Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {order.status === 'cooking' && order.estimatedDelivery && (
        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Estimated delivery:</span>
          <span className="font-medium">
            {order.estimatedDelivery.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function Orders() {
  const { user, isAuthenticated, setAuthModalOpen, setAuthModalMode, currency, language } = useApp();
  const [activeTab, setActiveTab] = useState('active');

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('nav.orders', language)}</h1>
            <p className="text-muted-foreground mb-8">
              Please log in to view your orders
            </p>
            <Button 
              variant="hero" 
              onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
            >
              {t('nav.login', language)}
            </Button>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const activeOrders = sampleOrders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = sampleOrders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-serif font-bold mb-8">{t('nav.orders', language)}</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="active" className="flex-1">
                  Active ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="flex-1">
                  Past Orders ({pastOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No active orders</p>
                  </div>
                ) : (
                  activeOrders.map(order => (
                    <OrderCard key={order.id} order={order} currency={currency} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No past orders</p>
                  </div>
                ) : (
                  pastOrders.map(order => (
                    <OrderCard key={order.id} order={order} currency={currency} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
