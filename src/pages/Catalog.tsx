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
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useApp } from '@/contexts/AppContext';
import { t, formatPrice, getLocalizedField } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Fallback mock data if database is empty
const mockDishes: Dish[] = [
  {
    id: '1',
    name: 'Homemade Beshbarmak',
    name_ru: 'Домашний Бешбармак',
    name_kz: 'Үй бесбармағы',
    description: 'Traditional Kazakh dish with tender lamb, handmade noodles, and savory broth',
    description_ru: 'Традиционное казахское блюдо с нежной бараниной, домашней лапшой и ароматным бульоном',
    description_kz: 'Нәзік қой етімен, үй кеспесімен және хош иісті сорпамен дәстүрлі қазақ тағамы',
    price: 7200,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
    chef: { id: 'chef-1', name: 'Aisha K.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop', rating: 4.9 },
    cuisine: 'Kazakh',
    dietary: [],
    rating: 4.8,
    reviewCount: 128,
    prepTime: 45,
    availablePortions: 8,
  },
  {
    id: '2',
    name: 'Authentic Plov',
    name_ru: 'Настоящий Плов',
    name_kz: 'Шынайы палау',
    description: 'Uzbek rice pilaf with carrots, chickpeas, and aromatic spices',
    description_ru: 'Узбекский плов с морковью, нутом и ароматными специями',
    description_kz: 'Сәбіз, нұт және хош иісті дәмдеуіштермен өзбек палауы',
    price: 5850,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop',
    chef: { id: 'chef-2', name: 'Rustam M.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop', rating: 4.8 },
    cuisine: 'Uzbek',
    dietary: ['Halal', 'Gluten-free'],
    rating: 4.9,
    reviewCount: 256,
    prepTime: 60,
    availablePortions: 12,
  },
  {
    id: '3',
    name: 'Georgian Khinkali',
    name_ru: 'Грузинские Хинкали',
    name_kz: 'Грузин хинкалилері',
    description: 'Hand-pleated dumplings filled with spiced beef and pork, served with fresh herbs',
    description_ru: 'Ручной лепки пельмени с пряной говядиной и свининой, подаются со свежей зеленью',
    description_kz: 'Дәмдеуішті сиыр және шошқа етімен толтырылған қолмен жасалған тұшпара, жаңа шөптермен',
    price: 4950,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop',
    chef: { id: 'chef-3', name: 'Nino G.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop', rating: 4.7 },
    cuisine: 'Georgian',
    dietary: [],
    rating: 4.7,
    reviewCount: 89,
    prepTime: 30,
    availablePortions: 20,
  },
  {
    id: '4',
    name: 'Russian Borscht',
    name_ru: 'Русский Борщ',
    name_kz: 'Орыс борщы',
    description: 'Classic beet soup with cabbage, potatoes, and sour cream',
    description_ru: 'Классический свекольный суп с капустой, картофелем и сметаной',
    description_kz: 'Қызылша, қырыққабат, картоп және қаймақпен классикалық сорпа',
    price: 4050,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop',
    chef: { id: 'chef-4', name: 'Elena P.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop', rating: 4.9 },
    cuisine: 'Russian',
    dietary: ['Vegetarian'],
    rating: 4.6,
    reviewCount: 167,
    prepTime: 25,
    availablePortions: 15,
  },
  {
    id: '5',
    name: 'Turkish Lahmacun',
    name_ru: 'Турецкий Лахмаджун',
    name_kz: 'Түрік лахмаджуны',
    description: 'Thin crispy flatbread topped with minced lamb, tomatoes, and fresh herbs',
    description_ru: 'Тонкая хрустящая лепёшка с фаршем ягнёнка, помидорами и свежей зеленью',
    description_kz: 'Ұнтақталған қозы еті, қызанақ және жаңа шөптермен жұқа қытырлақ нан',
    price: 3600,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop',
    chef: { id: 'chef-5', name: 'Mehmet A.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop', rating: 4.8 },
    cuisine: 'Turkish',
    dietary: ['Halal'],
    rating: 4.8,
    reviewCount: 203,
    prepTime: 20,
    availablePortions: 25,
  },
  {
    id: '6',
    name: 'Indian Butter Chicken',
    name_ru: 'Индийский Баттер Чикен',
    name_kz: 'Үнді Баттер Чикен',
    description: 'Creamy tomato-based curry with tender chicken and aromatic spices',
    description_ru: 'Сливочное карри на томатной основе с нежной курицей и ароматными специями',
    description_kz: 'Нәзік тауық пен хош иісті дәмдеуіштермен қызанақ негізіндегі кремді карри',
    price: 6300,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop',
    chef: { id: 'chef-6', name: 'Priya S.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop', rating: 4.9 },
    cuisine: 'Indian',
    dietary: ['Halal', 'Gluten-free'],
    rating: 4.9,
    reviewCount: 312,
    prepTime: 40,
    availablePortions: 10,
  },
  {
    id: '7',
    name: 'Japanese Tonkotsu Ramen',
    name_ru: 'Японский Тонкоцу Рамен',
    name_kz: 'Жапон Тонкоцу Рамені',
    description: 'Rich pork bone broth with noodles, chashu, and soft-boiled egg',
    description_ru: 'Насыщенный бульон из свиных костей с лапшой, тясю и яйцом всмятку',
    description_kz: 'Кеспе, часу және жартылай пісірілген жұмыртқамен шошқа сүйегінен жасалған бай сорпа',
    price: 6750,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
    chef: { id: 'chef-7', name: 'Yuki T.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop', rating: 4.8 },
    cuisine: 'Japanese',
    dietary: [],
    rating: 4.7,
    reviewCount: 178,
    prepTime: 35,
    availablePortions: 6,
  },
  {
    id: '8',
    name: 'Mexican Carnitas Tacos',
    name_ru: 'Мексиканские Такос с Карнитас',
    name_kz: 'Мексикалық Карнитас Такос',
    description: 'Slow-cooked pulled pork in corn tortillas with salsa and fresh cilantro',
    description_ru: 'Томлёная свинина в кукурузных тортильях с сальсой и свежей кинзой',
    description_kz: 'Сальса және жаңа кинзамен жүгері тортильясындағы баяу пісірілген шошқа еті',
    price: 5400,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop',
    chef: { id: 'chef-8', name: 'Maria L.', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop', rating: 4.7 },
    cuisine: 'Mexican',
    dietary: ['Gluten-free'],
    rating: 4.8,
    reviewCount: 145,
    prepTime: 25,
    availablePortions: 18,
  },
];

const defaultCuisines = ['All', 'Kazakh', 'Uzbek', 'Georgian', 'Russian', 'Turkish', 'Indian', 'Japanese', 'Mexican'];
const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-free'];

export default function Catalog() {
  const { language } = useApp();
  const { toast } = useToast();
  
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch dishes from database
  useEffect(() => {
    const fetchDishes = async () => {
      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        if (productsData && productsData.length > 0) {
          // Fetch chef profiles
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

          const formattedDishes: Dish[] = productsData.map(product => {
            const profile = profilesMap.get(product.chef_id);
            const reviewStats = reviewsMap.get(product.id);
            const avgRating = reviewStats ? Math.round((reviewStats.sum / reviewStats.count) * 10) / 10 : 0;
            const reviewCount = reviewStats?.count || 0;
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
              dietary: product.dietary || [],
              rating: avgRating || 0,
              reviewCount,
              prepTime: product.prep_time || 30,
              availablePortions: product.available_portions,
            };
          });
          setDishes(formattedDishes);
        } else {
          // Use mock data if database is empty
          setDishes(mockDishes);
        }
      } catch (error) {
        console.error('Error fetching dishes:', error);
        setDishes(mockDishes);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, []);

  // Dynamic cuisines from loaded dishes
  const cuisines = useMemo(() => {
    const uniqueCuisines = [...new Set(dishes.map(d => d.cuisine).filter(Boolean))];
    if (uniqueCuisines.length === 0) return defaultCuisines;
    return ['All', ...uniqueCuisines];
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      // Filter out dishes with no portions available
      if (dish.availablePortions <= 0) return false;
      
      // Get localized fields for search
      const dishName = getLocalizedField(dish.name, dish.name_ru, dish.name_kz, language);
      const dishDescription = getLocalizedField(dish.description, dish.description_ru, dish.description_kz, language);
      
      // Search
      const matchesSearch = dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dishDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.chef.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Cuisine
      const matchesCuisine = selectedCuisine === 'All' || dish.cuisine === selectedCuisine;
      
      // Dietary
      const matchesDietary = selectedDietary.length === 0 || 
        selectedDietary.some(d => dish.dietary.includes(d));
      
      // Price
      const matchesPrice = dish.price >= priceRange[0] && dish.price <= priceRange[1];
      
      return matchesSearch && matchesCuisine && matchesDietary && matchesPrice;
    });
  }, [dishes, searchQuery, selectedCuisine, selectedDietary, priceRange, language]);

  const handleAddToCart = () => {
    toast({
      title: t('common.success', language),
      description: t('catalog.addToCart', language),
    });
  };

  const clearFilters = () => {
    setSelectedCuisine('All');
    setSelectedDietary([]);
    setPriceRange([0, 15000]);
  };

  const activeFiltersCount = (selectedCuisine !== 'All' ? 1 : 0) + 
    selectedDietary.length + 
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
              
              {/* Search */}
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

                      {/* Dietary */}
                      <div>
                        <h4 className="font-medium mb-3">{t('catalog.dietary', language)}</h4>
                        <div className="space-y-3">
                          {dietaryOptions.map(diet => (
                            <div key={diet} className="flex items-center gap-2">
                              <Checkbox
                                id={diet}
                                checked={selectedDietary.includes(diet)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedDietary([...selectedDietary, diet]);
                                  } else {
                                    setSelectedDietary(selectedDietary.filter(d => d !== diet));
                                  }
                                }}
                              />
                              <label htmlFor={diet} className="text-sm cursor-pointer">{diet}</label>
                            </div>
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
              {selectedDietary.map(diet => (
                <Badge key={diet} variant="secondary" className="gap-1">
                  {diet}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSelectedDietary(selectedDietary.filter(d => d !== diet))} 
                  />
                </Badge>
              ))}
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
