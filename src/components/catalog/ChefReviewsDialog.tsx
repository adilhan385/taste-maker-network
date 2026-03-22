import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  userName: string;
  avatarUrl: string | null;
}

interface ChefReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chefId: string;
  chefName: string;
}

export default function ChefReviewsDialog({ open, onOpenChange, chefId, chefName }: ChefReviewsDialogProps) {
  const { language } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const fetchReviews = async () => {
      // Get all products by this chef
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('chef_id', chefId);

      if (!products?.length) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);

      // Get reviews for these products
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, user_id')
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (!reviewsData?.length) {
        setReviews([]);
        setAvgRating(0);
        setLoading(false);
        return;
      }

      // Get user profiles
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const formatted: Review[] = reviewsData.map(r => {
        const profile = profilesMap.get(r.user_id);
        return {
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          userName: profile?.full_name || t('reviews.anonymous', language),
          avatarUrl: profile?.avatar_url || null,
        };
      });

      const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setReviews(formatted);
      setLoading(false);
    };

    fetchReviews();
  }, [open, chefId, language]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('reviews.chefReviews', language)}: {chefName}</DialogTitle>
          {!loading && reviews.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-accent fill-accent" />
                <span className="font-semibold text-lg">{avgRating}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({reviews.length} {t('reviews.reviewsCount', language)})
              </span>
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('reviews.noReviews', language)}</p>
        ) : (
          <ScrollArea className="max-h-[400px] pr-3">
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={review.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">{review.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'dd.MM.yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
