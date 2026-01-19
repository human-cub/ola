import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Truck, MapPin } from "lucide-react";
import {
  ARGENTINA_PROVINCES,
  getDeliveryZone,
  searchLocalities,
  isCABAProvince,
} from "@/data/argentinaLocations";

interface AddressFormProps {
  street: string;
  setStreet: (value: string) => void;
  streetNumber: string;
  setStreetNumber: (value: string) => void;
  floor: string;
  setFloor: (value: string) => void;
  postalCode: string;
  setPostalCode: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  province: string;
  setProvince: (value: string) => void;
  references: string;
  setReferences: (value: string) => void;
  errors: Record<string, string>;
  onDeliveryZoneChange?: (zone: 'caba' | 'amba' | 'other') => void;
}

export const AddressForm = ({
  street,
  setStreet,
  streetNumber,
  setStreetNumber,
  floor,
  setFloor,
  postalCode,
  setPostalCode,
  city,
  setCity,
  province,
  setProvince,
  references,
  setReferences,
  errors,
  onDeliveryZoneChange,
}: AddressFormProps) => {
  const [deliveryZone, setDeliveryZone] = useState<'caba' | 'amba' | 'other'>('caba');
  const [cityQuery, setCityQuery] = useState(city);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Check if current province is CABA (hide city field)
  const isCABA = isCABAProvince(province);

  // Update delivery zone when address changes
  useEffect(() => {
    const zone = getDeliveryZone(postalCode, province, city);
    setDeliveryZone(zone);
    onDeliveryZoneChange?.(zone);
  }, [postalCode, province, city, onDeliveryZoneChange]);

  // Update city suggestions based on province and query
  useEffect(() => {
    if (isCABA) {
      setCitySuggestions([]);
      return;
    }
    if (cityQuery.length >= 2) {
      const suggestions = searchLocalities(province, cityQuery);
      setCitySuggestions(suggestions);
    } else {
      setCitySuggestions(searchLocalities(province, ""));
    }
  }, [cityQuery, province, isCABA]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node)
      ) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setCityQuery(selectedCity);
    setShowCitySuggestions(false);
  };

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    
    // If CABA is selected, clear city (not needed)
    if (isCABAProvince(newProvince)) {
      setCity("");
      setCityQuery("");
      setDeliveryZone('caba');
      onDeliveryZoneChange?.('caba');
    } else {
      // Reset city when province changes
      setCity("");
      setCityQuery("");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Dirección de entrega
      </h2>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="street" className="text-sm">Calle *</Label>
          <Input
            id="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Av. Corrientes"
            className={errors.street ? "border-destructive" : ""}
          />
          {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="number" className="text-sm">Número *</Label>
          <Input
            id="number"
            value={streetNumber}
            onChange={(e) => setStreetNumber(e.target.value)}
            placeholder="1234"
            className={errors.number ? "border-destructive" : ""}
          />
          {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="floor" className="text-sm">Piso/Depto</Label>
          <Input
            id="floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="3° B"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="postalCode" className="text-sm">CP *</Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPostalCode(value);
            }}
            placeholder="1043"
            maxLength={4}
            className={errors.postalCode ? "border-destructive" : ""}
          />
          {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="province" className="text-sm">Provincia *</Label>
        <Select value={province} onValueChange={handleProvinceChange}>
          <SelectTrigger id="province" className={errors.province ? "border-destructive" : ""}>
            <SelectValue placeholder="Seleccioná provincia" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-background">
            {ARGENTINA_PROVINCES.map((prov) => (
              <SelectItem key={prov} value={prov}>
                {prov}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.province && <p className="text-xs text-destructive">{errors.province}</p>}
      </div>

      {/* City field - hidden for CABA provinces */}
      {!isCABA && (
        <div className="space-y-1 relative">
          <Label htmlFor="city" className="text-sm">Ciudad/Localidad *</Label>
          <Input
            ref={cityInputRef}
            id="city"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setCity(e.target.value);
              setShowCitySuggestions(true);
            }}
            onFocus={() => setShowCitySuggestions(true)}
            placeholder="Escribí tu ciudad o localidad"
            className={errors.city ? "border-destructive" : ""}
            autoComplete="off"
          />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-auto"
            >
              {citySuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  onClick={() => handleCitySelect(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="references" className="text-sm">Referencias</Label>
        <Textarea
          id="references"
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          placeholder="Timbre, indicaciones, etc."
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Delivery Zone Indicator */}
      {deliveryZone === 'caba' ? (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">¡Envío gratis en CABA!</span>
        </div>
      ) : deliveryZone === 'amba' ? (
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
          <Truck className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Envío AMBA: $3.000</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <Truck className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Envío resto del país: $5.000</span>
        </div>
      )}
    </div>
  );
};
