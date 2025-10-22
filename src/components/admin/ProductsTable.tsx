import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface Product {
  id: string;
  name: string;
  weight: string;
  real_orders_count: number;
  virtual_orders_count: number;
  waiting_for_discount_count: number;
  total_orders_count: number;
}

const ProductsTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [virtualCount, setVirtualCount] = useState<number>(0);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar productos");
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateVirtualCount = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .update({ virtual_orders_count: virtualCount })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar");
      return;
    }

    toast.success("Contador virtual actualizado");
    setEditingId(null);
    fetchProducts();
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setVirtualCount(product.virtual_orders_count);
  };

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Productos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Órdenes Reales</TableHead>
                <TableHead>Esperando Descuento</TableHead>
                <TableHead>Órdenes Virtuales</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.weight}</TableCell>
                  <TableCell>{product.real_orders_count}</TableCell>
                  <TableCell className="font-semibold text-primary">{product.waiting_for_discount_count}</TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input
                        type="number"
                        value={virtualCount}
                        onChange={(e) => setVirtualCount(parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    ) : (
                      product.virtual_orders_count
                    )}
                  </TableCell>
                  <TableCell className="font-bold">{product.total_orders_count}</TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateVirtualCount(product.id)}
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsTable;
