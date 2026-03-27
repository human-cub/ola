import { useState, useRef } from "react";
import { Users, ShoppingCart, Calculator, FileCheck, Truck, CreditCard, Package, ClipboardCheck, Play } from "lucide-react";
import videoCover from "@/assets/video-cover.png";
import { cn } from "@/lib/utils";

const waitingListSteps = [
  {
    icon: Users,
    title: "Te sumás a la compra de los productos",
    description: "Sumáte en la lista de espera de lunes a domingo (sin compromiso)"
  },
  {
    icon: Calculator,
    title: "Al final de la semana vemos cuántos se sumaron",
    description: "Calculamos el descuento según cuántas personas se sumaron a cada producto"
  },
  {
    icon: FileCheck,
    title: "El lunes confirmás tu pedido",
    description: "Chequeás los precios finales y confirmás tu pedido en la lista de espera"
  },
  {
    icon: Truck,
    title: "Envío el mismo día después de confirmar o retirás vos cuando quieras",
    description: "Envío gratis en CABA (GBA $3.000 • Interior $5.000 • Gratis en todo el país desde $100.000)"
  },
  {
    icon: CreditCard,
    title: "Revisás y pagás al recibirlo",
    description: "Sin riesgos: revisás los productos y pagás en el momento en efectivo o transferencia"
  }
];

const buyNowSteps = [
  {
    icon: ShoppingCart,
    title: "Elegís tus productos favoritos y hacés clic en \"Comprar ahora\"",
    description: "Compra directa, sin espera"
  },
  {
    icon: ClipboardCheck,
    title: "Completás el pedido en el carrito",
    description: "Sin prepago"
  },
  {
    icon: Truck,
    title: "Te lo llevamos o lo retirás vos",
    description: "Envío gratis en CABA (GBA $3.000 • Interior $5.000\n• Gratis en todo el país desde $100.000)",
    subtitle: "Pedidos antes de las 14:00 hs: entrega el mismo día en CABA y GBA"
  },
  {
    icon: CreditCard,
    title: "Revisás y pagás al recibirlo",
    description: "Sin riesgos: revisás el producto y pagás en el momento en efectivo o transferencia"
  }
];

type SegmentedToggleButtonProps = {
  isActive: boolean;
  onClick: () => void;
  label: string;
};

const SegmentedToggleButton = ({ isActive, onClick, label }: SegmentedToggleButtonProps) => (
  <button
    onClick={onClick}
    style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}
    className={`w-1/2 py-2.5 px-4 sm:px-6 rounded-full sm:text-sm font-medium transition-all duration-300 flex items-center justify-center whitespace-nowrap ${
      isActive
        ? 'bg-primary text-primary-foreground shadow-md'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {label}
  </button>
);

const VideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
      showControlsTemporarily();
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    video.currentTime = (x / rect.width) * video.duration;
  };

  const skip = (seconds: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    showControlsTemporarily();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    showControlsTemporarily();
  };

  return (
    <div
      className="relative max-w-md md:max-w-xs mx-auto mb-6 rounded-2xl overflow-hidden cursor-pointer group"
      onClick={handlePlayPause}
    >
      <video
        ref={videoRef}
        src="https://gl71nzm2l7iaribb.public.blob.vercel-storage.com/ola_optimized.mp4"
        playsInline
        preload="none"
        className="w-full rounded-2xl"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
      />

      {/* Cover overlay */}
      {!isPlaying && progress === 0 && (
        <>
          <div
            className="absolute inset-0 rounded-2xl bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${videoCover})`, backgroundPosition: '50% 35%' }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        </>
      )}

      {/* Paused overlay (after started) */}
      {!isPlaying && progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg" onClick={handlePlayPause}>
            <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      {(isPlaying || progress > 0) && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-4 pt-10 transition-opacity duration-300",
            (showControls || !isPlaying) ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div className="w-full h-2.5 bg-white/30 rounded-full mb-4 cursor-pointer" onClick={handleProgressClick}>
            <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>

          {/* Buttons */}
          <div className="flex items-center">
            <div className="flex-1" />
            <div className="flex items-center gap-8">
              <button onClick={skip(-5)} className="text-white/90 hover:text-white transition-colors">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  <text x="12" y="15.5" fontSize="7.5" textAnchor="middle" fontWeight="bold" fontFamily="Arial">5</text>
                </svg>
              </button>

              <button onClick={(e) => { e.stopPropagation(); handlePlayPause(); }} className="text-white/90 hover:text-white transition-colors">
                {isPlaying ? (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <Play className="w-8 h-8" fill="currentColor" />
                )}
              </button>

              <button onClick={skip(5)} className="text-white/90 hover:text-white transition-colors">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                  <text x="12" y="15.5" fontSize="7.5" textAnchor="middle" fontWeight="bold" fontFamily="Arial">5</text>
                </svg>
              </button>
            </div>
            <div className="flex-1 flex justify-end">
              <button onClick={toggleMute} className="text-white/90 hover:text-white transition-colors">
                {isMuted ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProcessSteps = () => {
  const [isWaitingList, setIsWaitingList] = useState(true);
  
  const steps = isWaitingList ? waitingListSteps : buyNowSteps;

  return (
    <section className="py-8 bg-muted/30" id="how-it-works">
      <div className="container mx-auto">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Cómo Funciona?
          </h2>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-6"></div>

          {/* Video Player */}
          <VideoPlayer />

          
          {/* Segmented Toggle - centered in viewport, ignoring parent padding */}
          <div className="max-w-[640px] md:mx-auto -mx-2 sm:w-auto flex bg-muted rounded-full p-1 gap-1">
            <SegmentedToggleButton
              isActive={isWaitingList}
              onClick={() => setIsWaitingList(true)}
              label="Esperar y pagar menos"
            />
            <SegmentedToggleButton
              isActive={!isWaitingList}
              onClick={() => setIsWaitingList(false)}
              label="Comprar ahora"
            />
          </div>
        </div>
        
        <div
          className={cn(
            "relative mx-auto flex max-w-md flex-col gap-6 items-center",
            "md:grid md:max-w-none md:grid-cols-2 md:gap-8 md:px-6 md:w-fit",
            "lg:px-[88px]",
            "xl:grid-cols-3"
          )}
        >
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <div key={`${isWaitingList ? 'wait' : 'buy'}-${index}`} className="relative min-w-0 w-full h-full max-w-[360px] /*mx-auto">
                {/* Step Block */}
                 <div
                   className="relative h-full bg-background rounded-xl p-4 shadow-sm transition-all duration-300 border border-border/50 animate-fade-in /*mx-6 lg:mx-0 lg:p-5"
                   style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                 >
                   {/* Step Number */}
                   <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                     {index + 1}
                   </div>
                   
                   {/* Icon */}
                   <div className="mb-3 flex justify-center">
                     <div className="bg-gradient-primary/10 rounded-full flex items-center justify-center">
                       <IconComponent className="size-14 my-4 text-primary" />
                     </div>
                   </div>
                   
                     <h3 className="text-lg font-semibold text-foreground mb-2 text-center leading-[1.15] text-balance">
                       {step.title}
                       {'subtitle' in step && step.subtitle && (
                         <span className="block text-sm font-normal text-muted-foreground mt-1">
                           {step.subtitle as string}
                         </span>
                       )}
                     </h3>
                    <p className="text-muted-foreground text-center text-sm leading-relaxed whitespace-pre-line">
                      {step.description}
                    </p>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
