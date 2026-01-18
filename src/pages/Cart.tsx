import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { formatPrice, t } from '@/lib/i18n';

// Mock dish data for cart items
const dishData: Record<string, { name: string; image: string; chef: string }> = {
  '1': { name: 'Homemade Beshbarmak', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', chef: 'Aisha K.' },
  '2': { name: 'Authentic Plov', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', chef: 'Rustam M.' },
};

export default function Cart() {
  const { cart, currency, language, addToCart, removeFromCart, cartTotal, isAuthenticated, setAuthModalOpen, setAuthModalMode } = useApp();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Your Cart</h1>
            <p className="text-muted-foreground mb-8">
              Please log in to view your cart
            </p>
            <Button 
              variant="hero" 
              onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
            >
              {t('nav.login', language)}
            </Button>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Browse our delicious dishes and add some to your cart
            </p>
            <Link to="/catalog">
              <Button variant="hero" className="gap-2">
                Browse Catalog
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const updateQuantity = (dishId: string, delta: number, currentQty: number, price: number) => {
    if (currentQty + delta <= 0) {
      removeFromCart(dishId);
    } else {
      addToCart({ dishId, quantity: delta, price });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-serif font-bold mb-8">Your Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map(item => {
                  const dish = dishData[item.dishId];
                  return (
                    <motion.div
                      key={item.dishId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-card rounded-xl p-4 shadow-card flex gap-4"
                    >
                      <img
                        src={dish?.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'}
                        alt={dish?.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{dish?.name || 'Dish'}</h3>
                        <p className="text-sm text-muted-foreground mb-3">by {dish?.chef || 'Chef'}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.dishId, -1, item.quantity, item.price)}
                              className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.dishId, 1, item.quantity, item.price)}
                              className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-primary">
                              {formatPrice(item.price * item.quantity, currency)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.dishId)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl p-6 shadow-card sticky top-24">
                  <h2 className="font-serif font-semibold text-lg mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(cartTotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span>{formatPrice(2.99, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee</span>
                      <span>{formatPrice(cartTotal * 0.05, currency)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(cartTotal + 2.99 + cartTotal * 0.05, currency)}</span>
                    </div>
                  </div>

                  <Button variant="hero" size="lg" className="w-full gap-2">
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By placing an order, you agree to our Terms of Service
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
