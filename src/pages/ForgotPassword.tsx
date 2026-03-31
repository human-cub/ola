import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

const emailSchema = z.string().email("Email inválido");

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // Use custom send-email edge function to send via Resend
      await supabase.functions.invoke("send-email", {
        body: {
          type: "password_reset",
          to: email,
          data: {
            redirectTo: `${window.location.origin}/restablecer-clave`,
          },
        },
      });

      setEmailSent(true);
    } catch (error: any) {
      // Always show same message for security
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/ingresar" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a iniciar sesión
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <img 
                src="/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" 
                alt="Ola Logo" 
                className="w-12 h-12"
                loading="eager"
                decoding="async"
              />
            </div>
            <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              Ingresá tu email y te enviaremos instrucciones para restablecerla
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center py-4 space-y-4">
                <Mail className="w-16 h-16 text-primary mx-auto" />
                <h3 className="text-lg font-semibold">¡Revisá tu email!</h3>
                <p className="text-muted-foreground">
                  Si existe una cuenta con ese email, te enviamos instrucciones para restablecer tu contraseña.
                </p>
                <p className="text-sm text-muted-foreground">
                  El enlace es válido por 1 hora. Revisá también tu carpeta de spam.
                </p>
                <Link to="/ingresar">
                  <Button variant="outline" className="mt-4">
                    Volver a iniciar sesión
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={error ? "border-destructive" : ""}
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar instrucciones"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
