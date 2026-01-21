import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, User, FileCheck, Camera, ArrowRight, ArrowLeft, Check, Upload, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schema for chef application
const chefApplicationSchema = z.object({
  fullName: z.string().trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Zа-яА-ЯёЁәғқңөұүһіӘҒҚҢӨҰҮҺІ\s\-']+$/, 'Name contains invalid characters'),
  phone: z.string()
    .regex(/^\+?[0-9\s\-()]{10,20}$/, 'Invalid phone number format'),
  city: z.string().trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City name too long'),
  address: z.string().trim().max(200, 'Address too long').optional().or(z.literal('')),
  bio: z.string().trim()
    .min(10, 'Please write at least 10 characters about yourself')
    .max(1000, 'Bio too long'),
  cuisineSpecialization: z.string().min(1, 'Please select a cuisine'),
  experience: z.string().min(1, 'Please select your experience level'),
});

const cuisineOptions = ['Kazakh', 'Uzbek', 'Russian', 'Georgian', 'Turkish', 'Indian', 'Japanese', 'Mexican', 'Italian', 'Chinese', 'Korean', 'Other'];

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
    sanitaryCertificate: null as File | null,
    profilePhoto: null as File | null,
    bio: '',
    cuisineSpecialization: '',
    experience: '',
  });

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

  const handleFileChange = (field: 'idDocument' | 'sanitaryCertificate' | 'profilePhoto') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFormData(prev => ({ ...prev, [field]: e.target.files![0] }));
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
    
    const { data: { publicUrl } } = supabase.storage
      .from('chef-documents')
      .getPublicUrl(fileName);
    
    return publicUrl;
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
        cuisineSpecialization: formData.cuisineSpecialization,
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
      const [passportUrl, sanitaryUrl, photoUrl] = await Promise.all([
        uploadFile(formData.idDocument!, 'passport'),
        uploadFile(formData.sanitaryCertificate!, 'sanitary'),
        formData.profilePhoto ? uploadFile(formData.profilePhoto, 'photo') : Promise.resolve(null),
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
          docs_sanitary_url: sanitaryUrl,
          profile_photo_url: photoUrl,
          bio: validationResult.data.bio || null,
          cuisine_specialization: validationResult.data.cuisineSpecialization,
          experience: validationResult.data.experience,
          status: 'pending',
        });

      if (error) throw error;

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
      case 1: return formData.fullName && formData.phone && formData.city;
      case 2: return formData.idDocument && formData.sanitaryCertificate;
      case 3: return formData.bio && formData.cuisineSpecialization && formData.experience;
      default: return false;
    }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t('becomeChef.fullName', language)} *</Label><Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{t('becomeChef.phone', language)} *</Label><Input type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>{t('becomeChef.city', language)} *</Label><Input value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{t('becomeChef.address', language)}</Label><Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder={t('becomeChef.addressOptional', language)} /></div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold mb-6">{t('becomeChef.documentVerification', language)}</h2>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>{t('becomeChef.idDocument', language)} *</Label><div className="border-2 border-dashed rounded-xl p-6 text-center"><input type="file" accept="image/*,.pdf" onChange={handleFileChange('idDocument')} className="hidden" id="idDocument" /><label htmlFor="idDocument" className="cursor-pointer">{formData.idDocument ? <div className="flex items-center justify-center gap-2 text-primary"><Check className="w-5 h-5" /><span>{formData.idDocument.name}</span></div> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="w-8 h-8" /><span>{t('becomeChef.clickToUpload', language)}</span></div>}</label></div></div>
                  <div className="space-y-2"><Label>{t('becomeChef.medicalCert', language)} *</Label><div className="border-2 border-dashed rounded-xl p-6 text-center"><input type="file" accept="image/*,.pdf" onChange={handleFileChange('sanitaryCertificate')} className="hidden" id="sanitaryCertificate" /><label htmlFor="sanitaryCertificate" className="cursor-pointer">{formData.sanitaryCertificate ? <div className="flex items-center justify-center gap-2 text-primary"><Check className="w-5 h-5" /><span>{formData.sanitaryCertificate.name}</span></div> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="w-8 h-8" /><span>{t('becomeChef.clickToUpload', language)}</span></div>}</label></div></div>
                  <div className="space-y-2"><Label>{t('becomeChef.profilePhoto', language)}</Label><div className="border-2 border-dashed rounded-xl p-6 text-center"><input type="file" accept="image/*" onChange={handleFileChange('profilePhoto')} className="hidden" id="profilePhoto" /><label htmlFor="profilePhoto" className="cursor-pointer">{formData.profilePhoto ? <div className="flex items-center justify-center gap-2 text-primary"><Check className="w-5 h-5" /><span>{formData.profilePhoto.name}</span></div> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><Camera className="w-8 h-8" /><span>{t('becomeChef.clickToUpload', language)}</span></div>}</label></div></div>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold mb-6">{t('becomeChef.cookingProfile', language)}</h2>
                <div className="space-y-2"><Label>{t('becomeChef.bio', language)} *</Label><Textarea rows={4} value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder={t('becomeChef.bioPlaceholder', language)} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t('becomeChef.cuisine', language)} *</Label><Select value={formData.cuisineSpecialization} onValueChange={(v) => setFormData(prev => ({ ...prev, cuisineSpecialization: v }))}><SelectTrigger><SelectValue placeholder={t('becomeChef.cuisineSelect', language)} /></SelectTrigger><SelectContent>{cuisineOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>{t('becomeChef.experience', language)} *</Label><Select value={formData.experience} onValueChange={(v) => setFormData(prev => ({ ...prev, experience: v }))}><SelectTrigger><SelectValue placeholder={t('becomeChef.experienceSelect', language)} /></SelectTrigger><SelectContent><SelectItem value="1">{t('becomeChef.exp1', language)}</SelectItem><SelectItem value="1-3">{t('becomeChef.exp1_3', language)}</SelectItem><SelectItem value="3-5">{t('becomeChef.exp3_5', language)}</SelectItem><SelectItem value="5+">{t('becomeChef.exp5plus', language)}</SelectItem></SelectContent></Select></div>
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
