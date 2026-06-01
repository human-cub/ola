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
    <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
      {showFilter && (
        <label className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">{filterLabel}</span>
          <select
            value={filter ?? "all"}
            onChange={(e) => onFilterChange!(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
      <label className="flex items-center gap-2 text-sm">
        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">Ordenar</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
      return arr.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      );
  }
};