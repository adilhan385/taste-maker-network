import { Clock, CheckCircle, ChefHat, Package, Truck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

type OrderStatus = 'pending' | 'accepted' | 'cooking' | 'ready' | 'delivered' | 'cancelled';

interface OrderProgressTrackerProps {
  status: OrderStatus;
  compact?: boolean;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500' },
  accepted: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500' },
  cooking: { icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500' },
  ready: { icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  delivered: { icon: Truck, color: 'text-green-600', bg: 'bg-green-600' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500' },
};

const statusOrder: OrderStatus[] = ['pending', 'accepted', 'cooking', 'ready', 'delivered'];

export default function OrderProgressTracker({ status, compact = false }: OrderProgressTrackerProps) {
  const { language } = useApp();
  
  if (status === 'cancelled') {
    const config = statusConfig.cancelled;
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-2">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', config.bg)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className={cn('font-medium', config.color)}>
          {t('orders.status.cancelled', language)}
        </span>
      </div>
    );
  }

  const currentIndex = statusOrder.indexOf(status);

  if (compact) {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-2">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', config.bg)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className={cn('font-medium', config.color)}>
          {t(`orders.status.${status}`, language)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (statusOrder.length - 1)) * 100}%` }}
          />
        </div>
        
        {statusOrder.map((s, index) => {
          const config = statusConfig[s];
          const Icon = config.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={s} className="flex flex-col items-center z-10">
              <div 
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                  isCompleted || isCurrent ? config.bg : 'bg-muted',
                  isCurrent && 'ring-4 ring-primary/20 scale-110'
                )}
              >
                <Icon className={cn(
                  'w-4 h-4 transition-colors',
                  isCompleted || isCurrent ? 'text-white' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'text-xs mt-2 text-center max-w-[60px]',
                isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
              )}>
                {t(`orders.status.${s}`, language)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
