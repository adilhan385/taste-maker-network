import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';

export default function Orders() {
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated } = useAuthContext();

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
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-serif font-bold mb-8">{t('nav.orders', language)}</h1>
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t('orders.empty', language)}</p>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
