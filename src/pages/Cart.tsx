import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CreditCard, Banknote, Truck, Store } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { formatPrice, t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

export default function Cart() {
  const { cart, currency, language, updateCartQuantity, removeFromCart, cartTotal, isAuthenticated, user, setAuthModalOpen, setAuthModalMode, clearCart } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');

  // Admin shouldn't see cart
  if (user?.role === 'admin') {
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
            <h1 className="text-3xl font-serif font-bold mb-4">Admin Panel</h1>
            <p className="text-muted-foreground mb-8">
              Cart functionality is not available for administrators
            </p>
            <Link to="/admin">
              <Button variant="hero">
                Go to Admin Panel
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </Layout>
    );
  }

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

  const handleQuantityUpdate = (dishId: string, delta: number, currentQty: number, maxPortions: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeFromCart(dishId);
      toast({
        title: 'Item removed',
        description: 'Item has been removed from your cart',
      });
    } else if (newQty > maxPortions) {
      toast({
        title: 'Not enough portions',
        description: `Only ${maxPortions} portions available`,
        variant: 'destructive',
      });
    } else {
      updateCartQuantity(dishId, newQty);
    }
  };

  const handleRemoveItem = (dishId: string, dishName: string) => {
    removeFromCart(dishId);
    toast({
      title: 'Item removed',
      description: `${dishName} has been removed from your cart`,
    });
  };

  const deliveryFee = deliveryOption === 'delivery' ? 2.99 : 0;
  const serviceFee = cartTotal * 0.05;
  const total = cartTotal + deliveryFee + serviceFee;

  const handleCheckout = () => {
    toast({
      title: 'Order placed!',
      description: `Your order of ${formatPrice(total, currency)} has been placed successfully.`,
    });
    clearCart();
    navigate('/orders');
  };

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-serif font-bold mb-8">Your Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map(item => (
                  <motion.div
                    key={item.dishId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card rounded-xl p-4 shadow-card flex gap-4"
                  >
                    <img
                      src={item.dishImage}
                      alt={item.dishName}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{item.dishName}</h3>
                      <p className="text-sm text-muted-foreground mb-1">by {item.chefName}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {formatPrice(item.price, currency)} per portion
                      </p>
                      
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityUpdate(item.dishId, -1, item.quantity, item.maxPortions)}
                            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityUpdate(item.dishId, 1, item.quantity, item.maxPortions)}
                            disabled={item.quantity >= item.maxPortions}
                            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-muted-foreground">
                            (max {item.maxPortions})
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-primary">
                            {formatPrice(item.price * item.quantity, currency)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.dishId, item.dishName)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl p-6 shadow-card sticky top-24 space-y-6">
                  <h2 className="font-serif font-semibold text-lg">Order Summary</h2>
                  
                  {/* Delivery Options */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Delivery Option</h3>
                    <RadioGroup value={deliveryOption} onValueChange={(v) => setDeliveryOption(v as 'delivery' | 'pickup')}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span>Delivery</span>
                          <span className="ml-auto text-sm text-muted-foreground">{formatPrice(2.99, currency)}</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          <span>Pickup</span>
                          <span className="ml-auto text-sm text-muted-foreground">Free</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Payment Method</h3>
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'online' | 'cash')}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span>Pay Online</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <Banknote className="w-4 h-4 text-muted-foreground" />
                          <span>Cash on {deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(cartTotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}
                      </span>
                      <span>{deliveryFee > 0 ? formatPrice(deliveryFee, currency) : 'Free'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee</span>
                      <span>{formatPrice(serviceFee, currency)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total, currency)}</span>
                    </div>
                  </div>

                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full gap-2"
                    onClick={handleCheckout}
                  >
                    {paymentMethod === 'online' ? 'Proceed to Payment' : 'Place Order'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
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
