import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Mail, Phone, MapPin, Edit2, Save } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated, profile, updateProfile } = useAuthContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });

  if (!isAuthenticated || !profile) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('nav.profile', language)}</h1>
            <p className="text-muted-foreground mb-8">Please log in to view your profile</p>
            <Button variant="hero" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>{t('nav.login', language)}</Button>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const handleSave = async () => {
    await updateProfile(formData);
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-serif font-bold">{profile.fullName}</h1>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${profile.role === 'admin' ? 'bg-destructive/20 text-destructive' : profile.role === 'cook' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
                <Button variant={isEditing ? 'hero' : 'outline'} onClick={isEditing ? handleSave : () => setIsEditing(true)} className="gap-2">
                  {isEditing ? <><Save className="w-4 h-4" />Save</> : <><Edit2 className="w-4 h-4" />Edit</>}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="info">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="info" className="flex-1">Personal Info</TabsTrigger>
                <TabsTrigger value="favorites" className="flex-1">Favorites</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">My Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                <div className="bg-card rounded-2xl p-6 shadow-card space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Full Name</Label><Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} disabled={!isEditing} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input value={profile.email} disabled /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} disabled={!isEditing} /></div>
                    <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} disabled={!isEditing} /></div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="favorites"><div className="bg-card rounded-2xl p-6 shadow-card text-center"><p className="text-muted-foreground">No favorites yet</p></div></TabsContent>
              <TabsContent value="reviews"><div className="bg-card rounded-2xl p-6 shadow-card text-center"><p className="text-muted-foreground">No reviews yet</p></div></TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
