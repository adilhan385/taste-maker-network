import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import DishCard, { Dish } from '@/components/catalog/DishCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { useApp } from '@/contexts/AppContext';
import { t, formatPrice, getLocalizedField } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


const rankOrder: Record<string, number> = { diamond: 4, gold: 3, silver: 2, bronze: 1 };
const defaultCuisines = ['All'];

export default function Catalog() {
  const { language } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true)
          .gt('available_portions', 0)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        if (productsData && productsData.length > 0) {
          const chefIds = [...new Set(productsData.map(p => p.chef_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', chefIds);

          const profilesMap = new Map(
            profilesData?.map(p => [p.user_id, p]) || []
          );

          // Fetch reviews for real ratings
          const productIds = productsData.map(p => p.id);
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('product_id, rating')
            .in('product_id', productIds);

          const reviewsMap = new Map<string, { sum: number; count: number }>();
          reviewsData?.forEach(r => {
            const existing = reviewsMap.get(r.product_id) || { sum: 0, count: 0 };
            existing.sum += r.rating;
            existing.count += 1;
            reviewsMap.set(r.product_id, existing);
          });

          // Fetch chef ranks
          const { data: ranksData } = await supabase
            .from('chef_ranks')
            .select('chef_id, rank')
            .in('chef_id', chefIds);

          const ranksMap = new Map(
            ranksData?.map(r => [r.chef_id, r.rank]) || []
          );

          const formattedDishes: Dish[] = productsData.map(product => {
            const profile = profilesMap.get(product.chef_id);
            const reviewStats = reviewsMap.get(product.id);
            const avgRating = reviewStats ? Math.round((reviewStats.sum / reviewStats.count) * 10) / 10 : 0;
            const reviewCount = reviewStats?.count || 0;
            const chefRank = ranksMap.get(product.chef_id) || 'bronze';
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
                rating: avgRating || 4.8,
              },
              cuisine: product.cuisine || '',
              dietary: [],
              rating: avgRating || 0,
              reviewCount,
              prepTime: product.prep_time || 30,
              availablePortions: product.available_portions,
              chefRank,
            };
          });

          // Sort by chef rank (diamond first)
          formattedDishes.sort((a, b) => (rankOrder[b.chefRank || 'bronze'] || 1) - (rankOrder[a.chefRank || 'bronze'] || 1));

          setDishes(formattedDishes);
        } else {
          setDishes([]);
        }
      } catch (error) {
        console.error('Error fetching dishes:', error);
        setDishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, []);

  const cuisines = useMemo(() => {
    const uniqueCuisines = [...new Set(dishes.map(d => d.cuisine).filter(Boolean))];
    if (uniqueCuisines.length === 0) return defaultCuisines;
    return ['All', ...uniqueCuisines];
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      if (dish.availablePortions <= 0) return false;
      
      const dishName = getLocalizedField(dish.name, dish.name_ru, dish.name_kz, language);
      const dishDescription = getLocalizedField(dish.description, dish.description_ru, dish.description_kz, language);
      
      const matchesSearch = dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dishDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.chef.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCuisine = selectedCuisine === 'All' || dish.cuisine === selectedCuisine;
      
      const matchesPrice = dish.price >= priceRange[0] && dish.price <= priceRange[1];
      
      return matchesSearch && matchesCuisine && matchesPrice;
    });
  }, [dishes, searchQuery, selectedCuisine, priceRange, language]);

  const handleAddToCart = () => {
    toast({
      title: t('common.success', language),
      description: t('catalog.addToCart', language),
    });
  };

  const clearFilters = () => {
    setSelectedCuisine('All');
    setPriceRange([0, 15000]);
  };

  const activeFiltersCount = (selectedCuisine !== 'All' ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < 15000 ? 1 : 0);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-secondary/30 py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                {t('catalog.title', language)}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t('catalog.subtitle', language)}
              </p>
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={t('catalog.search', language)}
                    className="pl-10 h-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2 relative">
                      <SlidersHorizontal className="w-5 h-5" />
                      <span className="hidden sm:inline">{t('catalog.filters', language)}</span>
                      {activeFiltersCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle className="flex items-center justify-between">
                        {t('catalog.filters', language)}
                        {activeFiltersCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            {t('catalog.clearAll', language)}
                          </Button>
                        )}
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-8">
                      {/* Cuisine */}
                      <div>
                        <h4 className="font-medium mb-3">{t('catalog.cuisine', language)}</h4>
                        <div className="flex flex-wrap gap-2">
                          {cuisines.map(cuisine => (
                            <Badge
                              key={cuisine}
                              variant={selectedCuisine === cuisine ? 'default' : 'secondary'}
                              className="cursor-pointer"
                              onClick={() => setSelectedCuisine(cuisine)}
                            >
                              {cuisine === 'All' ? t('common.all', language) : cuisine}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <h4 className="font-medium mb-3">{t('catalog.price', language)}</h4>
                        <Slider
                          min={0}
                          max={15000}
                          step={100}
                          value={priceRange}
                          onValueChange={setPriceRange}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{formatPrice(priceRange[0])}</span>
                          <span>{formatPrice(priceRange[1])}</span>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">{t('catalog.activeFilters', language)}:</span>
              {selectedCuisine !== 'All' && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCuisine}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCuisine('All')} />
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 15000) && (
                <Badge variant="secondary" className="gap-1">
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange([0, 15000])} />
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">{t('catalog.noDishes', language)}</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                {t('catalog.clearFilters', language)}
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">{filteredDishes.length} {t('catalog.dishesFound', language)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDishes.map((dish, index) => (
                  <DishCard 
                    key={dish.id} 
                    dish={dish} 
                    index={index} 
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
