import { useBrands } from "@/hooks/useBrands";

interface Props {
  selectedBrandId: string | null;
  onSelect: (brandId: string | null) => void;
}

export const BrandBar = ({ selectedBrandId, onSelect }: Props) => {
  const { data: brands = [] } = useBrands();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t shadow-soft">
      <div className="container mx-auto px-2 py-2 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${
              selectedBrandId === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/30 text-muted-foreground border-transparent hover:border-primary/30"
            }`}
          >
            Todos
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg border min-w-[64px] transition ${
                selectedBrandId === b.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-primary/30 bg-muted/20"
              }`}
              title={b.name}
            >
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt={b.name}
                  className="h-8 w-auto max-w-[60px] object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-[10px] font-semibold uppercase">{b.name}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};