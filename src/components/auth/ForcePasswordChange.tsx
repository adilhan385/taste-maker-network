import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

interface Props {
  open: boolean;
  onComplete: () => void;
  userId: string;
}

export default function ForcePasswordChange({ open, onComplete, userId }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { language } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: t('common.error', language), description: t('auth.passwordMinLength', language), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('common.error', language), description: t('auth.passwordsMismatch', language), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      await supabase.from('profiles').update({ force_password_change: false } as any).eq('user_id', userId);

      toast({ title: t('common.success', language), description: t('auth.passwordChanged', language) });
      onComplete();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {t('auth.mustChangePassword', language)}
          </DialogTitle>
          <DialogDescription>
            {t('auth.mustChangePasswordDesc', language)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('auth.newPassword', language)}</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label>{t('auth.confirmNewPassword', language)}</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t('auth.changePassword', language)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
