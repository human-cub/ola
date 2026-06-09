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
  Eye, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserDetailDialog } from "./UserDetailDialog";
import { UserDeleteDialog } from "./UserDeleteDialog";

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

const ITEMS_PER_PAGE = 50;

type UserRole = "admin" | "mayorista" | "cliente";

const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  mayorista: "Mayorista",
  cliente: "Cliente",
};

const UsersTable = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole>>({});
  const [passwordSet, setPasswordSet] = useState<Record<string, boolean>>({});
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

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

      // Password-set status (admin only): flag migrated accounts that still have no password.
      supabase.rpc("admin_users_password_status" as any).then(({ data: pwd }) => {
        const pmap: Record<string, boolean> = {};
        (pwd ?? []).forEach((r: any) => { pmap[r.user_id] = r.password_set; });
        setPasswordSet(pmap);
      });

      // Load roles for the visible users
      const userIds = (data ?? []).map((u) => u.user_id);
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        const map: Record<string, UserRole> = {};
        userIds.forEach((id) => { map[id] = "cliente"; });
        (rolesData ?? []).forEach((r: any) => {
          // admin overrides mayorista; mayorista overrides cliente
          if (r.role === "admin") map[r.user_id] = "admin";
          else if (r.role === "mayorista" && map[r.user_id] !== "admin") map[r.user_id] = "mayorista";
        });
        setUserRoles(map);
      } else {
        setUserRoles({});
      }
    } catch (error: any) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, statusFilter]);

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

  const handlePromoteGuest = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_guest: false } as any)
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Cuenta promovida a miembro");
      fetchUsers();
    } catch {
      toast.error("Error al promover la cuenta");
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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId);
    try {
      // Remove existing admin/mayorista roles for this user
      const { error: delError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .in("role", ["admin", "mayorista"]);
      if (delError) throw delError;

      // Insert the new role unless it's "cliente" (no row needed)
      if (newRole !== "cliente") {
        const { error: insError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole as any });
        if (insError) throw insError;
      }

      setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
      toast.success(`Rol actualizado a ${roleLabel[newRole]}`);
    } catch (error: any) {
      toast.error("Error al actualizar el rol");
    } finally {
      setUpdatingRole(null);
    }
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
                      <TableHead>Rol</TableHead>
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
                          <Select
                            value={userRoles[user.user_id] ?? "cliente"}
                            onValueChange={(v) => handleRoleChange(user.user_id, v as UserRole)}
                            disabled={updatingRole === user.user_id}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cliente">Cliente</SelectItem>
                              <SelectItem value="mayorista">Mayorista</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {user.is_blocked ? (
                            <Badge variant="destructive">Bloqueado</Badge>
                          ) : user.profile_completed ? (
                            <Badge className="bg-success text-success-foreground">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Incompleto</Badge>
                          )}
                        {passwordSet[user.user_id] === false && (
                            <Badge variant="outline" className="ml-1 border-amber-500 text-amber-600">Sin clave</Badge>
                          )}
                        {(user as any).is_guest && (
                            <Badge variant="outline" className="ml-1 border-sky-500 text-sky-600">Guest</Badge>
                          )}
                          </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(user as any).is_guest && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Promover a miembro (ver precios de grupo)"
                              onClick={() => handlePromoteGuest(user)}
                            >
                              <ArrowUpCircle className="w-4 h-4 text-sky-600" />
                            </Button>
                          )}
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

      <UserDetailDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onBlockUser={handleBlockUser}
        onDeleteUser={(user) => {
          setUserToDelete(user);
          setDeleteDialogOpen(true);
        }}
      />

      <UserDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={userToDelete}
        onDeleted={() => {
          setUserToDelete(null);
          setSelectedUser(null);
          fetchUsers();
        }}
      />
    </>
  );
};

export default UsersTable;
