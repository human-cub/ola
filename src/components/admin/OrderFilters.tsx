import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Archive } from "lucide-react";

interface OrderFiltersProps {
  showArchive: boolean;
  onToggleArchive: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const OrderFilters = ({
  showArchive,
  onToggleArchive,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
}: OrderFiltersProps) => {
  return (
    <>
      {/* Archive Toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant={showArchive ? "default" : "outline"}
          size="sm"
          onClick={onToggleArchive}
          className="gap-2"
        >
          <Archive className="w-4 h-4" />
          {showArchive ? "Volver a activos" : "Ver archivo"}
        </Button>
        {showArchive && (
          <span className="text-sm text-muted-foreground">Mostrando pedidos entregados y cancelados</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, email o teléfono..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="immediate">Inmediato</SelectItem>
            <SelectItem value="collective">Colectivo</SelectItem>
            <SelectItem value="mayorista">Mayorista</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {showArchive ? (
              <>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
