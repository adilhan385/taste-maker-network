import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Globe, Lock, Bell, HelpCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Language, t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'kz', name: 'Қазақша', flag: '🇰🇿' },
];

export default function SettingsPage() {
  const { language, setLanguage, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated, profile } = useAuthContext();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    orders: true,
    messages: true,
    promotions: false,
    newsletter: false,
  });

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
              <SettingsIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('nav.settings', language)}</h1>
            <p className="text-muted-foreground mb-8">
              {t('settings.loginPrompt', language)}
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

  const handlePasswordChange = () => {
    toast({
      title: t('settings.passwordUpdated', language),
      description: t('settings.passwordUpdatedDesc', language),
    });
  };

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-serif font-bold mb-8">{t('nav.settings', language)}</h1>

            <div className="space-y-6">
              {/* Language */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{t('settings.languageRegion', language)}</h2>
                    <p className="text-sm text-muted-foreground">{t('settings.customize', language)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.language', language)}</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{t('settings.notifications', language)}</h2>
                    <p className="text-sm text-muted-foreground">{t('settings.manageNotifications', language)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.orderUpdates', language)}</p>
                      <p className="text-sm text-muted-foreground">{t('settings.orderUpdatesDesc', language)}</p>
                    </div>
                    <Switch
                      checked={notifications.orders}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, orders: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.messages', language)}</p>
                      <p className="text-sm text-muted-foreground">{t('settings.messagesDesc', language)}</p>
                    </div>
                    <Switch
                      checked={notifications.messages}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, messages: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.promotions', language)}</p>
                      <p className="text-sm text-muted-foreground">{t('settings.promotionsDesc', language)}</p>
                    </div>
                    <Switch
                      checked={notifications.promotions}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, promotions: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{t('settings.security', language)}</h2>
                    <p className="text-sm text-muted-foreground">{t('settings.securityDesc', language)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('settings.currentPassword', language)}</Label>
                    <Input type="password" placeholder={t('settings.currentPassword', language)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('settings.newPassword', language)}</Label>
                    <Input type="password" placeholder={t('settings.newPassword', language)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('settings.confirmPassword', language)}</Label>
                    <Input type="password" placeholder={t('settings.confirmPassword', language)} />
                  </div>
                  <Button variant="outline" onClick={handlePasswordChange}>
                    {t('settings.updatePassword', language)}
                  </Button>
                </div>
              </div>

              {/* Help */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{t('settings.helpSupport', language)}</h2>
                    <p className="text-sm text-muted-foreground">{t('settings.helpDesc', language)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    {t('settings.faq', language)}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    {t('settings.contactSupport', language)}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    {t('settings.privacyPolicy', language)}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    {t('settings.termsOfService', language)}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
