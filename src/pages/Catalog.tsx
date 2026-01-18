import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
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
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

const allDishes: Dish[] = [
  {
    id: '1',
    name: 'Homemade Beshbarmak',
    description: 'Traditional Kazakh dish with tender lamb, handmade noodles, and savory broth',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
    chef: { id: 'chef-1', name: 'Aisha K.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop', rating: 4.9 },
    cuisine: 'Kazakh',
    dietary: ['Halal'],
    rating: 4.8,
    reviewCount: 128,
    prepTime: 45,
    availablePortions: 8,
  },
  {
    id: '2',
    name: 'Authentic Plov',
    description: 'Uzbek rice pilaf with carrots, chickpeas, and aromatic spices',
    price: 12.99,
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
    description: 'Hand-pleated dumplings filled with spiced beef and pork, served with fresh herbs',
    price: 10.99,
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
    description: 'Classic beet soup with cabbage, potatoes, and sour cream',
    price: 8.99,
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
    description: 'Thin crispy flatbread topped with minced lamb, tomatoes, and fresh herbs',
    price: 7.99,
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
    description: 'Creamy tomato-based curry with tender chicken and aromatic spices',
    price: 13.99,
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
    description: 'Rich pork bone broth with noodles, chashu, and soft-boiled egg',
    price: 14.99,
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
    description: 'Slow-cooked pulled pork in corn tortillas with salsa and fresh cilantro',
    price: 11.99,
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

const cuisines = ['All', 'Kazakh', 'Uzbek', 'Georgian', 'Russian', 'Turkish', 'Indian', 'Japanese', 'Mexican'];
const dietaryOptions = ['Halal', 'Vegetarian', 'Vegan', 'Gluten-free'];

export default function Catalog() {
  const { language } = useApp();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredDishes = useMemo(() => {
    return allDishes.filter(dish => {
      // Search
      const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
  }, [searchQuery, selectedCuisine, selectedDietary, priceRange]);

  const handleAddToCart = () => {
    toast({
      title: t('common.success', language),
      description: 'Added to cart!',
    });
  };

  const clearFilters = () => {
    setSelectedCuisine('All');
    setSelectedDietary([]);
    setPriceRange([0, 50]);
  };

  const activeFiltersCount = (selectedCuisine !== 'All' ? 1 : 0) + 
    selectedDietary.length + 
    (priceRange[0] > 0 || priceRange[1] < 50 ? 1 : 0);

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
                Browse delicious homemade dishes from verified local chefs
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
                            Clear all
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
                              {cuisine}
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
                          max={50}
                          step={1}
                          value={priceRange}
                          onValueChange={setPriceRange}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}</span>
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
              <span className="text-sm text-muted-foreground">Active filters:</span>
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
              {(priceRange[0] > 0 || priceRange[1] < 50) && (
                <Badge variant="secondary" className="gap-1">
                  ${priceRange[0]} - ${priceRange[1]}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange([0, 50])} />
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          {filteredDishes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No dishes found matching your criteria</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">{filteredDishes.length} dishes found</p>
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
