import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, CreditCard, Banknote, ArrowLeft, Truck, Store } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatPrice, t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

export default function Cart() {
  const { cart, language, updateCartQuantity, removeFromCart, cartTotal, setAuthModalOpen, setAuthModalMode, clearCart } = useApp();
  const { isAuthenticated, profile } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');

  if (profile?.role === 'admin') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('cart.adminAccount', language)}</h2>
            <p className="text-muted-foreground mb-6">{t('cart.adminCantOrder', language)}</p>
            <Button asChild>
              <Link to="/admin">{t('cart.goToAdmin', language)}</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('cart.pleaseLogin', language)}</h2>
            <p className="text-muted-foreground mb-6">{t('cart.loginSubtitle', language)}</p>
            <Button onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>
              {t('auth.logIn', language)}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('cart.empty', language)}</h2>
            <p className="text-muted-foreground mb-6">{t('cart.emptySubtitle', language)}</p>
            <Button asChild>
              <Link to="/catalog">{t('cart.browseDishes', language)}</Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const handleQuantityUpdate = (productId: string, delta: number, currentQty: number, maxPortions: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
      toast({ title: t('cart.itemRemoved', language) });
    } else if (newQty > maxPortions) {
      toast({ title: t('cart.notEnoughPortions', language), variant: 'destructive' });
    } else {
      updateCartQuantity(productId, newQty);
    }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeFromCart(productId);
    toast({ title: t('cart.itemRemoved', language), description: `${productName} ${t('cart.itemRemovedDesc', language)}` });
  };

  const deliveryFee = deliveryOption === 'delivery' ? 500 : 0;
  const serviceFee = Math.round(cartTotal * 0.05);
  const totalPrice = cartTotal + deliveryFee + serviceFee;

  const handleCheckout = async () => {
    toast({ title: t('cart.orderPlaced', language), description: t('cart.orderPlacedDesc', language) });
    clearCart();
    navigate('/orders');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/catalog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('cart.backToCatalog', language)}
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">{t('cart.title', language)}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-lg mb-4">{t('cart.yourItems', language)} ({cart.length})</h2>
            
            {cart.map(item => (
              <motion.div key={item.productId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl p-4 shadow-card flex gap-4">
                <img src={item.productImage || '/placeholder.svg'} alt={item.productName} className="w-24 h-24 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">{item.productName}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{t('cart.by', language)} {item.chefName}</p>
                  <p className="text-sm text-muted-foreground mb-3">{formatPrice(item.price)} {t('cart.perPortion', language)}</p>
                  
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleQuantityUpdate(item.productId, -1, item.quantity, item.maxPortions)} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button onClick={() => handleQuantityUpdate(item.productId, 1, item.quantity, item.maxPortions)} disabled={item.quantity >= item.maxPortions} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-muted-foreground">({t('cart.max', language)} {item.maxPortions})</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">{formatPrice(item.price * item.quantity)}</span>
                      <button onClick={() => handleRemoveItem(item.productId, item.productName)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 shadow-card sticky top-24 space-y-6">
              <h2 className="font-semibold text-lg">{t('cart.orderSummary', language)}</h2>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('cart.deliveryOption', language)}</h3>
                <RadioGroup value={deliveryOption} onValueChange={(v) => setDeliveryOption(v as 'delivery' | 'pickup')}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span>{t('cart.delivery', language)}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{formatPrice(500)}</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>{t('cart.pickup', language)}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{t('cart.free', language)}</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('cart.paymentMethod', language)}</h3>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'online' | 'cash')}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>{t('cart.payOnline', language)}</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      <span>{t('cart.payCash', language)}</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('cart.subtotal', language)}</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('cart.deliveryFee', language)}</span>
                  <span>{deliveryOption === 'delivery' ? formatPrice(deliveryFee) : t('cart.free', language)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('cart.serviceFee', language)}</span>
                  <span>{formatPrice(serviceFee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                  <span>{t('cart.total', language)}</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button onClick={handleCheckout} className="w-full" size="lg">
                {paymentMethod === 'online' ? t('cart.proceedToPayment', language) : t('cart.placeOrder', language)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
