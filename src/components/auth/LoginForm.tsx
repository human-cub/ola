import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import * as amplitude from "@amplitude/analytics-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

interface LoginFormProps {
  onSuccess: () => void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Tras Google: volver a donde se pidió el login (?redirect=...) o al inicio.
  // Antes iba siempre a /mi-cuenta.
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/";
  const safeRedirect =
    redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : "/";
  const redirectTo = `${window.location.origin}${safeRedirect}`;

  const handleGoogle = async () => {
    setGoogleLoading(true);
    amplitude.track("Login", { method: "google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      toast.error("No se pudo iniciar con Google. Probá de nuevo.");
      setGoogleLoading(false);
    }
  };

  const finishSuccess = (method: string) => {
    amplitude.track("Login", { button_label: "Iniciar Sesión", method });
    toast.success("¡Bienvenido/a!");
    onSuccess();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
        let timeoutId: number | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error("timeout")), ms);
        });
        try {
          return await Promise.race([promise, timeoutPromise]);
        } finally {
          if (timeoutId) window.clearTimeout(timeoutId);
        }
      };

      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        12_000
      );

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          try {
            const { data: claim } = await supabase.functions.invoke("claim-password", {
              body: { email, password },
            });
            if (claim?.claimed) {
              const retry = await supabase.auth.signInWithPassword({ email, password });
              if (!retry.error) {
                finishSuccess("email_first_set");
                return;
              }
            }
          } catch {
            /* fall through to standard error */
          }
          toast.error("Email o contraseña incorrectos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Confirmá tu email antes de iniciar sesión");
        } else {
          toast.error(error.message);
        }
        return;
      }

      finishSuccess("email");
    } catch (error: any) {
      if (error?.message === "timeout") {
        toast.error("La autenticación tardó demasiado. Reintentá.");
      } else {
        toast.error("Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading}>
        {googleLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <span className="mr-2"><GoogleIcon /></span>}
        Continuar con Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">o con tu email</span></div>
      </div>

      <form onSubmit={handleLogin} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={errors.email ? "border-destructive" : ""} />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Contraseña</Label>
          <div className="relative">
            <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={errors.password ? "border-destructive pr-10" : "pr-10"} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Recordarme</Label>
          </div>
          <Link to="/recuperar-clave" className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cargando...</>) : ("Iniciar Sesión")}
        </Button>
      </form>
    </div>
  );
};
