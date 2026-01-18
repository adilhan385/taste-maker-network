import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, User, FileCheck, Camera, ArrowRight, ArrowLeft, Check, Upload } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';

const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Verification', icon: FileCheck },
  { id: 3, title: 'Cooking Profile', icon: Camera },
];

const cuisineOptions = [
  'Kazakh', 'Uzbek', 'Russian', 'Georgian', 'Turkish', 'Indian', 'Japanese', 'Mexican', 'Italian', 'Chinese', 'Korean', 'Other'
];

export default function BecomeChef() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuthModalOpen, setAuthModalMode, language } = useApp();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('nav.becomeChef', language)}</h1>
            <p className="text-muted-foreground mb-8">
              Please log in or create an account to start your chef application
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
              >
                {t('nav.login', language)}
              </Button>
              <Button 
                variant="hero" 
                onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}
              >
                {t('nav.register', language)}
              </Button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const handleFileChange = (field: 'idDocument' | 'sanitaryCertificate' | 'profilePhoto') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSubmit = () => {
    toast({
      title: 'Application Submitted!',
      description: 'Your chef application has been submitted. We will review your documents and notify you within 2-3 business days.',
    });
    navigate('/');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.phone && formData.city && formData.address;
      case 2:
        return formData.idDocument && formData.sanitaryCertificate;
      case 3:
        return formData.bio && formData.cuisineSpecialization && formData.experience;
      default:
        return false;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2">{t('nav.becomeChef', language)}</h1>
            <p className="text-muted-foreground">Complete the steps below to start your culinary journey</p>
          </motion.div>

          {/* Steps */}
          <div className="flex justify-between items-center mb-12 relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep >= step.id 
                    ? 'gradient-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Form */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card rounded-2xl p-8 shadow-card"
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold mb-6">Personal Information</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (777) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Almaty"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Approximate) *</Label>
                  <Input
                    id="address"
                    placeholder="District, Street"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold mb-6">Document Verification</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Please upload clear photos of your documents. This helps us verify your identity and ensure food safety standards.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ID/Passport Document *</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange('idDocument')}
                        className="hidden"
                        id="idDocument"
                      />
                      <label htmlFor="idDocument" className="cursor-pointer">
                        {formData.idDocument ? (
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <Check className="w-5 h-5" />
                            <span>{formData.idDocument.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="w-8 h-8" />
                            <span>Click to upload ID document</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sanitary/Medical Certificate *</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange('sanitaryCertificate')}
                        className="hidden"
                        id="sanitaryCertificate"
                      />
                      <label htmlFor="sanitaryCertificate" className="cursor-pointer">
                        {formData.sanitaryCertificate ? (
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <Check className="w-5 h-5" />
                            <span>{formData.sanitaryCertificate.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="w-8 h-8" />
                            <span>Click to upload certificate</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold mb-6">Cooking Profile</h2>

                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange('profilePhoto')}
                      className="hidden"
                      id="profilePhoto"
                    />
                    <label htmlFor="profilePhoto" className="cursor-pointer">
                      {formData.profilePhoto ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <Check className="w-5 h-5" />
                          <span>{formData.profilePhoto.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Camera className="w-8 h-8" />
                          <span>Upload a profile photo</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Short Bio *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself and your cooking journey..."
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cuisine Specialization *</Label>
                    <Select 
                      value={formData.cuisineSpecialization}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cuisineSpecialization: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuisineOptions.map(cuisine => (
                          <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Years of Experience *</Label>
                    <Select
                      value={formData.experience}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Less than 1 year</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  variant="hero"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Submit Application
                  <Check className="w-4 h-4" />
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
