import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Package, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { t, formatPrice } from '@/lib/i18n';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  cuisine: string | null;
  dietary: string[] | null;
  prep_time: number | null;
  available_portions: number;
  is_available: boolean;
  allergens: string[] | null;
  portion_size: string | null;
  ingredients: string[] | null;
  available_days: string[] | null;
}

const cuisineOptions = ['Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'French', 'Thai', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Spanish', 'Middle Eastern', 'Other'];
// Dietary options removed
const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ChefDishesTab() {
  const { user } = useAuthContext();
  const { language } = useApp();
  const { toast } = useToast();
  const [dishes, setDishes] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cuisine: '',
    dietary: [] as string[],
    prep_time: '',
    available_portions: '10',
    allergens: '',
    portion_size: '',
    ingredients: '',
    available_days: dayOptions as string[],
  });

  useEffect(() => {
    if (user) fetchDishes();
  }, [user]);

  const fetchDishes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('chef_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDishes(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cuisine: '',
      dietary: [],
      prep_time: '',
      available_portions: '10',
      allergens: '',
      portion_size: '',
      ingredients: '',
      available_days: dayOptions,
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingDish(null);
  };

  const openEditDialog = (dish: Product) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || '',
      price: dish.price.toString(),
      cuisine: dish.cuisine || '',
      dietary: dish.dietary || [],
      prep_time: dish.prep_time?.toString() || '',
      available_portions: dish.available_portions.toString(),
      allergens: dish.allergens?.join(', ') || '',
      portion_size: dish.portion_size || '',
      ingredients: dish.ingredients?.join(', ') || '',
      available_days: dish.available_days || dayOptions,
    });
    setImagePreview(dish.image_url);
    setDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!formData.name || !formData.price) {
      toast({ title: 'Error', description: 'Name and price are required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = editingDish?.image_url || null;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        chef_id: user.id,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cuisine: formData.cuisine || null,
        dietary: formData.dietary.length > 0 ? formData.dietary : null,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
        available_portions: parseInt(formData.available_portions) || 10,
        image_url: imageUrl,
        allergens: formData.allergens ? formData.allergens.split(',').map(s => s.trim()).filter(Boolean) : null,
        portion_size: formData.portion_size || null,
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(s => s.trim()).filter(Boolean) : null,
        available_days: formData.available_days,
      };

      if (editingDish) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingDish.id);
        if (error) throw error;
        toast({ title: 'Dish updated successfully!' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
        toast({ title: 'Dish created successfully!' });
      }

      setDialogOpen(false);
      resetForm();
      fetchDishes();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (dish: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !dish.is_available })
        .eq('id', dish.id);
      if (error) throw error;
      fetchDishes();
      toast({ title: dish.is_available ? 'Dish paused' : 'Dish activated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteDish = async (dish: Product) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', dish.id);
      if (error) throw error;
      fetchDishes();
      toast({ title: 'Dish deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const toggleDietary = (option: string) => {
    setFormData(prev => ({
      ...prev,
      dietary: prev.dietary.includes(option) 
        ? prev.dietary.filter(d => d !== option)
        : [...prev.dietary, option]
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold">{t('chef.myDishes', language)}</h2>
        <Button variant="hero" onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('chef.addDish', language)}
        </Button>
      </div>

      {dishes.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 shadow-card text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{t('chef.noDishes', language)}</p>
          <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(true); }}>
            {t('chef.addFirst', language)}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {dishes.map(dish => (
              <motion.div
                key={dish.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-2xl overflow-hidden shadow-card"
              >
                <div className="aspect-video bg-muted relative">
                  {dish.image_url ? (
                    <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                      {!dish.is_available && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="secondary">{t('chef.paused', language)}</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{dish.name}</h3>
                    <span className="text-primary font-bold">{formatPrice(dish.price)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{dish.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    {dish.cuisine && <Badge variant="outline">{dish.cuisine}</Badge>}
                    <span className="text-xs text-muted-foreground">{dish.available_portions} portions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(dish)} className="flex-1 gap-1">
                      <Edit2 className="w-3 h-3" />
                      {t('chef.edit', language)}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAvailability(dish)}>
                      {dish.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteDish(dish)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle>{editingDish ? t('chef.editDish', language) : t('chef.addDish', language)}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('chef.dishPhoto', language)}</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">{t('chef.upload', language)}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('chef.dishName', language)} *</Label>
                <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder={t('chef.dishNamePlaceholder', language)} />
              </div>
              <div className="space-y-2">
                <Label>{t('chef.price', language)} *</Label>
                <Input type="number" step="1" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder={t('chef.pricePlaceholder', language)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('chef.description', language)}</Label>
              <Textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder={t('chef.descriptionPlaceholder', language)} rows={3} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('chef.cuisine', language)}</Label>
                <Select value={formData.cuisine} onValueChange={v => setFormData(prev => ({ ...prev, cuisine: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('chef.cuisineSelect', language)} /></SelectTrigger>
                  <SelectContent>
                    {cuisineOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('chef.prepTime', language)}</Label>
                <Input type="number" value={formData.prep_time} onChange={e => setFormData(prev => ({ ...prev, prep_time: e.target.value }))} placeholder="30" />
              </div>
              <div className="space-y-2">
                <Label>{t('chef.portions', language)}</Label>
                <Input type="number" value={formData.available_portions} onChange={e => setFormData(prev => ({ ...prev, available_portions: e.target.value }))} placeholder="10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('chef.portionSize', language)}</Label>
              <Input value={formData.portion_size} onChange={e => setFormData(prev => ({ ...prev, portion_size: e.target.value }))} placeholder={t('chef.portionSizePlaceholder', language)} />
            </div>

            <div className="space-y-2">
              <Label>{t('chef.ingredients', language)}</Label>
              <Input value={formData.ingredients} onChange={e => setFormData(prev => ({ ...prev, ingredients: e.target.value }))} placeholder={t('chef.ingredientsPlaceholder', language)} />
            </div>

            <div className="space-y-2">
              <Label>{t('chef.allergens', language)}</Label>
              <Input value={formData.allergens} onChange={e => setFormData(prev => ({ ...prev, allergens: e.target.value }))} placeholder={t('chef.allergensPlaceholder', language)} />
            </div>

            <div className="space-y-2">
              <Label>{t('chef.dietaryOptions', language)}</Label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map(option => (
                  <Badge 
                    key={option} 
                    variant={formData.dietary.includes(option) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDietary(option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('chef.availableDays', language)}</Label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map(day => (
                  <Badge
                    key={day}
                    variant={formData.available_days.includes(day) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingDish ? 'Update Dish' : 'Create Dish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
