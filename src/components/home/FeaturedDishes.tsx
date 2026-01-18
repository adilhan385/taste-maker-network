import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import DishCard, { Dish } from '@/components/catalog/DishCard';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

// Sample dishes for display
const sampleDishes: Dish[] = [
  {
    id: '1',
    name: 'Homemade Beshbarmak',
    description: 'Traditional Kazakh dish with tender lamb, handmade noodles, and savory broth',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
    chef: {
      id: 'chef-1',
      name: 'Aisha K.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop',
      rating: 4.9,
    },
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
    chef: {
      id: 'chef-2',
      name: 'Rustam M.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
      rating: 4.8,
    },
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
    chef: {
      id: 'chef-3',
      name: 'Nino G.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop',
      rating: 4.7,
    },
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
    chef: {
      id: 'chef-4',
      name: 'Elena P.',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop',
      rating: 4.9,
    },
    cuisine: 'Russian',
    dietary: ['Vegetarian'],
    rating: 4.6,
    reviewCount: 167,
    prepTime: 25,
    availablePortions: 15,
  },
];

export default function FeaturedDishes() {
  const { language } = useApp();
  const { toast } = useToast();

  const handleAddToCart = () => {
    toast({
      title: t('common.success', language),
      description: 'Added to cart!',
    });
  };

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
              Fresh dishes from the best local home cooks
            </p>
          </div>
          <Link to="/catalog">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleDishes.map((dish, index) => (
            <DishCard
              key={dish.id}
              dish={dish}
              index={index}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
