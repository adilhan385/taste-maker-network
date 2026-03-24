import { ReactNode } from 'react';
import Navbar from './Navbar';
import AuthModal from '@/components/auth/AuthModal';
import { usePresence } from '@/hooks/usePresence';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  usePresence();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <AuthModal />
    </div>
  );
}
