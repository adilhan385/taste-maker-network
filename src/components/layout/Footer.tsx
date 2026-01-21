import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function Footer() {
  const { language } = useApp();

  return (
    <footer className="bg-foreground text-background/80 py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold text-background">ChefCook</span>
          </Link>
          <p className="text-sm text-background/60 text-center max-w-md">
            Connecting food lovers with talented home cooks for authentic, 
            delicious meals made with love.
          </p>
        </div>

        <div className="border-t border-background/10 pt-8 text-center text-sm text-background/50">
          <p>&copy; {new Date().getFullYear()} ChefCook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
