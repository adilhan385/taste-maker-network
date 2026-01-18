import { motion } from 'framer-motion';
import { ChefHat, ShieldCheck, Truck, Heart } from 'lucide-react';

const features = [
  {
    icon: ChefHat,
    title: 'Verified Home Cooks',
    description: 'Every chef is verified with proper documentation and kitchen inspections',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Guaranteed',
    description: 'Fresh ingredients, proper hygiene, and your satisfaction guaranteed',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Hot meals delivered to your door within 30-60 minutes',
  },
  {
    icon: Heart,
    title: 'Made with Love',
    description: 'Authentic family recipes passed down through generations',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
            Why Choose ChefCook?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We connect you with talented home cooks in your neighborhood for authentic, 
            delicious meals made with love and care
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
