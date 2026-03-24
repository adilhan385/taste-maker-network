import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
});

const registerSchema = z.object({
  name: z.string().trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Zа-яА-ЯёЁәғқңөұүһіӘҒҚҢӨҰҮҺІ\s\-']+$/, 'Name contains invalid characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-ZА-ЯЁ]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ModalView = 'form' | 'emailSent' | 'smsVerify' | 'forgotPassword' | 'resetLinkSent';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode, language } = useApp();
  const { signIn, signUp } = useAuthContext();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [view, setView] = useState<ModalView>('form');
  const [smsCode, setSmsCode] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const resetState = () => {
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    setErrors({});
    setView('form');
    setSmsCode('');
    setRegisteredPhone('');
    setResetEmail('');
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setView('resetLinkSent');
      }
    } catch (err) {
      console.error('Reset password error:', err);
    }
    setResetLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (authModalMode === 'login') {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (!error) {
          setAuthModalOpen(false);
          resetState();
        }
      } else {
        const result = registerSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        // Check if phone is already taken
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formData.phone)
          .maybeSingle();

        if (existingPhone) {
          setErrors({ phone: t('auth.phoneTaken', language) });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.name, formData.phone);
        if (!error) {
          setView('emailSent');
          if (formData.phone) {
            setRegisteredPhone(formData.phone);
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    }

    setIsLoading(false);
  };

  const handleSendSms = async () => {
    if (!registeredPhone) return;
    setSmsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t('auth.checkEmail', language), description: t('auth.checkEmailDesc', language) });
        setSmsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: { action: 'send', phone: registeredPhone },
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('auth.codeSent', language), description: t('auth.codeSentDesc', language) });
        setView('smsVerify');
      }
    } catch (err) {
      console.error('SMS send error:', err);
    }
    setSmsLoading(false);
  };

  const handleVerifySms = async () => {
    if (smsCode.length !== 6) return;
    setSmsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: { action: 'verify', phone: registeredPhone, code: smsCode },
      });

      if (error) {
        toast({ title: t('auth.invalidCode', language), description: error.message, variant: 'destructive' });
      } else if (data?.verified) {
        toast({ title: t('auth.phoneVerified', language), description: t('auth.phoneVerifiedDesc', language) });
        setAuthModalOpen(false);
        resetState();
      } else {
        toast({ title: t('auth.invalidCode', language), variant: 'destructive' });
      }
    } catch (err) {
      console.error('SMS verify error:', err);
    }
    setSmsLoading(false);
  };

  const toggleMode = () => {
    setAuthModalMode(authModalMode === 'login' ? 'register' : 'login');
    resetState();
  };

  const handleOpenChange = (open: boolean) => {
    setAuthModalOpen(open);
    if (!open) resetState();
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6"
        >
          <AnimatePresence mode="wait">
            {view === 'emailSent' && (
              <motion.div
                key="emailSent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-serif font-semibold">{t('auth.checkEmail', language)}</h2>
                <p className="text-muted-foreground text-sm">{t('auth.checkEmailDesc', language)}</p>
                <p className="text-xs text-muted-foreground">{formData.email}</p>

                {registeredPhone && (
                  <div className="pt-4 border-t space-y-3">
                    <p className="text-sm font-medium">{t('auth.verifyPhone', language)}</p>
                    <p className="text-xs text-muted-foreground">{registeredPhone}</p>
                    <Button onClick={handleSendSms} disabled={smsLoading} variant="outline" className="w-full">
                      {smsLoading ? t('common.loading', language) : t('auth.sendCode', language)}
                    </Button>
                  </div>
                )}

                <Button variant="ghost" onClick={() => { setAuthModalOpen(false); resetState(); }} className="w-full mt-4">
                  OK
                </Button>
              </motion.div>
            )}

            {view === 'smsVerify' && (
              <motion.div
                key="smsVerify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-serif font-semibold">{t('auth.verifyPhone', language)}</h2>
                <p className="text-muted-foreground text-sm">{t('auth.enterCode', language)}</p>
                <p className="text-xs text-muted-foreground">{registeredPhone}</p>

                <div className="flex justify-center py-4">
                  <InputOTP maxLength={6} value={smsCode} onChange={setSmsCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button onClick={handleVerifySms} disabled={smsLoading || smsCode.length !== 6} variant="hero" className="w-full">
                  {smsLoading ? t('common.loading', language) : t('auth.verifyPhone', language)}
                </Button>

                <button onClick={handleSendSms} disabled={smsLoading} className="text-sm text-primary hover:underline">
                  {t('auth.resendCode', language)}
                </button>
              </motion.div>
            )}

            {view === 'forgotPassword' && (
              <motion.div
                key="forgotPassword"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-2xl font-serif text-center">
                    {t('auth.forgotPasswordTitle', language)}
                  </DialogTitle>
                  <p className="text-center text-muted-foreground text-sm">
                    {t('auth.forgotPasswordDesc', language)}
                  </p>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">{t('auth.email', language)}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button onClick={handleForgotPassword} disabled={resetLoading || !resetEmail} variant="hero" className="w-full">
                  {resetLoading ? t('common.loading', language) : t('auth.sendResetLink', language)}
                </Button>
                <button onClick={() => setView('form')} className="text-sm text-primary hover:underline w-full text-center block">
                  {t('auth.backToLogin', language)}
                </button>
              </motion.div>
            )}

            {view === 'resetLinkSent' && (
              <motion.div
                key="resetLinkSent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-serif font-semibold">{t('auth.resetLinkSent', language)}</h2>
                <p className="text-muted-foreground text-sm">{t('auth.resetLinkSentDesc', language)}</p>
                <p className="text-xs text-muted-foreground">{resetEmail}</p>
                <Button variant="ghost" onClick={() => { setAuthModalOpen(false); resetState(); }} className="w-full mt-4">
                  OK
                </Button>
              </motion.div>
            )}

            {view === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                              placeholder="Your name"
                              className="pl-10"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
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
                              required
                            />
                          </div>
                          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
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
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
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
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
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
                        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {authModalMode === 'login' && (
                    <div className="text-right">
                      <button type="button" className="text-sm text-primary hover:underline" onClick={() => { setResetEmail(formData.email); setView('forgotPassword'); }}>
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
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
