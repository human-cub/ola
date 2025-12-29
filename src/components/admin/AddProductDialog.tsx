import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Upload, Loader2 } from "lucide-react";
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

interface AddProductDialogProps {
  onProductAdded: () => void;
}

const AddProductDialog = ({ onProductAdded }: AddProductDialogProps) => {
  const [open, setOpen] = useState(false);
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

  const parsePrices = (pricesStr: string): { people: number; price: number }[] => {
    const priceValues = pricesStr.split(/\s+/).map(p => parseInt(p.replace(/\D/g, "")));
    if (priceValues.length !== 5 || priceValues.some(isNaN)) {
      throw new Error("Debe ingresar 5 precios válidos separados por espacios");
    }
    const tiers = [1, 25, 50, 75, 100];
    return tiers.map((people, i) => ({ people, price: priceValues[i] }));
  };

  const formatWeight = (weight: string): string => {
    const trimmed = weight.trim();
    if (trimmed.toLowerCase().includes("peso neto") || 
        trimmed.toLowerCase().includes("cápsulas") ||
        trimmed.toLowerCase().includes("unidades")) {
      return trimmed;
    }
    if (/^\d+\s*g$/i.test(trimmed)) {
      return trimmed;
    }
    if (/^\d+\s*capsulas?$/i.test(trimmed)) {
      return trimmed.replace(/capsulas?/i, "cápsulas");
    }
    if (/^\d+\s*unidades?$/i.test(trimmed)) {
      return trimmed;
    }
    return trimmed;
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
    setLoading(true);

    try {
      const priceSlider = parsePrices(formData.prices);
      const flavorsArray = formData.flavors
        ? formData.flavors.split(",").map(f => f.trim()).filter(Boolean)
        : [];
      
      const slug = generateSlug(formData.name);
      const link = `/producto/${slug}`;

      const { error } = await supabase.from("products").insert({
        name: formData.name,
        category: formData.category,
        weight: formatWeight(formData.weight),
        prices: priceSlider,
        images: imageUrls,
        description: formData.description,
        flavors: flavorsArray,
        link: link,
        is_manual: true,
        real_orders_count: 0,
        virtual_orders_count: 0,
        waiting_for_discount_count: 0,
        buynow_count: 0,
      });

      if (error) throw error;

      toast.success("Producto añadido correctamente");
      setOpen(false);
      resetForm();
      onProductAdded();
    } catch (error: any) {
      toast.error(error.message || "Error al añadir producto");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      weight: "",
      prices: "",
      description: "",
      flavors: "",
    });
    setImageUrls([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Añadir Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Producto</DialogTitle>
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
            <Label>Categoría *</Label>
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
              placeholder="Ej: Star Nutrition Whey Protein"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Weight/Quantity */}
          <div className="space-y-2">
            <Label>Cantidad *</Label>
            <Input
              required
              placeholder="Ej: 908g, 60 cápsulas, 16 unidades"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Formato automático: 908g → Peso neto: 908g
            </p>
          </div>

          {/* Flavors - MOVED UP */}
          <div className="space-y-2">
            <Label>Sabores/Variantes (opcional)</Label>
            <Input
              placeholder="Chocolate, Vainilla, Frutilla"
              value={formData.flavors}
              onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Separados por coma
            </p>
          </div>

          {/* Prices - MOVED DOWN */}
          <div className="space-y-2">
            <Label>Precios (5 valores separados por espacio) *</Label>
            <Input
              required
              placeholder="67200 59100 52600 45200 38800"
              value={formData.prices}
              onChange={(e) => setFormData({ ...formData, prices: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              De mayor a menor: precio 1 persona → 25 → 50 → 75 → 100
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción del Producto</Label>
            <Textarea
              placeholder="Descripción detallada del producto..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={loading || uploadingImages}>
              {loading ? "Guardando..." : "Guardar Producto"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
