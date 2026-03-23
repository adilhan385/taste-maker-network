import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Trash2, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  available_portions: number;
  is_available: boolean;
  image_url: string | null;
  chef_id: string;
  chef_name?: string;
  cuisine: string | null;
  created_at: string;
}

interface Props {
  searchQuery: string;
}

export default function AdminProductsTab({ searchQuery }: Props) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const chefIds = [...new Set((data || []).map(p => p.chef_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', chefIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      setProducts((data || []).map(p => ({
        ...p,
        chef_name: profileMap.get(p.chef_id) || 'Unknown',
      })));
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить продукты', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast({ title: 'Блюдо удалено', description: deleteTarget.name });
      setDeleteTarget(null);
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.chef_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) || false
  );

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Badge variant="secondary">{products.length} блюд</Badge>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Продукты не найдены</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-4 shadow-card flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Image className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">Повар: {p.chef_name} • {p.price} ₸</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{p.available_portions} порций</Badge>
                  {p.cuisine && <Badge variant="secondary">{p.cuisine}</Badge>}
                  {!p.is_available && <Badge variant="destructive">Недоступно</Badge>}
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(p)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить блюдо</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Вы уверены, что хотите удалить "{deleteTarget?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
