import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { GroupIcon } from "@/components/icons/GroupIcon";
import { Users, Share2, FileCheck, Truck, ShoppingCart, ClipboardCheck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const waitingListSteps = [
  {
    icon: Users,
    title: "Elegí tus productos",
    description: "Sumate al grupo de cada marca. Podés estar en varios a la vez y ya tenés el Precio Garantizado."
  },
  {
    icon: Share2,
    title: "Invitá y compartí",
    description: "El Súper-Precio se activa cuando los pedidos del grupo llegan a la meta. Cada persona que sumás acerca el mínimo para todos."
  },
  {
    icon: FileCheck,
    title: "El lunes conocés tu precio",
    description: "Si el grupo llegó a la meta, pagás el Súper-Precio; si no, te queda el Precio Garantizado. Después confirmás tu pedido."
  },
  {
    icon: Truck,
    title: "Coordinamos la entrega",
    description: "A domicilio o retiro, pagás al recibirlo. Gratis en CABA · GBA $3.000 · Interior $5.000 · gratis desde $100.000."
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
  icon?: ReactNode;
};

const SegmentedToggleButton = ({ isActive, onClick, label, icon }: SegmentedToggleButtonProps) => (
  <button
    onClick={onClick}
    style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}
    className={`w-1/2 py-2.5 px-4 sm:px-6 rounded-full sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap ${
      isActive
        ? 'bg-primary text-primary-foreground shadow-md'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {icon}
    {label}
  </button>
);

export const ProcessSteps = () => {
  const [isWaitingList, setIsWaitingList] = useState(true);

  const steps = isWaitingList ? waitingListSteps : buyNowSteps;

  return (
    <section className="py-8 bg-muted/30" id="how-it-works">
      <div className="container mx-auto">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            <Link to="/como-comprar" className="hover:opacity-80 transition-opacity">
              Cómo Comprar
            </Link>
          </h2>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-6"></div>

          {/* Segmented Toggle - centered in viewport, ignoring parent padding */}
          <div className="max-w-[640px] md:mx-auto -mx-2 sm:w-auto flex bg-muted rounded-full p-1 gap-1">
            <SegmentedToggleButton
              isActive={isWaitingList}
              onClick={() => setIsWaitingList(true)}
              label="Sumate al grupo"
              icon={<GroupIcon className="w-4 h-4 shrink-0" />}
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
              <div key={`${isWaitingList ? 'wait' : 'buy'}-${index}`} className="relative min-w-0 w-full h-full max-w-[360px]">
                {/* Step Block */}
                <div
                  className="relative h-full bg-background rounded-xl p-4 shadow-sm transition-all duration-300 border border-border/50 animate-fade-in lg:p-5"
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
