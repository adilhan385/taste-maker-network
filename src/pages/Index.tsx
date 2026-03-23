import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedDishes from '@/components/home/FeaturedDishes';
import HowItWorks from '@/components/home/HowItWorks';
import BecomeChefCTA from '@/components/home/BecomeChefCTA';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Index() {
  const { profile, isAuthenticated } = useAuthContext();
  const showChefCTA = !isAuthenticated || profile?.role === 'buyer';

  return (
    <Layout>
      <HeroSection />
      <FeaturedDishes />
      <HowItWorks />
      {showChefCTA && <BecomeChefCTA />}
      <Footer />
    </Layout>
  );
}
