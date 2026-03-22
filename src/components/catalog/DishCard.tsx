import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, Heart, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatPrice, t, getLocalizedField } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import ChefReviewsDialog from './ChefReviewsDialog';

export interface Dish {
  id: string;
  name: string;
  name_ru?: string | null;
  name_kz?: string | null;
  description: string;
  description_ru?: string | null;
  description_kz?: string | null;
  price: number;
  image: string;
  chef: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
  };
  cuisine: string;
  dietary: string[];
  rating: number;
  reviewCount: number;
  prepTime: number;
  availablePortions: number;
}

interface DishCardProps {
  dish: Dish;
  onAddToCart?: () => void;
  index?: number;
}

export default function DishCard({ dish, onAddToCart, index = 0 }: DishCardProps) {
  const { language, addToCart, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated, profile } = useAuthContext();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showChefReviews, setShowChefReviews] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isCook = profile?.role === 'cook';
  const isOwnDish = isCook && profile?.userId === dish.chef.id;
  const showAddToCart = !isAdmin && !isOwnDish;
  const isDisabled = isOwnDish;

  // Get localized name and description
  const dishName = getLocalizedField(dish.name, dish.name_ru, dish.name_kz, language);
  const dishDescription = getLocalizedField(dish.description, dish.description_ru, dish.description_kz, language);

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= dish.availablePortions) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (dish.availablePortions < quantity) {
      toast({
        title: t('common.error', language),
        description: t('cart.notEnoughPortions', language),
        variant: 'destructive',
      });
      return;
    }
    
    addToCart({
      productId: dish.id,
      quantity,
      price: dish.price,
      productName: dishName,
      productImage: dish.image,
      chefName: dish.chef.name,
      chefId: dish.chef.id,
      maxPortions: dish.availablePortions,
    });

    toast({
      title: t('common.success', language),
      description: `${dishName} (x${quantity}) ${t('catalog.addToCart', language)}!`,
    });

    setQuantity(1);
    setShowQuantitySelector(false);
    onAddToCart?.();
  };

  const handleButtonClick = () => {
    if (!isAuthenticated) {
      handleAddToCart();
      return;
    }
    setShowQuantitySelector(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-card rounded-2xl overflow-hidden card-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={dish.image}
          alt={dishName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors">
          <Heart className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        </button>

        {dish.dietary.filter(d => d !== 'Halal').length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {dish.dietary.filter(d => d !== 'Halal').slice(0, 2).map((diet) => (
              <Badge key={diet} variant="secondary" className="text-xs bg-background/80 backdrop-blur">
                {diet}
              </Badge>
            ))}
          </div>
        )}

        {showAddToCart && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {showQuantitySelector ? (
              <div className="bg-background/95 backdrop-blur rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('catalog.quantity', language)}:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= dish.availablePortions}
                      className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  {t('catalog.maxPortions', language)}: {dish.availablePortions} {t('catalog.portions', language)}
                </p>

                <Button onClick={handleAddToCart} variant="hero" size="sm" className="w-full gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {t('catalog.addToCart', language)} ({formatPrice(dish.price * quantity)})
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleButtonClick} 
                variant="hero" 
                size="sm" 
                className="w-full gap-2"
                disabled={isDisabled}
              >
                <ShoppingCart className="w-4 h-4" />
                {isOwnDish ? t('catalog.yourDish', language) : t('catalog.addToCart', language)}
              </Button>
            )}
          </div>
        )}

        {isOwnDish && (
          <div className="absolute bottom-3 left-3 right-3">
            <Badge variant="secondary" className="w-full justify-center py-2">
              {t('catalog.thisIsYourDish', language)}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <img
            src={dish.chef.avatar}
            alt={dish.chef.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <button
            onClick={() => setShowChefReviews(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {dish.chef.name}
          </button>
          <button
            onClick={() => setShowChefReviews(true)}
            className="flex items-center gap-1 text-xs text-accent ml-auto hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Star className="w-3 h-3 fill-current" />
            {dish.chef.rating}
          </button>
        </div>

        <h3 className="font-serif font-semibold text-lg mb-1 line-clamp-1">{dishName}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{dishDescription}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-accent fill-accent" />
            {dish.rating} ({dish.reviewCount})
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {dish.prepTime} {t('common.min', language)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-primary">{formatPrice(dish.price)}</span>
            <span className="text-xs text-muted-foreground ml-1">{t('catalog.perPortion', language)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {dish.availablePortions} {t('catalog.available', language)}
          </span>
        </div>
      </div>

      <ChefReviewsDialog
        open={showChefReviews}
        onOpenChange={setShowChefReviews}
        chefId={dish.chef.id}
        chefName={dish.chef.name}
      />
    </motion.div>
  );
}
