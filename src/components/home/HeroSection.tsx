import { motion } from 'framer-motion';
import { ArrowRight, ChefHat, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import heroBg from '@/assets/hero-bg.jpg';

export default function HeroSection() {
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated } = useAuthContext();

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      setAuthModalMode('register');
      setAuthModalOpen(true);
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Delicious homemade food" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <ChefHat className="w-4 h-4" />
              {t('hero.badge', language)}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6"
          >
            {t('hero.title', language)}{' '}
            <span className="text-gradient">{t('hero.titleHighlight', language)}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground mb-8 max-w-lg"
          >
            {t('hero.subtitle', language)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Link to="/catalog">
              <Button variant="hero" size="xl" className="gap-2">
                {t('hero.cta', language)}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/become-chef">
                <Button variant="outline" size="xl">
                  {t('hero.ctaSecondary', language)}
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{t('hero.stats.local', language)}</div>
                <div className="text-sm text-muted-foreground">{t('hero.stats.homeChefs', language)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold">{t('hero.stats.quality', language)}</div>
                <div className="text-sm text-muted-foreground">{t('hero.stats.homemadeFood', language)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{t('hero.stats.community', language)}</div>
                <div className="text-sm text-muted-foreground">{t('hero.stats.foodLovers', language)}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
