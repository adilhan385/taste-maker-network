import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, DollarSign, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';

const benefits = [
  { icon: DollarSign, text: 'Earn extra income doing what you love' },
  { icon: Clock, text: 'Flexible schedule - cook when you want' },
  { icon: Users, text: 'Build a loyal customer base' },
];

export default function BecomeChefCTA() {
  const { language } = useApp();
  const { isAuthenticated } = useAuthContext();

  return (
    <section className="py-20 bg-foreground text-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 text-background/90 text-sm font-medium mb-6">
              <ChefHat className="w-4 h-4" />
              Join Our Community
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-6">
              Share Your Passion,<br />
              <span className="text-primary">Earn Money Cooking</span>
            </h2>

            <p className="text-background/70 text-lg mb-8 max-w-lg">
              Turn your kitchen into a business. Join home cooks 
              sharing their delicious creations with hungry neighbors.
            </p>

            <ul className="space-y-4 mb-8">
              {benefits.map((benefit) => (
                <li key={benefit.text} className="flex items-center gap-3 text-background/80">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <benefit.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  {benefit.text}
                </li>
              ))}
            </ul>

            <Link to="/become-chef">
              <Button variant="hero" size="xl" className="gap-2">
                {t('hero.ctaSecondary', language)}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <div className="relative">
              <div className="w-full aspect-square max-w-md mx-auto rounded-3xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop"
                  alt="Happy home cook"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
