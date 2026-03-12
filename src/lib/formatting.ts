export const formatPrice = (price: number): string => {
  return `$${Math.round(price).toLocaleString("es-AR")}`;
};

export const formatDateLong = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

export const formatDateNatural = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatDateCompact = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFullName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback = "",
): string => {
  const name = [firstName, lastName].filter(Boolean).join(" ");
  return name || fallback;
};
