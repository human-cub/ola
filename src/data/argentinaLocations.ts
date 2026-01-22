// Argentina provinces with their localities
// CABA, Capital Federal are aliases for Ciudad Autónoma de Buenos Aires
export const CABA_PROVINCE_ALIASES = [
  "Capital Federal (CABA)",
  "Ciudad Autónoma de Buenos Aires",
  "CABA",
  "Capital Federal"
];

export const ARGENTINA_PROVINCES = [
  "Capital Federal (CABA)",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
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

// Check if a province is CABA (any alias)
export function isCABAProvince(province: string): boolean {
  const normalizedProvince = province.toLowerCase().trim();
  return CABA_PROVINCE_ALIASES.some(alias => 
    normalizedProvince === alias.toLowerCase() ||
    normalizedProvince.includes("capital federal") ||
    normalizedProvince.includes("caba") ||
    normalizedProvince.includes("ciudad autónoma")
  );
}

// All CABA barrios
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

// All AMBA localities (partidos and main cities)
export const AMBA_LOCALITIES = [
  // Partidos
  "Almirante Brown", "Avellaneda", "Berazategui", "Berisso", "Campana",
  "Cañuelas", "Ensenada", "Escobar", "Esteban Echeverría", "Exaltación de la Cruz",
  "Ezeiza", "Florencio Varela", "General Las Heras", "General Rodríguez",
  "General San Martín", "Hurlingham", "Ituzaingó", "José C. Paz", "La Matanza",
  "La Plata", "Lanús", "Lomas de Zamora", "Luján", "Malvinas Argentinas",
  "Marcos Paz", "Merlo", "Moreno", "Morón", "Pilar", "Presidente Perón",
  "Quilmes", "San Fernando", "San Isidro", "San Miguel", "San Vicente",
  "Tigre", "Tres de Febrero", "Vicente López", "Zárate",
  // Main localities
  "Adrogué", "Banfield", "Bernal", "Burzaco", "Caseros", "Castelar",
  "City Bell", "Claypole", "Dock Sud", "Don Bosco", "El Palomar",
  "El Talar", "Florencio Varela", "Gonnet", "González Catán", "Grand Bourg",
  "Haedo", "Hudson", "José León Suárez", "Llavallol", "Los Polvorines",
  "Martínez", "Olivos", "Pablo Podestá", "Quilmes Oeste", "Rafael Calzada",
  "Ramos Mejía", "Remedios de Escalada", "Sarandí", "San Justo",
  "Temperley", "Turdera", "Villa Ballester", "Villa Bosch", "Villa Domínico",
  "Villa Luzuriaga", "Villa Madero", "Wilde", "William Morris",
  // Additional localities
  "Acassuso", "Beccar", "Boulogne", "Florida", "La Lucila", "Munro",
  "San Fernando", "Victoria", "Villa Adelina", "Villa Martelli",
  "Bella Vista", "Del Viso", "Fátima", "Manuel Alberti", "Maquinista Savio",
  "Villa Rosa", "Tortuguitas", "Ing. Maschwitz", "Garín", "Matheu",
  "Pacheco", "Talar de Pacheco", "General Pacheco", "Benavídez", "Dique Luján",
  "Don Torcuato", "El Talar", "Los Troncos", "Nordelta", "Ricardo Rojas",
  "Rincón de Milberg", "San Isidro Labrador",
  "Ciudadela", "El Libertador", "Loma Hermosa", "José Ingenieros",
  "San Andrés", "Santos Lugares", "Villa Ballester", "Villa Lynch",
  "Villa Maipú", "Billinghurst",
  "Carapachay", "Florida Este", "Florida Oeste", "La Lucila", "Munro",
  "Olivos", "Vicente López", "Villa Martelli",
  "Aldo Bonzi", "Ciudad Evita", "González Catán", "Gregorio de Laferrere",
  "Isidro Casanova", "La Tablada", "Lomas del Mirador", "Rafael Castillo",
  "San Justo", "Tapiales", "Villa Luzuriaga", "Virrey del Pino",
  "20 de Junio", "9 de Abril", "Canning", "El Jagüel", "Luis Guillón",
  "Monte Grande", "Tristán Suárez",
  "Alejandro Korn", "Domselaar", "San Vicente",
  "Glew", "Longchamps", "José Mármol", "Ministro Rivadavia", "Rafael Calzada",
  "Abasto", "Arturo Seguí", "City Bell", "El Peligro", "Etcheverry",
  "Gorina", "Gonnet", "Hernández", "Lisandro Olmos", "Los Hornos",
  "Manuel B. Gonnet", "Melchor Romero", "Ringuelet", "San Carlos",
  "Tolosa", "Villa Elisa", "Villa Elvira",
  "Ezpeleta", "Quilmes Oeste", "San Francisco Solano",
  "Solano", "Bernal Oeste", "Don Bosco",
  "Área de Promoción El Triángulo", "Bosques", "Hudson", "Pereyra",
  "Ranelagh", "Sourigues", "Villa España", "Plátanos", "Gutiérrez",
  "Ingeniero Allan", "La Capilla", "Villa Brown",
  "Gerli", "Lanús Este", "Lanús Oeste", "Monte Chingolo", "Remedios de Escalada",
  "Valentín Alsina", "Crucecita",
  "Banfield", "Llavallol", "Temperley", "Turdera",
  "Villa Fiorito", "Villa Centenario", "Villa Industriales",
  "Avellaneda Centro", "Dock Sud", "Piñeyro", "Sarandí", "Villa Domínico", "Wilde",
  "Berazategui Centro", "El Pato", "Juan María Gutiérrez", "Villa España",
  "Caseros", "Ciudad Jardín Lomas del Palomar", "Ciudadela", "El Libertador",
  "José Ingenieros", "Loma Hermosa", "Martín Coronado", "Pablo Podestá",
  "Sáenz Peña", "Santos Lugares", "Villa Bosch", "Villa Raffo",
  "Hurlingham Centro", "Villa Santos Tesei", "William C. Morris",
  "Bella Vista", "Muñiz", "San Miguel Centro",
  "Grand Bourg", "Ingeniero Pablo Nogués", "Los Polvorines", "Pablo Nogués",
  "Tortuguitas",
  "Del Viso", "Fátima", "La Lonja", "Manuel Alberti", "Manzanares",
  "Presidente Derqui", "Villa Astolfi", "Villa del Pilar", "Villa Rosa",
  "Bosques", "El Pato", "Francisco Álvarez", "La Reja", "Mariano Acosta",
  "Paso del Rey", "Pontevedra", "San Antonio de Padua", "Libertad",
  "Cuartel V", "La Perlita", "Moreno Centro", "Trujui",
  "Castelar", "El Palomar", "Haedo", "Morón Centro", "Villa Sarmiento",
  "Ituzaingó Centro", "Villa Udaondo",
  "Garín", "Ingeniero Maschwitz", "Loma Verde", "Maquinista Savio",
  "Campana Centro", "Los Cardales",
  "Zárate Centro", "Lima",
  "Luján Centro", "Olivera", "Open Door", "Torres",
  "Capilla del Señor", "Los Cardales", "Pavón",
  "General Rodríguez Centro", "La Bota",
  "Marcos Paz Centro", "Libertad",
  "Cañuelas Centro", "Máximo Paz", "Vicente Casares",
  "Presidente Perón", "Guernica",
  "Ezeiza Centro", "La Unión", "Tristán Suárez",
  "Ensenada Centro", "Punta Lara",
  "Berisso Centro", "Los Talas"
];

// Complete list of cities by province
export const MAJOR_CITIES: Record<string, string[]> = {
  "Buenos Aires": [
    // Add CABA aliases as valid localities in Buenos Aires
    "Capital Federal (CABA)",
    ...AMBA_LOCALITIES,
    // Interior de Buenos Aires (excluding duplicates already in AMBA_LOCALITIES)
    "Bahía Blanca", "Mar del Plata", "Tandil", "Necochea", "Olavarría",
    "Junín", "Pergamino", "San Nicolás de los Arroyos", "Azul", "Tres Arroyos",
    "Chivilcoy", "Mercedes", "Bragado", "Chacabuco", "9 de Julio",
    "Trenque Lauquen", "Pehuajó", "Carlos Casares", "General Villegas",
    "Lincoln", "Bolívar", "General Pico", "25 de Mayo", "Saladillo",
    "Lobos", "Navarro", "Suipacha", "Carmen de Areco", "San Antonio de Areco",
    "Baradero", "San Pedro", "Ramallo", "Arrecifes",
    "Salto", "Rojas", "Colón", "Lobería", "General Alvarado", "Miramar",
    "Mar de Ajó", "San Clemente del Tuyú", "Santa Teresita", "Mar del Tuyú",
    "San Bernardo", "Pinamar", "Villa Gesell", "Cariló", "Valeria del Mar",
    "Monte Hermoso", "Punta Alta", "Coronel Rosales", "Villarino", "Patagones",
    "General Pueyrredón", "Balcarce", "General Belgrano", "Las Flores",
    "Rauch", "Ayacucho", "Dolores", "Maipú", "General Madariaga",
    "General Lavalle", "Tordillo", "Castelli", "Chascomús", "Pila",
    "Lezama", "Magdalena", "Brandsen", "Punta Indio", "Coronel Brandsen"
  ],
  "Córdoba": [
    "Córdoba Capital", "Río Cuarto", "Villa María", "San Francisco", 
    "Villa Carlos Paz", "Alta Gracia", "Río Tercero", "Bell Ville",
    "Villa Allende", "La Calera", "Jesús María", "Cosquín", "Cruz del Eje",
    "La Falda", "Carlos Paz", "Mina Clavero", "Villa Dolores", "Dean Funes",
    "Morteros", "Arroyito", "Las Varillas", "Oncativo", "Río Segundo",
    "Pilar", "Río Ceballos", "Salsipuedes", "Unquillo", "Mendiolaza",
    "Villa General Belgrano", "Santa Rosa de Calamuchita", "Embalse",
    "Almafuerte", "General Deheza", "General Cabrera", "Laboulaye",
    "Huinca Renancó", "Marcos Juárez", "Leones", "Monte Maíz",
    "Villa Cura Brochero", "Nono", "Villa de las Rosas", "San Javier",
    "Villa Giardino", "La Cumbre", "Los Cocos", "Capilla del Monte",
    "Agua de Oro", "El Manzano", "Colonia Caroya", "Sinsacate",
    "Anisacate", "La Bolsa", "Villa Ciudad de América", "San Antonio de Arredondo"
  ],
  "Santa Fe": [
    "Rosario", "Santa Fe Capital", "Rafaela", "Venado Tuerto", 
    "Reconquista", "Villa Gobernador Gálvez", "Casilda", "San Lorenzo",
    "Santo Tomé", "Esperanza", "Cañada de Gómez", "Sunchales", "Villa Constitución",
    "Funes", "Roldán", "Capitán Bermúdez", "Granadero Baigorria", "Pérez",
    "Arroyo Seco", "Carcarañá", "Alcorta", "Arequito", "Armstrong",
    "Las Parejas", "Las Rosas", "San Jorge", "Sastre", "Totoras",
    "Avellaneda", "Tostado", "Vera", "Calchaquí", "Ceres", "San Cristóbal",
    "San Justo", "San Javier", "Helvecia", "Cayastá", "Coronda",
    "Gálvez", "San Genaro", "Firmat", "Rufino", "Melincué",
    "Wheelwright", "Villa Cañás", "Murphy", "Bouquet", "Christophersen"
  ],
  "Mendoza": [
    "Mendoza Capital", "San Rafael", "Godoy Cruz", "Guaymallén",
    "Las Heras", "Maipú", "Luján de Cuyo", "Tunuyán", "San Martín",
    "Rivadavia", "Junín", "Tupungato", "General Alvear", "Malargüe",
    "Santa Rosa", "La Paz", "Lavalle", "Chacras de Coria", "Vistalba",
    "Agrelo", "Perdriel", "Ugarteche", "Coquimbito", "Fray Luis Beltrán",
    "Rodeo de la Cruz", "Palmira", "La Consulta", "Eugenio Bustos",
    "Colonia Las Rosas", "Alto Verde", "Villa Atuel", "Monte Comán",
    "Bowen", "Real del Padre", "Jaime Prats", "25 de Mayo", "Medrano",
    "Villa Seca", "Barrio La Gloria", "El Algarrobal", "El Plumerillo"
  ],
  "Tucumán": [
    "San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Banda del Río Salí",
    "Concepción", "Monteros", "Famaillá", "Aguilares", "Juan Bautista Alberdi",
    "Simoca", "Lules", "Bella Vista", "Tafí del Valle", "Amaicha del Valle",
    "El Mollar", "Graneros", "La Cocha", "Leales", "Trancas", "Burruyacú",
    "Delfín Gallo", "El Manantial", "San Pablo", "Las Talitas",
    "Alderetes", "Villa Mariano Moreno", "San Andrés", "El Bracho",
    "Los Ralos", "Santa Lucía", "Villa Quinteros", "Acheral", "San Isidro de Lules"
  ],
  "Salta": [
    "Salta Capital", "San Ramón de la Nueva Orán", "Tartagal", 
    "General Güemes", "Cafayate", "Metán", "Rosario de la Frontera",
    "Joaquín V. González", "Embarcación", "Aguaray", "Profesor Salvador Mazza",
    "General Mosconi", "Pichanal", "Colonia Santa Rosa", "Hipólito Yrigoyen",
    "San José de Orquera", "Campo Quijano", "La Caldera", "Vaqueros",
    "San Lorenzo", "Cerrillos", "La Merced", "El Carril", "Chicoana",
    "Cachi", "Molinos", "San Carlos", "Animaná", "Angastaco",
    "Santa María", "La Candelaria", "El Jardín", "El Tala", "Apolinario Saravia",
    "Las Lajitas", "Rivadavia Banda Norte", "Rivadavia Banda Sur", "Iruya"
  ],
  "Entre Ríos": [
    "Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay",
    "Gualeguay", "Colón", "Victoria", "Villaguay", "Chajarí", "Federación",
    "San José", "Basavilbaso", "Nogoyá", "Crespo", "Diamante", "La Paz",
    "Federal", "Feliciano", "Islas del Ibicuy", "Larroque", "Urdinarrain",
    "Rosario del Tala", "Maciá", "Hasenkamp", "Hernández", "Bovril",
    "Villa Elisa", "San Salvador", "Santa Elena", "Villa Mantero",
    "Ubajay", "Villa del Rosario", "Aldea San Antonio", "Oro Verde",
    "San Benito", "Cerrito", "María Grande", "Seguí", "Viale",
    "Ramírez", "Hernandarias", "Puerto Yeruá", "Pueblo General Belgrano"
  ],
  "Misiones": [
    "Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Montecarlo",
    "San Vicente", "Leandro N. Alem", "Apóstoles", "Jardín América",
    "Puerto Rico", "San Pedro", "Aristóbulo del Valle", "Campo Grande",
    "25 de Mayo", "Ruiz de Montoya", "Campo Viera", "Santo Pipó",
    "San Ignacio", "Puerto Esperanza", "Wanda", "Puerto Libertad",
    "Bernardo de Irigoyen", "San Antonio", "Alba Posse", "Panambí",
    "Dos de Mayo", "Colonia Aurora", "Campo Ramón", "Guaraní",
    "El Soberbio", "San Javier", "Florentino Ameghino", "Capioví",
    "Garuhapé", "Colonia Delicia", "Cerro Azul", "Gobernador Roca"
  ],
  "Corrientes": [
    "Corrientes Capital", "Goya", "Paso de los Libres", "Mercedes", "Curuzú Cuatiá",
    "Monte Caseros", "Esquina", "Bella Vista", "Santo Tomé", "Ituzaingó",
    "Alvear", "Empedrado", "Saladas", "San Luis del Palmar", "Itatí",
    "San Roque", "Sauce", "Lavalle", "Goya", "Santa Lucía",
    "Gobernador Virasoro", "Garruchos", "La Cruz", "Yapeyú", "Mburucuyá",
    "Concepción", "San Miguel", "Loreto", "Caá Catí", "Berón de Astrada"
  ],
  "Chaco": [
    "Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela", 
    "General San Martín", "Barranqueras", "Charata", "Quitilipi",
    "Las Breñas", "Machagai", "Juan José Castelli", "Fontana",
    "Puerto Tirol", "Tres Isletas", "General Pinedo", "Corzuela",
    "Pampa del Infierno", "Taco Pozo", "Miraflores", "Laguna Blanca",
    "Presidencia de la Plaza", "Villa Berthet", "Colonia Elisa",
    "Hermoso Campo", "San Bernardo", "Capitán Solari", "Colonia Benítez",
    "Puerto Vilelas", "Margarita Belén", "Basail", "Makallé"
  ],
  "San Juan": [
    "San Juan Capital", "Rawson", "Rivadavia", "Chimbas", "Santa Lucía",
    "Pocito", "Albardón", "Caucete", "9 de Julio", "Jáchal",
    "San Martín", "Sarmiento", "25 de Mayo", "Iglesia", "Calingasta",
    "Valle Fértil", "Ullum", "Zonda", "Angaco", "Desamparados",
    "Villa Media Agua", "Las Flores", "Trinidad", "Carpintería"
  ],
  "Jujuy": [
    "San Salvador de Jujuy", "Palpalá", "San Pedro de Jujuy", 
    "Libertador General San Martín", "Humahuaca", "Tilcara",
    "La Quiaca", "Perico", "El Carmen", "Monterrico", "Abra Pampa",
    "Yuto", "Calilegua", "Fraile Pintado", "Purmamarca", "Maimará",
    "Volcán", "Tumbaya", "Susques", "Coranzulí", "Rinconada",
    "Santa Catalina", "Yala", "Lozano", "San Antonio", "Reyes"
  ],
  "Río Negro": [
    "Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti", "Villa Regina",
    "Allen", "Catriel", "El Bolsón", "Choele Choel", "Cinco Saltos",
    "Centenario", "Fernández Oro", "Ingeniero Huergo", "Mainqué",
    "Cervantes", "Chichinales", "General Enrique Godoy", "Lamarque",
    "Luis Beltrán", "Darwin", "Pomona", "Río Colorado", "Conesa",
    "San Antonio Oeste", "Las Grutas", "Sierra Grande", "Valcheta",
    "Los Menucos", "Maquinchao", "Ingeniero Jacobacci", "Comallo",
    "Pilcaniyeu", "Ñorquinco", "El Cuy", "Dina Huapi", "Lago Puelo"
  ],
  "Neuquén": [
    "Neuquén Capital", "San Martín de los Andes", "Cutral Có", 
    "Centenario", "Plottier", "Villa La Angostura", "Junín de los Andes",
    "Zapala", "Chos Malal", "Senillosa", "Rincón de los Sauces",
    "Plaza Huincul", "Añelo", "San Patricio del Chañar", "Vista Alegre",
    "Las Lajas", "Loncopué", "Andacollo", "Buta Ranquil", "El Cholar",
    "Aluminé", "Villa Pehuenia", "Caviahue", "Copahue", "Piedra del Águila",
    "El Huecú", "Tricao Malal", "Los Miches", "Mariano Moreno"
  ],
  "Formosa": [
    "Formosa Capital", "Clorinda", "Pirané", "El Colorado",
    "Las Lomitas", "Ingeniero Juárez", "Laguna Blanca", "Ibarreta",
    "Comandante Fontana", "Estanislao del Campo", "General Güemes",
    "Laguna Yema", "Los Chiriguanos", "Misión Tacaaglé", "Pozo del Tigre",
    "Villa General Güemes", "Riacho He-Hé", "Laguna Naick Neck",
    "San Martín II", "Gran Guardia", "Mayor Villafañe", "El Espinillo"
  ],
  "Chubut": [
    "Rawson", "Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel",
    "Rada Tilly", "Gaiman", "Dolavon", "Puerto Pirámides", "Camarones",
    "Sarmiento", "Lago Puelo", "El Hoyo", "Epuyén", "Cholila",
    "Gobernador Costa", "Río Pico", "José de San Martín", "Tecka",
    "Paso de Indios", "Alto Río Senguer", "Río Mayo", "Facundo",
    "Ricardo Rojas", "28 de Julio", "Playa Unión", "Las Plumas"
  ],
  "San Luis": [
    "San Luis Capital", "Villa Mercedes", "Merlo", "La Punta",
    "Justo Daract", "La Toma", "Concarán", "Tilisarao", "Naschel",
    "Quines", "Candelaria", "Luján", "Juana Koslay", "Potrero de los Funes",
    "El Trapiche", "El Volcán", "Cortaderas", "Villa Larca", "Papagayos",
    "Santa Rosa del Conlara", "Villa del Carmen", "Buena Esperanza",
    "Unión", "Nueva Galia", "Fortuna", "Arizona", "Bagual"
  ],
  "Catamarca": [
    "San Fernando del Valle de Catamarca", "Santa María", "Andalgalá", "Tinogasta",
    "Belén", "Recreo", "Chumbicha", "Fiambalá", "Londres", "Hualfín",
    "San José", "Pomán", "Saujil", "Mutquín", "Colpes", "El Alto",
    "Ancasti", "La Paz", "Icaño", "Capayán", "Fray Mamerto Esquiú",
    "Valle Viejo", "Paclín", "Ambato", "La Puerta", "Los Varela"
  ],
  "La Rioja": [
    "La Rioja Capital", "Chilecito", "Aimogasta", "Chamical",
    "Villa Unión", "Chepes", "Sanagasta", "Famatina", "Nonogasta",
    "Arauco", "Aminga", "Anillaco", "Chuquis", "Malanzán", "Olta",
    "Patquía", "Ulapes", "Tama", "Vichigasta", "Los Sarmientos",
    "Guandacol", "Villa Castelli", "Jagüé", "Alto Carrizal"
  ],
  "La Pampa": [
    "Santa Rosa", "General Pico", "Toay", "General Acha",
    "Eduardo Castex", "Victorica", "Realicó", "Ingeniero Luiggi",
    "Intendente Alvear", "Macachín", "Catriló", "Quemú Quemú",
    "25 de Mayo", "Guatraché", "Winifreda", "Trenel", "Rancul",
    "Jacinto Arauz", "General San Martín", "Bernasconi", "La Adela",
    "Miguel Riglos", "Lonquimay", "Alpachiri", "Doblas", "Ataliva Roca"
  ],
  "Santiago del Estero": [
    "Santiago del Estero Capital", "La Banda", "Termas de Río Hondo", "Añatuya",
    "Frías", "Monte Quemado", "Quimilí", "Fernández", "Loreto", "Suncho Corral",
    "Bandera", "Campo Gallo", "Tintina", "Pinto", "Los Juríes",
    "Colonia Dora", "Herrera", "Villa Ojo de Agua", "Sumampa",
    "Selva", "Icaño", "Vilmer", "Beltrán", "Clodomira", "Choya"
  ],
  "Santa Cruz": [
    "Río Gallegos", "Caleta Olivia", "El Calafate", "Pico Truncado", "Puerto Deseado",
    "Las Heras", "San Julián", "Puerto Santa Cruz", "Perito Moreno",
    "Comandante Luis Piedra Buena", "28 de Noviembre", "Río Turbio",
    "Gobernador Gregores", "Los Antiguos", "El Chaltén", "Cañadón Seco",
    "Jaramillo", "Fitz Roy", "Koluel Kaike", "Bajo Caracoles"
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
  
  // Check by province (including CABA aliases)
  if (isCABAProvince(province)) {
    return 'caba';
  }
  
  // Check if city is a CABA alias (when province is Buenos Aires)
  if (CABA_PROVINCE_ALIASES.some(alias => 
    city.toLowerCase() === alias.toLowerCase()
  )) {
    return 'caba';
  }
  
  // Check by city name for AMBA
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
  // For any CABA alias, return CABA localities
  if (isCABAProvince(province)) {
    return CABA_LOCALITIES;
  }
  return MAJOR_CITIES[province] || [];
}

// Search localities matching a query - sorted with matches at top
export function searchLocalities(province: string, query: string): string[] {
  const localities = getLocalitiesForProvince(province);
  if (!query || query.length < 2) return localities.slice(0, 15);
  
  const lowerQuery = query.toLowerCase();
  
  // Filter matching localities
  const matching = localities.filter(loc => loc.toLowerCase().includes(lowerQuery));
  
  // Sort: exact matches first, then starts-with, then includes
  matching.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Exact match
    if (aLower === lowerQuery) return -1;
    if (bLower === lowerQuery) return 1;
    
    // Starts with query
    const aStarts = aLower.startsWith(lowerQuery);
    const bStarts = bLower.startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    // Otherwise alphabetical
    return a.localeCompare(b);
  });
  
  return matching.slice(0, 15);
}

// Postal code to location mapping - expanded ranges
// Returns province and optionally city based on postal code
export function getLocationByPostalCode(postalCode: string): { province: string; city?: string } | null {
  const cp = parseInt(postalCode, 10);
  if (isNaN(cp)) return null;

  // CABA: 1000-1499
  if (cp >= 1000 && cp <= 1499) {
    return { province: "Capital Federal (CABA)" };
  }

  // Buenos Aires province - extensive mapping
  // AMBA - Zona Norte: 1600-1699
  if (cp >= 1600 && cp <= 1699) {
    if (cp >= 1602 && cp <= 1605) return { province: "Buenos Aires", city: "Vicente López" };
    if (cp >= 1606 && cp <= 1609) return { province: "Buenos Aires", city: "San Isidro" };
    if (cp >= 1610 && cp <= 1619) return { province: "Buenos Aires", city: "San Fernando" };
    if (cp >= 1620 && cp <= 1639) return { province: "Buenos Aires", city: "Tigre" };
    if (cp >= 1640 && cp <= 1649) return { province: "Buenos Aires", city: "Martínez" };
    if (cp >= 1650 && cp <= 1659) return { province: "Buenos Aires", city: "San Isidro" };
    if (cp >= 1660 && cp <= 1669) return { province: "Buenos Aires", city: "San Fernando" };
    if (cp >= 1670 && cp <= 1679) return { province: "Buenos Aires", city: "Pilar" };
    if (cp >= 1680 && cp <= 1689) return { province: "Buenos Aires", city: "Escobar" };
    return { province: "Buenos Aires" };
  }
  
  // AMBA - Zona Oeste: 1700-1799
  if (cp >= 1700 && cp <= 1799) {
    if (cp >= 1702 && cp <= 1709) return { province: "Buenos Aires", city: "Ciudadela" };
    if (cp >= 1712 && cp <= 1719) return { province: "Buenos Aires", city: "Castelar" };
    if (cp >= 1720 && cp <= 1729) return { province: "Buenos Aires", city: "Morón" };
    if (cp >= 1730 && cp <= 1739) return { province: "Buenos Aires", city: "Moreno" };
    if (cp >= 1740 && cp <= 1749) return { province: "Buenos Aires", city: "Merlo" };
    if (cp >= 1750 && cp <= 1759) return { province: "Buenos Aires", city: "San Justo" };
    if (cp >= 1760 && cp <= 1769) return { province: "Buenos Aires", city: "Ituzaingó" };
    if (cp >= 1770 && cp <= 1779) return { province: "Buenos Aires", city: "General Rodríguez" };
    if (cp >= 1780 && cp <= 1789) return { province: "Buenos Aires", city: "Luján" };
    return { province: "Buenos Aires" };
  }
  
  // AMBA - Zona Sur: 1800-1899
  if (cp >= 1800 && cp <= 1899) {
    if (cp >= 1802 && cp <= 1809) return { province: "Buenos Aires", city: "Avellaneda" };
    if (cp >= 1810 && cp <= 1819) return { province: "Buenos Aires", city: "Lanús" };
    if (cp >= 1820 && cp <= 1829) return { province: "Buenos Aires", city: "Banfield" };
    if (cp >= 1830 && cp <= 1839) return { province: "Buenos Aires", city: "Lomas de Zamora" };
    if (cp >= 1840 && cp <= 1849) return { province: "Buenos Aires", city: "Quilmes" };
    if (cp >= 1850 && cp <= 1859) return { province: "Buenos Aires", city: "Florencio Varela" };
    if (cp >= 1860 && cp <= 1869) return { province: "Buenos Aires", city: "Berazategui" };
    if (cp >= 1870 && cp <= 1879) return { province: "Buenos Aires", city: "Almirante Brown" };
    if (cp >= 1880 && cp <= 1889) return { province: "Buenos Aires", city: "Esteban Echeverría" };
    if (cp >= 1890 && cp <= 1899) return { province: "Buenos Aires", city: "Ezeiza" };
    return { province: "Buenos Aires" };
  }
  
  // La Plata area: 1900-1999
  if (cp >= 1900 && cp <= 1999) {
    if (cp >= 1900 && cp <= 1925) return { province: "Buenos Aires", city: "La Plata" };
    if (cp >= 1926 && cp <= 1929) return { province: "Buenos Aires", city: "Ensenada" };
    if (cp >= 1930 && cp <= 1939) return { province: "Buenos Aires", city: "Berisso" };
    return { province: "Buenos Aires" };
  }

  // Interior de Buenos Aires
  // San Nicolás, Ramallo area: 2900-2999
  if (cp >= 2900 && cp <= 2999) {
    if (cp >= 2900 && cp <= 2919) return { province: "Buenos Aires", city: "San Nicolás de los Arroyos" };
    return { province: "Buenos Aires" };
  }
  
  // Junín, Pergamino area: 2700-2799
  if (cp >= 2700 && cp <= 2799) {
    if (cp >= 2700 && cp <= 2719) return { province: "Buenos Aires", city: "Pergamino" };
    if (cp >= 2740 && cp <= 2749) return { province: "Buenos Aires", city: "Arrecifes" };
    return { province: "Buenos Aires" };
  }
  
  // Zárate, Campana: 2800-2899
  if (cp >= 2800 && cp <= 2899) {
    if (cp >= 2800 && cp <= 2809) return { province: "Buenos Aires", city: "Zárate" };
    if (cp >= 2810 && cp <= 2819) return { province: "Buenos Aires", city: "Campana" };
    return { province: "Buenos Aires" };
  }
  
  // Azul, Olavarría area: 7300-7399
  if (cp >= 7300 && cp <= 7399) {
    if (cp >= 7300 && cp <= 7309) return { province: "Buenos Aires", city: "Azul" };
    if (cp >= 7310 && cp <= 7319) return { province: "Buenos Aires", city: "Tapalqué" };
    return { province: "Buenos Aires" };
  }
  
  // Olavarría: 7400-7499
  if (cp >= 7400 && cp <= 7499) {
    if (cp >= 7400 && cp <= 7409) return { province: "Buenos Aires", city: "Olavarría" };
    return { province: "Buenos Aires" };
  }
  
  // Tandil area: 7000-7099
  if (cp >= 7000 && cp <= 7099) {
    if (cp >= 7000 && cp <= 7009) return { province: "Buenos Aires", city: "Tandil" };
    return { province: "Buenos Aires" };
  }
  
  // Necochea, Tres Arroyos: 7500-7599
  if (cp >= 7500 && cp <= 7599) {
    if (cp >= 7500 && cp <= 7509) return { province: "Buenos Aires", city: "Tres Arroyos" };
    if (cp >= 7540 && cp <= 7549) return { province: "Buenos Aires", city: "Claromecó" };
    return { province: "Buenos Aires" };
  }
  
  // Mar del Plata: 7600-7699
  if (cp >= 7600 && cp <= 7699) {
    return { province: "Buenos Aires", city: "Mar del Plata" };
  }

  // Bahía Blanca: 8000-8099
  if (cp >= 8000 && cp <= 8099) {
    if (cp >= 8000 && cp <= 8019) return { province: "Buenos Aires", city: "Bahía Blanca" };
    return { province: "Buenos Aires" };
  }
  
  // 9 de Julio, Junín area: 6500-6599
  if (cp >= 6500 && cp <= 6599) {
    if (cp >= 6500 && cp <= 6509) return { province: "Buenos Aires", city: "9 de Julio" };
    return { province: "Buenos Aires" };
  }
  
  // Chivilcoy, Mercedes: 6600-6699
  if (cp >= 6600 && cp <= 6699) {
    if (cp >= 6600 && cp <= 6609) return { province: "Buenos Aires", city: "Mercedes" };
    if (cp >= 6620 && cp <= 6629) return { province: "Buenos Aires", city: "Chivilcoy" };
    return { province: "Buenos Aires" };
  }

  // Rosario: 2000-2099
  if (cp >= 2000 && cp <= 2099) {
    return { province: "Santa Fe", city: "Rosario" };
  }

  // Santa Fe Capital: 3000-3099
  if (cp >= 3000 && cp <= 3099) {
    return { province: "Santa Fe", city: "Santa Fe Capital" };
  }
  
  // Rafaela: 2300-2399
  if (cp >= 2300 && cp <= 2399) {
    if (cp >= 2300 && cp <= 2319) return { province: "Santa Fe", city: "Rafaela" };
    return { province: "Santa Fe" };
  }
  
  // Venado Tuerto: 2600-2699
  if (cp >= 2600 && cp <= 2699) {
    if (cp >= 2600 && cp <= 2619) return { province: "Santa Fe", city: "Venado Tuerto" };
    return { province: "Santa Fe" };
  }
  
  // San Lorenzo, Villa Gobernador Gálvez: 2200-2299
  if (cp >= 2200 && cp <= 2299) {
    if (cp >= 2200 && cp <= 2209) return { province: "Santa Fe", city: "San Lorenzo" };
    if (cp >= 2248 && cp <= 2252) return { province: "Santa Fe", city: "Villa Gobernador Gálvez" };
    return { province: "Santa Fe" };
  }

  // Córdoba Capital: 5000-5099
  if (cp >= 5000 && cp <= 5099) {
    return { province: "Córdoba", city: "Córdoba Capital" };
  }
  
  // Río Cuarto: 5800-5899
  if (cp >= 5800 && cp <= 5899) {
    if (cp >= 5800 && cp <= 5819) return { province: "Córdoba", city: "Río Cuarto" };
    return { province: "Córdoba" };
  }
  
  // Villa María: 5900-5999
  if (cp >= 5900 && cp <= 5999) {
    if (cp >= 5900 && cp <= 5919) return { province: "Córdoba", city: "Villa María" };
    return { province: "Córdoba" };
  }
  
  // San Francisco: 2400-2499
  if (cp >= 2400 && cp <= 2499) {
    if (cp >= 2400 && cp <= 2419) return { province: "Córdoba", city: "San Francisco" };
    return { province: "Córdoba" };
  }
  
  // Villa Carlos Paz: 5152
  if (cp >= 5150 && cp <= 5160) {
    return { province: "Córdoba", city: "Villa Carlos Paz" };
  }

  // Mendoza: 5500-5599
  if (cp >= 5500 && cp <= 5599) {
    return { province: "Mendoza", city: "Mendoza Capital" };
  }
  
  // San Rafael: 5600-5699
  if (cp >= 5600 && cp <= 5699) {
    if (cp >= 5600 && cp <= 5619) return { province: "Mendoza", city: "San Rafael" };
    return { province: "Mendoza" };
  }

  // Tucumán: 4000-4099
  if (cp >= 4000 && cp <= 4099) {
    return { province: "Tucumán", city: "San Miguel de Tucumán" };
  }
  
  // Tafí Viejo, Yerba Buena: 4100-4199
  if (cp >= 4100 && cp <= 4199) {
    if (cp >= 4107 && cp <= 4109) return { province: "Tucumán", city: "Yerba Buena" };
    if (cp >= 4103 && cp <= 4106) return { province: "Tucumán", city: "Tafí Viejo" };
    return { province: "Tucumán" };
  }

  // Salta: 4400-4499
  if (cp >= 4400 && cp <= 4499) {
    return { province: "Salta", city: "Salta Capital" };
  }

  // Entre Ríos - Paraná: 3100-3199
  if (cp >= 3100 && cp <= 3199) {
    if (cp >= 3100 && cp <= 3109) return { province: "Entre Ríos", city: "Paraná" };
    return { province: "Entre Ríos" };
  }
  
  // Concordia: 3200-3299
  if (cp >= 3200 && cp <= 3299) {
    if (cp >= 3200 && cp <= 3209) return { province: "Entre Ríos", city: "Concordia" };
    return { province: "Entre Ríos" };
  }
  
  // Gualeguaychú: 2820
  if (cp >= 2820 && cp <= 2840) {
    return { province: "Entre Ríos", city: "Gualeguaychú" };
  }

  // Misiones - Posadas: 3300-3399
  if (cp >= 3300 && cp <= 3399) {
    if (cp >= 3300 && cp <= 3309) return { province: "Misiones", city: "Posadas" };
    return { province: "Misiones" };
  }

  // Corrientes: 3400-3499
  if (cp >= 3400 && cp <= 3499) {
    return { province: "Corrientes", city: "Corrientes Capital" };
  }

  // Chaco - Resistencia: 3500-3599
  if (cp >= 3500 && cp <= 3599) {
    if (cp >= 3500 && cp <= 3509) return { province: "Chaco", city: "Resistencia" };
    if (cp >= 3540 && cp <= 3549) return { province: "Chaco", city: "Presidencia Roque Sáenz Peña" };
    return { province: "Chaco" };
  }

  // Formosa: 3600-3699
  if (cp >= 3600 && cp <= 3699) {
    return { province: "Formosa", city: "Formosa Capital" };
  }

  // Santiago del Estero: 4200-4299
  if (cp >= 4200 && cp <= 4299) {
    return { province: "Santiago del Estero", city: "Santiago del Estero Capital" };
  }

  // Jujuy: 4600-4699
  if (cp >= 4600 && cp <= 4699) {
    return { province: "Jujuy", city: "San Salvador de Jujuy" };
  }
  
  // Catamarca: 4700-4799
  if (cp >= 4700 && cp <= 4799) {
    return { province: "Catamarca", city: "San Fernando del Valle de Catamarca" };
  }

  // San Juan: 5400-5499
  if (cp >= 5400 && cp <= 5499) {
    return { province: "San Juan", city: "San Juan Capital" };
  }

  // La Rioja: 5300-5399
  if (cp >= 5300 && cp <= 5399) {
    return { province: "La Rioja", city: "La Rioja Capital" };
  }

  // San Luis: 5700-5799
  if (cp >= 5700 && cp <= 5799) {
    if (cp >= 5700 && cp <= 5709) return { province: "San Luis", city: "San Luis Capital" };
    if (cp >= 5730 && cp <= 5739) return { province: "San Luis", city: "Villa Mercedes" };
    return { province: "San Luis" };
  }

  // La Pampa: 6300-6399
  if (cp >= 6300 && cp <= 6399) {
    if (cp >= 6300 && cp <= 6309) return { province: "La Pampa", city: "Santa Rosa" };
    if (cp >= 6360 && cp <= 6369) return { province: "La Pampa", city: "General Pico" };
    return { province: "La Pampa" };
  }

  // Neuquén: 8300-8399
  if (cp >= 8300 && cp <= 8399) {
    if (cp >= 8300 && cp <= 8309) return { province: "Neuquén", city: "Neuquén Capital" };
    if (cp >= 8370 && cp <= 8379) return { province: "Neuquén", city: "San Martín de los Andes" };
    return { province: "Neuquén" };
  }

  // Río Negro - Bariloche: 8400-8499
  if (cp >= 8400 && cp <= 8499) {
    if (cp >= 8400 && cp <= 8409) return { province: "Río Negro", city: "San Carlos de Bariloche" };
    return { province: "Río Negro" };
  }
  
  // Río Negro - Viedma: 8500-8599
  if (cp >= 8500 && cp <= 8599) {
    if (cp >= 8500 && cp <= 8509) return { province: "Río Negro", city: "Viedma" };
    return { province: "Río Negro" };
  }
  
  // General Roca, Cipolletti: 8330-8340
  if (cp >= 8330 && cp <= 8340) {
    if (cp >= 8330 && cp <= 8334) return { province: "Río Negro", city: "General Roca" };
    if (cp >= 8335 && cp <= 8340) return { province: "Río Negro", city: "Cipolletti" };
    return { province: "Río Negro" };
  }

  // Chubut - Comodoro: 9000-9099
  if (cp >= 9000 && cp <= 9099) {
    if (cp >= 9000 && cp <= 9009) return { province: "Chubut", city: "Comodoro Rivadavia" };
    return { province: "Chubut" };
  }
  
  // Chubut - Rawson, Trelew: 9100-9199
  if (cp >= 9100 && cp <= 9199) {
    if (cp >= 9100 && cp <= 9109) return { province: "Chubut", city: "Rawson" };
    if (cp >= 9120 && cp <= 9129) return { province: "Chubut", city: "Trelew" };
    return { province: "Chubut" };
  }
  
  // Puerto Madryn: 9120
  if (cp >= 9120 && cp <= 9125) {
    return { province: "Chubut", city: "Puerto Madryn" };
  }
  
  // Esquel: 9200-9299
  if (cp >= 9200 && cp <= 9299) {
    if (cp >= 9200 && cp <= 9209) return { province: "Chubut", city: "Esquel" };
    return { province: "Chubut" };
  }

  // Santa Cruz: 9400-9499
  if (cp >= 9400 && cp <= 9499) {
    if (cp >= 9400 && cp <= 9409) return { province: "Santa Cruz", city: "Río Gallegos" };
    if (cp >= 9405 && cp <= 9406) return { province: "Santa Cruz", city: "El Calafate" };
    return { province: "Santa Cruz" };
  }

  // Tierra del Fuego: 9410-9420
  if (cp >= 9410 && cp <= 9420) {
    if (cp >= 9410 && cp <= 9415) return { province: "Tierra del Fuego", city: "Ushuaia" };
    if (cp >= 9420 && cp <= 9425) return { province: "Tierra del Fuego", city: "Río Grande" };
    return { province: "Tierra del Fuego" };
  }

  return null;
}