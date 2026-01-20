import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/lib/i18n';
import { useAuthContext } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'guest' | 'buyer' | 'cook' | 'admin';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
  chefName: string;
  chefId: string;
  maxPortions: number;
}

interface AppContextType {
  // Settings
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Cart (local state, syncs to DB when authenticated)
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
  
  // UI
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthContext();
  
  const [language, setLanguage] = useState<Language>('ru');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Load settings from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('chefcook_language') as Language;
    if (savedLang && ['en', 'ru', 'kz'].includes(savedLang)) {
      setLanguage(savedLang);
    }
  }, []);

  // Load cart from DB when authenticated, or from localStorage when not
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCartFromDB();
    } else {
      const savedCart = localStorage.getItem('chefcook_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  }, [isAuthenticated, user]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('chefcook_language', language);
  }, [language]);

  // Save cart to localStorage (for guests)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('chefcook_cart', JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  const loadCartFromDB = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product_id,
        products (
          id,
          name,
          price,
          image_url,
          available_portions,
          chef_id
        )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const cartItems: CartItem[] = data.map((item: any) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.products?.price || 0,
          productName: item.products?.name || 'Unknown',
          productImage: item.products?.image_url || '',
          chefName: 'Chef',
          chefId: item.products?.chef_id || '',
          maxPortions: item.products?.available_portions || 10,
        }));
        setCart(cartItems);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      const savedCart = localStorage.getItem('chefcook_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  };

  const syncCartToDB = async (newCart: CartItem[]) => {
    if (!user) return;
    
    try {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      
      if (newCart.length > 0) {
        await supabase.from('cart_items').insert(
          newCart.map(item => ({
            user_id: user.id,
            product_id: item.productId,
            quantity: item.quantity,
          }))
        );
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      let newCart;
      if (existing) {
        newCart = prev.map(i => 
          i.productId === item.productId 
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, item.maxPortions) }
            : i
        );
      } else {
        newCart = [...prev, item];
      }
      
      if (isAuthenticated) {
        syncCartToDB(newCart);
      }
      
      return newCart;
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => {
      const newCart = prev.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      );
      
      if (isAuthenticated) {
        syncCartToDB(newCart);
      }
      
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(i => i.productId !== productId);
      
      if (isAuthenticated) {
        syncCartToDB(newCart);
      }
      
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (isAuthenticated && user) {
      supabase.from('cart_items').delete().eq('user_id', user.id);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value: AppContextType = {
    language,
    setLanguage,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartItemCount,
    isAuthModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
