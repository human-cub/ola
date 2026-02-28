import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AddProductDialog from "./AddProductDialog";
import EditProductDialog from "./EditProductDialog";
import VirtualOrdersPopover from "./VirtualOrdersPopover";
import { Spinner } from "../ui/spinner";

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
  base_probability: number | null;
  real_orders_count: number;
  buynow_count: number;
  virtual_orders_count: number;
  waiting_for_discount_count: number;
  total_orders_count: number;
}

const ProductsTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  
  // Filter products by category
  const filteredProducts = categoryFilter === "all" 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle>Gestión de Productos</CardTitle>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} productos
            </span>
          </div>
          <AddProductDialog onProductAdded={fetchProducts} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Esperando</TableHead>
                  <TableHead>Offline</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(product)}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.category || '-'}</TableCell>
                    <TableCell>{product.weight}</TableCell>
                    <TableCell className="font-semibold text-primary">{product.waiting_for_discount_count}</TableCell>
                    <TableCell>{product.virtual_orders_count}</TableCell>
                    <TableCell className="font-bold">
                      {product.waiting_for_discount_count + product.virtual_orders_count}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <VirtualOrdersPopover
                        productId={product.id}
                        productName={product.name}
                        currentVirtualCount={product.virtual_orders_count}
                        currentBaseProbability={product.base_probability}
                        isManual={product.is_manual}
                        onUpdate={fetchProducts}
                      />
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
