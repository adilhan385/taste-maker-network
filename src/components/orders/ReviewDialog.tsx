import { useState } from 'react';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  orderId: string;
  userId: string;
  onReviewSubmitted: (productId: string, orderId: string) => void;
}

export default function ReviewDialog({
  open,
  onOpenChange,
  productId,
  productName,
  orderId,
  userId,
  onReviewSubmitted,
}: ReviewDialogProps) {
  const { language } = useApp();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      user_id: userId,
      product_id: productId,
      order_id: orderId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      console.error('Error submitting review:', error);
      toast({
        title: t('common.error', language),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('reviews.thankYou', language),
        description: t('reviews.submitted', language),
      });
      onReviewSubmitted(productId, orderId);
      onOpenChange(false);
      setRating(0);
      setComment('');
    }
    setSubmitting(false);
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reviews.leaveReview', language)}</DialogTitle>
          <p className="text-sm text-muted-foreground">{productName}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Star rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('reviews.rating', language)}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= displayRating
                        ? 'text-accent fill-accent'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('reviews.comment', language)}
              <span className="text-muted-foreground font-normal ml-1">({t('common.optional', language)})</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('reviews.commentPlaceholder', language)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            variant="hero"
          >
            {submitting ? t('common.loading', language) : t('reviews.submit', language)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
