import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AddProductDialog from "./AddProductDialog";
import EditProductDialog from "./EditProductDialog";
import VirtualOrdersPopover from "./VirtualOrdersPopover";
import { Spinner } from "../ui/spinner";
import { ExternalLink } from "lucide-react";

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
  is_qa_only: boolean;
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

  const getFrontendLink = (product: Product) => {
    if (!product.link) return null;
    return product.link.startsWith("/") ? product.link : `/${product.link}`;
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
                  <TableHead>Visibilidad</TableHead>
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{product.name}</span>
                        {product.is_qa_only && <Badge variant="secondary">QA</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.category || '-'}</TableCell>
                    <TableCell>{product.weight}</TableCell>
                    <TableCell className="font-semibold text-primary">{product.waiting_for_discount_count}</TableCell>
                    <TableCell>{product.virtual_orders_count}</TableCell>
                    <TableCell>
                      {product.is_qa_only ? (
                        <Badge variant="outline">Solo admin</Badge>
                      ) : (
                        <Badge variant="outline">Público</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">
                      {product.waiting_for_discount_count + product.virtual_orders_count}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {getFrontendLink(product) && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={getFrontendLink(product) || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Ver ${product.name} en el frontend`}
                              title="Ver en frontend"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <VirtualOrdersPopover
                          productId={product.id}
                          productName={product.name}
                          currentVirtualCount={product.virtual_orders_count}
                          currentBaseProbability={product.base_probability}
                          isManual={product.is_manual}
                          onUpdate={fetchProducts}
                        />
                      </div>
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
