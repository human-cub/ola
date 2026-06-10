import { UseFormReturn } from "react-hook-form";
import { formatPrice } from "@/lib/formatting";
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
  /** Total redondeado para pagos cash (transferencia/efectivo); se muestra junto a esas opciones. */
  cashTotal?: number;
}

export const CheckoutPaymentForm = ({ form, cashTotal }: CheckoutPaymentFormProps) => {
  const cashHint = cashTotal && cashTotal > 0 ? (
    <span className="ml-3 text-xs font-medium text-green-600 tabular-nums">{formatPrice(cashTotal)}</span>
  ) : null;
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
                <SelectItem value="transferencia">
                  <span className="flex w-full items-center justify-between">
                    <span>Transferencia</span>
                    {cashHint}
                  </span>
                </SelectItem>
                <SelectItem value="efectivo">
                  <span className="flex w-full items-center justify-between">
                    <span>Efectivo</span>
                    {cashHint}
                  </span>
                </SelectItem>
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
