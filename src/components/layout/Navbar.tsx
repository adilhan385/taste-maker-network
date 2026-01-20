import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingCart, User, ChefHat, MessageCircle, Bell, Settings, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import LanguageCurrencySelector from './LanguageCurrencySelector';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, language, setAuthModalOpen, setAuthModalMode, cartItemCount } = useApp();
  const { profile, isAuthenticated, signOut } = useAuthContext();
  const location = useLocation();
  
  // Role-based cart visibility - hide for admin
  const showCart = !profile || profile.role !== 'admin';

  const handleLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const NavLinks = () => {
    if (!profile) {
      return (
        <>
          <Link 
            to="/catalog" 
            className="text-foreground/80 hover:text-foreground transition-colors font-medium"
          >
            {t('nav.catalog', language)}
          </Link>
        </>
      );
    }

    if (profile.role === 'cook') {
      return (
        <>
          <Link to="/chef-dashboard" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
            {t('nav.myDishes', language)}
          </Link>
          <Link to="/orders" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
            {t('nav.orders', language)}
          </Link>
          <Link to="/chat" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
            {t('nav.chat', language)}
          </Link>
        </>
      );
    }

    return (
      <>
        <Link to="/catalog" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
          {t('nav.catalog', language)}
        </Link>
        <Link to="/orders" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
          {t('nav.orders', language)}
        </Link>
        <Link to="/chat" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
          {t('nav.chat', language)}
        </Link>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-bold text-foreground">ChefCook</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLinks />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <LanguageCurrencySelector />

          {/* Cart - visible for guests and buyers, hidden for admin */}
          {showCart && (
            <Link to="/cart" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Link>
          )}

          {isAuthenticated && profile && (
            <>
              {/* Become a Chef - for buyers only */}
              {profile.role === 'buyer' && (
                <Link to="/become-chef">
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    <ChefHat className="w-4 h-4" />
                    {t('nav.becomeChef', language)}
                  </Button>
                </Link>
              )}

              {/* Notifications */}
              <Link to="/notifications" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </Link>
            </>
          )}

          {/* User Menu / Auth Buttons */}
          {isAuthenticated && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{profile.fullName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('nav.profile', language)}
                  </Link>
                </DropdownMenuItem>
                {profile.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {t('nav.adminPanel', language)}
                    </Link>
                  </DropdownMenuItem>
                )}
                {profile.role === 'cook' && (
                  <DropdownMenuItem asChild>
                    <Link to="/chef-dashboard" className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4" />
                      Chef Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {t('nav.settings', language)}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('nav.logout', language)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleLogin}>
                {t('nav.login', language)}
              </Button>
              <Button variant="default" size="sm" onClick={handleRegister}>
                {t('nav.register', language)}
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <NavLinks />
              {profile?.role === 'buyer' && (
                <Link to="/become-chef" className="flex items-center gap-2 text-primary font-medium">
                  <ChefHat className="w-4 h-4" />
                  {t('nav.becomeChef', language)}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
