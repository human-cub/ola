// Argentina provinces with their localities
export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán"
] as const;

// Major cities in CABA (barrios)
export const CABA_LOCALITIES = [
  "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", 
  "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución", 
  "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos",
  "Monte Castro", "Monserrat", "Nueva Pompeya", "Núñez", "Palermo", 
  "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios",
  "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal",
  "San Nicolás", "San Telmo", "Versalles", "Villa Crespo", "Villa del Parque",
  "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro",
  "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo",
  "Villa Santa Rita", "Villa Soldati", "Villa Urquiza", "Vélez Sársfield"
];

// Major cities in AMBA (Gran Buenos Aires)
export const AMBA_LOCALITIES = [
  "Almirante Brown", "Avellaneda", "Berazategui", "Berisso", "Campana",
  "Cañuelas", "Ensenada", "Escobar", "Esteban Echeverría", "Exaltación de la Cruz",
  "Ezeiza", "Florencio Varela", "General Las Heras", "General Rodríguez",
  "General San Martín", "Hurlingham", "Ituzaingó", "José C. Paz", "La Matanza",
  "La Plata", "Lanús", "Lomas de Zamora", "Luján", "Malvinas Argentinas",
  "Marcos Paz", "Merlo", "Moreno", "Morón", "Pilar", "Presidente Perón",
  "Quilmes", "San Fernando", "San Isidro", "San Miguel", "San Vicente",
  "Tigre", "Tres de Febrero", "Vicente López", "Zárate",
  // Specific localities
  "Adrogué", "Banfield", "Bernal", "Burzaco", "Caseros", "Castelar",
  "City Bell", "Claypole", "Dock Sud", "Don Bosco", "El Palomar",
  "El Talar", "Florencio Varela", "Gonnet", "González Catán", "Grand Bourg",
  "Haedo", "Hudson", "José León Suárez", "Llavallol", "Los Polvorines",
  "Martínez", "Olivos", "Pablo Podestá", "Quilmes Oeste", "Rafael Calzada",
  "Ramos Mejía", "Remedios de Escalada", "Sarandí", "San Justo",
  "Temperley", "Turdera", "Villa Ballester", "Villa Bosch", "Villa Domínico",
  "Villa Luzuriaga", "Villa Madero", "Wilde", "William Morris"
];

// Major cities in other provinces
export const MAJOR_CITIES: Record<string, string[]> = {
  "Buenos Aires": [
    ...AMBA_LOCALITIES,
    "Bahía Blanca", "Mar del Plata", "Tandil", "Necochea", "Olavarría",
    "Junín", "Pergamino", "San Nicolás", "Zárate", "Campana"
  ],
  "Córdoba": [
    "Córdoba Capital", "Río Cuarto", "Villa María", "San Francisco", 
    "Villa Carlos Paz", "Alta Gracia", "Río Tercero", "Bell Ville",
    "Villa Allende", "La Calera", "Jesús María", "Cosquín"
  ],
  "Santa Fe": [
    "Rosario", "Santa Fe Capital", "Rafaela", "Venado Tuerto", 
    "Reconquista", "Villa Gobernador Gálvez", "Casilda", "San Lorenzo"
  ],
  "Mendoza": [
    "Mendoza Capital", "San Rafael", "Godoy Cruz", "Guaymallén",
    "Las Heras", "Maipú", "Luján de Cuyo", "Tunuyán", "San Martín"
  ],
  "Tucumán": [
    "San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Banda del Río Salí",
    "Concepción", "Monteros", "Famaillá"
  ],
  "Salta": [
    "Salta Capital", "San Ramón de la Nueva Orán", "Tartagal", 
    "General Güemes", "Cafayate", "Metán"
  ],
  "Entre Ríos": [
    "Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay",
    "Gualeguay", "Colón", "Victoria", "Villaguay"
  ],
  "Misiones": [
    "Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Montecarlo"
  ],
  "Corrientes": [
    "Corrientes Capital", "Goya", "Paso de los Libres", "Mercedes", "Curuzú Cuatiá"
  ],
  "Chaco": [
    "Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela", 
    "General San Martín", "Barranqueras"
  ],
  "San Juan": [
    "San Juan Capital", "Rawson", "Rivadavia", "Chimbas", "Santa Lucía"
  ],
  "Jujuy": [
    "San Salvador de Jujuy", "Palpalá", "San Pedro de Jujuy", 
    "Libertador General San Martín", "Humahuaca", "Tilcara"
  ],
  "Río Negro": [
    "Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti", "Villa Regina"
  ],
  "Neuquén": [
    "Neuquén Capital", "San Martín de los Andes", "Cutral Có", 
    "Centenario", "Plottier", "Villa La Angostura"
  ],
  "Formosa": [
    "Formosa Capital", "Clorinda", "Pirané", "El Colorado"
  ],
  "Chubut": [
    "Rawson", "Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel"
  ],
  "San Luis": [
    "San Luis Capital", "Villa Mercedes", "Merlo", "La Punta"
  ],
  "Catamarca": [
    "San Fernando del Valle de Catamarca", "Santa María", "Andalgalá", "Tinogasta"
  ],
  "La Rioja": [
    "La Rioja Capital", "Chilecito", "Aimogasta", "Chamical"
  ],
  "La Pampa": [
    "Santa Rosa", "General Pico", "Toay", "General Acha"
  ],
  "Santiago del Estero": [
    "Santiago del Estero Capital", "La Banda", "Termas de Río Hondo", "Añatuya"
  ],
  "Santa Cruz": [
    "Río Gallegos", "Caleta Olivia", "El Calafate", "Pico Truncado", "Puerto Deseado"
  ],
  "Tierra del Fuego": [
    "Ushuaia", "Río Grande", "Tolhuin"
  ]
};

// Postal code ranges for delivery zones
export function getDeliveryZone(postalCode: string, province: string, city: string): 'caba' | 'amba' | 'other' {
  const cp = parseInt(postalCode, 10);
  
  // Check by postal code first
  if (!isNaN(cp)) {
    // CABA: 1000-1499
    if (cp >= 1000 && cp <= 1499) {
      return 'caba';
    }
    // AMBA postal codes (approximate ranges)
    if (
      (cp >= 1600 && cp <= 1699) || // Zona Norte
      (cp >= 1700 && cp <= 1799) || // Zona Oeste  
      (cp >= 1800 && cp <= 1899) || // Zona Sur
      (cp >= 1900 && cp <= 1999)    // La Plata, Berisso, Ensenada
    ) {
      return 'amba';
    }
  }
  
  // Check by province
  if (province === "Ciudad Autónoma de Buenos Aires") {
    return 'caba';
  }
  
  // Check by city name
  if (AMBA_LOCALITIES.some(loc => 
    city.toLowerCase().includes(loc.toLowerCase()) || 
    loc.toLowerCase().includes(city.toLowerCase())
  )) {
    return 'amba';
  }
  
  return 'other';
}

// Get localities for a province
export function getLocalitiesForProvince(province: string): string[] {
  if (province === "Ciudad Autónoma de Buenos Aires") {
    return CABA_LOCALITIES;
  }
  return MAJOR_CITIES[province] || [];
}

// Search localities matching a query
export function searchLocalities(province: string, query: string): string[] {
  const localities = getLocalitiesForProvince(province);
  if (!query || query.length < 2) return localities.slice(0, 10);
  
  const lowerQuery = query.toLowerCase();
  return localities
    .filter(loc => loc.toLowerCase().includes(lowerQuery))
    .slice(0, 10);
}
