import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, Loader2, MapPin, Phone, FileText, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

interface ChefApplication {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  address: string | null;
  bio: string | null;
  cuisine_specialization: string;
  experience: string;
  profile_photo_url: string | null;
  status: string;
}

const rankLabels: Record<string, string> = {
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
  diamond: '💎 Diamond',
};

export default function ChefProfileTab() {
  const { user, profile, updateProfile } = useAuthContext();
  const { language } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chefData, setChefData] = useState<ChefApplication | null>(null);
  const [chefRank, setChefRank] = useState<string>('bronze');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    bio: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchChefData();
      fetchChefRank();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.fullName || prev.fullName,
        phone: profile.phone || prev.phone,
        city: profile.city || prev.city,
        address: profile.address || prev.address,
        bio: profile.bio || prev.bio,
      }));
    }
  }, [profile]);

  const fetchChefRank = async () => {
    if (!user) return;
    const { data } = await supabase.from('chef_ranks').select('rank').eq('chef_id', user.id).maybeSingle();
    if (data) setChefRank(data.rank);
  };

  const fetchChefData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chef_applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setChefData(data);
        setFormData({
          fullName: data.full_name,
          phone: data.phone,
          city: data.city,
          address: data.address || '',
          bio: data.bio || '',
        });
        setPhotoPreview(data.profile_photo_url);
      }
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = profile?.avatarUrl;
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('chef-documents').upload(fileName, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('chef-documents').getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }
      await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        bio: formData.bio,
        avatarUrl,
      });
      toast({ title: t('chef.profileUpdated', language) });
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold">{t('chef.profileTitle', language)}</h2>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                  {photoPreview ? <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-primary" />}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl font-bold">{formData.fullName}</h3>
                <p className="text-muted-foreground">{profile?.email}</p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <Badge variant="secondary">{t('chef.verifiedChef', language)}</Badge>
                  <Badge variant="outline">{rankLabels[chefRank] || chefRank}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" />{t('chef.contactInfo', language)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('becomeChef.fullName', language)}</Label>
                <Input value={formData.fullName} onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('becomeChef.phone', language)}</Label>
                <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />{t('chef.location', language)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('becomeChef.city', language)}</Label>
                <Input value={formData.city} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('becomeChef.address', language)}</Label>
                <Input value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />{t('chef.aboutYou', language)}</CardTitle>
            <CardDescription>{t('chef.aboutYouDesc', language)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={formData.bio} onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder={t('chef.aboutYouPlaceholder', language)} rows={4} />
          </CardContent>
        </Card>
      </motion.div>

      {chefData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>{t('chef.verificationDetails', language)}</CardTitle>
              <CardDescription>{t('chef.verificationDetailsDesc', language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('admin.experience', language)}</span>
                <span className="font-medium">{chefData.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('chef.status', language)}</span>
                <Badge variant="default" className="bg-green-500">{t('admin.statusApproved', language)}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex justify-end">
        <Button variant="hero" onClick={saveProfile} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('chef.saveProfile', language)}
        </Button>
      </div>
    </div>
  );
}
