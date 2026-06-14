import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Ban, CheckCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatAddress } from "@/lib/address";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  profile_completed: boolean;
  email?: string;
  instagram_handle?: string | null;
  social_reward_granted_at?: string | null;
}

interface LoginEntry {
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface UserDetailDialogProps {
  user: UserProfile | null;
  onClose: () => void;
  onBlockUser: (user: UserProfile) => void;
  onDeleteUser: (user: UserProfile) => void;
}

export const UserDetailDialog = ({
  user,
  onClose,
  onBlockUser,
  onDeleteUser,
}: UserDetailDialogProps) => {
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data } = await supabase
          .from("login_history")
          .select("*")
          .eq("user_id", user.user_id)
          .order("login_at", { ascending: false })
          .limit(20);

        setLoginHistory(data || []);
      } catch (error) {
        console.error("Error loading login history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user?.user_id]);

  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle del usuario</DialogTitle>
          <DialogDescription>
            Información completa y actividad del usuario
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium">
                  {user.first_name || "-"} {user.last_name || ""}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Teléfono</p>
                <p className="font-medium">{user.phone || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Dirección</p>
                <p className="font-medium">{formatAddress(user.address)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{user.email || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha de registro</p>
                <p className="font-medium">
                  {format(new Date(user.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                {user.is_blocked ? (
                  <Badge variant="destructive">Bloqueado</Badge>
                ) : (
                  <Badge className="bg-success text-success-foreground">Activo</Badge>
                )}
              </div>
              {user.social_reward_granted_at && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Instagram</p>
                  <p className="font-medium flex flex-wrap items-center gap-2">
                    {user.instagram_handle ? (
                      <a
                        href={`https://instagram.com/${user.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @{user.instagram_handle}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    <Badge variant="outline" className="border-pink-500 text-pink-600">
                      Se suscribió por el descuento web
                    </Badge>
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Historial de accesos</h4>
              {loadingHistory ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : loginHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin accesos registrados</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {loginHistory.map((entry, i) => (
                    <div key={i} className="text-sm flex justify-between py-1 border-b last:border-0">
                      <span>
                        {format(new Date(entry.login_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {entry.ip_address || "IP desconocida"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant={user.is_blocked ? "default" : "destructive"}
                onClick={() => onBlockUser(user)}
                className="flex-1"
              >
                {user.is_blocked ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4 mr-2" />
                    Bloquear
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onDeleteUser(user)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
