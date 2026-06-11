import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SociosHeader } from "../SociosHeader";
import { useSociosCartCtx } from "../SociosCartProvider";
import { useMayoristaMin } from "../hooks/useMayoristaMin";
import { formatARS } from "../lib/format";

const Carrito = () => {
  const { items, setQuantity, removeItem, subtotal, loading } = useSociosCartCtx();
  const min = useMayoristaMin();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const missing = Math.max(0, min - subtotal);
  const canCheckout = subtotal >= min && items.length > 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      <SociosHeader search={search} onSearchChange={setSearch} />
      <main className="pt-[112px] px-3">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-xl font-bold mb-4">Tu pedido</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">El carrito está vacío</p>
              <Button asChild>
                <Link to="/">Ver catálogo</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 bg-card border rounded-lg p-3">
                  <div className="w-14 h-14 shrink-0 bg-white rounded-md overflow-hidden">
                    {it.product_image && (
                      <img
                        src={it.product_image}
                        alt={it.product_name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight line-clamp-2">
                      {it.product_name}
                      {it.flavor && (
                        <span className="text-muted-foreground"> · {it.flavor}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatARS(it.price_per_unit)} c/u
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => void setQuantity(it.id, it.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-7 text-center text-sm font-medium">{it.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => void setQuantity(it.id, it.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="w-20 text-right text-sm font-bold">
                    {formatARS(it.price_per_unit * it.quantity)}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => void removeItem(it.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg">
          <div className="container mx-auto max-w-3xl px-3 py-3 space-y-2">
            {missing > 0 ? (
              <div className="text-sm text-destructive font-medium text-center">
                Faltan: {formatARS(missing)}
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <Button
                className="flex-1"
                size="lg"
                disabled={!canCheckout}
                onClick={() => navigate("/finalizar")}
              >
                Confirmar pedido
              </Button>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-lg font-bold">{formatARS(subtotal)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carrito;