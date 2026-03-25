import { useState, useEffect } from 'react';
import { AlertTriangle, Star, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

interface Appeal {
  id: string;
  review_id: string;
  chef_id: string;
  reason: string;
  status: string;
  created_at: string;
  review?: {
    id: string;
    rating: number;
    comment: string | null;
    product_id: string;
    user_id: string;
    created_at: string;
  };
  chef_name?: string;
  reviewer_name?: string;
  product_name?: string;
}

export default function AdminReviewAppealsTab({ searchQuery }: { searchQuery: string }) {
  const { language } = useApp();
  const { toast } = useToast();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      const { data, error } = await supabase
        .from('review_appeals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) { setAppeals([]); setLoading(false); return; }

      // Fetch related reviews
      const reviewIds = data.map(a => a.review_id);
      const { data: reviews } = await supabase.from('reviews').select('*').in('id', reviewIds);
      const reviewMap = new Map(reviews?.map(r => [r.id, r]) || []);

      // Fetch chef names
      const chefIds = [...new Set(data.map(a => a.chef_id))];
      const { data: chefProfiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', chefIds);
      const chefMap = new Map(chefProfiles?.map(p => [p.user_id, p.full_name]) || []);

      // Fetch reviewer names
      const reviewerIds = [...new Set(reviews?.map(r => r.user_id) || [])];
      const { data: reviewerProfiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', reviewerIds);
      const reviewerMap = new Map(reviewerProfiles?.map(p => [p.user_id, p.full_name]) || []);

      // Fetch product names
      const productIds = [...new Set(reviews?.map(r => r.product_id) || [])];
      const { data: products } = await supabase.from('products').select('id, name').in('id', productIds);
      const productMap = new Map(products?.map(p => [p.id, p.name]) || []);

      setAppeals(data.map(a => {
        const review = reviewMap.get(a.review_id);
        return {
          ...a,
          review: review || undefined,
          chef_name: chefMap.get(a.chef_id) || 'Chef',
          reviewer_name: review ? (reviewerMap.get(review.user_id) || 'User') : 'User',
          product_name: review ? (productMap.get(review.product_id) || '') : '',
        };
      }));
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appeal: Appeal) => {
    setActionLoading(appeal.id);
    try {
      // Delete the review
      if (appeal.review) {
        const { error: deleteError } = await supabase.from('reviews').delete().eq('id', appeal.review_id);
        if (deleteError) throw deleteError;
      }
      // Update appeal status
      const { error } = await supabase.from('review_appeals').update({ status: 'approved' }).eq('id', appeal.id);
      if (error) throw error;

      toast({ title: t('admin.appealApproved', language) });
      setAppeals(prev => prev.filter(a => a.id !== appeal.id));
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appeal: Appeal) => {
    setActionLoading(appeal.id);
    try {
      const { error } = await supabase.from('review_appeals').update({ status: 'rejected' }).eq('id', appeal.id);
      if (error) throw error;
      toast({ title: t('admin.appealRejected', language) });
      setAppeals(prev => prev.filter(a => a.id !== appeal.id));
    } catch (error: any) {
      toast({ title: t('common.error', language), description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = appeals.filter(a =>
    !searchQuery || a.chef_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="w-4 h-4" />
        <span>{filtered.length} {t('admin.appealsCount', language)}</span>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{t('admin.noAppeals', language)}</CardContent></Card>
      ) : (
        filtered.map(appeal => (
          <Card key={appeal.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-medium">{appeal.chef_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(appeal.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant="outline">{t('admin.statusPending', language)}</Badge>
              </div>

              {/* Review details */}
              {appeal.review && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t('admin.reviewDetails', language)}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{appeal.reviewer_name}</span>
                    <span className="text-xs text-muted-foreground">• {appeal.product_name}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < appeal.review!.rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                  {appeal.review.comment && <p className="text-sm">{appeal.review.comment}</p>}
                </div>
              )}

              {/* Appeal reason */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">{t('admin.appealReason', language)}</div>
                <p className="text-sm">{appeal.reason}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleApprove(appeal)}
                  disabled={actionLoading === appeal.id}
                >
                  {actionLoading === appeal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                  {t('admin.deleteReview', language)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(appeal)}
                  disabled={actionLoading === appeal.id}
                >
                  <X className="w-4 h-4 mr-1" />
                  {t('admin.rejectAppeal', language)}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
