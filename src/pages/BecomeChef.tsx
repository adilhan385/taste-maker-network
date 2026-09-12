import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, User, FileCheck, Camera, ArrowRight, ArrowLeft, Check, Upload, Loader2, ShieldCheck } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { CITIES, getCityLabel } from '@/lib/cities';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schema for chef application
const chefApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(100).regex(/^[a-zA-Zа-яА-ЯёЁәғқңөұүһіӘҒҚҢӨҰҮҺІ\s\-']+$/),
  phone: z.string().regex(/^\+?[0-9\s\-()]{10,20}$/),
  city: z.string().trim().min(2).max(100),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  bio: z.string().trim().min(10).max(1000),
  kaspiPhone: z.string().regex(/^\+?[0-9\s\-()]{10,20}$/).optional().or(z.literal('')),
  experience: z.string().min(1),
});

export default function BecomeChef() {
  const navigate = useNavigate();
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated, profile, user } = useAuthContext();
  const { toast } = useToast();

  const steps = [
    { id: 1, title: t('becomeChef.step1', language), icon: User },
    { id: 2, title: t('becomeChef.step2', language), icon: FileCheck },
    { id: 3, title: t('becomeChef.step3', language), icon: Camera },
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    address: profile?.address || '',
    idDocument: null as File | null,
    facePhoto: null as File | null,
    kitchenPhoto: null as File | null,
    sanitaryCertificate: null as File | null,
    bio: '',
    kaspiPhone: '',
    experience: '',
  });

  // Phone verification (only when the profile has no phone from registration)
  const existingPhone = profile?.phone || '';
  const [phoneVerified, setPhoneVerified] = useState(!!existingPhone);
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || profile.fullName || '',
        phone: prev.phone || profile.phone || '',
        city: prev.city || profile.city || '',
        address: prev.address || profile.address || '',
      }));
      if (profile.phone) setPhoneVerified(true);
    }
  }, [profile]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('becomeChef.title', language)}</h1>
            <p className="text-muted-foreground mb-8">{t('becomeChef.loginPrompt', language)}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>{t('nav.login', language)}</Button>
              <Button variant="hero" onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}>{t('nav.register', language)}</Button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const handleFileChange = (field: 'idDocument' | 'facePhoto' | 'kitchenPhoto' | 'sanitaryCertificate') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFormData(prev => ({ ...prev, [field]: e.target.files![0] }));
  };

  const handleSendSms = async () => {
    if (!formData.phone) return;
    setSmsLoading(true);
    const { error } = await supabase.functions.invoke('send-sms-otp', {
      body: { action: 'send', phone: formData.phone },
    });
    if (error) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } else {
      setSmsSent(true);
      toast({ title: t('auth.codeSent', language), description: t('auth.codeSentDesc', language) });
    }
    setSmsLoading(false);
  };

  const handleVerifySms = async () => {
    if (smsCode.length !== 6) return;
    setSmsLoading(true);
    const { data, error } = await supabase.functions.invoke('send-sms-otp', {
      body: { action: 'verify', phone: formData.phone, code: smsCode },
    });
    if (error || !data?.verified) {
      toast({ title: t('auth.invalidCode', language), variant: 'destructive' });
    } else {
      setPhoneVerified(true);
      toast({ title: t('becomeChef.phoneOk', language) });
    }
    setSmsLoading(false);
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const userId = user?.id;
    if (!userId) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('chef-documents')
      .upload(fileName, file);

    if (error) throw error;

    // Return only the relative path, not a public URL — the bucket is private
    return fileName;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ title: t('common.error', language), description: t('becomeChef.loginPrompt', language), variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate form data with Zod schema
      const validationResult = chefApplicationSchema.safeParse({
        fullName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        bio: formData.bio,
        kaspiPhone: formData.kaspiPhone,
        experience: formData.experience,
      });

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
        toast({ title: t('common.error', language), description: errorMessages, variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      // Check for existing pending application
      const { data: existingApp } = await supabase
        .from('chef_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingApp) {
        toast({ title: t('becomeChef.appExists', language), description: t('becomeChef.appExistsDesc', language), variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      // Upload documents
      const [passportUrl, faceUrl, kitchenUrl, sanitaryUrl] = await Promise.all([
        uploadFile(formData.idDocument!, 'passport'),
        uploadFile(formData.facePhoto!, 'photo'),
        uploadFile(formData.kitchenPhoto!, 'kitchen'),
        formData.sanitaryCertificate ? uploadFile(formData.sanitaryCertificate, 'sanitary') : Promise.resolve(null),
      ]);

      // Insert application with validated data
      const { error } = await supabase
        .from('chef_applications')
        .insert({
          user_id: user.id,
          full_name: validationResult.data.fullName,
          phone: validationResult.data.phone,
          city: validationResult.data.city,
          address: validationResult.data.address || null,
          docs_passport_url: passportUrl,
          docs_sanitary_url: sanitaryUrl || null,
          profile_photo_url: faceUrl,
          kitchen_photo_url: kitchenUrl,
          bio: validationResult.data.bio || null,
          cuisine_specialization: 'General',
          kaspi_phone: validationResult.data.kaspiPhone || null,
          experience: validationResult.data.experience,
          status: 'pending',
        });

      if (error) throw error;

      // Keep the profile in sync (city, and phone if it was just verified)
      await supabase
        .from('profiles')
        .update({
          city: validationResult.data.city,
          phone: validationResult.data.phone,
        })
        .eq('user_id', user.id);

      toast({ title: t('becomeChef.appSubmitted', language), description: t('becomeChef.appSubmittedDesc', language) });
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({ title: t('common.error', language), description: error.message || t('common.error', language), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.fullName && !!formData.city && !!formData.phone && phoneVerified;
      case 2: return !!formData.idDocument && !!formData.facePhoto && !!formData.kitchenPhoto;
      case 3: return !!formData.bio && !!formData.experience;
      default: return false;
    }
  };

  const fileField = (
    id: 'idDocument' | 'facePhoto' | 'kitchenPhoto' | 'sanitaryCertificate',
    label: string,
    hint: string,
    required: boolean,
    icon: 'upload' | 'camera' = 'upload',
  ) => {
    const file = formData[id];
    const Icon = icon === 'camera' ? Camera : Upload;
    return (
      <div className="space-y-2">
        <Label>{label}{required ? ' *' : ''}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        <div className="border-2 border-dashed rounded-xl p-6 text-center">
          <input type="file" accept={id === 'idDocument' || id === 'sanitaryCertificate' ? 'image/*,.pdf' : 'image/*'} onChange={handleFileChange(id)} className="hidden" id={id} />
          <label htmlFor={id} className="cursor-pointer block">
            {file ? (
              <div className="flex items-center justify-center gap-2 text-primary break-all">
                <Check className="w-5 h-5 shrink-0" /><span>{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Icon className="w-8 h-8" /><span>{t('becomeChef.clickToUpload', language)}</span>
              </div>
            )}
          </label>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2">{t('becomeChef.title', language)}</h1>
            <p className="text-muted-foreground">{t('becomeChef.subtitle', language)}</p>
          </motion.div>

          <div className="flex justify-between items-center mb-12 relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${currentStep >= step.id ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`mt-2 text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</span>
              </div>
            ))}
          </div>

          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl p-8 shadow-card">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold mb-6">{t('becomeChef.personalInfo', language)}</h2>
                <div className="space-y-2">
                  <Label>{t('becomeChef.fullName', language)} *</Label>
                  <Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} />
                </div>

                {existingPhone ? (
                  <div className="space-y-2">
                    <Label>{t('becomeChef.phone', language)}</Label>
                    <Input value={existingPhone} readOnly disabled />
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />{t('becomeChef.phoneVerified', language)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>{t('becomeChef.phone', language)} *</Label>
                    <p className="text-xs text-muted-foreground">{t('becomeChef.phoneVerifyHint', language)}</p>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        value={formData.phone}
                        disabled={phoneVerified}
                        placeholder="+7 777 123 4567"
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                      {!phoneVerified && (
                        <Button variant="outline" onClick={handleSendSms} disabled={!formData.phone || smsLoading}>
                          {smsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('becomeChef.sendCode', language)}
                        </Button>
                      )}
                    </div>
                    {phoneVerified ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />{t('becomeChef.phoneOk', language)}
                      </p>
                    ) : smsSent && (
                      <div className="flex gap-2 pt-2">
                        <Input
                          inputMode="numeric"
                          maxLength={6}
                          placeholder={t('becomeChef.enterCode', language)}
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                        />
                        <Button variant="hero" onClick={handleVerifySms} disabled={smsCode.length !== 6 || smsLoading}>
                          {smsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('becomeChef.verifyCode', language)}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t('becomeChef.city', language)} *</Label>
                  <Select value={formData.city} onValueChange={(v) => setFormData(prev => ({ ...prev, city: v }))}>
                    <SelectTrigger><SelectValue placeholder={t('becomeChef.citySelect', language)} /></SelectTrigger>
                    <SelectContent>
                      {CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{getCityLabel(city, language)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('becomeChef.address', language)}</Label>
                  <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder={t('becomeChef.addressOptional', language)} />
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold mb-6">{t('becomeChef.documentVerification', language)}</h2>
                <div className="space-y-4">
                  {fileField('idDocument', t('becomeChef.idDocument', language), t('becomeChef.idDocumentHint', language), true)}
                  {fileField('facePhoto', t('becomeChef.facePhoto', language), t('becomeChef.facePhotoHint', language), true, 'camera')}
                  {fileField('kitchenPhoto', t('becomeChef.kitchenPhoto', language), t('becomeChef.kitchenPhotoHint', language), true, 'camera')}
                  {fileField('sanitaryCertificate', t('becomeChef.medicalCert', language), t('becomeChef.medicalCertHint', language), false)}
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold mb-6">{t('becomeChef.cookingProfile', language)}</h2>
                <div className="space-y-2"><Label>{t('becomeChef.bio', language)} *</Label><Textarea rows={4} value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder={t('becomeChef.bioPlaceholder', language)} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t('becomeChef.experience', language)} *</Label><Select value={formData.experience} onValueChange={(v) => setFormData(prev => ({ ...prev, experience: v }))}><SelectTrigger><SelectValue placeholder={t('becomeChef.experienceSelect', language)} /></SelectTrigger><SelectContent><SelectItem value="1">{t('becomeChef.exp1', language)}</SelectItem><SelectItem value="1-3">{t('becomeChef.exp1_3', language)}</SelectItem><SelectItem value="3-5">{t('becomeChef.exp3_5', language)}</SelectItem><SelectItem value="5+">{t('becomeChef.exp5plus', language)}</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>{t('becomeChef.kaspiPhone', language)}</Label><Input type="tel" value={formData.kaspiPhone} onChange={(e) => setFormData(prev => ({ ...prev, kaspiPhone: e.target.value }))} placeholder="+7 777 123 4567" /></div>
                </div>
              </div>
            )}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1 || isSubmitting} className="gap-2"><ArrowLeft className="w-4 h-4" />{t('becomeChef.back', language)}</Button>
              {currentStep < 3 ? (
                <Button variant="hero" onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canProceed()} className="gap-2">{t('becomeChef.continue', language)}<ArrowRight className="w-4 h-4" /></Button>
              ) : (
                <Button variant="hero" onClick={handleSubmit} disabled={!canProceed() || isSubmitting} className="gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />{t('becomeChef.submitting', language)}</> : <><Check className="w-4 h-4" />{t('becomeChef.submit', language)}</>}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
