import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/formatting";

interface CheckoutOrderSummaryProps {
  items: Array<{
    id: string;
    product_name: string;
    flavor: string | null;
    quantity: number;
    price_per_unit?: number;
    current_price_per_unit?: number;
  }>;
  total: number;
}

export const CheckoutOrderSummary = ({ items, total }: CheckoutOrderSummaryProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-6">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-3 px-1">
          <span className="text-lg font-semibold">Resumen del pedido</span>
          <div className="flex items-center gap-2">
            <span className="font-bold">{formatPrice(total)}</span>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pb-4">
          {items.map((item) => {
            const price = item.price_per_unit ?? item.current_price_per_unit ?? 0;
            return (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.quantity}x {item.product_name} {item.flavor && `(${item.flavor})`}</span>
                <span>{formatPrice(price * item.quantity)}</span>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
