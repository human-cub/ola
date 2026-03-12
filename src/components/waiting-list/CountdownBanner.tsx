import { Clock, AlertTriangle } from "lucide-react";

interface CountdownBannerProps {
  isCollectionEnded: boolean;
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
}

export const CountdownBanner = ({ isCollectionEnded, timeLeft }: CountdownBannerProps) => {
  if (isCollectionEnded) {
    return (
      <div className="mb-6 bg-amber-500 text-white rounded-xl p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">¡Compra colectiva cerrada!</span>
        </div>
        <p className="text-center text-sm opacity-90 mb-2">
          Tenés hasta el domingo para confirmar tu pedido
        </p>
        <div className="flex justify-center gap-3 text-center text-sm">
          <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m restantes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-gradient-primary text-white rounded-xl p-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Clock className="w-5 h-5" />
        <span className="font-medium">Cierre en:</span>
      </div>
      <div className="flex justify-center gap-4 text-center">
        <div>
          <div className="text-3xl font-bold">{timeLeft.days}</div>
          <div className="text-xs opacity-80">días</div>
        </div>
        <div className="text-3xl font-bold">:</div>
        <div>
          <div className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs opacity-80">horas</div>
        </div>
        <div className="text-3xl font-bold">:</div>
        <div>
          <div className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs opacity-80">min</div>
        </div>
        <div className="text-3xl font-bold">:</div>
        <div>
          <div className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs opacity-80">seg</div>
        </div>
      </div>
      <p className="text-center text-sm mt-2 opacity-90">
        El pedido se cerrará el domingo a las 23:59
      </p>
    </div>
  );
};
