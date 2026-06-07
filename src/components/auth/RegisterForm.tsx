import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import * as amplitude from "@amplitude/analytics-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[a-zA-Z]/, "La contraseña debe contener al menos una letra")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("signup-with-email", {
        body: {
          email,
          password,
          redirectTo: `${window.location.origin}/completar-perfil`,
        },
      });

      if (error) {
        let message = error.message;
        if (error.context instanceof Response) {
          const payload = await error.context.json().catch(() => null);
          message = payload?.error || message;
        } else {
          message = error.context?.error || message;
        }
        toast.error(message);
        return;
      }

      amplitude.track('Sign Up', { button_label: 'Crear Cuenta', method: 'email' });

      // Welcome email (fire and forget)
      supabase.functions.invoke("send-email", { body: { type: "welcome", to: email } }).catch(() => {});

      // Account is auto-confirmed → sign in directly.
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.success("¡Cuenta creada! Iniciá sesión.");
        navigate("/ingresar");
      } else {
        toast.success("¡Bienvenido/a a Ola! 🌊");
        navigate("/completar-perfil");
      }
    } catch (error: any) {
      toast.error("Error al registrarte");
    } finally {
      setLoading(false);
    }
  };

  // Email verification page removed - auth auto-confirms

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Contraseña</Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? "border-destructive pr-10" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con letras y números
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
        <div className="relative">
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>


      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Registrando...
          </>
        ) : (
          "Crear cuenta"
        )}
      </Button>
    </form>
  );
};
