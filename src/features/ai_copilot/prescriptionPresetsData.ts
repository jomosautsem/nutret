export interface ClinicalPreset {
  id: string;
  name: string;
  badge: string; // e.g. 'Metabólico', 'Rendimiento', 'Basado en Plantas', 'Cardiovascular', 'Digestivo', 'Hormonal', 'Personalizado'
  description: string;
  goal: string;
  caloricAdjustmentType: 'deficit_pct' | 'deficit_kcal' | 'surplus_pct' | 'surplus_kcal' | 'maintenance';
  adjustmentValue: number;
  proteinGKg: number;
  proteinPct?: number;
  proteinMode?: 'gkg' | 'percent';
  carbsPct: number;
  fatPct: number;
  dietStyle: string;
  mealsCount: number;
  conditions: string[];
  allergies: string[];
  prepStyle: string;
  recommendations?: string;
  isVisibleInQuickBar?: boolean;
  isFavorite?: boolean;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: 'deficit_insulin_res',
    name: 'Déficit Moderado + Resistencia a la Insulina',
    badge: 'Metabólico',
    description: 'Control glucémico estricto con carbohidratos de bajo índice glucémico y alta saciedad proteica.',
    goal: 'Pérdida de Grasa y Sensibilidad a la Insulina',
    caloricAdjustmentType: 'deficit_kcal',
    adjustmentValue: -350,
    proteinGKg: 1.9,
    carbsPct: 40,
    fatPct: 30,
    dietStyle: 'Mediterránea / Bajo Índice Glucémico',
    mealsCount: 4,
    conditions: ['Resistencia a la Insulina', 'Sobrepeso'],
    allergies: [],
    prepStyle: 'Práctica / <25 min',
    recommendations: 'Priorizar fibra soluble (chía, avena integral, verduras de hoja verde). Evitar azúcares simples y harinas refinadas. Realizar caminata ligera de 10 min post-comidas.',
    isVisibleInQuickBar: true,
    isFavorite: true,
    isCustom: false,
  },
  {
    id: 'hypertrophy_high_protein',
    name: 'Hipertrofia Muscular Alta Proteína',
    badge: 'Rendimiento',
    description: 'Superávit energético controlado optimizando síntesis proteica con timing peri-entrenamiento.',
    goal: 'Hipertrofia Muscular y Fuerza',
    caloricAdjustmentType: 'surplus_kcal',
    adjustmentValue: 300,
    proteinGKg: 2.2,
    carbsPct: 50,
    fatPct: 22,
    dietStyle: 'Omnívora Flexible',
    mealsCount: 5,
    conditions: [],
    allergies: [],
    prepStyle: 'Meal Prep',
    recommendations: 'Distribuir proteína en 4-5 tomas de mínimo 30g. Ingerir carbohidratos complejos 90 min previos al entrenamiento y batido/comida recuperadora dentro de las 2h posteriores.',
    isVisibleInQuickBar: true,
    isFavorite: true,
    isCustom: false,
  },
  {
    id: 'vegan_balanced',
    name: 'Plan Vegano / Vegetariano Equilibrado',
    badge: 'Basado en Plantas',
    description: 'Combinación de aminoácidos limitantes, leguminosas, semillas y control de micronutrientes (B12, Hierro, Zinc).',
    goal: 'Recomposición Corporal Vegetariana',
    caloricAdjustmentType: 'deficit_pct',
    adjustmentValue: -15,
    proteinGKg: 1.8,
    carbsPct: 52,
    fatPct: 28,
    dietStyle: 'Vegana Estricta / Plant-Based',
    mealsCount: 4,
    conditions: [],
    allergies: ['Lácteos'],
    prepStyle: 'Equilibrada',
    recommendations: 'Complementar cereales con leguminosas (ej. arroz + lentejas). Consumir fuentes de vitamina C junto a alimentos ricos en hierro vegetal. Suplementar cianocobalamina (B12) 2000mcg/semana.',
    isVisibleInQuickBar: true,
    isFavorite: false,
    isCustom: false,
  },
  {
    id: 'cardioprotective_dash',
    name: 'Cardioprotector / DASH / Hipertensión',
    badge: 'Cardiovascular',
    description: 'Bajo en sodio (<1500mg), alto en potasio/magnesio y rico en grasas monoinsaturadas.',
    goal: 'Control de Presión Arterial y Perfil Lipídico',
    caloricAdjustmentType: 'maintenance',
    adjustmentValue: 0,
    proteinGKg: 1.6,
    carbsPct: 50,
    fatPct: 25,
    dietStyle: 'Dieta DASH / Cardiosaludable',
    mealsCount: 4,
    conditions: ['Hipertensión Arterial', 'Dislipidemia'],
    allergies: [],
    prepStyle: 'Económica y Fresca',
    recommendations: 'Restringir sal añadida (<2g/día). Usar hierbas aromáticas y especias como sustituto. Aumentar consumo de frutos secos crudos (nueces) y aceite de oliva virgen extra crudo.',
    isVisibleInQuickBar: true,
    isFavorite: false,
    isCustom: false,
  },
  {
    id: 'gastroprotective_fodmap',
    name: 'Gastroprotector / Bajo en FODMAPs',
    badge: 'Digestivo',
    description: 'Alivio de distensión, SII y gastritis excluyendo oligosacáridos, disacáridos y polioles fermentables.',
    goal: 'Salud Digestiva y Reducción de Inflamación',
    caloricAdjustmentType: 'maintenance',
    adjustmentValue: 0,
    proteinGKg: 1.7,
    carbsPct: 45,
    fatPct: 30,
    dietStyle: 'Baja en FODMAPs / Fácil Digestión',
    mealsCount: 4,
    conditions: ['Síndrome de Intestino Irritable (SII)', 'Gastritis'],
    allergies: ['Lactosa', 'Trigo'],
    prepStyle: 'Suave / Cocción al Vapor',
    recommendations: 'Comer en ambiente tranquilo y masticar lentamente. Evitar irritantes gástricos (café en ayunas, alcohol, picantes fuertes, bebidas carbonatadas). Fase de eliminación por 4-6 semanas.',
    isVisibleInQuickBar: true,
    isFavorite: false,
    isCustom: false,
  },
  {
    id: 'sop_hormonal_balance',
    name: 'Recomposición Femenina / SOP',
    badge: 'Hormonal',
    description: 'Protocolo antiinflamatorio con modulación de insulina, grasas antiinflamatorias omega-3 y fitoestrógenos.',
    goal: 'Balance Hormonal y Pérdida de Grasa Visceral',
    caloricAdjustmentType: 'deficit_kcal',
    adjustmentValue: -300,
    proteinGKg: 1.8,
    carbsPct: 38,
    fatPct: 32,
    dietStyle: 'Antiinflamatoria / Mediterránea',
    mealsCount: 4,
    conditions: ['Síndrome de Ovario Poliquístico (SOP)', 'Resistencia a la Insulina'],
    allergies: [],
    prepStyle: 'Práctica',
    recommendations: 'Enfocarse en índice glucémico bajo y alto contenido de polifenoles (frutos rojos, cúrcuma, té verde). Incluir semillas de linaza molida y suplementación con Inositol según criterio.',
    isVisibleInQuickBar: true,
    isFavorite: false,
    isCustom: false,
  },
];

export const PRESET_BADGES = [
  'Metabólico',
  'Rendimiento',
  'Basado en Plantas',
  'Cardiovascular',
  'Digestivo',
  'Hormonal',
  'Clínico Especial',
  'Pérdida de Peso',
  'Antiinflamatorio',
  'Personalizado',
];
