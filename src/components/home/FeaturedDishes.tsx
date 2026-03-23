import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import DishCard, { Dish } from '@/components/catalog/DishCard';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function FeaturedDishes() {
  const { language } = useApp();
  const { toast } = useToast();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true)
          .gt('available_portions', 0)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error || !productsData || productsData.length === 0) {
          setDishes([]);
          setLoading(false);
          return;
        }

        const chefIds = [...new Set(productsData.map(p => p.chef_id))];
        const [{ data: profilesData }, { data: ranksData }, { data: reviewsData }] = await Promise.all([
          supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', chefIds),
          supabase.from('chef_ranks').select('chef_id, rank').in('chef_id', chefIds),
          supabase.from('reviews').select('product_id, rating').in('product_id', productsData.map(p => p.id)),
        ]);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const ranksMap = new Map(ranksData?.map(r => [r.chef_id, r.rank]) || []);
        const reviewsMap = new Map<string, { sum: number; count: number }>();
        reviewsData?.forEach(r => {
          const existing = reviewsMap.get(r.product_id) || { sum: 0, count: 0 };
          existing.sum += r.rating;
          existing.count += 1;
          reviewsMap.set(r.product_id, existing);
        });

        const formatted: Dish[] = productsData.map(product => {
          const profile = profilesMap.get(product.chef_id);
          const stats = reviewsMap.get(product.id);
          const avgRating = stats ? Math.round((stats.sum / stats.count) * 10) / 10 : 0;
          return {
            id: product.id,
            name: product.name,
            name_ru: product.name_ru,
            name_kz: product.name_kz,
            description: product.description || '',
            description_ru: product.description_ru,
            description_kz: product.description_kz,
            price: Number(product.price),
            image: product.image_url || '/placeholder.svg',
            chef: {
              id: product.chef_id,
              name: profile?.full_name || 'Chef',
              avatar: profile?.avatar_url || '',
              rating: avgRating || 0,
            },
            cuisine: product.cuisine || '',
            dietary: [],
            rating: avgRating,
            reviewCount: stats?.count || 0,
            prepTime: product.prep_time || 30,
            availablePortions: product.available_portions,
            chefRank: ranksMap.get(product.chef_id) || 'bronze',
          };
        });

        setDishes(formatted);
      } catch (err) {
        console.error('Error fetching featured dishes:', err);
        setDishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleAddToCart = () => {
    toast({
      title: t('common.success', language),
      description: t('catalog.addToCart', language),
    });
  };

  if (!loading && dishes.length === 0) return null;

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-2">
              {t('catalog.title', language)}
            </h2>
            <p className="text-muted-foreground">
              {t('catalog.subtitle', language)}
            </p>
          </div>
          <Link to="/catalog">
            <Button variant="outline" className="gap-2">
              {t('common.viewAll', language) || 'View All'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dishes.map((dish, index) => (
              <DishCard
                key={dish.id}
                dish={dish}
                index={index}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
