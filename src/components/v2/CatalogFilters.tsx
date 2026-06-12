import { ArrowDownUp, Filter } from "lucide-react";

export type SortKey = "popular" | "price_asc" | "price_desc" | "alpha";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Más populares" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "alpha", label: "Alfabético (A-Z)" },
];

interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  filter?: string;
  onFilterChange?: (v: string) => void;
  filterLabel?: string;
  filterOptions?: FilterOption[];
}

export const CatalogFilters = ({
  sort,
  onSortChange,
  filter,
  onFilterChange,
  filterLabel,
  filterOptions,
}: Props) => {
  const showFilter = !!filterOptions && !!onFilterChange;
  return (
    <div className="flex items-center justify-end gap-2 mb-6">
      {showFilter && (
        <label className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0 flex-1 sm:flex-initial">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="sr-only">{filterLabel}</span>
          <select
            value={filter ?? "all"}
            onChange={(e) => onFilterChange!(e.target.value)}
            className="h-9 w-full sm:w-auto min-w-0 rounded-md border bg-background px-2 sm:px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">{filterLabel ?? "Todos"}</option>
            {filterOptions!.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0 flex-1 sm:flex-initial">
        <ArrowDownUp className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="sr-only">Ordenar</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="h-9 w-full sm:w-auto min-w-0 rounded-md border bg-background px-2 sm:px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export const sortProducts = <
  T extends { name: string; priceT4: number; sortOrder: number },
>(
  list: T[],
  sort: SortKey,
  popOf?: (p: T) => number,
): T[] => {
  const arr = [...list];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => a.priceT4 - b.priceT4 || a.name.localeCompare(b.name));
    case "price_desc":
      return arr.sort((a, b) => b.priceT4 - a.priceT4 || a.name.localeCompare(b.name));
    case "alpha":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "popular":
    default:
      // Popularidad real (conteo de pedidos) primero; luego orden de catálogo.
      return arr.sort(
        (a, b) =>
          (popOf ? popOf(b) - popOf(a) : 0) ||
          a.sortOrder - b.sortOrder ||
          a.name.localeCompare(b.name),
      );
  }
};