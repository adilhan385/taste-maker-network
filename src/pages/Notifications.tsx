import { motion } from 'framer-motion';
import { Bell, Package, MessageCircle, ChefHat, CreditCard, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

interface Notification {
  id: string;
  type: 'order' | 'chat' | 'chef' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'Order Status Update',
    message: 'Your Beshbarmak order is now being prepared by Aisha K.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isRead: false,
  },
  {
    id: '2',
    type: 'chat',
    title: 'New Message',
    message: 'Aisha K. sent you a message: "Your order is almost ready!"',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isRead: false,
  },
  {
    id: '3',
    type: 'order',
    title: 'Order Delivered',
    message: 'Your Plov order has been delivered. Enjoy your meal!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Your payment of $31.98 has been processed successfully.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'Welcome to ChefCook!',
    message: 'Start exploring delicious homemade dishes from local chefs.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    isRead: true,
  },
];

const iconMap = {
  order: Package,
  chat: MessageCircle,
  chef: ChefHat,
  payment: CreditCard,
  system: AlertCircle,
};

const colorMap = {
  order: 'bg-info/20 text-info',
  chat: 'bg-success/20 text-success',
  chef: 'bg-primary/20 text-primary',
  payment: 'bg-accent/20 text-accent-foreground',
  system: 'bg-muted text-muted-foreground',
};

export default function Notifications() {
  const { isAuthenticated, setAuthModalOpen, setAuthModalMode, language } = useApp();

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
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Notifications</h1>
            <p className="text-muted-foreground mb-8">
              Please log in to view your notifications
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

  const unreadCount = sampleNotifications.filter(n => !n.isRead).length;

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-serif font-bold">Notifications</h1>
                <p className="text-muted-foreground">{unreadCount} unread</p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm">
                  Mark all as read
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {sampleNotifications.map((notification, index) => {
                const Icon = iconMap[notification.type];
                const colorClass = colorMap[notification.type];
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-card rounded-xl p-4 shadow-card flex gap-4 ${
                      !notification.isRead ? 'border-l-4 border-primary' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {notification.timestamp.toLocaleDateString() === new Date().toLocaleDateString()
                            ? notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : notification.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
