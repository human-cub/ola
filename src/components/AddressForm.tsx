import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Truck, MapPin } from "lucide-react";
import {
  ARGENTINA_PROVINCES,
  CABA_PROVINCE_ALIASES,
  getDeliveryZone,
  searchLocalities,
  isCABAProvince,
} from "@/data/argentinaLocations";
import { cn } from "@/lib/utils";

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
  onDeliveryZoneChange?: (zone: 'caba' | 'gba' | 'other') => void;
  hideReferences?: boolean;
  title?: string;
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
  hideReferences = false,
  title = "Dirección de entrega",
}: AddressFormProps) => {
  const [deliveryZone, setDeliveryZone] = useState<'caba' | 'gba' | 'other' | 'pending'>('pending');
  const [cityQuery, setCityQuery] = useState(city);
  const [cityComboboxOpen, setCityComboboxOpen] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  // Check if current province is CABA (hide city field)
  const isCABA = isCABAProvince(province);
  
  // Check if Buenos Aires province (needs city selection before showing shipping cost)
  const isBuenosAires = province === "Buenos Aires";

  // Sync cityQuery with city prop
  useEffect(() => {
    setCityQuery(city);
  }, [city]);

  // Update delivery zone when address changes (based on Provincia + Ciudad only, not postal code)
  useEffect(() => {
    // CABA province - always free
    if (isCABA) {
      setDeliveryZone('caba');
      onDeliveryZoneChange?.('caba');
      return;
    }
    
    // Buenos Aires province - MUST wait for city selection
    if (isBuenosAires) {
      // No city selected yet - show nothing
      if (!city || city.trim().length < 2) {
        setDeliveryZone('pending');
        return;
      }
      // Check if city is CABA variant
      if (CABA_PROVINCE_ALIASES.some(alias => 
        city.toLowerCase() === alias.toLowerCase()
      )) {
        setDeliveryZone('caba');
        onDeliveryZoneChange?.('caba');
        return;
      }
      // City selected - calculate zone based on city name (no postal code)
      const zone = getDeliveryZone('', province, city);
      setDeliveryZone(zone);
      onDeliveryZoneChange?.(zone);
      return;
    }
    
    // Other provinces - always $5000 immediately
    if (province && !isBuenosAires && !isCABA) {
      setDeliveryZone('other');
      onDeliveryZoneChange?.('other');
      return;
    }
    
    // No province selected yet
    setDeliveryZone('pending');
  }, [province, city, onDeliveryZoneChange, isCABA, isBuenosAires]);

  // Postal code is now optional and does not auto-fill province/city
  // Delivery cost is calculated based on Provincia + Ciudad/Localidad only

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

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setCityQuery(selectedCity);
    setCityComboboxOpen(false);
  };

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    
    // If CABA is selected, clear city (not needed)
    if (isCABAProvince(newProvince)) {
      setCity("");
      setCityQuery("");
      setCityComboboxOpen(false);
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
        {title}
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
            placeholder="3 B"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="postalCode" className="text-sm">Código postal</Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(e) => {
              const value = e.target.value.slice(0, 8);
              setPostalCode(value);
            }}
            placeholder="1043"
            maxLength={8}
          />
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
          <Popover open={cityComboboxOpen} onOpenChange={setCityComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                id="city"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={cityComboboxOpen}
                className={cn(
                  "h-10 w-full max-w-none justify-between rounded-md px-3 py-2 text-left text-sm font-normal tracking-normal shadow-none hover:bg-background hover:shadow-none mx-0",
                  !city && "text-muted-foreground",
                  errors.city && "border-destructive"
                )}
              >
                <span className="truncate">
                  {city || "Escribí tu ciudad o localidad"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  value={cityQuery}
                  onValueChange={(value) => {
                    setCityQuery(value);
                    setCity(value);
                  }}
                  placeholder="Escribí tu ciudad o localidad"
                />
                <CommandList className="max-h-[200px]">
                  <CommandEmpty>No se encontraron localidades.</CommandEmpty>
                  {citySuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={() => handleCitySelect(suggestion)}
                      className="px-3 py-2 text-sm"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          city === suggestion ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>
      )}

      {!hideReferences && (
        <div className="space-y-1">
          <Label htmlFor="references" className="text-sm">Referencias</Label>
          <Textarea
            id="references"
            value={references}
            onChange={(e) => setReferences(e.target.value)}
            placeholder="Código promocional, preferencias, timbre, indicaciones, etc."
            rows={2}
            className="resize-none"
          />
        </div>
      )}

      {/* Delivery Zone Indicator - hide if pending */}
      {deliveryZone === 'caba' && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">¡Envío gratis en CABA!</span>
        </div>
      )}
      {deliveryZone === 'gba' && (
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
          <Truck className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Envío GBA: $3.000</span>
        </div>
      )}
      {deliveryZone === 'other' && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <Truck className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Envío resto del país: $5.000</span>
        </div>
      )}
      {/* No indicator shown when deliveryZone is 'pending' */}
    </div>
  );
};
