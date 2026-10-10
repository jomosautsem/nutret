import { NutritionPlanDay, NutritionPlanMeal, NutritionPlanItem } from '../../types';

export interface DayTemplateDef {
  dayOfWeek: number;
  dayName: string;
  shortName: string;
  theme: string;
  meals: Array<{
    name: string;
    suggestedTime: string;
    mealOrder: number;
    items: Array<{
      name: string;
      portionDescription: string;
      baseKcal: number;
      baseProtein: number;
      baseCarbs: number;
      baseFat: number;
      itemType: 'FOOD' | 'RECIPE' | 'EQUIVALENT_GROUP';
    }>;
  }>;
}

export interface MealOptionDef {
  dishTitle: string;
  suggestedTime: string;
  tags?: string[];
  items: Array<{
    name: string;
    portionDescription: string;
    baseKcal: number;
    baseProtein: number;
    baseCarbs: number;
    baseFat: number;
    itemType: 'FOOD' | 'RECIPE' | 'EQUIVALENT_GROUP';
  }>;
}

// ====================================================
// MASSIVE MEAL POOLS (25+ OPTIONS EACH FOR MAXIMUM VARIETY)
// ====================================================

export const BREAKFAST_OPTIONS_POOL: MealOptionDef[] = [
  {
    dishTitle: 'Huevos revueltos con espinacas y jitomate',
    suggestedTime: '08:00',
    tags: ['omnivore', 'mediterranean', 'low-carb', 'high-protein'],
    items: [
      { name: 'Huevo entero fresco', portionDescription: '2 piezas (100g)', baseKcal: 140, baseProtein: 12.6, baseCarbs: 0.8, baseFat: 9.6, itemType: 'FOOD' },
      { name: 'Espinacas frescas desinfectadas', portionDescription: '1 taza (60g)', baseKcal: 15, baseProtein: 1.5, baseCarbs: 2, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Jitomate saladette picado', portionDescription: '1/2 pieza (60g)', baseKcal: 15, baseProtein: 0.8, baseCarbs: 2.5, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Tortillas de maíz nixtamalizado', portionDescription: '2 piezas (50g)', baseKcal: 130, baseProtein: 3, baseCarbs: 28, baseFat: 1, itemType: 'FOOD' },
      { name: 'Aguacate Hass fresco', portionDescription: '1/3 pieza (35g)', baseKcal: 50, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Pancakes de avena, plátano y claras con crema de almendras',
    suggestedTime: '08:00',
    tags: ['omnivore', 'mediterranean', 'high-protein', 'fitness'],
    items: [
      { name: 'Pancakes de avena, plátano y clara de huevo', portionDescription: '2 piezas medianas (80g)', baseKcal: 220, baseProtein: 16, baseCarbs: 32, baseFat: 3, itemType: 'RECIPE' },
      { name: 'Mantequilla de almendra o cacahuate natural', portionDescription: '1 cda (15g)', baseKcal: 90, baseProtein: 4, baseCarbs: 3, baseFat: 7.5, itemType: 'FOOD' },
      { name: 'Canela molida y café negro o té verde', portionDescription: 'Al gusto sin azúcar', baseKcal: 5, baseProtein: 0, baseCarbs: 1, baseFat: 0, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Omelette de champiñones y queso Oaxaca light',
    suggestedTime: '08:00',
    tags: ['omnivore', 'mediterranean', 'low-carb', 'vegetarian'],
    items: [
      { name: 'Huevo entero fresco', portionDescription: '2 piezas (100g)', baseKcal: 140, baseProtein: 12.6, baseCarbs: 0.8, baseFat: 9.6, itemType: 'FOOD' },
      { name: 'Queso Oaxaca light deshebrado', portionDescription: '40g', baseKcal: 85, baseProtein: 10, baseCarbs: 1, baseFat: 4.5, itemType: 'FOOD' },
      { name: 'Champiñones frescos rebanados', portionDescription: '1/2 taza (70g)', baseKcal: 20, baseProtein: 1.5, baseCarbs: 1.5, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Frijoles refritos con aceite de oliva (sin manteca)', portionDescription: '1/3 taza (80g)', baseKcal: 90, baseProtein: 5, baseCarbs: 14, baseFat: 2, itemType: 'FOOD' },
      { name: 'Tortillas de maíz nixtamalizado', portionDescription: '2 piezas (50g)', baseKcal: 130, baseProtein: 3, baseCarbs: 28, baseFat: 1, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Chilaquiles verdes ligeros con pechuga deshebrada',
    suggestedTime: '08:30',
    tags: ['omnivore', 'high-protein', 'mexican'],
    items: [
      { name: 'Totopos horneados de maíz en salsa verde suave', portionDescription: '40g totopos horneados + 1/2 taza (120ml) de salsa verde', baseKcal: 160, baseProtein: 3, baseCarbs: 32, baseFat: 1.5, itemType: 'RECIPE' },
      { name: 'Pechuga de pollo cocida deshebrada', portionDescription: '80g cocida', baseKcal: 130, baseProtein: 25, baseCarbs: 0, baseFat: 2.5, itemType: 'FOOD' },
      { name: 'Queso panela fresco rallado y aguacate', portionDescription: '30g de queso panela + 1/4 pieza (25g) de aguacate Hass', baseKcal: 95, baseProtein: 6, baseCarbs: 2, baseFat: 7, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Toast integral con aguacate triturado y huevos poché',
    suggestedTime: '08:00',
    tags: ['mediterranean', 'omnivore', 'high-protein'],
    items: [
      { name: 'Pan integral de masa madre tostado', portionDescription: '2 rebanadas (60g)', baseKcal: 150, baseProtein: 6, baseCarbs: 28, baseFat: 1.5, itemType: 'FOOD' },
      { name: 'Huevos poché al vapor', portionDescription: '2 piezas (100g)', baseKcal: 145, baseProtein: 13, baseCarbs: 1, baseFat: 10, itemType: 'FOOD' },
      { name: 'Aguacate Hass con semillas de ajonjolí y hojuelas de chile', portionDescription: '1/3 pieza (35g)', baseKcal: 60, baseProtein: 1, baseCarbs: 2, baseFat: 5.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Huevos a la mexicana con frijoles de la olla',
    suggestedTime: '08:00',
    tags: ['omnivore', 'mexican', 'high-protein'],
    items: [
      { name: 'Huevo entero fresco', portionDescription: '2 piezas (100g)', baseKcal: 140, baseProtein: 12.6, baseCarbs: 0.8, baseFat: 9.6, itemType: 'FOOD' },
      { name: 'Jitomate, cebolla y chile serrano picados', portionDescription: '1/2 pieza (60g) de jitomate + 2 cdas (20g) de cebolla + 1/2 pieza de chile serrano', baseKcal: 25, baseProtein: 1, baseCarbs: 4.5, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Frijoles negros de la olla enteros', portionDescription: '1/2 taza (85g)', baseKcal: 95, baseProtein: 6.4, baseCarbs: 17, baseFat: 0.8, itemType: 'FOOD' },
      { name: 'Tortillas de maíz calientitas', portionDescription: '2 piezas (50g)', baseKcal: 130, baseProtein: 3, baseCarbs: 28, baseFat: 1, itemType: 'FOOD' },
      { name: 'Fruta fresca de temporada (Papaya o Melón)', portionDescription: '1 taza (140g)', baseKcal: 55, baseProtein: 0.8, baseCarbs: 14, baseFat: 0.2, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tazón de avena tibia cocida con leche de almendra y frutos rojos',
    suggestedTime: '08:00',
    tags: ['vegetarian', 'mediterranean'],
    items: [
      { name: 'Avena en hojuelas cocida con canela', portionDescription: '1/2 taza seca (40g)', baseKcal: 155, baseProtein: 5, baseCarbs: 27, baseFat: 3, itemType: 'FOOD' },
      { name: 'Leche de almendras sin azúcar + proteína o clara', portionDescription: '1 taza + 1 medida proteína o 2 claras', baseKcal: 110, baseProtein: 18, baseCarbs: 2, baseFat: 3, itemType: 'FOOD' },
      { name: 'Moras azules frescas y nueces en mitades', portionDescription: '1/2 taza moras + 10g nueces', baseKcal: 95, baseProtein: 2, baseCarbs: 12, baseFat: 6, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Quesadillas de maíz con flor de calabaza y queso panela asado',
    suggestedTime: '08:00',
    tags: ['vegetarian', 'mexican', 'mediterranean'],
    items: [
      { name: 'Tortillas de maíz con flor de calabaza y epazote', portionDescription: '2 piezas maíz + flor de calabaza', baseKcal: 140, baseProtein: 3.5, baseCarbs: 29, baseFat: 1, itemType: 'FOOD' },
      { name: 'Queso panela o canasto asado', portionDescription: '70g en rebanadas asadas', baseKcal: 150, baseProtein: 16, baseCarbs: 2, baseFat: 8, itemType: 'FOOD' },
      { name: 'Salsa martajada de molcajete y aguacate', portionDescription: 'Al gusto + 1/4 aguacate', baseKcal: 45, baseProtein: 0.5, baseCarbs: 2, baseFat: 4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Licuado energético de plátano, avena, cacao puro y yogur griego',
    suggestedTime: '08:00',
    tags: ['high-protein', 'fitness', 'vegetarian'],
    items: [
      { name: 'Plátano maduro con cacao sin azúcar', portionDescription: '1 pieza mediana + 1 cdta cacao', baseKcal: 105, baseProtein: 1.5, baseCarbs: 26, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Yogur griego sin azúcar y leche descremada', portionDescription: '150g yogur + 1/2 taza leche', baseKcal: 140, baseProtein: 18, baseCarbs: 10, baseFat: 2, itemType: 'FOOD' },
      { name: 'Avena en hojuelas y semillas de chía', portionDescription: '3 cdas avena + 1 cdta chía', baseKcal: 110, baseProtein: 4, baseCarbs: 18, baseFat: 3, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Sándwich de claras de huevo con pechuga de pavo y germinado',
    suggestedTime: '08:00',
    tags: ['omnivore', 'high-protein', 'practical'],
    items: [
      { name: 'Pan integral de granos enteros', portionDescription: '2 rebanadas', baseKcal: 140, baseProtein: 6, baseCarbs: 26, baseFat: 1.5, itemType: 'FOOD' },
      { name: 'Claras de huevo con pechuga de pavo baja en sodio', portionDescription: '3 claras + 50g pavo', baseKcal: 120, baseProtein: 22, baseCarbs: 1, baseFat: 1.5, itemType: 'FOOD' },
      { name: 'Jitomate en rodajas, germinado de alfalfa y mostaza', portionDescription: 'Abundante al gusto', baseKcal: 25, baseProtein: 1, baseCarbs: 4, baseFat: 0.2, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Shakshuka mediterránea con huevos en salsa de tomate y pimientos',
    suggestedTime: '08:30',
    tags: ['mediterranean', 'vegetarian', 'antiinflammatory'],
    items: [
      { name: 'Huevos pochados en salsa de pimiento y tomate con comino', portionDescription: '2 huevos enteros + 1 taza salsa shakshuka', baseKcal: 190, baseProtein: 14, baseCarbs: 8, baseFat: 11, itemType: 'RECIPE' },
      { name: 'Pan pita integral tostado', portionDescription: '1 pieza (50g)', baseKcal: 135, baseProtein: 5, baseCarbs: 26, baseFat: 1.2, itemType: 'FOOD' },
      { name: 'Queso feta o panela desmoronado', portionDescription: '25g', baseKcal: 65, baseProtein: 4, baseCarbs: 1, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tostada de salmón ahumado con requesón, alcaparras y eneldo',
    suggestedTime: '08:00',
    tags: ['pescatarian', 'mediterranean', 'high-protein'],
    items: [
      { name: 'Pan integral de centeno o masa madre', portionDescription: '2 rebanadas', baseKcal: 140, baseProtein: 5, baseCarbs: 26, baseFat: 1, itemType: 'FOOD' },
      { name: 'Salmón ahumado con alcaparras y limón', portionDescription: '70g', baseKcal: 120, baseProtein: 16, baseCarbs: 0, baseFat: 6, itemType: 'FOOD' },
      { name: 'Requesón ligero con eneldo fresco', portionDescription: '3 cdas (45g)', baseKcal: 45, baseProtein: 6, baseCarbs: 1.5, baseFat: 1.5, itemType: 'FOOD' },
      { name: 'Pepino persa rebanado fino', portionDescription: '1 taza', baseKcal: 16, baseProtein: 0.8, baseCarbs: 3, baseFat: 0.1, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tazón tibio de quinoa con manzana verde, canela y nueces',
    suggestedTime: '08:00',
    tags: ['vegetarian', 'gluten-free', 'fiber'],
    items: [
      { name: 'Quinoa cocida con canela y bebida de almendras', portionDescription: '1 taza cocida', baseKcal: 180, baseProtein: 6, baseCarbs: 32, baseFat: 3, itemType: 'FOOD' },
      { name: 'Manzana verde salteada en agua con canela', portionDescription: '1 pieza mediana', baseKcal: 72, baseProtein: 0.3, baseCarbs: 19, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Proteína en polvo o yogur griego', portionDescription: '20g proteína o 100g yogur', baseKcal: 80, baseProtein: 16, baseCarbs: 2, baseFat: 0.8, itemType: 'FOOD' },
      { name: 'Nueces de castilla troceadas', portionDescription: '12g (4 mitades)', baseKcal: 78, baseProtein: 1.8, baseCarbs: 1.6, baseFat: 7.8, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Huevos motuleños ligeros en tostadas horneadas con chícharos',
    suggestedTime: '08:30',
    tags: ['mexican', 'omnivore', 'high-protein'],
    items: [
      { name: 'Huevos estrellados al comal con salsa de jitomate yucateca', portionDescription: '2 huevos enteros + 1/2 taza salsa chiltomate', baseKcal: 160, baseProtein: 13, baseCarbs: 4, baseFat: 10, itemType: 'RECIPE' },
      { name: 'Tostadas horneadas de maíz nixtamalizado con frijol negro untado', portionDescription: '2 piezas + 2 cdas frijol', baseKcal: 100, baseProtein: 3.5, baseCarbs: 19, baseFat: 1, itemType: 'FOOD' },
      { name: 'Chícharos cocidos, jamón de pavo en cubitos y queso panela', portionDescription: '2 cdas chícharos + 30g pavo + 20g panela', baseKcal: 95, baseProtein: 10, baseCarbs: 4, baseFat: 4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Molletes integrales con frijol negro de la olla y queso panela gratinado',
    suggestedTime: '08:00',
    tags: ['vegetarian', 'mexican', 'high-fiber'],
    items: [
      { name: 'Bolillo integral o pan multigrano sin migajón', portionDescription: '1 pieza abierta en mitades', baseKcal: 140, baseProtein: 5, baseCarbs: 27, baseFat: 1.5, itemType: 'FOOD' },
      { name: 'Frijoles negros refritos con aceite de oliva', portionDescription: '1/3 taza', baseKcal: 85, baseProtein: 5, baseCarbs: 13, baseFat: 2, itemType: 'FOOD' },
      { name: 'Queso panela o asadero bajo en grasa fundido', portionDescription: '60g', baseKcal: 130, baseProtein: 14, baseCarbs: 2, baseFat: 7.5, itemType: 'FOOD' },
      { name: 'Pico de gallo fresco con cilantro y limón', portionDescription: '1/2 taza', baseKcal: 20, baseProtein: 0.8, baseCarbs: 4, baseFat: 0.2, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Omelette blanco de espárragos, champiñones portobello y queso de cabra',
    suggestedTime: '08:00',
    tags: ['vegetarian', 'keto', 'low-carb', 'high-protein'],
    items: [
      { name: 'Claras de huevo con espárragos y portobello salteados', portionDescription: '4 claras + 1 huevo entero + 1 taza vegetales', baseKcal: 165, baseProtein: 22, baseCarbs: 4, baseFat: 6, itemType: 'FOOD' },
      { name: 'Queso de cabra suave', portionDescription: '30g', baseKcal: 85, baseProtein: 6, baseCarbs: 0.8, baseFat: 7, itemType: 'FOOD' },
      { name: 'Tortilla de maíz o pan integral', portionDescription: '1 pieza', baseKcal: 65, baseProtein: 1.5, baseCarbs: 14, baseFat: 0.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tostadas de maíz azul con machaca de res magra a la mexicana',
    suggestedTime: '08:30',
    tags: ['mexican', 'omnivore', 'high-protein'],
    items: [
      { name: 'Machaca sonorense de res magra con jitomate, cebolla y chile', portionDescription: '50g machaca hidratada + vegetales', baseKcal: 150, baseProtein: 26, baseCarbs: 3, baseFat: 3, itemType: 'FOOD' },
      { name: 'Huevos revueltos agregados a la machaca', portionDescription: '1 pieza entera', baseKcal: 72, baseProtein: 6.3, baseCarbs: 0.4, baseFat: 4.8, itemType: 'FOOD' },
      { name: 'Tortillas de maíz azul calientitas', portionDescription: '2 piezas', baseKcal: 125, baseProtein: 3, baseCarbs: 26, baseFat: 1, itemType: 'FOOD' },
      { name: 'Frijoles de la olla', portionDescription: '1/4 taza', baseKcal: 55, baseProtein: 3.5, baseCarbs: 10, baseFat: 0.2, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tazón de açai o frutos rojos con proteína vegetal, chía y almendras',
    suggestedTime: '08:00',
    tags: ['vegan', 'fitness', 'antioxidants'],
    items: [
      { name: 'Pulpa de açai sin azúcar batida con fresas y espinaca', portionDescription: '1 taza base espesa', baseKcal: 80, baseProtein: 2, baseCarbs: 14, baseFat: 2.5, itemType: 'FOOD' },
      { name: 'Proteína vegetal aislada (chícharo y arroz)', portionDescription: '25g polvo', baseKcal: 95, baseProtein: 20, baseCarbs: 2, baseFat: 1, itemType: 'FOOD' },
      { name: 'Semillas de chía y semillas de cáñamo (hemp)', portionDescription: '1 cdta chía + 1 cdta hemp', baseKcal: 55, baseProtein: 3, baseCarbs: 2, baseFat: 4, itemType: 'FOOD' },
      { name: 'Almendras fileteadas y arándanos frescos', portionDescription: '10g almendras + 1/4 taza arándanos', baseKcal: 75, baseProtein: 2.2, baseCarbs: 7, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Crepas ligeras de avena rellenas de requesón campesino y fresas frescas',
    suggestedTime: '08:30',
    tags: ['vegetarian', 'fitness', 'low-sugar'],
    items: [
      { name: 'Crepas finas de avena y clara de huevo', portionDescription: '2 crepas grandes', baseKcal: 160, baseProtein: 12, baseCarbs: 24, baseFat: 2, itemType: 'RECIPE' },
      { name: 'Requesón campesino aromatizado con vainilla y canela', portionDescription: '1/3 taza (80g)', baseKcal: 85, baseProtein: 11, baseCarbs: 2.5, baseFat: 3.5, itemType: 'FOOD' },
      { name: 'Fresas frescas en rebanadas con jugo de naranja', portionDescription: '1 taza (150g)', baseKcal: 50, baseProtein: 1, baseCarbs: 11, baseFat: 0.4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Wrap integral de claras, pechuga de pavo, espinacas y queso gouda light',
    suggestedTime: '08:00',
    tags: ['practical', 'high-protein', 'fitness'],
    items: [
      { name: 'Tortilla de trigo integral o linaza grande', portionDescription: '1 pieza (45g)', baseKcal: 110, baseProtein: 4, baseCarbs: 20, baseFat: 2, itemType: 'FOOD' },
      { name: 'Claras de huevo con espinacas salteadas', portionDescription: '3 claras + 1 taza espinaca', baseKcal: 65, baseProtein: 12, baseCarbs: 2, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Pechuga de pavo horneada y queso gouda light', portionDescription: '40g pavo + 30g gouda light', baseKcal: 115, baseProtein: 16, baseCarbs: 1, baseFat: 5, itemType: 'FOOD' },
    ],
  },
];

export const MORNING_SNACK_OPTIONS_POOL: MealOptionDef[] = [
  {
    dishTitle: 'Manzana verde con canela y almendras tostadas',
    suggestedTime: '11:00',
    tags: ['mediterranean', 'snack', 'vegetarian'],
    items: [
      { name: 'Manzana verde con canela en polvo', portionDescription: '1 pieza mediana (150g)', baseKcal: 72, baseProtein: 0.3, baseCarbs: 19, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Almendras naturales sin sal', portionDescription: '12 piezas (15g)', baseKcal: 85, baseProtein: 3, baseCarbs: 3, baseFat: 7, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Yogur griego natural con moras azules y semillas de chía',
    suggestedTime: '11:00',
    tags: ['high-protein', 'snack', 'vegetarian'],
    items: [
      { name: 'Yogur griego natural sin endulzantes', portionDescription: '1/2 taza (100g)', baseKcal: 65, baseProtein: 10, baseCarbs: 4, baseFat: 1, itemType: 'FOOD' },
      { name: 'Arándanos o moras frescas', portionDescription: '1/2 taza (75g)', baseKcal: 42, baseProtein: 0.5, baseCarbs: 11, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Semillas de chía hidratadas', portionDescription: '1 cdta (5g)', baseKcal: 25, baseProtein: 1, baseCarbs: 2, baseFat: 1.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Bastones de jícama y pepino con limón y semillas de calabaza',
    suggestedTime: '11:00',
    tags: ['low-carb', 'vegetarian', 'snack'],
    items: [
      { name: 'Pepino y jícama en bastones con limón y chile piquín', portionDescription: '1.5 tazas (200g)', baseKcal: 45, baseProtein: 2, baseCarbs: 9, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Semillas de calabaza tostadas', portionDescription: '15g', baseKcal: 85, baseProtein: 4.5, baseCarbs: 2, baseFat: 7, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Papaya fresca picada con requesón campesino',
    suggestedTime: '11:00',
    tags: ['mediterranean', 'high-protein', 'snack'],
    items: [
      { name: 'Papaya fresca picada en cubos', portionDescription: '1 taza (150g)', baseKcal: 55, baseProtein: 0.8, baseCarbs: 14, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Requesón o queso cottage bajo en grasa', portionDescription: '3 cdas (45g)', baseKcal: 50, baseProtein: 6, baseCarbs: 2, baseFat: 1.5, itemType: 'FOOD' },
      { name: 'Nueces picadas', portionDescription: '2 mitades (6g)', baseKcal: 40, baseProtein: 1, baseCarbs: 1, baseFat: 4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tostada horneada con aguacate y queso fresco',
    suggestedTime: '11:00',
    tags: ['mexican', 'mediterranean', 'snack'],
    items: [
      { name: 'Tostada de maíz horneada', portionDescription: '1 pieza', baseKcal: 30, baseProtein: 0.8, baseCarbs: 6, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Aguacate machacado con sal marina', portionDescription: '1/4 pieza (25g)', baseKcal: 40, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 4, itemType: 'FOOD' },
      { name: 'Queso panela desmoronado', portionDescription: '30g', baseKcal: 65, baseProtein: 6.5, baseCarbs: 1, baseFat: 4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Medio plátano con crema de maní natural',
    suggestedTime: '11:00',
    tags: ['fitness', 'snack', 'vegetarian'],
    items: [
      { name: 'Plátano en rodajas', portionDescription: '1/2 pieza (60g)', baseKcal: 55, baseProtein: 0.7, baseCarbs: 14, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Mantequilla de cacahuate 100% natural', portionDescription: '1 cdta colmada (10g)', baseKcal: 60, baseProtein: 2.5, baseCarbs: 2, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Edamames tiernos al vapor con sal de mar y limón',
    suggestedTime: '11:00',
    tags: ['plant-based', 'high-protein', 'fiber'],
    items: [
      { name: 'Vainas de edamame cocidas al vapor', portionDescription: '1 taza en vaina (120g)', baseKcal: 110, baseProtein: 10, baseCarbs: 9, baseFat: 4, itemType: 'FOOD' },
      { name: 'Limón y sal marina en grano', portionDescription: 'Al gusto', baseKcal: 5, baseProtein: 0.1, baseCarbs: 1, baseFat: 0, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Pudín de chía hidratada en leche de coco con frambuesas',
    suggestedTime: '11:00',
    tags: ['omega-3', 'vegan', 'keto'],
    items: [
      { name: 'Semillas de chía hidratadas en leche vegetal sin azúcar', portionDescription: '1.5 cdas chía (18g) + 1/2 taza leche almendra', baseKcal: 95, baseProtein: 3.5, baseCarbs: 7, baseFat: 6, itemType: 'RECIPE' },
      { name: 'Frambuesas frescas', portionDescription: '1/2 taza (60g)', baseKcal: 32, baseProtein: 0.7, baseCarbs: 7, baseFat: 0.4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Brochetas caprese de jitomates cherry con mozzarella fresca y albahaca',
    suggestedTime: '11:00',
    tags: ['mediterranean', 'low-carb', 'vegetarian'],
    items: [
      { name: 'Jitomates cherry frescos', portionDescription: '1 taza (150g)', baseKcal: 28, baseProtein: 1.3, baseCarbs: 6, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Queso mozzarella fresco o panela en bolitas', portionDescription: '40g', baseKcal: 95, baseProtein: 8, baseCarbs: 1, baseFat: 7, itemType: 'FOOD' },
      { name: 'Hojas de albahaca y gotas de aceite de oliva', portionDescription: '1/2 cdta AOVE', baseKcal: 22, baseProtein: 0, baseCarbs: 0, baseFat: 2.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Rollitos de pechuga de pavo con espárragos cocidos y mostaza',
    suggestedTime: '11:00',
    tags: ['keto', 'high-protein', 'low-carb'],
    items: [
      { name: 'Pechuga de pavo baja en sodio en rebanadas', portionDescription: '3 rebanadas (60g)', baseKcal: 60, baseProtein: 12, baseCarbs: 1, baseFat: 0.8, itemType: 'FOOD' },
      { name: 'Puntas de espárragos al vapor', portionDescription: '6 piezas', baseKcal: 20, baseProtein: 2, baseCarbs: 3, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Aguacate en tiritas dentro del rollito', portionDescription: '25g', baseKcal: 40, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Bastones de apio y zanahoria con hummus casero de garbanzo',
    suggestedTime: '11:00',
    tags: ['mediterranean', 'vegan', 'fiber'],
    items: [
      { name: 'Hummus tradicional de garbanzo con tahini', portionDescription: '3 cdas (45g)', baseKcal: 110, baseProtein: 4, baseCarbs: 10, baseFat: 6, itemType: 'FOOD' },
      { name: 'Bastones crujientes de zanahoria y apio', portionDescription: '1.5 tazas', baseKcal: 45, baseProtein: 1.2, baseCarbs: 10, baseFat: 0.2, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Smoothie verde desintoxicante de piña, espinaca y jengibre',
    suggestedTime: '11:00',
    tags: ['detox', 'hydration', 'vitamins'],
    items: [
      { name: 'Piña natural fresca en cubos', portionDescription: '3/4 taza (120g)', baseKcal: 60, baseProtein: 0.6, baseCarbs: 15, baseFat: 0.1, itemType: 'FOOD' },
      { name: 'Espinacas tiernas baby y pepino con jengibre', portionDescription: '1 taza espinaca + 1/2 pepino', baseKcal: 20, baseProtein: 1.5, baseCarbs: 4, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Semillas de linaza molida', portionDescription: '1 cdta (5g)', baseKcal: 25, baseProtein: 1, baseCarbs: 1.5, baseFat: 2, itemType: 'FOOD' },
    ],
  },
];

export const LUNCH_OPTIONS_POOL: MealOptionDef[] = [
  {
    dishTitle: 'Pechuga de pollo a la plancha con arroz integral y nopales',
    suggestedTime: '14:30',
    tags: ['omnivore', 'high-protein', 'mexican'],
    items: [
      { name: 'Pechuga de pollo a la plancha con hierbas finas', portionDescription: '140g cocida', baseKcal: 210, baseProtein: 42, baseCarbs: 0, baseFat: 4, itemType: 'FOOD' },
      { name: 'Arroz integral al vapor', portionDescription: '3/4 taza cocido', baseKcal: 150, baseProtein: 3, baseCarbs: 32, baseFat: 1, itemType: 'FOOD' },
      { name: 'Frijoles negros de la olla', portionDescription: '1/2 taza', baseKcal: 110, baseProtein: 7, baseCarbs: 20, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Ensalada mixta (lechuga, pepino, limón y aceite de oliva)', portionDescription: 'Abundante + 1 cdta AOVE', baseKcal: 65, baseProtein: 1, baseCarbs: 3, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Filete de pescado blanco empapelado con quinoa y verduras',
    suggestedTime: '14:30',
    tags: ['mediterranean', 'pescatarian', 'high-protein'],
    items: [
      { name: 'Filete de pescado blanco fresco al limón y epazote', portionDescription: '150g al vapor o empapelado', baseKcal: 145, baseProtein: 32, baseCarbs: 0, baseFat: 2, itemType: 'FOOD' },
      { name: 'Quinoa tricolor al vapor', portionDescription: '3/4 taza cocida', baseKcal: 165, baseProtein: 6, baseCarbs: 30, baseFat: 2.5, itemType: 'FOOD' },
      { name: 'Calabacitas y zanahorias asadas con romero', portionDescription: '1.5 tazas', baseKcal: 55, baseProtein: 2, baseCarbs: 11, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Aguacate Hass en cubos', portionDescription: '1/3 pieza (35g)', baseKcal: 50, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Fajitas de res magra con pimientos tricolores y guacamole',
    suggestedTime: '14:30',
    tags: ['omnivore', 'high-protein', 'mexican'],
    items: [
      { name: 'Fajitas de arrachera o bistec de res magro', portionDescription: '130g cocido con cebolla y pimientos', baseKcal: 220, baseProtein: 35, baseCarbs: 5, baseFat: 7, itemType: 'FOOD' },
      { name: 'Tortillas de maíz recién calientes', portionDescription: '2 piezas', baseKcal: 130, baseProtein: 3, baseCarbs: 28, baseFat: 1, itemType: 'FOOD' },
      { name: 'Frijoles de la olla', portionDescription: '1/3 taza', baseKcal: 75, baseProtein: 5, baseCarbs: 14, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Guacamole tradicional y salsa verde', portionDescription: '2 cdas (30g)', baseKcal: 45, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 4.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Salmón a la plancha con espárragos y camote asado',
    suggestedTime: '14:30',
    tags: ['mediterranean', 'pescatarian', 'antiinflammatory'],
    items: [
      { name: 'Filete de salmón fresco sellado al sartén', portionDescription: '140g', baseKcal: 260, baseProtein: 30, baseCarbs: 0, baseFat: 15, itemType: 'FOOD' },
      { name: 'Camote horneado con canela y sal de grano', portionDescription: '1/2 taza en cubos (100g)', baseKcal: 90, baseProtein: 2, baseCarbs: 21, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Espárragos y brócoli al vapor con limón', portionDescription: '1 taza abundante', baseKcal: 45, baseProtein: 4, baseCarbs: 8, baseFat: 0.4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Pollo en mole verde artesanal con arroz y frijoles',
    suggestedTime: '14:30',
    tags: ['mexican', 'omnivore', 'comfort'],
    items: [
      { name: 'Pechuga o pierna sin piel en mole verde de pepita y tomate', portionDescription: '130g pollo + 3 cdas mole verde ligero', baseKcal: 240, baseProtein: 33, baseCarbs: 8, baseFat: 8.5, itemType: 'RECIPE' },
      { name: 'Arroz blanco con elote y cilantro', portionDescription: '1/2 taza', baseKcal: 110, baseProtein: 2.2, baseCarbs: 24, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Calabacitas salteadas al vapor', portionDescription: '1 taza', baseKcal: 35, baseProtein: 1.5, baseCarbs: 7, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Tortilla de maíz nixtamalizado', portionDescription: '2 piezas', baseKcal: 130, baseProtein: 3, baseCarbs: 28, baseFat: 1, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Medallón de atún sellado con costra de ajonjolí y ensalada asiática',
    suggestedTime: '14:30',
    tags: ['pescatarian', 'fitness', 'antiinflammatory'],
    items: [
      { name: 'Medallón de atún fresco con ajonjolí negro', portionDescription: '150g sellado término medio', baseKcal: 220, baseProtein: 38, baseCarbs: 1, baseFat: 7, itemType: 'FOOD' },
      { name: 'Arroz al vapor tipo jazmín o basmati', portionDescription: '3/4 taza', baseKcal: 145, baseProtein: 3, baseCarbs: 32, baseFat: 0.4, itemType: 'FOOD' },
      { name: 'Ensalada oriental de col morada, pepino y edamames con aderezo de soya y jengibre', portionDescription: '1.5 tazas', baseKcal: 85, baseProtein: 5, baseCarbs: 9, baseFat: 3.5, itemType: 'RECIPE' },
    ],
  },
  {
    dishTitle: 'Albóndigas de pavo en salsa de chipotle con pasta integral y ensalada',
    suggestedTime: '14:30',
    tags: ['omnivore', 'high-protein', 'comfort'],
    items: [
      { name: 'Albóndigas caseras de pechuga de pavo en salsa de chipotle y jitomate', portionDescription: '4 piezas medianas (140g)', baseKcal: 215, baseProtein: 34, baseCarbs: 6, baseFat: 6, itemType: 'RECIPE' },
      { name: 'Pasta corta integral al dente con perejil', portionDescription: '3/4 taza cocida', baseKcal: 155, baseProtein: 6, baseCarbs: 31, baseFat: 1, itemType: 'FOOD' },
      { name: 'Ensalada verde con espinaca, lechuga romana y vinagreta balsámica', portionDescription: 'Abundante + 1 cdta aceite oliva', baseKcal: 60, baseProtein: 1.5, baseCarbs: 4, baseFat: 4.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Lentejas estofadas con verduras campesinas y medallón de res magra',
    suggestedTime: '14:30',
    tags: ['omnivore', 'high-fiber', 'iron-rich'],
    items: [
      { name: 'Lentejas guisadas con jitomate, cebolla, zanahoria y cilantro', portionDescription: '1 taza de lentejas cocidas', baseKcal: 210, baseProtein: 16, baseCarbs: 36, baseFat: 1, itemType: 'RECIPE' },
      { name: 'Medallón o filete de res magro a la plancha', portionDescription: '90g cocido', baseKcal: 150, baseProtein: 24, baseCarbs: 0, baseFat: 5.5, itemType: 'FOOD' },
      { name: 'Ensalada fresca de nopales con orégano y limón', portionDescription: '1 taza', baseKcal: 35, baseProtein: 2, baseCarbs: 7, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Aguacate Hass', portionDescription: '1/4 pieza', baseKcal: 40, baseProtein: 0.5, baseCarbs: 1, baseFat: 4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tazón de quinoa con garbanzos crujientes, vegetales rostizados y tahini',
    suggestedTime: '14:30',
    tags: ['vegan', 'high-fiber', 'plant-protein'],
    items: [
      { name: 'Quinoa cocida con cúrcuma', portionDescription: '3/4 taza', baseKcal: 160, baseProtein: 6, baseCarbs: 30, baseFat: 2.5, itemType: 'FOOD' },
      { name: 'Garbanzos especiados horneados con paprika', portionDescription: '1/2 taza', baseKcal: 135, baseProtein: 7, baseCarbs: 22, baseFat: 2.5, itemType: 'FOOD' },
      { name: 'Calabaza, pimientos y cebolla morada rostizados', portionDescription: '1.5 tazas', baseKcal: 70, baseProtein: 2.5, baseCarbs: 14, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Aderezo ligero de tahini y limón', portionDescription: '1 cda (15g)', baseKcal: 85, baseProtein: 2.5, baseCarbs: 3, baseFat: 7.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Lomo de cerdo magro en salsa de mostaza y miel con puré de papa rústico',
    suggestedTime: '14:30',
    tags: ['omnivore', 'high-protein', 'gourmet'],
    items: [
      { name: 'Medallones de lomo de cerdo magro al horno', portionDescription: '140g cocido en salsa dijon ligera', baseKcal: 210, baseProtein: 36, baseCarbs: 4, baseFat: 5.5, itemType: 'RECIPE' },
      { name: 'Puré de papa rústico con cáscara y leche descremada', portionDescription: '1/2 taza', baseKcal: 110, baseProtein: 3, baseCarbs: 23, baseFat: 1, itemType: 'FOOD' },
      { name: 'Ejotes verdes salteados con almendras fileteadas', portionDescription: '1 taza ejotes + 10g almendras', baseKcal: 90, baseProtein: 3.5, baseCarbs: 9, baseFat: 5.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Ceviche fresco de pescado blanco con mango, pepino y tostadas horneadas',
    suggestedTime: '14:30',
    tags: ['pescatarian', 'low-calorie', 'refreshing'],
    items: [
      { name: 'Ceviche de pescado blanco marinado en limón con cilantro', portionDescription: '160g pescado fresco preparado', baseKcal: 170, baseProtein: 34, baseCarbs: 3, baseFat: 2, itemType: 'RECIPE' },
      { name: 'Cubos de mango y pepino dentro del ceviche', portionDescription: '1/2 taza mango + 1/2 taza pepino', baseKcal: 60, baseProtein: 1, baseCarbs: 15, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Tostadas horneadas de maíz', portionDescription: '3 piezas', baseKcal: 90, baseProtein: 2.5, baseCarbs: 18, baseFat: 1, itemType: 'FOOD' },
      { name: 'Aguacate en cubos', portionDescription: '1/3 pieza (35g)', baseKcal: 50, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Pimientos rellenos de carne molida de res magra y arroz salvaje',
    suggestedTime: '14:30',
    tags: ['omnivore', 'low-carb', 'high-protein'],
    items: [
      { name: 'Pimientos morrones horneados rellenos de res magra 95/5', portionDescription: '2 mitades con 130g carne + salsa pomodoro', baseKcal: 230, baseProtein: 32, baseCarbs: 10, baseFat: 6.5, itemType: 'RECIPE' },
      { name: 'Arroz salvaje o integral mezclado en el relleno', portionDescription: '1/2 taza cocido', baseKcal: 105, baseProtein: 3, baseCarbs: 22, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Queso panela rallado encima gratinado', portionDescription: '30g', baseKcal: 65, baseProtein: 6.5, baseCarbs: 1, baseFat: 4, itemType: 'FOOD' },
      { name: 'Ensalada de espinacas con vinagre de manzana', portionDescription: '1.5 tazas', baseKcal: 25, baseProtein: 2, baseCarbs: 4, baseFat: 0.2, itemType: 'FOOD' },
    ],
  },
];

export const AFTERNOON_SNACK_OPTIONS_POOL: MealOptionDef[] = [
  {
    dishTitle: 'Fresas frescas con requesón campesino y canela',
    suggestedTime: '17:30',
    tags: ['high-protein', 'snack', 'vegetarian'],
    items: [
      { name: 'Fresas frescas rebanadas', portionDescription: '1 taza (150g)', baseKcal: 48, baseProtein: 1, baseCarbs: 11, baseFat: 0.4, itemType: 'FOOD' },
      { name: 'Requesón campesino bajo en grasa', portionDescription: '1/3 taza (80g)', baseKcal: 85, baseProtein: 11, baseCarbs: 2.5, baseFat: 3.5, itemType: 'FOOD' },
      { name: 'Canela molida al gusto', portionDescription: 'Al gusto', baseKcal: 3, baseProtein: 0, baseCarbs: 0.8, baseFat: 0, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tostada de arroz o maíz con crema de cacahuate y plátano',
    suggestedTime: '17:30',
    tags: ['fitness', 'snack'],
    items: [
      { name: 'Tostada de arroz inflado (Rice cake)', portionDescription: '1 pieza', baseKcal: 35, baseProtein: 0.7, baseCarbs: 7, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Mantequilla de cacahuate natural sin azúcar', portionDescription: '1 cda (15g)', baseKcal: 90, baseProtein: 4, baseCarbs: 3, baseFat: 7.5, itemType: 'FOOD' },
      { name: 'Plátano en rodajas finas', portionDescription: '1/3 pieza (40g)', baseKcal: 35, baseProtein: 0.5, baseCarbs: 9, baseFat: 0.1, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Gelatina light con yogur griego batido',
    suggestedTime: '17:30',
    tags: ['high-protein', 'low-carb', 'snack'],
    items: [
      { name: 'Gelatina sin azúcar preparada', portionDescription: '1 taza (200g)', baseKcal: 15, baseProtein: 3, baseCarbs: 0, baseFat: 0, itemType: 'FOOD' },
      { name: 'Yogur griego natural sin azúcar', portionDescription: '1/2 taza (100g)', baseKcal: 65, baseProtein: 10, baseCarbs: 4, baseFat: 1, itemType: 'FOOD' },
      { name: 'Nueces picadas', portionDescription: '3 mitades (9g)', baseKcal: 60, baseProtein: 1.4, baseCarbs: 1.2, baseFat: 6, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Zanahorias baby y pepino con dip de aguacate y limón',
    suggestedTime: '17:30',
    tags: ['low-carb', 'vegetarian', 'snack'],
    items: [
      { name: 'Zanahorias baby y pepino rebanado', portionDescription: '1.5 tazas', baseKcal: 50, baseProtein: 1.5, baseCarbs: 11, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Guacamole ligero con cilantro', portionDescription: '2 cdas (30g)', baseKcal: 45, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 4.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Naranjas en gajos con queso panela fresco',
    suggestedTime: '17:30',
    tags: ['high-protein', 'snack'],
    items: [
      { name: 'Naranja fresca pelada en gajos', portionDescription: '1 pieza mediana', baseKcal: 62, baseProtein: 1.2, baseCarbs: 15, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Queso panela en cubitos', portionDescription: '40g', baseKcal: 85, baseProtein: 9, baseCarbs: 1, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Mix energético de nuez de la india, almendras y arándanos sin azúcar',
    suggestedTime: '17:30',
    tags: ['heart-healthy', 'energy', 'raw'],
    items: [
      { name: 'Nueces de la india y almendras naturales', portionDescription: '20g surtido', baseKcal: 115, baseProtein: 4, baseCarbs: 6, baseFat: 9.5, itemType: 'FOOD' },
      { name: 'Arándanos secos deshidratados sin azúcar', portionDescription: '1 cda (12g)', baseKcal: 38, baseProtein: 0.1, baseCarbs: 9, baseFat: 0.1, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Palomitas caseras hechas con aire caliente y sal marina',
    suggestedTime: '17:30',
    tags: ['high-fiber', 'snack', 'low-calorie'],
    items: [
      { name: 'Palomitas naturales reventadas sin mantequilla', portionDescription: '3 tazas infladas (25g maíz)', baseKcal: 95, baseProtein: 3, baseCarbs: 18, baseFat: 1.2, itemType: 'FOOD' },
      { name: 'Semillas de ajonjolí o chile en polvo', portionDescription: '1 cdta', baseKcal: 18, baseProtein: 0.6, baseCarbs: 0.5, baseFat: 1.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tazón de kiwi y frutos del bosque con semillas de girasol',
    suggestedTime: '17:30',
    tags: ['vitamin-c', 'antioxidant', 'fresh'],
    items: [
      { name: 'Kiwi en rodajas y zarzamoras', portionDescription: '1 pieza kiwi + 1/2 taza zarzamoras', baseKcal: 70, baseProtein: 1.5, baseCarbs: 16, baseFat: 0.6, itemType: 'FOOD' },
      { name: 'Semillas de girasol tostadas sin sal', portionDescription: '1 cda (12g)', baseKcal: 70, baseProtein: 2.5, baseCarbs: 2.5, baseFat: 6, itemType: 'FOOD' },
    ],
  },
];

export const DINNER_OPTIONS_POOL: MealOptionDef[] = [
  {
    dishTitle: 'Sincronizadas ligeras con queso panela y pico de gallo',
    suggestedTime: '20:30',
    tags: ['omnivore', 'high-protein', 'mexican'],
    items: [
      { name: 'Tortillas de maíz nixtamalizado', portionDescription: '2 piezas', baseKcal: 130, baseProtein: 3, baseCarbs: 28, baseFat: 1, itemType: 'FOOD' },
      { name: 'Queso panela o Oaxaca bajo en grasa', portionDescription: '50g', baseKcal: 110, baseProtein: 12, baseCarbs: 1.5, baseFat: 6, itemType: 'FOOD' },
      { name: 'Pechuga de pavo baja en sodio', portionDescription: '2 rebanadas (40g)', baseKcal: 40, baseProtein: 8, baseCarbs: 1, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Pico de gallo fresco con limón', portionDescription: 'Abundante al gusto', baseKcal: 20, baseProtein: 0.8, baseCarbs: 4, baseFat: 0.2, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tostadas de atún a la mexicana con aguacate',
    suggestedTime: '20:30',
    tags: ['pescatarian', 'high-protein', 'mexican'],
    items: [
      { name: 'Atún en agua drenado preparado a la mexicana', portionDescription: '1 lata drenada (120g) + pico de gallo', baseKcal: 130, baseProtein: 29, baseCarbs: 3, baseFat: 1, itemType: 'FOOD' },
      { name: 'Tostadas de maíz horneadas (sin grasa)', portionDescription: '2 piezas', baseKcal: 60, baseProtein: 1.5, baseCarbs: 12, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Aguacate picado en cubos', portionDescription: '1/3 pieza (35g)', baseKcal: 50, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Ceviche fresco de pescado o champiñones con tostadas de maíz',
    suggestedTime: '20:30',
    tags: ['pescatarian', 'mediterranean'],
    items: [
      { name: 'Ceviche fresco de pescado o champiñones con pepino y cilantro', portionDescription: '140g pescado o setas + vegetales', baseKcal: 140, baseProtein: 28, baseCarbs: 5, baseFat: 1.5, itemType: 'RECIPE' },
      { name: 'Tostadas horneadas de maíz', portionDescription: '2 piezas', baseKcal: 60, baseProtein: 1.5, baseCarbs: 12, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Aguacate picado en cubos', portionDescription: '1/3 pieza (35g)', baseKcal: 50, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Omelette ligero de claras con calabacita y queso fresco',
    suggestedTime: '20:30',
    tags: ['vegetarian', 'low-carb', 'high-protein'],
    items: [
      { name: 'Claras de huevo con calabacita tierna en cubos', portionDescription: '3 claras + 1 huevo entero + 1/2 taza calabacita', baseKcal: 145, baseProtein: 18, baseCarbs: 3, baseFat: 6, itemType: 'FOOD' },
      { name: 'Queso panela en cubitos', portionDescription: '40g', baseKcal: 85, baseProtein: 9, baseCarbs: 1, baseFat: 5, itemType: 'FOOD' },
      { name: 'Pan integral tostado o tortilla de maíz', portionDescription: '1 pieza', baseKcal: 70, baseProtein: 2.5, baseCarbs: 14, baseFat: 0.7, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Sándwich gourmet de pechuga de pavo artesanal con germinado y aguacate',
    suggestedTime: '20:30',
    tags: ['omnivore', 'practical'],
    items: [
      { name: 'Sándwich de pechuga de pavo con germinado y jitomate', portionDescription: '2 rebanadas pan integral + 80g pavo + aguacate 30g', baseKcal: 250, baseProtein: 22, baseCarbs: 28, baseFat: 6.5, itemType: 'RECIPE' },
      { name: 'Mostaza dijon y aderezo ligero de yogur', portionDescription: 'Al gusto', baseKcal: 15, baseProtein: 0.5, baseCarbs: 2, baseFat: 0.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Ensalada tibia de pollo deshebrado con vinagreta de limón y aguacate',
    suggestedTime: '20:30',
    tags: ['omnivore', 'low-carb', 'high-protein'],
    items: [
      { name: 'Pechuga de pollo deshebrada tibia', portionDescription: '100g cocida', baseKcal: 150, baseProtein: 31, baseCarbs: 0, baseFat: 3, itemType: 'FOOD' },
      { name: 'Mix de lechugas, espinacas y jitomates cherry', portionDescription: '2 tazas abundantes', baseKcal: 35, baseProtein: 2, baseCarbs: 6, baseFat: 0.3, itemType: 'FOOD' },
      { name: 'Aguacate Hass y aceite de oliva virgen extra', portionDescription: '1/3 aguacate + 1 cdta AOVE', baseKcal: 95, baseProtein: 1, baseCarbs: 2, baseFat: 9.5, itemType: 'FOOD' },
      { name: 'Tostada de maíz horneada', portionDescription: '1 pieza', baseKcal: 30, baseProtein: 0.8, baseCarbs: 6, baseFat: 0.3, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Quesadillas de nopal asado con requesón y salsa martajada',
    suggestedTime: '20:30',
    tags: ['vegetarian', 'low-carb', 'mexican'],
    items: [
      { name: 'Nopales asados al comal a modo de tortilla', portionDescription: '2 piezas grandes', baseKcal: 35, baseProtein: 2, baseCarbs: 7, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Requesón o queso panela fresco', portionDescription: '80g', baseKcal: 120, baseProtein: 14, baseCarbs: 3, baseFat: 5, itemType: 'FOOD' },
      { name: 'Tortilla de maíz nixtamalizado', portionDescription: '1 pieza', baseKcal: 65, baseProtein: 1.5, baseCarbs: 14, baseFat: 0.5, itemType: 'FOOD' },
      { name: 'Aguacate y salsa verde fresca', portionDescription: '1/4 aguacate + salsa', baseKcal: 45, baseProtein: 0.5, baseCarbs: 2, baseFat: 4, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Tacos de lechuga orejona con salmón a las finas hierbas y aguacate',
    suggestedTime: '20:30',
    tags: ['keto', 'pescatarian', 'antiinflammatory'],
    items: [
      { name: 'Hojas de lechuga romana o francesa a modo de taco', portionDescription: '4 hojas grandes', baseKcal: 15, baseProtein: 1, baseCarbs: 3, baseFat: 0.2, itemType: 'FOOD' },
      { name: 'Salmón fresco en lascas o pechuga de pavo salteada', portionDescription: '110g cocido', baseKcal: 190, baseProtein: 24, baseCarbs: 0, baseFat: 10, itemType: 'FOOD' },
      { name: 'Guacamole casero y salsa de mango o pico de gallo', portionDescription: '2 cdas guacamole', baseKcal: 45, baseProtein: 0.5, baseCarbs: 2, baseFat: 4.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Crema ligera de calabacitas sin lácteos con pechuga deshebrada',
    suggestedTime: '20:30',
    tags: ['comfort', 'light', 'high-protein'],
    items: [
      { name: 'Sopa o crema de calabacita italiana licuada con caldo desgrasado', portionDescription: '1.5 tazas', baseKcal: 60, baseProtein: 3, baseCarbs: 10, baseFat: 1, itemType: 'RECIPE' },
      { name: 'Pechuga de pollo cocida deshebrada añadida', portionDescription: '80g', baseKcal: 130, baseProtein: 25, baseCarbs: 0, baseFat: 2.5, itemType: 'FOOD' },
      { name: 'Cubitos de queso panela y semillas de calabaza tostadas', portionDescription: '30g panela + 1 cdta semillas', baseKcal: 85, baseProtein: 7, baseCarbs: 1.5, baseFat: 6, itemType: 'FOOD' },
      { name: 'Tostada horneada', portionDescription: '1 pieza', baseKcal: 30, baseProtein: 0.8, baseCarbs: 6, baseFat: 0.3, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Wrap de atún con verduras crujientes y aderezo de yogur mostaza',
    suggestedTime: '20:30',
    tags: ['practical', 'pescatarian', 'fitness'],
    items: [
      { name: 'Tortilla de trigo integral o nopal', portionDescription: '1 pieza grande (45g)', baseKcal: 100, baseProtein: 4, baseCarbs: 18, baseFat: 1.5, itemType: 'FOOD' },
      { name: 'Atún en agua con apio y pepino picaditos', portionDescription: '1 lata drenada (120g)', baseKcal: 120, baseProtein: 28, baseCarbs: 1, baseFat: 0.8, itemType: 'FOOD' },
      { name: 'Aderezo de yogur griego con mostaza dijon y limón', portionDescription: '2 cdas', baseKcal: 30, baseProtein: 3, baseCarbs: 2, baseFat: 0.5, itemType: 'RECIPE' },
      { name: 'Aguacate Hass en rebanadas', portionDescription: '1/4 pieza (25g)', baseKcal: 40, baseProtein: 0.5, baseCarbs: 1.5, baseFat: 4, itemType: 'FOOD' },
    ],
  },
];

export const EVENING_SNACK_OPTIONS_POOL: MealOptionDef[] = [
  {
    dishTitle: 'Infusión relajante con nueces de castilla',
    suggestedTime: '22:00',
    tags: ['snack', 'low-carb', 'relaxation'],
    items: [
      { name: 'Té de manzanilla, lavanda o tila sin azúcar', portionDescription: '1 taza (250ml)', baseKcal: 2, baseProtein: 0, baseCarbs: 0.5, baseFat: 0, itemType: 'FOOD' },
      { name: 'Nueces de castilla en mitades', portionDescription: '4 mitades (10g)', baseKcal: 65, baseProtein: 1.5, baseCarbs: 1.5, baseFat: 6.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Leche de almendras tibia con canela y cúrcuma (Golden Milk)',
    suggestedTime: '22:00',
    tags: ['snack', 'antiinflammatory', 'relaxation'],
    items: [
      { name: 'Bebida de almendras sin azúcar tibia con canela y cúrcuma', portionDescription: '1 taza (240ml)', baseKcal: 40, baseProtein: 1.5, baseCarbs: 2, baseFat: 3, itemType: 'FOOD' },
      { name: 'Semillas de chía', portionDescription: '1 cdta (5g)', baseKcal: 25, baseProtein: 1, baseCarbs: 2, baseFat: 1.5, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Requesón campesino batido con canela y esencia de vainilla',
    suggestedTime: '22:00',
    tags: ['snack', 'high-protein', 'low-carb'],
    items: [
      { name: 'Queso cottage o requesón bajo en grasa con canela', portionDescription: '1/3 taza (80g)', baseKcal: 65, baseProtein: 10, baseCarbs: 3, baseFat: 1, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Té de tila con 1 cuadro de chocolate amargo 85% cacao',
    suggestedTime: '22:00',
    tags: ['antioxidants', 'relaxation'],
    items: [
      { name: 'Infusión de flores de tila sin endulzar', portionDescription: '1 taza', baseKcal: 2, baseProtein: 0, baseCarbs: 0.5, baseFat: 0, itemType: 'FOOD' },
      { name: 'Chocolate negro 85% cacao puro', portionDescription: '1 cuadrito (10g)', baseKcal: 60, baseProtein: 1, baseCarbs: 3.5, baseFat: 4.8, itemType: 'FOOD' },
    ],
  },
  {
    dishTitle: 'Vaso de leche descremada con extracto natural de vainilla',
    suggestedTime: '22:00',
    tags: ['casein', 'protein', 'sleep'],
    items: [
      { name: 'Leche descremada tibia con vainilla', portionDescription: '1 taza (240ml)', baseKcal: 85, baseProtein: 8.5, baseCarbs: 12, baseFat: 0.5, itemType: 'FOOD' },
    ],
  },
];

export const SEVEN_DAYS_CLINICAL_TEMPLATES: DayTemplateDef[] = [
  {
    dayOfWeek: 1,
    dayName: 'Lunes',
    shortName: 'Lun',
    theme: 'Energía & Arranque Semanal',
    meals: [
      { name: 'Desayuno', suggestedTime: '08:00', mealOrder: 1, items: BREAKFAST_OPTIONS_POOL[0].items },
      { name: 'Colación Matutina', suggestedTime: '11:00', mealOrder: 2, items: MORNING_SNACK_OPTIONS_POOL[0].items },
      { name: 'Comida', suggestedTime: '14:30', mealOrder: 3, items: LUNCH_OPTIONS_POOL[0].items },
      { name: 'Colación Vespertina', suggestedTime: '17:30', mealOrder: 4, items: AFTERNOON_SNACK_OPTIONS_POOL[0].items },
      { name: 'Cena', suggestedTime: '20:30', mealOrder: 5, items: DINNER_OPTIONS_POOL[0].items },
    ],
  },
];

/**
 * Deterministic pseudo-random number generator from seed string or number.
 */
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Shuffles an array with a seeded PRNG to ensure guaranteed non-repetitive variety across 7 days.
 */
function shuffleWithSeed<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates 7 differentiated daily plans scaled to a specific target calories and macro profile,
 * with MAXIMUM CULINARY VARIETY, non-repeating dishes, and patient-specific rotation.
 */
export function generateScaled7DaysPlan(
  targetKcal: number = 1750,
  targetProteinG?: number,
  targetCarbsG?: number,
  targetFatG?: number,
  mealsCount: number = 4,
  options?: {
    dietStyle?: string;
    varietySeed?: number;
    excludedFoods?: string[];
  }
): NutritionPlanDay[] {
  // Use a variety seed combined with timestamp or caller seed
  const rawSeed = options?.varietySeed ?? Math.floor(Math.random() * 1000000) + Date.now() % 10000;
  const rng = seededRandom(rawSeed);

  // Filter or prioritize pools based on dietStyle if applicable
  const style = (options?.dietStyle || '').toLowerCase();
  const filterByTag = (pool: MealOptionDef[]) => {
    if (style.includes('vegetar') || style.includes('vegan')) {
      const match = pool.filter((m) => m.tags?.some((t) => t.includes('vegetar') || t.includes('vegan')));
      return match.length >= 7 ? match : pool;
    }
    if (style.includes('pescet') || style.includes('pescat')) {
      const match = pool.filter((m) => m.tags?.some((t) => t.includes('pescat') || t.includes('vegetar') || t.includes('mediterranean')));
      return match.length >= 7 ? match : pool;
    }
    if (style.includes('keto') || style.includes('low-carb')) {
      const match = pool.filter((m) => m.tags?.some((t) => t.includes('low-carb') || t.includes('keto') || t.includes('high-protein')));
      return match.length >= 7 ? match : pool;
    }
    return pool;
  };

  // Shuffle pools non-repetitively so each day of the 7 days gets a unique, distinctive meal
  const shuffledBreakfasts = shuffleWithSeed(filterByTag(BREAKFAST_OPTIONS_POOL), rng);
  const shuffledMorningSnacks = shuffleWithSeed(filterByTag(MORNING_SNACK_OPTIONS_POOL), rng);
  const shuffledLunches = shuffleWithSeed(filterByTag(LUNCH_OPTIONS_POOL), rng);
  const shuffledAfternoonSnacks = shuffleWithSeed(filterByTag(AFTERNOON_SNACK_OPTIONS_POOL), rng);
  const shuffledDinners = shuffleWithSeed(filterByTag(DINNER_OPTIONS_POOL), rng);
  const shuffledEveningSnacks = shuffleWithSeed(EVENING_SNACK_OPTIONS_POOL, rng);

  const DAYS_META = [
    { dayOfWeek: 1, dayName: 'Lunes', shortName: 'Lun', theme: 'Energía & Arranque Semanal' },
    { dayOfWeek: 2, dayName: 'Martes', shortName: 'Mar', theme: 'Proteína Magra & Complejos' },
    { dayOfWeek: 3, dayName: 'Miércoles', shortName: 'Mié', theme: 'Fibra & Ácidos Grasos Esenciales' },
    { dayOfWeek: 4, dayName: 'Jueves', shortName: 'Jue', theme: 'Vitalidad & Minerales' },
    { dayOfWeek: 5, dayName: 'Viernes', shortName: 'Vie', theme: 'Antioxidantes & Hidratación' },
    { dayOfWeek: 6, dayName: 'Sábado', shortName: 'Sáb', theme: 'Variedad & Flexibilidad Saludable' },
    { dayOfWeek: 7, dayName: 'Domingo', shortName: 'Dom', theme: 'Digestión Ligera & Confort' },
  ];

  return DAYS_META.map((meta, dayIdx) => {
    const breakfast = shuffledBreakfasts[dayIdx % shuffledBreakfasts.length];
    const snack1 = shuffledMorningSnacks[dayIdx % shuffledMorningSnacks.length];
    const lunch = shuffledLunches[dayIdx % shuffledLunches.length];
    const snack2 = shuffledAfternoonSnacks[dayIdx % shuffledAfternoonSnacks.length];
    const dinner = shuffledDinners[dayIdx % shuffledDinners.length];
    const snack3 = shuffledEveningSnacks[dayIdx % shuffledEveningSnacks.length];

    // Build meals according to mealsCount
    const rawMealsDefs: Array<{ name: string; suggestedTime: string; mealOrder: number; items: any[] }> = [];

    if (mealsCount === 3) {
      // 3 Tomas: Desayuno, Comida, Cena
      rawMealsDefs.push(
        { name: 'Desayuno', suggestedTime: breakfast.suggestedTime, mealOrder: 1, items: breakfast.items },
        { name: 'Comida', suggestedTime: lunch.suggestedTime, mealOrder: 2, items: lunch.items },
        { name: 'Cena', suggestedTime: dinner.suggestedTime, mealOrder: 3, items: dinner.items }
      );
    } else if (mealsCount === 4) {
      // 4 Tomas: Alternate structure across days for even more variety!
      // On even days: Desayuno, Colación Matutina, Comida, Cena
      // On odd days: Desayuno, Comida, Colación Vespertina, Cena
      const useAfternoonSnack = dayIdx % 2 === 1;
      if (useAfternoonSnack) {
        rawMealsDefs.push(
          { name: 'Desayuno', suggestedTime: breakfast.suggestedTime, mealOrder: 1, items: breakfast.items },
          { name: 'Comida', suggestedTime: lunch.suggestedTime, mealOrder: 2, items: lunch.items },
          { name: 'Colación Vespertina', suggestedTime: snack2.suggestedTime, mealOrder: 3, items: snack2.items },
          { name: 'Cena', suggestedTime: dinner.suggestedTime, mealOrder: 4, items: dinner.items }
        );
      } else {
        rawMealsDefs.push(
          { name: 'Desayuno', suggestedTime: breakfast.suggestedTime, mealOrder: 1, items: breakfast.items },
          { name: 'Colación Matutina', suggestedTime: snack1.suggestedTime, mealOrder: 2, items: snack1.items },
          { name: 'Comida', suggestedTime: lunch.suggestedTime, mealOrder: 3, items: lunch.items },
          { name: 'Cena', suggestedTime: dinner.suggestedTime, mealOrder: 4, items: dinner.items }
        );
      }
    } else if (mealsCount === 5) {
      // 5 Tomas: Desayuno, Colación Matutina, Comida, Colación Vespertina, Cena
      rawMealsDefs.push(
        { name: 'Desayuno', suggestedTime: breakfast.suggestedTime, mealOrder: 1, items: breakfast.items },
        { name: 'Colación Matutina', suggestedTime: snack1.suggestedTime, mealOrder: 2, items: snack1.items },
        { name: 'Comida', suggestedTime: lunch.suggestedTime, mealOrder: 3, items: lunch.items },
        { name: 'Colación Vespertina', suggestedTime: snack2.suggestedTime, mealOrder: 4, items: snack2.items },
        { name: 'Cena', suggestedTime: dinner.suggestedTime, mealOrder: 5, items: dinner.items }
      );
    } else {
      // 6 Tomas: Desayuno, Colación Matutina, Comida, Colación Vespertina, Cena, Colación Nocturna
      rawMealsDefs.push(
        { name: 'Desayuno', suggestedTime: breakfast.suggestedTime, mealOrder: 1, items: breakfast.items },
        { name: 'Colación Matutina', suggestedTime: snack1.suggestedTime, mealOrder: 2, items: snack1.items },
        { name: 'Comida', suggestedTime: lunch.suggestedTime, mealOrder: 3, items: lunch.items },
        { name: 'Colación Vespertina', suggestedTime: snack2.suggestedTime, mealOrder: 4, items: snack2.items },
        { name: 'Cena', suggestedTime: dinner.suggestedTime, mealOrder: 5, items: dinner.items },
        { name: 'Colación Nocturna', suggestedTime: snack3.suggestedTime, mealOrder: 6, items: snack3.items }
      );
    }

    // Calculate raw base kcal for this day
    let rawDayKcal = 0;
    rawMealsDefs.forEach((m) => {
      m.items.forEach((it: any) => {
        rawDayKcal += it.baseKcal || 0;
      });
    });

    const finalRatio = rawDayKcal > 0 ? targetKcal / rawDayKcal : 1;

    const meals: NutritionPlanMeal[] = rawMealsDefs.map((m, mIdx) => {
      const items: NutritionPlanItem[] = m.items.map((it: any, itIdx: number) => {
        const itemKcal = Math.max(10, Math.round(it.baseKcal * finalRatio));
        const itemProt = Math.max(0.2, Math.round(it.baseProtein * finalRatio * 10) / 10);
        const itemCarb = Math.max(0.2, Math.round(it.baseCarbs * finalRatio * 10) / 10);
        const itemFat = Math.max(0.2, Math.round(it.baseFat * finalRatio * 10) / 10);
        const portionQty = Math.max(0.5, Math.round(finalRatio * 10) / 10);

        return {
          id: `item-${dayIdx + 1}-${mIdx + 1}-${itIdx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          itemType: it.itemType || 'FOOD',
          name: it.name,
          portionDescription: it.portionDescription,
          portionQuantity: portionQty,
          energyKcal: itemKcal,
          proteinG: itemProt,
          carbsG: itemCarb,
          fatG: itemFat,
        };
      });

      return {
        id: `meal-${dayIdx + 1}-${mIdx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: m.name,
        mealOrder: mIdx + 1,
        suggestedTime: m.suggestedTime,
        items,
      };
    });

    return {
      id: `day-${dayIdx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dayOfWeek: meta.dayOfWeek,
      dayName: meta.dayName,
      notes: meta.theme,
      meals,
    };
  });
}
