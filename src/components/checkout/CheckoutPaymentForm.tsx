import { UseFormReturn } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface CheckoutPaymentFormProps {
  form: UseFormReturn<any>;
}

export const CheckoutPaymentForm = ({ form }: CheckoutPaymentFormProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Forma de pago</h2>
      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná forma de pago" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta" disabled>Tarjeta (Próximamente)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
