import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Users, ChefHat, Package, CreditCard, BarChart3, Bell, MessageCircle, Settings, Search, LogOut } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import ChefApplicationsTab from '@/components/admin/ChefApplicationsTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminProductsTab from '@/components/admin/AdminProductsTab';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import AdminChatsTab from '@/components/admin/AdminChatsTab';
import AdminAnalyticsTab from '@/components/admin/AdminAnalyticsTab';

const navItems = [
  { id: 'applications', labelKey: 'admin.chefApplications', icon: ChefHat },
  { id: 'users', labelKey: 'admin.users', icon: Users },
  { id: 'products', labelKey: 'admin.products', icon: Package },
  { id: 'orders', labelKey: 'admin.orders', icon: CreditCard },
  { id: 'chats', labelKey: 'admin.chats', icon: MessageCircle },
  { id: 'analytics', labelKey: 'admin.analytics', icon: BarChart3 },
  { id: 'notifications', labelKey: 'admin.notifications', icon: Bell },
  { id: 'settings', labelKey: 'admin.settings', icon: Settings },
];

export default function AdminPanel() {
  const { language } = useApp();
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isAuthenticated || profile?.role !== 'admin') {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
              <Shield className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('admin.accessDenied', language)}</h1>
            <p className="text-muted-foreground mb-8">{t('admin.noPermission', language)}</p>
            <Link to="/"><Button variant="outline">{t('admin.returnHome', language)}</Button></Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Layout>
      <div className="min-h-screen flex">
        <div className="w-64 bg-card border-r p-4 hidden lg:block">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">{t('admin.panel', language)}</h2>
              <p className="text-xs text-muted-foreground">ChefCook</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{t(item.labelKey, language)}</span>
              </button>
            ))}
          </nav>
          <div className="mt-8 pt-4 border-t">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-5 h-5" /><span>{t('nav.logout', language)}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-serif font-bold">{t(navItems.find(n => n.id === activeTab)?.labelKey || '', language)}</h1>
                  <p className="text-muted-foreground">{t('admin.managePlatform', language)}</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t('common.search', language) + '...'} className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
              {activeTab === 'applications' && <ChefApplicationsTab searchQuery={searchQuery} />}
              {activeTab === 'users' && <AdminUsersTab searchQuery={searchQuery} />}
              {activeTab === 'products' && <AdminProductsTab searchQuery={searchQuery} />}
              {activeTab === 'orders' && <AdminOrdersTab searchQuery={searchQuery} />}
              {activeTab === 'chats' && <AdminChatsTab searchQuery={searchQuery} />}
              {activeTab === 'analytics' && <AdminAnalyticsTab />}
              {!['applications', 'users', 'products', 'orders', 'chats', 'analytics'].includes(activeTab) && (
                <div className="bg-card rounded-xl p-12 shadow-card text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('admin.noData', language)}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
