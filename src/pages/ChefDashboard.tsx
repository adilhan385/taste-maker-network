import { motion } from 'framer-motion';
import { ChefHat, Plus, Package } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { Link } from 'react-router-dom';

export default function ChefDashboard() {
  const { isAuthenticated, profile } = useAuthContext();
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();

  if (!isAuthenticated || profile?.role !== 'cook') {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Chef Dashboard</h1>
            <p className="text-muted-foreground mb-8">
              {!isAuthenticated ? 'Please log in to access your chef dashboard' : 'You need to be an approved chef to access this page'}
            </p>
            {!isAuthenticated ? (
              <Button variant="hero" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>
                {t('nav.login', language)}
              </Button>
            ) : (
              <Link to="/become-chef">
                <Button variant="hero">Apply to become a Chef</Button>
              </Link>
            )}
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-serif font-bold">Chef Dashboard</h1>
                <p className="text-muted-foreground">Manage your dishes and orders</p>
              </div>
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Dish
              </Button>
            </div>

            <div className="bg-card rounded-2xl p-12 shadow-card text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No dishes yet. Add your first dish to get started!</p>
              <Button variant="outline">Add Your First Dish</Button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
