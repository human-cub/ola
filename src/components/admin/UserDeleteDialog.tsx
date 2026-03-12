import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatFullName } from "@/lib/formatting";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onDeleted: () => void;
}

export const UserDeleteDialog = ({
  open,
  onOpenChange,
  user,
  onDeleted,
}: UserDeleteDialogProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: user.user_id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Usuario eliminado completamente");
      onOpenChange(false);
      onDeleted();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Error al eliminar el usuario");
    } finally {
      setDeleting(false);
    }
  };

  const displayName = user
    ? formatFullName(user.first_name, user.last_name, "este usuario")
    : "este usuario";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este perfil?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el perfil de{" "}
            <span className="font-medium">{displayName}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
