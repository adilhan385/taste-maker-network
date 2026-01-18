import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode, language, setUser } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (authModalMode === 'register' && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Check for admin login
    if (authModalMode === 'login' && formData.email === 'admin@gmail.com') {
      setUser({
        id: 'admin-1',
        email: 'admin@gmail.com',
        name: 'Administrator',
        role: 'admin',
      });
    } else {
      // Regular user login/register
      setUser({
        id: 'user-1',
        email: formData.email,
        name: authModalMode === 'register' ? formData.name : formData.email.split('@')[0],
        role: 'buyer',
        phone: formData.phone,
      });
    }

    toast({
      title: t('common.success', language),
      description: authModalMode === 'login' ? 'Welcome back!' : 'Account created successfully!',
    });

    setIsLoading(false);
    setAuthModalOpen(false);
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  };

  const toggleMode = () => {
    setAuthModalMode(authModalMode === 'login' ? 'register' : 'login');
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6"
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-serif text-center">
              {authModalMode === 'login' ? t('auth.login', language) : t('auth.register', language)}
            </DialogTitle>
            <p className="text-center text-muted-foreground text-sm">
              {authModalMode === 'login' ? t('auth.loginSubtitle', language) : t('auth.registerSubtitle', language)}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {authModalMode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('auth.name', language)}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('auth.phone', language)}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+7 (777) 123-4567"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email', language)}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password', language)}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {authModalMode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword', language)}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {authModalMode === 'login' && (
              <div className="text-right">
                <button type="button" className="text-sm text-primary hover:underline">
                  {t('auth.forgotPassword', language)}
                </button>
              </div>
            )}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? t('common.loading', language) : (authModalMode === 'login' ? t('auth.signIn', language) : t('auth.signUp', language))}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {authModalMode === 'login' ? t('auth.noAccount', language) : t('auth.hasAccount', language)}{' '}
            <button onClick={toggleMode} className="text-primary font-medium hover:underline">
              {authModalMode === 'login' ? t('auth.signUp', language) : t('auth.signIn', language)}
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
