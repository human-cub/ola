import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X, Clock, Tag, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { formatPrice } from "@/lib/formatting";
import {
  searchProducts,
  normalize,
  getRecentSearches,
  pushRecentSearch,
  clearRecentSearches,
} from "@/lib/productSearch";
import { track } from "@/lib/analytics";

const MAX_PRODUCTS = 6;
const MAX_QUICK = 3;

type Row =
  | { kind: "product"; urlSlug: string; name: string; brand: string | null; image: string; price: number }
  | { kind: "category"; slug: string; name: string; emoji?: string | null }
  | { kind: "brand"; slug: string; name: string }
  | { kind: "recent"; term: string }
  | { kind: "viewall"; term: string; count: number };

// Resalta los fragmentos del texto que coinciden con algún token de la query.
const Highlight = ({ text, tokens }: { text: string; tokens: string[] }) => {
  if (tokens.length === 0) return <>{text}</>;
  const norm = normalize(text);
  const marks: boolean[] = new Array(text.length).fill(false);
  for (const tk of tokens) {
    if (!tk) continue;
    let from = 0;
    while (true) {
      const i = norm.indexOf(tk, from);
      if (i === -1) break;
      for (let k = i; k < i + tk.length && k < marks.length; k++) marks[k] = true;
      from = i + tk.length;
    }
  }
  const parts: { s: string; on: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const on = marks[i];
    const last = parts[parts.length - 1];
    if (last && last.on === on) last.s += text[i];
    else parts.push({ s: text[i], on });
  }
  return (
    <>
      {parts.map((p, i) =>
        p.on ? (
          <mark key={i} className="bg-primary/15 text-foreground rounded-[2px] px-0">
            {p.s}
          </mark>
        ) : (
          <span key={i}>{p.s}</span>
        ),
      )}
    </>
  );
};

interface SearchBoxProps {
  className?: string;
  autoFocus?: boolean;
}

export const SearchBox = ({ className, autoFocus }: SearchBoxProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: products = [] } = useCatalogProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const initialQ =
    location.pathname === "/catalogo"
      ? new URLSearchParams(location.search).get("q") ?? ""
      : "";
  const [value, setValue] = useState(initialQ);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recents, setRecents] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  // sincroniza el campo cuando cambia ?q= en /catalogo
  useEffect(() => {
    if (location.pathname === "/catalogo") {
      setValue(new URLSearchParams(location.search).get("q") ?? "");
    }
  }, [location.pathname, location.search]);

  // cerrar al hacer click afuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const categoryNameBySlug = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c: any) => c.slug && m.set(c.slug, c.name ?? c.slug));
    return m;
  }, [categories]);

  const q = value.trim();
  const tokens = useMemo(() => normalize(q).split(" ").filter(Boolean), [q]);

  const matches = useMemo(() => {
    if (!q) return [];
    return searchProducts(products, q, categoryNameBySlug);
  }, [q, products, categoryNameBySlug]);

  // Analytics: búsqueda (debounce; cuenta de resultados vía ref para no re-disparar)
  const matchesCountRef = useRef(0);
  matchesCountRef.current = matches.length;
  useEffect(() => {
    const term = q;
    if (!term || term.length < 2) return;
    const t = setTimeout(() => {
      track("Search", { query: term.slice(0, 80), results: matchesCountRef.current });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // categorías / marcas que coinciden por nombre (atajos)
  const quickCategories = useMemo(() => {
    if (!q) return [];
    const nq = normalize(q);
    return categories
      .filter((c: any) => c.slug && normalize(c.name ?? "").includes(nq))
      .slice(0, MAX_QUICK);
  }, [q, categories]);

  const quickBrands = useMemo(() => {
    if (!q) return [];
    const nq = normalize(q);
    return brands
      .filter((b: any) => b.slug && normalize(b.name ?? "").includes(nq))
      .slice(0, MAX_QUICK);
  }, [q, brands]);

  // filas planas (para navegación con teclado)
  const rows: Row[] = useMemo(() => {
    if (!q) {
      return recents.map((term) => ({ kind: "recent", term }) as Row);
    }
    const out: Row[] = [];
    for (const c of quickCategories)
      out.push({ kind: "category", slug: c.slug, name: c.name, emoji: c.emoji });
    for (const b of quickBrands) out.push({ kind: "brand", slug: b.slug, name: b.name });
    for (const r of matches.slice(0, MAX_PRODUCTS)) {
      const p = r.product;
      out.push({
        kind: "product",
        urlSlug: p.urlSlug,
        name: p.name,
        brand: p.brandName,
        image: p.images[0] ?? "",
        price: p.priceT4 || p.priceRetailDisplay,
      });
    }
    if (matches.length > 0)
      out.push({ kind: "viewall", term: q, count: matches.length });
    return out;
  }, [q, recents, quickCategories, quickBrands, matches]);

  useEffect(() => setActive(-1), [q]);

  const go = (to: string) => {
    pushRecentSearch(q);
    setOpen(false);
    setActive(-1);
    navigate(to);
  };

  const submit = (term: string) => {
    const t = term.trim();
    if (!t) return;
    pushRecentSearch(t);
    setOpen(false);
    setActive(-1);
    navigate(`/catalogo?q=${encodeURIComponent(t)}`);
  };

  const runRow = (row: Row) => {
    switch (row.kind) {
      case "product":
        go(`/productos/${row.urlSlug}`);
        break;
      case "category":
        go(`/categoria/${row.slug}`);
        break;
      case "brand":
        go(`/marcas/${row.slug}`);
        break;
      case "recent":
        setValue(row.term);
        submit(row.term);
        break;
      case "viewall":
        submit(row.term);
        break;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < rows.length) runRow(rows[active]);
      else submit(value);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const openRecents = () => {
    setRecents(getRecentSearches());
    setOpen(true);
  };

  const showDropdown = open && (rows.length > 0 || (!!q && matches.length === 0));

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        role="search"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={openRecents}
            onKeyDown={onKeyDown}
            placeholder="Buscar productos…"
            className="pl-9 pr-9 h-9 rounded-full bg-muted/40"
            aria-label="Buscar productos"
            autoFocus={autoFocus}
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              aria-label="Limpiar"
              onClick={() => {
                setValue("");
                setActive(-1);
                openRecents();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border bg-popover shadow-elegant overflow-hidden max-h-[70vh] overflow-y-auto">
          {/* Recientes (campo vacío) */}
          {!q && rows.length > 0 && (
            <div className="py-1">
              <div className="flex items-center justify-between px-3 pt-2 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Búsquedas recientes
                </span>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    clearRecentSearches();
                    setRecents([]);
                  }}
                >
                  Borrar
                </button>
              </div>
              {rows.map((row, i) =>
                row.kind === "recent" ? (
                  <button
                    key={`r-${row.term}`}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => runRow(row)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                      active === i ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{row.term}</span>
                  </button>
                ) : null,
              )}
            </div>
          )}

          {/* Sin resultados */}
          {q && matches.length === 0 && quickCategories.length === 0 && quickBrands.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No encontramos productos para “{q}”.
            </div>
          )}

          {/* Atajos categoría / marca */}
          {q &&
            rows.map((row, i) => {
              if (row.kind === "category")
                return (
                  <button
                    key={`c-${row.slug}`}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => runRow(row)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                      active === i ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                  >
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>
                      Ver todo en <span className="font-semibold">{row.name}</span>
                    </span>
                  </button>
                );
              if (row.kind === "brand")
                return (
                  <button
                    key={`b-${row.slug}`}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => runRow(row)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                      active === i ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                  >
                    <Store className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>
                      Marca <span className="font-semibold">{row.name}</span>
                    </span>
                  </button>
                );
              return null;
            })}

          {/* Productos */}
          {q &&
            rows.map((row, i) =>
              row.kind === "product" ? (
                <button
                  key={`p-${row.urlSlug}`}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runRow(row)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left ${
                    active === i ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  <div className="w-10 h-10 shrink-0 rounded-md bg-white overflow-hidden flex items-center justify-center">
                    {row.image ? (
                      <img
                        src={row.image}
                        alt={row.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-tight line-clamp-1">
                      <Highlight text={row.name} tokens={tokens} />
                    </div>
                    {row.brand && (
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {row.brand}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-bold text-primary shrink-0">
                    {formatPrice(row.price)}
                  </div>
                </button>
              ) : null,
            )}

          {/* Ver todos */}
          {q &&
            rows.map((row, i) =>
              row.kind === "viewall" ? (
                <button
                  key="viewall"
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runRow(row)}
                  className={`w-full px-3 py-2.5 text-center text-sm font-semibold text-primary border-t ${
                    active === i ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  Ver todos los resultados ({row.count})
                </button>
              ) : null,
            )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
