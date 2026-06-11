import { Plus, Minus, Trash2 } from "lucide-react";

interface QuantityStepperProps {
  quantity: number;
  onMinus: () => void;
  onPlus: () => void;
  /** Permite bajar a 0 (quitar). En 1 el botón "menos" se vuelve papelera. */
  allowZero?: boolean;
  max?: number;
  className?: string;
}

/**
 * Contador segmentado compartido (− N +). Mismo diseño en Mis grupos, carrito
 * y popups de agregado, para que el control de cantidad sea idéntico en todo el sitio.
 */
export const QuantityStepper = ({
  quantity,
  onMinus,
  onPlus,
  allowZero = false,
  max = 99,
  className = "",
}: QuantityStepperProps) => {
  const removeOnMinus = allowZero && quantity <= 1;
  return (
    <div
      className={`inline-flex items-center rounded-md border border-input flex-shrink-0 overflow-hidden${
        className ? ` ${className}` : ""
      }`}
    >
      <button
        type="button"
        className="h-8 px-3 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        onClick={onMinus}
        disabled={!allowZero && quantity <= 1}
        aria-label={removeOnMinus ? "Quitar" : "Restar"}
      >
        {removeOnMinus ? (
          <Trash2 className="w-3.5 h-3.5" />
        ) : (
          <Minus className="w-3.5 h-3.5" />
        )}
      </button>
      <span className="w-9 text-center font-semibold text-sm border-x border-input leading-8">
        {quantity}
      </span>
      <button
        type="button"
        className="h-8 px-3 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        onClick={onPlus}
        disabled={quantity >= max}
        aria-label="Sumar"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default QuantityStepper;
