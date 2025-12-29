import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = [
  { value: "proteinas", label: "Proteínas" },
  { value: "creatinas", label: "Creatinas" },
  { value: "aminoacidos", label: "Aminoácidos" },
  { value: "aumentadores", label: "Aumentadores de masa" },
  { value: "barras", label: "Barras y snacks" },
  { value: "pre-entrenos", label: "Pre-entrenos" },
  { value: "colageno", label: "Colágeno" },
  { value: "vitaminas", label: "Vitaminas y minerales" },
];

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
}

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

const EditProductDialog = ({ product, open, onOpenChange, onProductUpdated }: EditProductDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    weight: "",
    prices: "",
    description: "",
    flavors: "",
  });

  useEffect(() => {
    if (product) {
      const pricesStr = product.prices?.map(p => p.price).join(" ") || "";
      const flavorsStr = Array.isArray(product.flavors) ? product.flavors.join(", ") : "";
      const images = Array.isArray(product.images) ? product.images : [];
      
      setFormData({
        name: product.name || "",
        category: product.category || "",
        weight: product.weight || "",
        prices: pricesStr,
        description: product.description || "",
        flavors: flavorsStr,
      });
      setImageUrls(images);
    }
  }, [product]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setImageUrls([...imageUrls, ...newUrls]);
      toast.success(`${newUrls.length} imagen(es) subida(s)`);
    } catch (error: any) {
      toast.error("Error al subir imagen: " + error.message);
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const parsePrices = (pricesStr: string): ProductPrices[] => {
    const priceValues = pricesStr.split(/\s+/).map(p => parseInt(p.replace(/\D/g, "")));
    if (priceValues.length !== 5 || priceValues.some(isNaN)) {
      throw new Error("Debe ingresar 5 precios válidos separados por espacios");
    }
    const tiers = [1, 25, 50, 75, 100];
    return tiers.map((people, i) => ({ people, price: priceValues[i] }));
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);

    try {
      const priceSlider = parsePrices(formData.prices);
      const flavorsArray = formData.flavors
        ? formData.flavors.split(",").map(f => f.trim()).filter(Boolean)
        : [];
      
      const slug = generateSlug(formData.name);
      const link = `/producto/${slug}`;

      const { error } = await supabase.from("products").update({
        name: formData.name,
        category: formData.category || null,
        weight: formData.weight,
        prices: JSON.parse(JSON.stringify(priceSlider)),
        images: imageUrls,
        description: formData.description || null,
        flavors: flavorsArray,
        link: link,
      } as any).eq("id", product.id);

      if (error) throw error;

      toast.success("Producto actualizado correctamente");
      onOpenChange(false);
      onProductUpdated();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar producto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;

      toast.success("Producto eliminado");
      onOpenChange(false);
      onProductUpdated();
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Upload */}
          <div className="space-y-3">
            <Label>Fotos del Producto</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                className="w-full gap-2"
              >
                {uploadingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Subir Fotos
                  </>
                )}
              </Button>
            </div>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Nombre del Producto *</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Weight/Quantity */}
          <div className="space-y-2">
            <Label>Cantidad *</Label>
            <Input
              required
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
          </div>

          {/* Flavors */}
          <div className="space-y-2">
            <Label>Sabores/Variantes</Label>
            <Input
              placeholder="Chocolate, Vainilla, Frutilla"
              value={formData.flavors}
              onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Separados por coma</p>
          </div>

          {/* Prices */}
          <div className="space-y-2">
            <Label>Precios (5 valores separados por espacio) *</Label>
            <Input
              required
              placeholder="67200 59100 52600 45200 38800"
              value={formData.prices}
              onChange={(e) => setFormData({ ...formData, prices: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              De mayor a menor: 1 → 25 → 50 → 75 → 100
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción del Producto</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={loading || uploadingImages}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
