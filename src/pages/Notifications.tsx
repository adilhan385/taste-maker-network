import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Package, ChefHat, Star, MessageCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order':
      return <Package className="w-5 h-5" />;
    case 'chef_approved':
    case 'chef_rejected':
      return <ChefHat className="w-5 h-5" />;
    case 'review':
      return <Star className="w-5 h-5" />;
    case 'message':
      return <MessageCircle className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};

const getNotificationColor = (type: string, isRead: boolean) => {
  if (isRead) return 'bg-muted text-muted-foreground';
  
  switch (type) {
    case 'chef_approved':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'chef_rejected':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'order':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-primary/10 text-primary';
  }
};

export default function Notifications() {
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated, user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } else {
        setNotifications(data || []);
      }
      setLoading(false);
    };
    
    if (user) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) {
      toast.error('Failed to mark as read');
    } else {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (error) {
      toast.error('Failed to mark all as read');
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Notifications</h1>
            <p className="text-muted-foreground mb-8">Please log in to view your notifications</p>
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
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-serif font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-muted-foreground mt-1">
                    {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`transition-all ${!notification.is_read ? 'border-primary/50 shadow-md' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type, notification.is_read)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {notification.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <Badge variant="default" className="flex-shrink-0">New</Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.created_at), 'MMM d, yyyy • h:mm a')}
                              </span>
                              {!notification.is_read && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Mark as read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
