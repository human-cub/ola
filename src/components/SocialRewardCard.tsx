import { useState } from "react";
import { toast } from "sonner";
import { Instagram, ExternalLink, BadgePercent, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSocialReward } from "@/hooks/useSocialReward";

const IG_URL = "https://www.instagram.com/ola.unity/";

export const SocialRewardCard = () => {
  const { state, claim } = useSocialReward();
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  if (state === "loading") return null;

  if (state === "claimed") {
    return (
      <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
        <div className="mb-1 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="font-semibold text-green-700">¡Súper-Precio desbloqueado!</p>
        </div>
        <p className="text-sm text-green-700/80">Gracias por seguirnos.</p>
      </div>
    );
  }

  const cleanHandle = handle.trim().replace(/^@+/, "");

  const onConfirm = async () => {
    if (!cleanHandle) return;
    setBusy(true);
    const ok = await claim(cleanHandle);
    setBusy(false);
    if (ok) {
      setOpen(false);
      toast.success("¡Súper-Precio desbloqueado!");
    } else {
      toast.error("No pudimos activar el descuento. Probá de nuevo.");
    }
  };

  return (
    <>
      <div className="mb-4 rounded-lg border border-primary/20 bg-card p-4">
        <div className="mb-1 flex items-center gap-2">
          <Instagram className="h-5 w-5 text-primary" />
          <p className="font-semibold">Seguinos en Instagram</p>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Seguí a <span className="text-primary">@ola.unity</span> y desbloqueá un Súper-Precio en tu próximo grupo.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" /> Abrir @ola.unity
          </a>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <BadgePercent className="h-4 w-4" /> Ya te seguí — desbloquear
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmá tu suscripción</DialogTitle>
            <DialogDescription>
              Indicá tu usuario de Instagram para validar que seguís a @ola.unity.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">@</span>
            <Input
              autoFocus
              placeholder="tu_usuario"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void onConfirm(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} disabled={busy || !cleanHandle}>
              <BadgePercent className="mr-2 h-4 w-4" /> Confirmar y desbloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SocialRewardCard;
