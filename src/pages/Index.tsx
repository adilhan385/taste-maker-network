import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedDishes from '@/components/home/FeaturedDishes';
import HowItWorks from '@/components/home/HowItWorks';
import BecomeChefCTA from '@/components/home/BecomeChefCTA';

export default function Index() {
  return (
    <Layout>
      <HeroSection />
      <FeaturedDishes />
      <HowItWorks />
      <BecomeChefCTA />
      <Footer />
    </Layout>
  );
}
