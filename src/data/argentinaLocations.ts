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
    // Interior de Buenos Aires
    "Bahía Blanca", "Mar del Plata", "Tandil", "Necochea", "Olavarría",
    "Junín", "Pergamino", "San Nicolás de los Arroyos", "Azul", "Tres Arroyos",
    "Chivilcoy", "Mercedes", "Bragado", "Chacabuco", "9 de Julio",
    "Trenque Lauquen", "Pehuajó", "Carlos Casares", "General Villegas",
    "Lincoln", "Bolívar", "General Pico", "25 de Mayo", "Saladillo",
    "Lobos", "Navarro", "Suipacha", "Carmen de Areco", "San Antonio de Areco",
    "Zárate", "Campana", "Baradero", "San Pedro", "Ramallo", "Arrecifes",
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

// Search localities matching a query
export function searchLocalities(province: string, query: string): string[] {
  const localities = getLocalitiesForProvince(province);
  if (!query || query.length < 2) return localities.slice(0, 10);
  
  const lowerQuery = query.toLowerCase();
  return localities
    .filter(loc => loc.toLowerCase().includes(lowerQuery))
    .slice(0, 10);
}

// Postal code to location mapping (common ranges)
// Returns province and optionally city based on postal code
export function getLocationByPostalCode(postalCode: string): { province: string; city?: string } | null {
  const cp = parseInt(postalCode, 10);
  if (isNaN(cp)) return null;

  // CABA: 1000-1499
  if (cp >= 1000 && cp <= 1499) {
    return { province: "Capital Federal (CABA)" };
  }

  // AMBA - Zona Norte: 1600-1699
  if (cp >= 1600 && cp <= 1699) {
    return { province: "Buenos Aires" };
  }
  
  // AMBA - Zona Oeste: 1700-1799
  if (cp >= 1700 && cp <= 1799) {
    return { province: "Buenos Aires" };
  }
  
  // AMBA - Zona Sur: 1800-1899
  if (cp >= 1800 && cp <= 1899) {
    return { province: "Buenos Aires" };
  }
  
  // La Plata, Berisso, Ensenada: 1900-1999
  if (cp >= 1900 && cp <= 1999) {
    if (cp >= 1900 && cp <= 1925) {
      return { province: "Buenos Aires", city: "La Plata" };
    }
    return { province: "Buenos Aires" };
  }

  // Córdoba Capital: 5000-5099
  if (cp >= 5000 && cp <= 5099) {
    return { province: "Córdoba", city: "Córdoba Capital" };
  }

  // Rosario: 2000-2099
  if (cp >= 2000 && cp <= 2099) {
    return { province: "Santa Fe", city: "Rosario" };
  }

  // Santa Fe Capital: 3000-3099
  if (cp >= 3000 && cp <= 3099) {
    return { province: "Santa Fe", city: "Santa Fe Capital" };
  }

  // Mendoza: 5500-5599
  if (cp >= 5500 && cp <= 5599) {
    return { province: "Mendoza", city: "Mendoza Capital" };
  }

  // Tucumán: 4000-4099
  if (cp >= 4000 && cp <= 4099) {
    return { province: "Tucumán", city: "San Miguel de Tucumán" };
  }

  // Salta: 4400-4499
  if (cp >= 4400 && cp <= 4499) {
    return { province: "Salta", city: "Salta Capital" };
  }

  // Mar del Plata: 7600-7699
  if (cp >= 7600 && cp <= 7699) {
    return { province: "Buenos Aires", city: "Mar del Plata" };
  }

  // Bahía Blanca: 8000-8099
  if (cp >= 8000 && cp <= 8099) {
    return { province: "Buenos Aires", city: "Bahía Blanca" };
  }

  // Neuquén: 8300-8399
  if (cp >= 8300 && cp <= 8399) {
    return { province: "Neuquén", city: "Neuquén Capital" };
  }

  // Resistencia/Chaco: 3500-3599
  if (cp >= 3500 && cp <= 3599) {
    return { province: "Chaco", city: "Resistencia" };
  }

  // Corrientes: 3400-3499
  if (cp >= 3400 && cp <= 3499) {
    return { province: "Corrientes", city: "Corrientes Capital" };
  }

  // Posadas/Misiones: 3300-3399
  if (cp >= 3300 && cp <= 3399) {
    return { province: "Misiones", city: "Posadas" };
  }

  // Paraná/Entre Ríos: 3100-3199
  if (cp >= 3100 && cp <= 3199) {
    return { province: "Entre Ríos", city: "Paraná" };
  }

  // San Juan: 5400-5499
  if (cp >= 5400 && cp <= 5499) {
    return { province: "San Juan", city: "San Juan Capital" };
  }

  // Santiago del Estero: 4200-4299
  if (cp >= 4200 && cp <= 4299) {
    return { province: "Santiago del Estero", city: "Santiago del Estero Capital" };
  }

  // Jujuy: 4600-4699
  if (cp >= 4600 && cp <= 4699) {
    return { province: "Jujuy", city: "San Salvador de Jujuy" };
  }

  // Formosa: 3600-3699
  if (cp >= 3600 && cp <= 3699) {
    return { province: "Formosa", city: "Formosa Capital" };
  }

  // La Rioja: 5300-5399
  if (cp >= 5300 && cp <= 5399) {
    return { province: "La Rioja", city: "La Rioja Capital" };
  }

  // Catamarca: 4700-4799
  if (cp >= 4700 && cp <= 4799) {
    return { province: "Catamarca", city: "San Fernando del Valle de Catamarca" };
  }

  // San Luis: 5700-5799
  if (cp >= 5700 && cp <= 5799) {
    return { province: "San Luis", city: "San Luis Capital" };
  }

  // La Pampa: 6300-6399
  if (cp >= 6300 && cp <= 6399) {
    return { province: "La Pampa", city: "Santa Rosa" };
  }

  // Río Negro - Viedma: 8500-8599
  if (cp >= 8500 && cp <= 8599) {
    return { province: "Río Negro", city: "Viedma" };
  }

  // Río Negro - Bariloche: 8400-8499
  if (cp >= 8400 && cp <= 8499) {
    return { province: "Río Negro", city: "San Carlos de Bariloche" };
  }

  // Chubut - Rawson: 9100-9199
  if (cp >= 9100 && cp <= 9199) {
    return { province: "Chubut", city: "Rawson" };
  }

  // Chubut - Comodoro: 9000-9099
  if (cp >= 9000 && cp <= 9099) {
    return { province: "Chubut", city: "Comodoro Rivadavia" };
  }

  // Santa Cruz: 9400-9499
  if (cp >= 9400 && cp <= 9499) {
    return { province: "Santa Cruz", city: "Río Gallegos" };
  }

  // Tierra del Fuego: 9410, 9420
  if (cp >= 9410 && cp <= 9420) {
    return { province: "Tierra del Fuego", city: "Ushuaia" };
  }

  return null;
}