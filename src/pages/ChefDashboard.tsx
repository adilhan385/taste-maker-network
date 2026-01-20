import { motion } from 'framer-motion';
import { ChefHat, UtensilsCrossed, Package, Users, BarChart3, Clock, User, DollarSign } from 'lucide-react';
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

export default function ChefDashboard() {
  const { isAuthenticated, profile } = useAuthContext();
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Chef Dashboard</h1>
            <p className="text-muted-foreground mb-8">Please log in to access your chef dashboard</p>
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
            <h1 className="text-3xl font-serif font-bold mb-4">Waiting for Approval</h1>
            <p className="text-muted-foreground mb-8">
              Your chef application is pending review. Once approved by an admin, you'll have access to your chef dashboard.
            </p>
            <Link to="/become-chef">
              <Button variant="outline">Apply to become a Chef</Button>
            </Link>
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
                <h1 className="text-3xl font-serif font-bold">Chef Dashboard</h1>
                <p className="text-muted-foreground">Manage your dishes, orders, and business</p>
              </div>
            </div>

            <Tabs defaultValue="dishes" className="space-y-6">
              <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent p-0">
                <TabsTrigger value="dishes" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <UtensilsCrossed className="w-4 h-4" />
                  My Dishes
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Package className="w-4 h-4" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="customers" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="w-4 h-4" />
                  Customers
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="availability" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Clock className="w-4 h-4" />
                  Availability
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="earnings" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <DollarSign className="w-4 h-4" />
                  Earnings
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
