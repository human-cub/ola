import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface CheckoutContactFormProps {
  form: UseFormReturn<any>;
  isGuest?: boolean;
  guestEmail?: string;
  setGuestEmail?: (v: string) => void;
  guestPassword?: string;
  setGuestPassword?: (v: string) => void;
}

export const CheckoutContactForm = ({
  form,
  isGuest = false,
  guestEmail = "",
  setGuestEmail,
  guestPassword = "",
  setGuestPassword,
}: CheckoutContactFormProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Datos de contacto</h2>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Nombre *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Tu nombre" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Apellido</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Tu apellido (opcional)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Teléfono *</FormLabel>
              <FormControl>
                <Input {...field} type="tel" placeholder="+54 9 11 1234-5678" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isGuest && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Con estos datos creamos tu cuenta para que puedas seguir tu pedido.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="guest-email">Email *</label>
              <Input
                id="guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail?.(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="guest-password">Contraseña *</label>
              <Input
                id="guest-password"
                type="password"
                value={guestPassword}
                onChange={(e) => setGuestPassword?.(e.target.value)}
                placeholder="Mínimo 8 caracteres, con letras y números"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
