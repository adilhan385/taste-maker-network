import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, Banknote, ArrowLeft, Truck, Store, Wallet, Smartphone, Upload, ImageIcon } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatPrice, t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type PaymentMethod = 'kaspi' | 'cash' | 'wallet';

export default function Cart() {
  const { cart, language, updateCartQuantity, removeFromCart, cartTotal, setAuthModalOpen, setAuthModalMode, clearCart } = useApp();
  const { isAuthenticated, profile } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('kaspi');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [chefKaspiPhone, setChefKaspiPhone] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchWallet = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('wallets').select('id, balance').eq('user_id', user.id).maybeSingle();
      if (data) { setWalletId(data.id); setWalletBalance(Number(data.balance)); }
    };
    fetchWallet();
  }, [isAuthenticated]);

  useEffect(() => {
    if (cart.length === 0) return;
    const chefId = cart[0]?.chefId;
    if (!chefId) return;
    const fetchKaspiPhone = async () => {
      // First check profiles for kaspi_phone
      const { data: profileData } = await supabase
        .from('profiles')
        .select('kaspi_phone, phone')
        .eq('user_id', chefId)
        .maybeSingle();
      
      if (profileData?.kaspi_phone) {
        setChefKaspiPhone(profileData.kaspi_phone);
        return;
      }

      // Fallback to chef_applications
      const { data } = await supabase
        .from('chef_applications')
        .select('kaspi_phone, phone')
        .eq('user_id', chefId)
        .eq('status', 'approved')
        .maybeSingle();
      if (data) setChefKaspiPhone(data.kaspi_phone || data.phone);
    };
    fetchKaspiPhone();
  }, [cart]);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  if (profile?.role === 'admin') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('cart.adminAccount', language)}</h2>
            <p className="text-muted-foreground mb-6">{t('cart.adminCantOrder', language)}</p>
            <Button asChild><Link to="/admin">{t('cart.goToAdmin', language)}</Link></Button>
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
            <Button onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>{t('auth.logIn', language)}</Button>
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
            <Button asChild><Link to="/catalog">{t('cart.browseDishes', language)}</Link></Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const handleQuantityUpdate = (productId: string, delta: number, currentQty: number, maxPortions: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) { removeFromCart(productId); toast({ title: t('cart.itemRemoved', language) }); }
    else if (newQty > maxPortions) { toast({ title: t('cart.notEnoughPortions', language), variant: 'destructive' }); }
    else { updateCartQuantity(productId, newQty); }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeFromCart(productId);
    toast({ title: t('cart.itemRemoved', language), description: `${productName} ${t('cart.itemRemovedDesc', language)}` });
  };

  const deliveryFee = deliveryOption === 'delivery' ? 500 : 0;
  const serviceFee = Math.round(cartTotal * 0.05);
  const totalPrice = cartTotal + deliveryFee + serviceFee;
  const insufficientBalance = paymentMethod === 'wallet' && walletBalance < totalPrice;

  const handleCheckout = async () => {
    if (paymentMethod === 'wallet' && walletBalance < totalPrice) {
      toast({ title: t('cart.insufficientBalance', language), variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'kaspi' && !receiptFile) {
      toast({ title: t('cart.receiptRequired', language), variant: 'destructive' });
      return;
    }

    if (deliveryOption === 'delivery' && !deliveryAddress.trim()) {
      toast({ title: t('payment.streetRequired', language), variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload receipt if kaspi
      let receiptUrl: string | null = null;
      if (paymentMethod === 'kaspi' && receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('payment-receipts').upload(fileName, receiptFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('payment-receipts').getPublicUrl(fileName);
        receiptUrl = publicUrl;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          chef_id: cart[0]?.chefId || null,
          total_amount: totalPrice,
          status: 'pending',
          payment_method: paymentMethod,
          delivery_type: deliveryOption,
          delivery_address: deliveryOption === 'delivery' ? `${deliveryAddress}${deliveryNotes ? ` (${deliveryNotes})` : ''}` : null,
          payment_receipt_url: receiptUrl,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // If wallet payment, deduct balance
      if (paymentMethod === 'wallet' && walletId) {
        const newBalance = walletBalance - totalPrice;
        const { error: walletError } = await supabase.from('wallets').update({ balance: newBalance }).eq('id', walletId);
        if (walletError) throw walletError;
        await supabase.from('wallet_transactions').insert({
          wallet_id: walletId, type: 'payment', amount: totalPrice,
          description: `Order #${order.id.slice(0, 8)}`, order_id: order.id,
        });
      }

      // Update available portions
      for (const item of cart) {
        const { data: product } = await supabase.from('products').select('available_portions, chef_id, name').eq('id', item.productId).single();
        if (product) {
          const newPortions = Math.max(0, product.available_portions - item.quantity);
          await supabase.from('products').update({ available_portions: newPortions, is_available: newPortions > 0 }).eq('id', item.productId);
          if (newPortions === 0) {
            await supabase.from('notifications').insert({
              user_id: product.chef_id, type: 'product_sold_out',
              title: 'Product sold out', message: `${product.name} is sold out`, related_id: item.productId
            });
          }
        }
      }

      // Notify chef
      const chefId = cart[0]?.chefId;
      if (chefId && order) {
        await supabase.from('notifications').insert({
          user_id: chefId, type: 'new_order',
          title: 'New order!', message: `New order for ${formatPrice(totalPrice)}`, related_id: order.id,
        });
      }

      toast({ title: t('cart.orderPlaced', language), description: t('cart.orderPlacedDesc', language) });
      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ title: t('common.error', language), variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/catalog"><ArrowLeft className="w-4 h-4 mr-2" />{t('cart.backToCatalog', language)}</Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">{t('cart.title', language)}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-lg mb-4">{t('cart.yourItems', language)} ({cart.length})</h2>
            
            {cart.map(item => (
              <motion.div key={item.productId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl p-4 shadow-card flex gap-3 sm:gap-4">
                <img src={item.productImage || '/placeholder.svg'} alt={item.productName} className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">{item.productName}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{t('cart.by', language)} {item.chefName}</p>
                  <p className="text-sm text-muted-foreground mb-3">{formatPrice(item.price)} {t('cart.perPortion', language)}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleQuantityUpdate(item.productId, -1, item.quantity, item.maxPortions)} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"><Minus className="w-4 h-4" /></button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button onClick={() => handleQuantityUpdate(item.productId, 1, item.quantity, item.maxPortions)} disabled={item.quantity >= item.maxPortions} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><Plus className="w-4 h-4" /></button>
                      <span className="text-xs text-muted-foreground">({t('cart.max', language)} {item.maxPortions})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">{formatPrice(item.price * item.quantity)}</span>
                      <button onClick={() => handleRemoveItem(item.productId, item.productName)} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {deliveryOption === 'delivery' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 shadow-card space-y-4">
                <h2 className="font-semibold text-lg">{t('payment.deliveryAddress', language)}</h2>
                <div>
                  <Label>{t('payment.street', language)} *</Label>
                  <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder={t('payment.streetPlaceholder', language)} className="mt-1" />
                </div>
                <div>
                  <Label>{t('payment.notes', language)}</Label>
                  <Textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} placeholder={t('payment.notesPlaceholder', language)} className="mt-1" rows={2} />
                </div>
              </motion.div>
            )}

            {paymentMethod === 'kaspi' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 shadow-card space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">{t('cart.kaspiTransfer', language)}</h2>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">{t('cart.kaspiInstruction', language)}</p>
                  <p className="text-2xl font-bold font-mono">{chefKaspiPhone || t('cart.kaspiNotAvailable', language)}</p>
                  <p className="text-lg font-semibold text-primary">{formatPrice(totalPrice)}</p>
                </div>

                {/* Receipt upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {t('cart.uploadReceipt', language)} *
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {receiptPreview ? (
                      <div className="space-y-2">
                        <img src={receiptPreview} alt="Receipt" className="max-h-48 mx-auto rounded-lg" />
                        <Button variant="outline" size="sm" onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}>
                          {t('common.delete', language)}
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t('cart.uploadReceiptHint', language)}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleReceiptChange} />
                      </label>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
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
                      <Truck className="w-4 h-4" /><span>{t('cart.delivery', language)}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{formatPrice(500)}</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Store className="w-4 h-4" /><span>{t('cart.pickup', language)}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{t('cart.free', language)}</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('cart.paymentMethod', language)}</h3>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="kaspi" id="kaspi" />
                    <Label htmlFor="kaspi" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /><span>{t('cart.payByKaspi', language)}</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Wallet className="w-4 h-4" /><span>{t('cart.payByWallet', language)}</span>
                      <span className={`ml-auto text-sm ${insufficientBalance ? 'text-destructive' : 'text-muted-foreground'}`}>{formatPrice(walletBalance)}</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Banknote className="w-4 h-4" /><span>{t('cart.payCash', language)}</span>
                    </Label>
                  </div>
                </RadioGroup>
                {paymentMethod === 'wallet' && insufficientBalance && (
                  <p className="text-sm text-destructive">{t('cart.insufficientBalance', language)}</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span>{t('cart.subtotal', language)}</span><span>{formatPrice(cartTotal)}</span></div>
                <div className="flex justify-between text-sm"><span>{t('cart.deliveryFee', language)}</span><span>{deliveryOption === 'delivery' ? formatPrice(deliveryFee) : t('cart.free', language)}</span></div>
                <div className="flex justify-between text-sm"><span>{t('cart.serviceFee', language)}</span><span>{formatPrice(serviceFee)}</span></div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2"><span>{t('cart.total', language)}</span><span className="text-primary">{formatPrice(totalPrice)}</span></div>
              </div>

              <Button 
                onClick={handleCheckout} className="w-full" size="lg"
                disabled={processing || insufficientBalance || (paymentMethod === 'kaspi' && !receiptFile)}
              >
                {processing ? t('common.loading', language) : paymentMethod === 'wallet' ? t('cart.payFromWallet', language) : t('cart.placeOrder', language)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
