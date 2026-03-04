import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";

const statusConfig = {
  pending: { label: 'Pendiente', icon: Clock },
  confirmed: { label: 'Confirmado', icon: CheckCircle },
  processing: { label: 'En proceso', icon: Package },
  shipped: { label: 'Enviado', icon: Truck },
  delivered: { label: 'Entregado', icon: CheckCircle },
  cancelled: { label: 'Cancelado', icon: XCircle },
};

const timelineSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

interface OrderTimelineProps {
  status: string;
}

export const OrderTimeline = ({ status }: OrderTimelineProps) => {
  if (status === 'cancelled' || status === 'delivered') return null;

  const currentStepIndex = timelineSteps.indexOf(status);

  return (
    <div className="mb-6 -mx-4 overflow-auto touch-pan-x">
      <div className="flex items-center justify-between gap-2 px-4">
        {timelineSteps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
              </div>
              <span className={`whitespace-nowrap text-xs mt-1 ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                {statusConfig[step as keyof typeof statusConfig]?.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
