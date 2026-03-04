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
}

export const CheckoutContactForm = ({ form }: CheckoutContactFormProps) => {
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
      </div>
    </div>
  );
};
