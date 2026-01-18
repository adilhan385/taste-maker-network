import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Currency } from '@/lib/i18n';

export type UserRole = 'guest' | 'buyer' | 'cook' | 'admin';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

interface CartItem {
  dishId: string;
  quantity: number;
  price: number;
}

interface AppContextType {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  
  // Settings
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  
  // UI
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Load settings from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('chefcook_language') as Language;
    const savedCurrency = localStorage.getItem('chefcook_currency') as Currency;
    const savedCart = localStorage.getItem('chefcook_cart');
    
    if (savedLang) setLanguage(savedLang);
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('chefcook_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('chefcook_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('chefcook_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.dishId === item.dishId);
      if (existing) {
        return prev.map(i => 
          i.dishId === item.dishId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (dishId: string) => {
    setCart(prev => prev.filter(i => i.dishId !== dishId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value: AppContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    language,
    setLanguage,
    currency,
    setCurrency,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
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
