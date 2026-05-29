import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ReviewEmail = () => {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Revisá tu email</CardTitle>
            <CardDescription>
              Te enviamos un enlace para confirmar la cuenta y activar tu acceso
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {email && (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm font-medium">
              {email}
            </div>
          )}
          <div className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 text-left text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>Después de confirmar el email, vas a poder completar tu perfil y seguir comprando</p>
          </div>
          <Button asChild className="w-full">
            <Link to="/ingresar">Ir a iniciar sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default ReviewEmail;