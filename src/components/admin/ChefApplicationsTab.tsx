import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Eye, Loader2, FileText, User, Phone, MapPin, ChefHat, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

interface ChefApplication {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  city: string;
  address: string | null;
  docs_passport_url: string;
  docs_sanitary_url: string;
  profile_photo_url: string | null;
  bio: string | null;
  cuisine_specialization: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

function SignedImage({ path, className }: { path: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from('chef-documents').createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl);
    });
  }, [path]);
  if (!url) return <div className={`bg-muted animate-pulse rounded-lg ${className || 'w-24 h-24'}`} />;
  return <img src={url} alt="" className={`rounded-lg object-cover ${className || 'w-24 h-24'}`} />;
}

interface Props {
  searchQuery: string;
}

export default function ChefApplicationsTab({ searchQuery }: Props) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { language } = useApp();
  const [applications, setApplications] = useState<ChefApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ChefApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('chef_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app: ChefApplication) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('chef_applications')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', app.id);
      if (error) throw error;
      toast({ title: t('admin.applicationApproved', language), description: app.full_name });
      setSelectedApp(null);
      setAdminNotes('');
      fetchApplications();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('chef_applications')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', selectedApp.id);
      if (error) throw error;
      toast({ title: t('admin.applicationRejected', language), description: selectedApp.full_name });
      setSelectedApp(null);
      setShowRejectDialog(false);
      setAdminNotes('');
      fetchApplications();
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">{t('admin.statusPending', language)}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">{t('admin.statusApproved', language)}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">{t('admin.statusRejected', language)}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app =>
    app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.cuisine_specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="text-sm">
          {pendingCount} {t('admin.pending', language)}
        </Badge>
        <Badge variant="outline" className="text-sm">
          {applications.length} {t('admin.total', language)}
        </Badge>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('admin.noApplications', language)}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-6 shadow-card"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {app.profile_photo_url ? (
                    <SignedImage path={app.profile_photo_url} className="w-20 h-20 rounded-full" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{app.full_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.city}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">{app.cuisine_specialization}</Badge>
                    <Badge variant="outline">{app.experience}</Badge>
                  </div>
                  
                  {app.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{app.bio}</p>}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{t('admin.applied', language)} {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                    <Eye className="w-4 h-4 mr-1" />{t('common.view', language)}
                  </Button>
                  {app.status === 'pending' && (
                    <>
                      <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(app)} disabled={actionLoading}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setSelectedApp(app); setShowRejectDialog(true); }} disabled={actionLoading}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!selectedApp && !showRejectDialog} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {selectedApp.profile_photo_url ? (
                      <SignedImage path={selectedApp.profile_photo_url} className="w-16 h-16 rounded-full" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <span>{selectedApp.full_name}</span>
                    <div className="font-normal text-sm text-muted-foreground">{selectedApp.city}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">{t('admin.phone', language)}</Label>
                    <p className="font-medium">{selectedApp.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t('admin.address', language)}</Label>
                    <p className="font-medium">{selectedApp.address || t('admin.notProvided', language)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t('admin.cuisine', language)}</Label>
                    <p className="font-medium">{selectedApp.cuisine_specialization}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t('admin.experience', language)}</Label>
                    <p className="font-medium">{selectedApp.experience}</p>
                  </div>
                </div>

                {selectedApp.bio && (
                  <div>
                    <Label className="text-muted-foreground text-xs">{t('admin.bio', language)}</Label>
                    <p className="mt-1">{selectedApp.bio}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground text-xs">{t('admin.documents', language)}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{t('admin.passport', language)}</p>
                      <SignedImage path={selectedApp.docs_passport_url} className="w-full h-48" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{t('admin.medicalCert', language)}</p>
                      <SignedImage path={selectedApp.docs_sanitary_url} className="w-full h-48" />
                    </div>
                  </div>
                  {selectedApp.profile_photo_url && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">{t('admin.profilePhoto', language)}</p>
                      <SignedImage path={selectedApp.profile_photo_url} className="w-32 h-32" />
                    </div>
                  )}
                </div>

                {selectedApp.status === 'pending' && (
                  <div>
                    <Label>{t('admin.adminNotes', language)}</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={t('admin.notesPlaceholder', language)}
                      rows={3}
                    />
                  </div>
                )}

                {selectedApp.admin_notes && selectedApp.status !== 'pending' && (
                  <div>
                    <Label className="text-muted-foreground text-xs">{t('admin.adminNotes', language)}</Label>
                    <p className="mt-1 text-sm">{selectedApp.admin_notes}</p>
                  </div>
                )}
              </div>

              {selectedApp.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setSelectedApp(null)}>{t('common.cancel', language)}</Button>
                  <Button variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={actionLoading}>
                    <X className="w-4 h-4 mr-1" />{t('admin.reject', language)}
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedApp)} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                    {t('admin.approve', language)}
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.rejectApplication', language)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t('admin.rejectConfirm', language)} {selectedApp?.full_name}?
            </p>
            <div>
              <Label>{t('admin.rejectReason', language)}</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('admin.rejectReasonPlaceholder', language)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setAdminNotes(''); }}>{t('common.cancel', language)}</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {t('admin.confirmReject', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
