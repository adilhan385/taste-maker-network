import { motion } from 'framer-motion';
import { Star, Clock, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { formatPrice, t } from '@/lib/i18n';

export interface Dish {
  id: string;
  name: string;
  description: string;
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
  const { currency, language, addToCart, isAuthenticated, setAuthModalOpen, setAuthModalMode } = useApp();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    
    addToCart({
      dishId: dish.id,
      quantity: 1,
      price: dish.price,
    });
    onAddToCart?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-card rounded-2xl overflow-hidden card-elevated"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Favorite Button */}
        <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors">
          <Heart className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        </button>

        {/* Dietary Badges */}
        {dish.dietary.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {dish.dietary.slice(0, 2).map((diet) => (
              <Badge key={diet} variant="secondary" className="text-xs bg-background/80 backdrop-blur">
                {diet}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Add */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button onClick={handleAddToCart} variant="hero" size="sm" className="w-full gap-2">
            <ShoppingCart className="w-4 h-4" />
            {t('catalog.addToCart', language)}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Chef */}
        <div className="flex items-center gap-2 mb-3">
          <img
            src={dish.chef.avatar}
            alt={dish.chef.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-xs text-muted-foreground">{dish.chef.name}</span>
          <span className="flex items-center gap-1 text-xs text-accent ml-auto">
            <Star className="w-3 h-3 fill-current" />
            {dish.chef.rating}
          </span>
        </div>

        {/* Title & Cuisine */}
        <h3 className="font-serif font-semibold text-lg mb-1 line-clamp-1">{dish.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{dish.description}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-accent fill-accent" />
            {dish.rating} ({dish.reviewCount})
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {dish.prepTime} min
          </span>
        </div>

        {/* Price & Portions */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-primary">{formatPrice(dish.price, currency)}</span>
            <span className="text-xs text-muted-foreground ml-1">{t('catalog.perPortion', language)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {dish.availablePortions} {t('catalog.available', language)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
