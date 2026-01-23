import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Ban,
  CheckCircle,
  Download,
  Eye,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
}

interface LoginEntry {
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

const ITEMS_PER_PAGE = 50;

// Format address from JSON or string
const formatAddress = (address: string | null): string => {
  if (!address) return "-";
  
  try {
    // Try parsing as JSON
    const parsed = JSON.parse(address);
    if (typeof parsed === 'object' && parsed !== null) {
      const parts = [
        parsed.street,
        parsed.number,
        parsed.floor,
        parsed.postalCode,
        parsed.city,
        parsed.province
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : "-";
    }
    return address;
  } catch {
    // Not JSON, return as-is
    return address;
  }
};

const UsersTable = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        );
      }

      if (statusFilter === "blocked") {
        query = query.eq("is_blocked", true);
      } else if (statusFilter === "active") {
        query = query.eq("is_blocked", false);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, statusFilter]);

  const handleViewUser = async (user: UserProfile) => {
    setSelectedUser(user);
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

  const handleBlockUser = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: !user.is_blocked,
          blocked_at: !user.is_blocked ? new Date().toISOString() : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(user.is_blocked ? "Usuario desbloqueado" : "Usuario bloqueado");
      fetchUsers();
      
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...user, is_blocked: !user.is_blocked });
      }
    } catch (error: any) {
      toast.error("Error al actualizar usuario");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    try {
      // Call edge function to completely delete user from auth.users
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userToDelete.user_id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Usuario eliminado completamente");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Error al eliminar el usuario");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Nombre", "Apellido", "Teléfono", "Dirección", "Estado", "Email", "Fecha registro"];
    const rows = users.map(u => [
      u.id,
      u.first_name || "",
      u.last_name || "",
      u.phone || "",
      u.address || "",
      u.is_blocked ? "Bloqueado" : "Activo",
      u.email || "",
      format(new Date(u.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle>Usuarios ({totalCount})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, teléfono..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron usuarios</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name || user.last_name
                            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                            : <span className="text-muted-foreground italic">Sin nombre</span>
                          }
                        </TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {user.is_blocked ? (
                            <Badge variant="destructive">Bloqueado</Badge>
                          ) : user.profile_completed ? (
                            <Badge className="bg-success text-success-foreground">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Incompleto</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleBlockUser(user)}
                          >
                            {user.is_blocked ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <Ban className="w-4 h-4 text-destructive" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del usuario</DialogTitle>
            <DialogDescription>
              Información completa y actividad del usuario
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nombre</p>
                  <p className="font-medium">
                    {selectedUser.first_name || "-"} {selectedUser.last_name || ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedUser.phone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Dirección</p>
                  <p className="font-medium">{formatAddress(selectedUser.address)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de registro</p>
                  <p className="font-medium">
                    {format(new Date(selectedUser.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  {selectedUser.is_blocked ? (
                    <Badge variant="destructive">Bloqueado</Badge>
                  ) : (
                    <Badge className="bg-success text-success-foreground">Activo</Badge>
                  )}
                </div>
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
                  variant={selectedUser.is_blocked ? "default" : "destructive"}
                  onClick={() => handleBlockUser(selectedUser)}
                  className="flex-1"
                >
                  {selectedUser.is_blocked ? (
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
                  onClick={() => {
                    setUserToDelete(selectedUser);
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el perfil de{" "}
              <span className="font-medium">
                {userToDelete?.first_name || userToDelete?.last_name
                  ? `${userToDelete.first_name || ""} ${userToDelete.last_name || ""}`.trim()
                  : "este usuario"}
              </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
    </>
  );
};

export default UsersTable;
