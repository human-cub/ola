import { useEffect, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import * as amplitude from "@amplitude/analytics-browser";
import { Check, Copy, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { InstagramStoryShare } from "@/components/InstagramStoryShare";
import { formatPrice } from "@/lib/formatting";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_LINK = "https://alaola.com.ar/";

// ── Enlace de referido del usuario (los clics con ?ref= se trackean) ─────────
const fetchReferralLink = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("user_id", session.user.id)
    .maybeSingle();
  const code = (data as { referral_code?: string | null } | null)?.referral_code;
  return code ? `https://alaola.com.ar/?ref=${code}` : null;
};

export const useReferralLink = () =>
  useQuery({ queryKey: ["referral-link"], queryFn: fetchReferralLink, staleTime: 5 * 60_000 });

// ── Fuegos artificiales alrededor de la barra de progreso ────────────────────
const BURST_COLORS = ["#FFD400", "#FF8A00", "#33BBFF", "#22C55E", "#FF5478"];

const FireworkBurst = ({ left, delay }: { left: string; delay: number }) => (
  <span className="absolute top-1/2 pointer-events-none" style={{ left }}>
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 46 + (i % 3) * 16;
      return (
        <span
          key={i}
          className="ola-fw"
          style={
            {
              backgroundColor: BURST_COLORS[i % BURST_COLORS.length],
              "--dx": `${Math.cos(angle) * dist}px`,
              "--dy": `${Math.sin(angle) * dist}px`,
              animationDelay: `${delay + (i % 4) * 0.05}s`,
            } as CSSProperties
          }
        />
      );
    })}
  </span>
);

const Fireworks = () => (
  <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden>
    <FireworkBurst left="18%" delay={0} />
    <FireworkBurst left="50%" delay={0.25} />
    <FireworkBurst left="82%" delay={0.5} />
    <style>{`
      .ola-fw{position:absolute;width:9px;height:9px;border-radius:9999px;opacity:0;animation:ola-fw-burst 1.5s ease-out 2;}
      @keyframes ola-fw-burst{
        0%{transform:translate(-50%,-50%) scale(.4);opacity:1}
        70%{opacity:1}
        100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1);opacity:0}
      }
    `}</style>
  </div>
);

// ── Éxito: compra grupal ─────────────────────────────────────────────────────
interface GroupSuccessProps {
  productName: string;
  /** Recaudación de la marca ANTES de este pedido */
  prevCollected: number;
  target: number;
  /** Aporte de este pedido (precio garantizado x cantidad) */
  addedAmount: number;
}

export const GroupAddSuccess = ({
  productName,
  prevCollected,
  target,
  addedAmount,
}: GroupSuccessProps) => {
  const { data: refLink } = useReferralLink();
  const shareLink = refLink ?? FALLBACK_LINK;
  const shareText = `Ola! Compras Grupales. Registrate con mi enlace y conseguí el Súper-Precio en tu primer pedido ${shareLink}`;

  const newCollected = prevCollected + addedAmount;
  const prevPct = target > 0 ? Math.min(100, (prevCollected / target) * 100) : 0;
  const newPct = target > 0 ? Math.min(100, (newCollected / target) * 100) : 0;
  const goalJustReached = target > 0 && prevCollected < target && newCollected >= target;

  // La barra arranca en el nivel previo y se llena con el aporte agregado
  const [pct, setPct] = useState(prevPct);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    const fill = setTimeout(() => setPct(newPct), 350);
    const boom = goalJustReached
      ? setTimeout(() => setCelebrate(true), 1100)
      : undefined;
    return () => {
      clearTimeout(fill);
      if (boom) clearTimeout(boom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barStyle = {
    width: `${pct}%`,
    background:
      "linear-gradient(90deg, hsl(48 100% 60%), hsl(var(--group-buy-accent)), hsl(36 100% 50%))",
  } satisfies CSSProperties;

  return (
    <div className="flex flex-col items-center justify-center py-2 gap-3">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="w-7 h-7 text-green-600" />
      </div>
      <p className="text-lg font-bold text-center leading-tight">¡Ya estás en el grupo!</p>
      <p className="text-sm text-muted-foreground text-center -mt-1.5">
        Tu Precio Garantizado quedó asegurado.
      </p>

      {/* Barra de progreso del grupo (mismo estilo que el bloque de precios) */}
      {target > 0 && (
        <div className="w-full mt-1">
          <div className="relative">
            <div className="relative h-8 bg-muted rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                style={barStyle}
              />
              {celebrate ? (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white whitespace-nowrap">
                  ¡Meta alcanzada! 🎉
                </span>
              ) : (
                <span
                  className={`absolute top-0 bottom-0 flex items-center text-sm font-bold whitespace-nowrap transition-all duration-1000 ${
                    pct >= 40 ? "text-white -translate-x-full" : "text-foreground"
                  }`}
                  style={{ left: `calc(${pct}% ${pct >= 40 ? "- 8px" : "+ 8px"})` }}
                >
                  {formatPrice(Math.min(newCollected, target))}
                </span>
              )}
            </div>
            {celebrate && <Fireworks />}
          </div>
          <div className="flex justify-between items-center mt-1.5 px-1">
            <span
              className="text-xs font-bold"
              style={{ color: "hsl(var(--group-buy-accent))" }}
            >
              Tu aporte: +{formatPrice(addedAmount)}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              Meta: {formatPrice(target)}
            </span>
          </div>
          {celebrate && (
            <p
              className="text-sm font-bold text-center mt-2"
              style={{ color: "hsl(var(--group-buy-accent))" }}
            >
              ¡Felicitaciones! El grupo desbloqueó el Súper-Precio.
            </p>
          )}
        </div>
      )}

      {/* Compartir */}
      <div className="w-full bg-gradient-primary/10 rounded-xl p-4 border border-primary/20 mt-1">
        <p className="text-sm font-semibold text-primary text-center mb-4">
          Invitá a un amigo y los dos obtienen el Súper-Precio
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              amplitude.track("Referral Shared", { method: "native", source: "add_success" });
              if (navigator.share) {
                navigator.share({ text: shareText }).catch(() => {});
              } else {
                navigator.clipboard.writeText(shareText);
                toast.success("¡Texto copiado!");
              }
            }}
            className="w-full py-2.5"
          >
            <ShareIcon className="h-4 w-4" />
            <span>Compartir con amigos</span>
          </Button>

          <InstagramStoryShare refLink={shareLink} />

          <Button
            variant="outline"
            onClick={() => {
              amplitude.track("Whatsapp Opened", { source: "add_to_cart_success", product_name: productName });
              window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
            }}
            className="w-full py-2.5 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>Compartir por WhatsApp</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              amplitude.track("Referral Shared", { method: "copy_invitation", source: "add_success" });
              navigator.clipboard.writeText(shareText);
              toast.success("¡Invitación copiada!");
            }}
            className="w-full py-2.5"
          >
            <Copy className="h-4 w-4" />
            <span>Copiar invitación</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              amplitude.track("Referral Shared", { method: "copy_link", source: "add_success" });
              navigator.clipboard.writeText(shareLink);
              toast.success("¡Enlace copiado!");
            }}
            className="w-full py-2.5"
          >
            <Copy className="h-4 w-4" />
            <span>Copiar enlace</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Éxito: compra inmediata ──────────────────────────────────────────────────
interface CartSuccessProps {
  productName: string;
  productImage: string | null;
  flavor: string | null;
  size?: string | null;
  quantity: number;
  unitPrice: number;
  onGoToCart: () => void;
  onClose: () => void;
}

export const CartAddSuccess = ({
  productName,
  productImage,
  flavor,
  size = null,
  quantity,
  unitPrice,
  onGoToCart,
  onClose,
}: CartSuccessProps) => (
  <div className="flex flex-col items-center justify-center py-2 gap-3">
    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
      <Check className="w-7 h-7 text-green-600" />
    </div>
    <p className="text-lg font-bold text-center leading-tight">¡Agregado al carrito!</p>

    <div className="w-full flex gap-3 items-center bg-muted/60 rounded-xl border border-border p-3">
      {productImage && (
        <div className="w-14 h-14 bg-slate-50 rounded-lg border border-border overflow-hidden shrink-0">
          <img src={productImage} alt={productName} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{productName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[flavor, size, quantity > 1 ? `×${quantity}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <span className="font-bold text-base text-primary whitespace-nowrap">
        {formatPrice(unitPrice * quantity)}
      </span>
    </div>

    <div className="w-full space-y-2 mt-1">
      <button
        type="button"
        onClick={onGoToCart}
        className="w-full py-3.5 rounded-2xl font-bold text-white text-[16px] flex items-center justify-center gap-2 shadow-lg bg-gradient-primary transform transition active:scale-95"
      >
        <ShoppingCart className="w-5 h-5" />
        Ir al carrito
      </button>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-3 rounded-2xl font-semibold text-muted-foreground border-2 border-border bg-card hover:bg-muted transform transition active:scale-95"
      >
        Seguir comprando
      </button>
    </div>
  </div>
);
