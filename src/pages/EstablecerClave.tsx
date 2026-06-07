import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function EstablecerClave() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate("/ingresar"); return; }
      setEmail(data.user.email ?? "");
      if (data.user.user_metadata?.password_set !== false) navigate("/mi-cuenta");
    });
  }, [navigate]);

  const handleSave = async () => {
    if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password, data: { password_set: true } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("¡Listo!");
    navigate("/mi-cuenta");
  };

  const handleSkip = async () => {
    await supabase.auth.updateUser({ data: { password_set: true } });
    navigate("/mi-cuenta");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Confirmá tu contraseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Ingresá tu contraseña para continuar.</p>
          {email && <p className="text-sm font-medium">{email}</p>}
          <div className="space-y-2">
            <Label htmlFor="np">Contraseña</Label>
            <div className="relative">
              <Input id="np" type={show ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} className="pr-10"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }} autoFocus />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Continuar
          </Button>
          <button type="button" onClick={handleSkip}
            className="w-full text-xs text-muted-foreground hover:text-foreground">
            Omitir por ahora
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
