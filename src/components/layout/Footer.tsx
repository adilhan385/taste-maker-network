import { Link } from 'react-router-dom';
import { ChefHat, Instagram, Facebook, Twitter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function Footer() {
  const { language } = useApp();

  return (
    <footer className="bg-foreground text-background/80 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-bold text-background">ChefCook</span>
            </Link>
            <p className="text-sm text-background/60 mb-6">
              Connecting food lovers with talented home cooks for authentic, 
              delicious meals made with love.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">For Buyers</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/catalog" className="hover:text-background transition-colors">Browse Dishes</Link></li>
              <li><Link to="/how-it-works" className="hover:text-background transition-colors">How It Works</Link></li>
              <li><Link to="/faq" className="hover:text-background transition-colors">FAQ</Link></li>
              <li><Link to="/support" className="hover:text-background transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">For Cooks</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/become-chef" className="hover:text-background transition-colors">Become a Chef</Link></li>
              <li><Link to="/chef-resources" className="hover:text-background transition-colors">Resources</Link></li>
              <li><Link to="/pricing" className="hover:text-background transition-colors">Pricing</Link></li>
              <li><Link to="/success-stories" className="hover:text-background transition-colors">Success Stories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-background transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-background transition-colors">Careers</Link></li>
              <li><Link to="/privacy" className="hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-background transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 text-center text-sm text-background/50">
          <p>&copy; {new Date().getFullYear()} ChefCook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
