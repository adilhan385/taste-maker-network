import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, UtensilsCrossed, Package, Users, BarChart3, Clock, User, Wallet, RefreshCw } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import ChefDishesTab from '@/components/chef/ChefDishesTab';
import ChefOrdersTab from '@/components/chef/ChefOrdersTab';
import ChefCustomersTab from '@/components/chef/ChefCustomersTab';
import ChefAnalyticsTab from '@/components/chef/ChefAnalyticsTab';
import ChefAvailabilityTab from '@/components/chef/ChefAvailabilityTab';
import ChefProfileTab from '@/components/chef/ChefProfileTab';
import ChefEarningsTab from '@/components/chef/ChefEarningsTab';
import { useToast } from '@/hooks/use-toast';

export default function ChefDashboard() {
  const { isAuthenticated, profile, refetchProfile } = useAuthContext();
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    await refetchProfile();
    setRefreshing(false);
    toast({
      title: t('chef.statusUpdated', language),
      description: t('chef.statusUpdatedDesc', language),
    });
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('chef.dashboard', language)}</h1>
            <p className="text-muted-foreground mb-8">{t('chef.loginPrompt', language)}</p>
            <Button variant="hero" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>
              {t('nav.login', language)}
            </Button>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  if (profile?.role !== 'cook') {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('chef.waitingApproval', language)}</h1>
            <p className="text-muted-foreground mb-8">{t('chef.waitingApprovalDesc', language)}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="default" 
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('chef.checking', language) : t('chef.checkStatus', language)}
              </Button>
              <Link to="/become-chef">
                <Button variant="outline">{t('chef.applyToBecome', language)}</Button>
              </Link>
            </div>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold">{t('chef.dashboard', language)}</h1>
                <p className="text-muted-foreground">{t('chef.dashboardDesc', language)}</p>
              </div>
            </div>

            <Tabs defaultValue="dishes" className="space-y-6">
              <TabsList className="w-full h-auto gap-2 bg-transparent p-0 overflow-x-auto flex-nowrap justify-start">
                <TabsTrigger value="dishes" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <UtensilsCrossed className="w-4 h-4" />
                  {t('chef.myDishes', language)}
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Package className="w-4 h-4" />
                  {t('nav.orders', language)}
                </TabsTrigger>
                <TabsTrigger value="customers" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="w-4 h-4" />
                  {t('nav.customers', language)}
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="w-4 h-4" />
                  {t('nav.analytics', language)}
                </TabsTrigger>
                <TabsTrigger value="availability" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Clock className="w-4 h-4" />
                  {t('nav.availability', language)}
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <User className="w-4 h-4" />
                  {t('nav.profile', language)}
                </TabsTrigger>
                <TabsTrigger value="earnings" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Wallet className="w-4 h-4" />
                  {t('nav.earnings', language)}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dishes"><ChefDishesTab /></TabsContent>
              <TabsContent value="orders"><ChefOrdersTab /></TabsContent>
              <TabsContent value="customers"><ChefCustomersTab /></TabsContent>
              <TabsContent value="analytics"><ChefAnalyticsTab /></TabsContent>
              <TabsContent value="availability"><ChefAvailabilityTab /></TabsContent>
              <TabsContent value="profile"><ChefProfileTab /></TabsContent>
              <TabsContent value="earnings"><ChefEarningsTab /></TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
