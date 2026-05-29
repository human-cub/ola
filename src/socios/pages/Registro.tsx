import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { storeInviteToken, clearInviteToken } from "../lib/format";

const Registro = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setValidating(false);
        return;
      }
      const { data, error } = await (supabase.rpc as any)("validate_wholesale_invite", { _token: token });
      const row = Array.isArray(data) ? data[0] : data;
      if (!error && row?.valid) {
        setValid(true);
        setLeadName(row.full_name || "");
        setLeadPhone(row.phone || "");
        setFirstName(row.full_name || "");
        setPhone(row.phone || "");
      }
      setValidating(false);
    };
    void run();
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    storeInviteToken(token);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    // If session created immediately (autoconfirm) — claim role and write profile
    if (data.session) {
      const { error: rpcErr } = await (supabase.rpc as any)("claim_wholesale_invite", { _token: token });
      if (rpcErr) {
        toast.error("No se pudo activar la cuenta mayorista: " + rpcErr.message);
      } else {
        clearInviteToken();
      }
      await supabase
        .from("profiles")
        .update({ first_name: firstName, phone, profile_completed: true })
        .eq("user_id", data.user!.id);
      navigate("/");
    } else {
      toast.success("Revisá tu email para confirmar la cuenta");
    }
    setLoading(false);
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !valid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold mb-2">Enlace inválido</h1>
          <p className="text-muted-foreground text-sm">
            Este enlace no existe o ya fue usado. Pedile uno nuevo al equipo de Ola.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-xl p-6 bg-card">
        <h1 className="text-xl font-bold text-center">Registro Mayorista</h1>
        <p className="text-xs text-muted-foreground text-center">
          Bienvenido {leadName}. Creá tu cuenta para acceder al portal Socios.
        </p>
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={leadPhone} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando…" : "Crear cuenta"}
        </Button>
      </form>
    </div>
  );
};

export default Registro;