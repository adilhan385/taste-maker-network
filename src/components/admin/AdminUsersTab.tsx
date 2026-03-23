import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Ban, Shield, ChefHat, ShoppingBag, Loader2, Unlock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  role: string;
  chefRank: string | null;
  ban?: {
    id: string;
    reason: string | null;
    banned_until: string | null;
    created_at: string;
  } | null;
}

interface Props {
  searchQuery: string;
}

export default function AdminUsersTab({ searchQuery }: Props) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { language } = useApp();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [banDialog, setBanDialog] = useState<UserWithRole | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('permanent');
  const [actionLoading, setActionLoading] = useState(false);
  const [rankDialog, setRankDialog] = useState<UserWithRole | null>(null);
  const [selectedRank, setSelectedRank] = useState('bronze');
  const [adminConfirmDialog, setAdminConfirmDialog] = useState<UserWithRole | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from('user_roles')
        .select('*');
      if (rErr) throw rErr;

      const { data: bans, error: bErr } = await supabase
        .from('user_bans')
        .select('*');
      if (bErr) throw bErr;

      const { data: ranks } = await supabase
        .from('chef_ranks')
        .select('*');

      const ranksMap = new Map((ranks || []).map(r => [r.chef_id, r.rank]));

      const userList: UserWithRole[] = (profiles || []).map(p => {
        const userRoles = (roles || []).filter(r => r.user_id === p.user_id);
        let role = 'buyer';
        if (userRoles.some(r => r.role === 'admin')) role = 'admin';
        else if (userRoles.some(r => r.role === 'cook')) role = 'cook';

        const activeBan = (bans || []).find(b =>
          b.user_id === p.user_id &&
          (b.banned_until === null || new Date(b.banned_until) > new Date())
        );

        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          phone: p.phone,
          city: p.city,
          avatar_url: p.avatar_url,
          role,
          chefRank: role === 'cook' ? ranksMap.get(p.user_id) || 'bronze' : null,
          ban: activeBan ? {
            id: activeBan.id,
            reason: activeBan.reason,
            banned_until: activeBan.banned_until,
            created_at: activeBan.created_at,
          } : null,
        };
      });

      setUsers(userList);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!banDialog || !user) return;
    setActionLoading(true);
    try {
      let bannedUntil: string | null = null;
      if (banDuration === '1d') bannedUntil = new Date(Date.now() + 86400000).toISOString();
      else if (banDuration === '7d') bannedUntil = new Date(Date.now() + 7 * 86400000).toISOString();
      else if (banDuration === '30d') bannedUntil = new Date(Date.now() + 30 * 86400000).toISOString();

      const { error } = await supabase.from('user_bans').insert({
        user_id: banDialog.user_id,
        banned_by: user.id,
        reason: banReason || null,
        banned_until: bannedUntil,
      });
      if (error) throw error;

      toast({ title: t('admin.userBanned', language), description: banDialog.full_name });
      setBanDialog(null);
      setBanReason('');
      setBanDuration('permanent');
      fetchUsers();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (u: UserWithRole) => {
    if (!u.ban) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('user_bans').delete().eq('id', u.ban.id);
      if (error) throw error;
      toast({ title: t('admin.userUnbanned', language), description: u.full_name });
      fetchUsers();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetRank = async () => {
    if (!rankDialog || !user) return;
    setActionLoading(true);
    try {
      // Upsert rank
      const { error } = await supabase.from('chef_ranks').upsert({
        chef_id: rankDialog.user_id,
        rank: selectedRank,
        assigned_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'chef_id' });
      if (error) throw error;

      toast({ title: t('admin.rankUpdated', language), description: `${rankDialog.full_name} → ${selectedRank}` });
      setRankDialog(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdmin = async () => {
    if (!adminConfirmDialog || !user) return;
    if (adminConfirmDialog.user_id === user.id) return;
    setActionLoading(true);
    try {
      if (adminConfirmDialog.role === 'admin') {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', adminConfirmDialog.user_id).eq('role', 'admin');
        if (error) throw error;
        toast({ title: t('admin.adminRevoked', language), description: adminConfirmDialog.full_name });
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: adminConfirmDialog.user_id, role: 'admin' });
        if (error) throw error;
        toast({ title: t('admin.adminGranted', language), description: adminConfirmDialog.full_name });
      }
      setAdminConfirmDialog(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Shield className="w-4 h-4" />;
    if (role === 'cook') return <ChefHat className="w-4 h-4" />;
    return <ShoppingBag className="w-4 h-4" />;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      cook: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      buyer: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    };
    return (
      <Badge variant="outline" className={`${colors[role] || ''} flex items-center gap-1`}>
        {getRoleIcon(role)} {role}
      </Badge>
    );
  };

  const rankLabels: Record<string, string> = { bronze: '🥉 Bronze', silver: '🥈 Silver', gold: '🥇 Gold', diamond: '💎 Diamond' };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.city?.toLowerCase().includes(searchQuery.toLowerCase()) || false
  );

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Badge variant="secondary">{users.length} {t('admin.usersCount', language)}</Badge>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('admin.usersNotFound', language)}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(u => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {u.avatar_url ? <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{u.full_name}</h3>
                  {getRoleBadge(u.role)}
                  {u.chefRank && (
                    <Badge variant="outline" className="text-xs">{rankLabels[u.chefRank] || u.chefRank}</Badge>
                  )}
                  {u.ban && <Badge variant="destructive" className="text-xs">{t('admin.banned', language)}{u.ban.banned_until ? ` ${t('admin.until', language)} ${new Date(u.ban.banned_until).toLocaleDateString()}` : ` ${t('admin.forever', language)}`}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{u.city || t('admin.noCity', language)} {u.phone ? `• ${u.phone}` : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {u.role === 'cook' && (
                  <Button variant="outline" size="sm" onClick={() => { setRankDialog(u); setSelectedRank(u.chefRank || 'bronze'); }}>
                    <Award className="w-4 h-4 mr-1" />{t('admin.rank', language)}
                  </Button>
                )}
                {u.role !== 'admin' && (
                  u.ban ? (
                    <Button variant="outline" size="sm" onClick={() => handleUnban(u)} disabled={actionLoading}>
                      <Unlock className="w-4 h-4 mr-1" />{t('admin.unban', language)}
                    </Button>
                  ) : (
                    <Button variant="destructive" size="sm" onClick={() => setBanDialog(u)} disabled={actionLoading}>
                      <Ban className="w-4 h-4 mr-1" />{t('admin.ban', language)}
                    </Button>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ban Dialog */}
      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.banUser', language)} {banDialog?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('admin.banDuration', language)}</Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">{t('admin.1day', language)}</SelectItem>
                  <SelectItem value="7d">{t('admin.7days', language)}</SelectItem>
                  <SelectItem value="30d">{t('admin.30days', language)}</SelectItem>
                  <SelectItem value="permanent">{t('admin.forever', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('admin.reason', language)}</Label>
              <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder={t('admin.reasonPlaceholder', language)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>{t('common.cancel', language)}</Button>
            <Button variant="destructive" onClick={handleBan} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{t('admin.ban', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rank Dialog */}
      <Dialog open={!!rankDialog} onOpenChange={() => setRankDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.setRank', language)} — {rankDialog?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('admin.rank', language)}</Label>
              <Select value={selectedRank} onValueChange={setSelectedRank}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">🥉 Bronze</SelectItem>
                  <SelectItem value="silver">🥈 Silver</SelectItem>
                  <SelectItem value="gold">🥇 Gold</SelectItem>
                  <SelectItem value="diamond">💎 Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRankDialog(null)}>{t('common.cancel', language)}</Button>
            <Button onClick={handleSetRank} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{t('common.save', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
