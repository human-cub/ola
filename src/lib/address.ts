export interface AddressData {
  street: string;
  number: string;
  floor: string;
  postalCode: string;
  city: string;
  province: string;
  references: string;
}

const emptyAddress: AddressData = {
  street: "",
  number: "",
  floor: "",
  postalCode: "",
  city: "",
  province: "",
  references: "",
};

export function parseAddress(addressJson: string | null): AddressData | null {
  if (!addressJson) return null;

  try {
    const parsed = JSON.parse(addressJson);
    if (typeof parsed !== "object" || parsed === null) return null;

    return {
      street: parsed.street || "",
      number: parsed.number || "",
      floor: parsed.floor || "",
      postalCode: parsed.postalCode || "",
      city: parsed.city || "",
      province: parsed.province || "",
      references: parsed.references || "",
    };
  } catch {
    return null;
  }
}

export function parseAddressOrEmpty(addressJson: string | null): AddressData {
  return parseAddress(addressJson) ?? emptyAddress;
}

export function formatAddress(address: string | null): string {
  if (!address) return "-";

  try {
    const parsed = JSON.parse(address);
    if (typeof parsed === "object" && parsed !== null) {
      const parts = [
        parsed.street,
        parsed.number,
        parsed.floor,
        parsed.postalCode,
        parsed.city,
        parsed.province,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "-";
    }
    return address;
  } catch {
    return address;
  }
}
