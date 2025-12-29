import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import AddProductDialog from "./AddProductDialog";
import EditProductDialog from "./EditProductDialog";

interface ProductPrices {
  people: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  weight: string;
  category: string | null;
  description: string | null;
  images: string[] | null;
  flavors: string[] | null;
  prices: ProductPrices[];
  link: string | null;
  is_manual: boolean | null;
  real_orders_count: number;
  buynow_count: number;
  virtual_orders_count: number;
  waiting_for_discount_count: number;
  total_orders_count: number;
}

const ProductsTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVirtualId, setEditingVirtualId] = useState<string | null>(null);
  const [virtualCount, setVirtualCount] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar productos");
      return;
    }

    // Parse JSON fields properly
    const parsedProducts = (data || []).map(p => ({
      ...p,
      images: Array.isArray(p.images) ? p.images as string[] : [],
      flavors: Array.isArray(p.flavors) ? p.flavors as string[] : [],
      prices: Array.isArray(p.prices) ? (p.prices as unknown as ProductPrices[]) : [],
    }));

    setProducts(parsedProducts as Product[]);
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
    setEditingVirtualId(null);
    fetchProducts();
  };

  const startEditingVirtual = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingVirtualId(product.id);
    setVirtualCount(product.virtual_orders_count);
  };

  const handleRowClick = (product: Product) => {
    if (editingVirtualId) return;
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Productos</CardTitle>
          <AddProductDialog onProductAdded={fetchProducts} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Comprar Ahora</TableHead>
                  <TableHead>Esperando Descuento</TableHead>
                  <TableHead>Órdenes Virtuales</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(product)}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.weight}</TableCell>
                    <TableCell>{product.buynow_count}</TableCell>
                    <TableCell className="font-semibold text-primary">{product.waiting_for_discount_count}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {editingVirtualId === product.id ? (
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
                    <TableCell className="font-bold">
                      {product.waiting_for_discount_count + product.virtual_orders_count}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {editingVirtualId === product.id ? (
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
                            onClick={() => setEditingVirtualId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => startEditingVirtual(e, product)}
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

      <EditProductDialog
        product={selectedProduct}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProductUpdated={fetchProducts}
      />
    </>
  );
};

export default ProductsTable;
