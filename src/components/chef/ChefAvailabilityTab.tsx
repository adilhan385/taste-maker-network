import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Power, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Availability {
  id?: string;
  is_kitchen_open: boolean;
  working_days: string[];
  start_time: string;
  end_time: string;
}

export default function ChefAvailabilityTab() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Availability>({
    is_kitchen_open: true,
    working_days: dayOptions,
    start_time: '09:00',
    end_time: '21:00',
  });

  useEffect(() => {
    if (user) fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chef_availability')
        .select('*')
        .eq('chef_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAvailability({
          id: data.id,
          is_kitchen_open: data.is_kitchen_open,
          working_days: data.working_days || dayOptions,
          start_time: data.start_time?.slice(0, 5) || '09:00',
          end_time: data.end_time?.slice(0, 5) || '21:00',
        });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day],
    }));
  };

  const toggleKitchen = async () => {
    if (!user) return;

    const newStatus = !availability.is_kitchen_open;
    setAvailability(prev => ({ ...prev, is_kitchen_open: newStatus }));

    try {
      const { error } = await supabase
        .from('chef_availability')
        .upsert({
          chef_id: user.id,
          is_kitchen_open: newStatus,
          working_days: availability.working_days,
          start_time: availability.start_time,
          end_time: availability.end_time,
        }, { onConflict: 'chef_id' });

      if (error) throw error;
      toast({ title: newStatus ? 'Kitchen is now open!' : 'Kitchen is now closed' });
    } catch (error: any) {
      setAvailability(prev => ({ ...prev, is_kitchen_open: !newStatus }));
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const saveSchedule = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('chef_availability')
        .upsert({
          chef_id: user.id,
          is_kitchen_open: availability.is_kitchen_open,
          working_days: availability.working_days,
          start_time: availability.start_time,
          end_time: availability.end_time,
        }, { onConflict: 'chef_id' });

      if (error) throw error;
      toast({ title: 'Schedule saved!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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
      <h2 className="text-2xl font-serif font-bold">Availability & Schedule</h2>

      {/* Kitchen Status Toggle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={availability.is_kitchen_open ? 'border-green-500/50' : 'border-destructive/50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${availability.is_kitchen_open ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
                  <Power className={`w-8 h-8 ${availability.is_kitchen_open ? 'text-green-600' : 'text-destructive'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    Kitchen is {availability.is_kitchen_open ? 'Open' : 'Closed'}
                  </h3>
                  <p className="text-muted-foreground">
                    {availability.is_kitchen_open 
                      ? 'Customers can place orders' 
                      : 'Customers cannot place orders'}
                  </p>
                </div>
              </div>
              <Switch
                checked={availability.is_kitchen_open}
                onCheckedChange={toggleKitchen}
                className="scale-150"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Working Hours */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Working Hours
            </CardTitle>
            <CardDescription>Set your daily operating hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={availability.start_time}
                  onChange={e => setAvailability(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-32"
                />
              </div>
              <span className="text-muted-foreground pt-6">to</span>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={availability.end_time}
                  onChange={e => setAvailability(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Working Days */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Working Days
            </CardTitle>
            <CardDescription>Select the days you're available to cook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {dayOptions.map(day => (
                <Badge
                  key={day}
                  variant={availability.working_days.includes(day) ? 'default' : 'outline'}
                  className="cursor-pointer py-2 px-4 text-sm"
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-end">
        <Button variant="hero" onClick={saveSchedule} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Schedule
        </Button>
      </div>
    </div>
  );
}
