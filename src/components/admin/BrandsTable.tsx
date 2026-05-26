import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { useBrands, type Brand } from "@/hooks/useBrands";
import { useQueryClient } from "@tanstack/react-query";

const BrandsTable = () => {
  const qc = useQueryClient();
  const { data: brands = [], isLoading, refetch, isFetching, error } =
    useBrands({ includeInactive: true });
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const handleToggleActive = async (b: Brand, isActive: boolean) => {
    setSavingSlug(b.slug);
    try {
      const { error: upErr } = await supabase
        .from("brand_overrides")
        .upsert(
          { slug: b.slug, is_active: isActive, sort_order: 0 },
          { onConflict: "slug" },
        );
      if (upErr) throw upErr;
      qc.invalidateQueries({ queryKey: ["brands"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSavingSlug(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Marcas</h2>
          <p className="text-xs text-muted-foreground">
            Nombre, slug, logo, SEO y orden se importan desde la base externa.
            Las marcas sin productos quedan inactivas automáticamente
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          size="sm"
          variant="outline"
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Sincronizar
        </Button>
      </div>

      {error ? (
        <div className="text-sm text-destructive border border-destructive/30 rounded p-3">
          {(error as Error).message}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Logo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>SEO Title</TableHead>
            <TableHead>SEO Description</TableHead>
            <TableHead className="w-20 text-center">Productos</TableHead>
            <TableHead className="w-20">Activa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No se encontraron marcas en la base externa
              </TableCell>
            </TableRow>
          ) : (
            brands.map((b) => {
              const hasProducts = (b.products_count ?? 0) > 0;
              return (
                <TableRow key={b.slug}>
                  <TableCell className="w-16">
                    {b.logo_url ? (
                      <img
                        src={b.logo_url}
                        alt={b.name}
                        className="h-8 w-auto max-w-[60px] object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{b.slug}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={b.seo_title ?? ""}>
                    {b.seo_title ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs max-w-[280px] truncate" title={b.seo_description ?? ""}>
                    {b.seo_description ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="w-20 text-center">
                    <span className={hasProducts ? "text-foreground" : "text-muted-foreground"}>
                      {b.products_count ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="w-20">
                    <Switch
                      checked={b.is_active}
                      onCheckedChange={(checked) => handleToggleActive(b, checked)}
                      disabled={savingSlug === b.slug || !hasProducts}
                      title={!hasProducts ? "Marca sin productos — inactiva" : undefined}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default BrandsTable;