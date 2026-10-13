import {
  Organization,
  UserProfile,
  Patient,
  ClinicalRecord,
  AnthropometricRecord,
  LaboratoryResult,
  Food,
  FoodEquivalentGroup,
  Recipe,
  NutritionPlan,
  MealLog,
  WaterLog,
  SupplementPrescription,
  SupplementLog,
  ProgressPhoto,
  ExerciseRoutine,
  Appointment,
  PaymentRecord,
  ChatMessage,
  AppNotification,
  Branch,
} from '../types';
import { ClinicalPreset, INITIAL_CLINICAL_PRESETS } from '../features/ai_copilot/prescriptionPresetsData';
import { supabaseDb } from './supabaseDb';

const STORAGE_KEYS = {
  ORGANIZATION: 'nutriluz_org',
  BRANCHES: 'nutriluz_branches',
  SPECIALISTS: 'nutriluz_specialists',
  CURRENT_USER: 'nutriluz_current_user',
  PATIENTS: 'nutriluz_patients',
  DELETED_PATIENT_IDS: 'nutriluz_deleted_patient_ids',
  CLINICAL_RECORDS: 'nutriluz_clinical_records',
  ANTHROPOMETRY: 'nutriluz_anthropometry',
  LABS: 'nutriluz_labs',
  EQUIVALENT_GROUPS: 'nutriluz_equivalent_groups',
  FOODS: 'nutriluz_foods',
  RECIPES: 'nutriluz_recipes',
  PLANS: 'nutriluz_plans',
  MEAL_LOGS: 'nutriluz_meal_logs',
  WATER_LOGS: 'nutriluz_water_logs',
  SUPPLEMENTS: 'nutriluz_supplements',
  SUPPLEMENT_LOGS: 'nutriluz_supplement_logs',
  EXERCISE_ROUTINES: 'nutriluz_exercises',
  APPOINTMENTS: 'nutriluz_appointments',
  PAYMENTS: 'nutriluz_payments',
  MESSAGES: 'nutriluz_messages',
  NOTIFICATIONS: 'nutriluz_notifications',
  PROGRESS_PHOTOS: 'nutriluz_progress_photos',
  PRESCRIPTION_PRESETS: 'nutriluz_prescription_presets',
  INITIALIZED: 'nutriluz_seed_v1',
};

// Safe asynchronous event dispatcher to prevent render-phase setState conflicts
export function safeDispatchEvent(name: string, detail?: any) {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (e) {
      console.warn(`Error dispatching ${name}:`, e);
    }
  }, 0);
}

// Default organization
export const initialOrganization: Organization = {
  id: 'org-nutriluz-mexico',
  name: 'Nutri Luz Elena',
  slug: 'nutri-luz-elena',
  logoUrl: 'https://qbhsmptpepxuuknwygdo.supabase.co/storage/v1/object/public/clinic-assets/logos/clinic_logo_1791503381084_ChatGPT_Image_7_oct_2026__01_44_24_p.m._opt.png',
  primaryColor: '#059669', // Emerald 600
  secondaryColor: '#047857',
  currency: 'MXN',
  country: 'México',
  phone: '7773846122',
  whatsapp: '7773846122',
  watermarkOpacity: 0.14,
  email: 'contacto@nutriluz.mx',
  address: 'Temixco, Morelos',
  taxId: 'NLZ240101XYZ',
  website: 'https://nutriluz.mx',
};

export const initialBranches: Branch[] = [
  {
    id: 'branch-cdmx-sur',
    organizationId: 'org-nutriluz-mexico',
    name: 'Consultorio Principal',
    code: 'CONS-PRINCIPAL',
    phone: '7773846122',
    whatsapp: '7773846122',
    address: 'Temixco, Morelos',
    isActive: true,
  },
  {
    id: 'branch-gdl-prov',
    organizationId: 'org-nutriluz-mexico',
    name: 'Sucursal Guadalajara (Providencia)',
    code: 'GDL-PROV',
    phone: '7773846122',
    whatsapp: '7773846122',
    address: 'Av. Providencia 2450, Guadalajara, JAL',
    isActive: true,
  },
];

export const initialSpecialists: UserProfile[] = [
  {
    id: 'user-lic-luz-elena',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    role: 'NUTRIOLOGO',
    email: 'luzelenaalcocer14@gmail.com',
    firstName: 'Luz Elena',
    lastName: 'Alcocer',
    professionalTitle: 'Lic. en Nutrición',
    licenseNumber: '15573967',
    specialties: ['Nutrición Clínica', 'Recomposición Corporal', 'Salud Metabólica'],
    avatarUrl: 'https://images.unsplash.com/photo-1594824813686-639a0397500e?w=300&auto=format&fit=crop&q=80',
    phone: '7773846122',
    whatsapp: '7773846122',
    bio: 'Especialista en nutrición personalizada basada en evidencia científica, recomposición corporal y control de resistencia a la insulina con más de 8 años de experiencia clínica.',
    publicProfileEnabled: true,
    publicSlug: 'luz-elena-alcocer',
    isActive: true,
  },
];

export const initialEquivalentGroups: FoodEquivalentGroup[] = [
  { id: 'eq-verduras', name: 'Verduras', code: 'VERDURAS', colorHex: '#10B981', avgEnergyKcal: 25, avgProteinG: 2, avgCarbsG: 4, avgFatG: 0, description: 'Espinacas, jitomate, nopales, brócoli, lechuga.' },
  { id: 'eq-frutas', name: 'Frutas', code: 'FRUTAS', colorHex: '#F59E0B', avgEnergyKcal: 60, avgProteinG: 0, avgCarbsG: 15, avgFatG: 0, description: 'Manzana, plátano, fresas, papaya, moras.' },
  { id: 'eq-cereales-sg', name: 'Cereales sin grasa', code: 'CEREALES_SG', colorHex: '#EAB308', avgEnergyKcal: 70, avgProteinG: 2, avgCarbsG: 15, avgFatG: 0, description: 'Avena, tortilla de maíz, arroz integral, pasta, tostadas horneadas.' },
  { id: 'eq-cereales-cg', name: 'Cereales con grasa', code: 'CEREALES_CG', colorHex: '#D97706', avgEnergyKcal: 115, avgProteinG: 2, avgCarbsG: 15, avgFatG: 5, description: 'Galletas de avena con chispas, pan dulce, tamal.' },
  { id: 'eq-leguminosas', name: 'Leguminosas', code: 'LEGUMINOSAS', colorHex: '#84CC16', avgEnergyKcal: 120, avgProteinG: 8, avgCarbsG: 20, avgFatG: 1, description: 'Frijoles cocidos, lentejas, garbanzos, habas.' },
  { id: 'eq-aoa-mba', name: 'AOA Muy Bajo Aporte', code: 'AOA_MBA', colorHex: '#EF4444', avgEnergyKcal: 40, avgProteinG: 7, avgCarbsG: 0, avgFatG: 1, description: 'Claras de huevo, pechuga de pavo, atún en agua.' },
  { id: 'eq-aoa-ba', name: 'AOA Bajo Aporte', code: 'AOA_BA', colorHex: '#F87171', avgEnergyKcal: 55, avgProteinG: 7, avgCarbsG: 0, avgFatG: 3, description: 'Pechuga de pollo sin piel, filete de tilapia, queso panela.' },
  { id: 'eq-aoa-ma', name: 'AOA Moderado Aporte', code: 'AOA_MA', colorHex: '#DC2626', avgEnergyKcal: 75, avgProteinG: 7, avgCarbsG: 0, avgFatG: 5, description: 'Huevo entero, carne de res bistec magro, queso Oaxaca.' },
  { id: 'eq-aoa-aa', name: 'AOA Alto Aporte', code: 'AOA_AA', colorHex: '#B91C1C', avgEnergyKcal: 100, avgProteinG: 7, avgCarbsG: 0, avgFatG: 8, description: 'Queso manchego, carne de cerdo, salchicha de pavo.' },
  { id: 'eq-leche-desc', name: 'Leche descremada', code: 'LECHE_DESC', colorHex: '#3B82F6', avgEnergyKcal: 95, avgProteinG: 9, avgCarbsG: 12, avgFatG: 2, description: 'Leche descremada, yogur griego sin azúcar.' },
  { id: 'eq-leche-ent', name: 'Leche entera', code: 'LECHE_ENT', colorHex: '#1D4ED8', avgEnergyKcal: 150, avgProteinG: 9, avgCarbsG: 12, avgFatG: 8, description: 'Leche entera pasteurizada, yogur natural entero.' },
  { id: 'eq-grasas-sp', name: 'Grasas sin proteína', code: 'GRASAS_SP', colorHex: '#8B5CF6', avgEnergyKcal: 45, avgProteinG: 0, avgCarbsG: 0, avgFatG: 5, description: 'Aceite de oliva extra virgen, aguacate Hass, aceite de aguacate.' },
  { id: 'eq-grasas-cp', name: 'Grasas con proteína', code: 'GRASAS_CP', colorHex: '#6D28D9', avgEnergyKcal: 70, avgProteinG: 3, avgCarbsG: 3, avgFatG: 5, description: 'Almendras, nuez pecana, semillas de chía, cacahuates tostados.' },
  { id: 'eq-azucares-sg', name: 'Azúcares sin grasa', code: 'AZUCARES_SG', colorHex: '#EC4899', avgEnergyKcal: 40, avgProteinG: 0, avgCarbsG: 10, avgFatG: 0, description: 'Miel de abeja pura, mermelada reducida en azúcar.' },
];

export const initialFoods: Food[] = [
  { id: 'f-1', name: 'Pechuga de pollo cocida s/piel', servingSize: '30g', servingWeightG: 30, energyKcal: 55, proteinG: 7, carbsG: 0, fatG: 3, equivalentGroupCode: 'AOA_BA' },
  { id: 'f-2', name: 'Pechuga de pollo a la plancha (porción 120g)', servingSize: '120g', servingWeightG: 120, energyKcal: 220, proteinG: 28, carbsG: 0, fatG: 12, equivalentGroupCode: 'AOA_BA' },
  { id: 'f-3', name: 'Huevo de gallina entero', servingSize: '1 pieza (50g)', servingWeightG: 50, energyKcal: 75, proteinG: 7, carbsG: 0.5, fatG: 5, equivalentGroupCode: 'AOA_MA' },
  { id: 'f-4', name: 'Clara de huevo pasteurizada', servingSize: '2 piezas (60ml)', servingWeightG: 60, energyKcal: 40, proteinG: 7, carbsG: 0, fatG: 0.2, equivalentGroupCode: 'AOA_MBA' },
  { id: 'f-5', name: 'Atún en agua (Dolores/Herdez)', servingSize: '1/3 de lata (40g)', servingWeightG: 40, energyKcal: 40, proteinG: 7.5, carbsG: 0, fatG: 0.5, equivalentGroupCode: 'AOA_MBA' },
  { id: 'f-6', name: 'Filete de tilapia o pescado blanco', servingSize: '40g', servingWeightG: 40, energyKcal: 55, proteinG: 7, carbsG: 0, fatG: 2.5, equivalentGroupCode: 'AOA_BA' },
  { id: 'f-7', name: 'Queso panela fresco (Lala/Fud)', servingSize: '40g', servingWeightG: 40, energyKcal: 55, proteinG: 6.5, carbsG: 1, fatG: 3, equivalentGroupCode: 'AOA_BA' },
  { id: 'f-8', name: 'Tortilla de maíz nixtamalizado', servingSize: '1 pieza (30g)', servingWeightG: 30, energyKcal: 70, proteinG: 2, carbsG: 15, fatG: 0.5, fiberG: 1.5, equivalentGroupCode: 'CEREALES_SG' },
  { id: 'f-9', name: 'Tostadas de maíz horneadas (Sanissimo)', servingSize: '2 piezas (24g)', servingWeightG: 24, energyKcal: 70, proteinG: 2, carbsG: 15, fatG: 0.5, fiberG: 2, equivalentGroupCode: 'CEREALES_SG' },
  { id: 'f-10', name: 'Avena en hojuelas cruda (Quaker)', servingSize: '1/3 taza (30g)', servingWeightG: 30, energyKcal: 70, proteinG: 3, carbsG: 14, fatG: 1.5, fiberG: 3, equivalentGroupCode: 'CEREALES_SG' },
  { id: 'f-11', name: 'Arroz integral cocido', servingSize: '1/2 taza (100g)', servingWeightG: 100, energyKcal: 70, proteinG: 2, carbsG: 15, fatG: 0.5, fiberG: 1.8, equivalentGroupCode: 'CEREALES_SG' },
  { id: 'f-12', name: 'Frijoles negros de la olla cocidos', servingSize: '1/2 taza (90g)', servingWeightG: 90, energyKcal: 120, proteinG: 8, carbsG: 20, fatG: 1, fiberG: 7, equivalentGroupCode: 'LEGUMINOSAS' },
  { id: 'f-13', name: 'Lentejas cocidas', servingSize: '1/2 taza (100g)', servingWeightG: 100, energyKcal: 120, proteinG: 8, carbsG: 20, fatG: 0.8, fiberG: 6, equivalentGroupCode: 'LEGUMINOSAS' },
  { id: 'f-14', name: 'Aguacate Hass', servingSize: '1/3 pieza (35g)', servingWeightG: 35, energyKcal: 45, proteinG: 0.5, carbsG: 1.5, fatG: 5, fiberG: 2, equivalentGroupCode: 'GRASAS_SP' },
  { id: 'f-15', name: 'Aceite de oliva extra virgen', servingSize: '1 cucharadita (5ml)', servingWeightG: 5, energyKcal: 45, proteinG: 0, carbsG: 0, fatG: 5, equivalentGroupCode: 'GRASAS_SP' },
  { id: 'f-16', name: 'Almendras enteras naturales', servingSize: '10 piezas (12g)', servingWeightG: 12, energyKcal: 70, proteinG: 3, carbsG: 2.5, fatG: 6, fiberG: 1.5, equivalentGroupCode: 'GRASAS_CP' },
  { id: 'f-17', name: 'Nuez pecana en mitades', servingSize: '3 piezas enteras (12g)', servingWeightG: 12, energyKcal: 70, proteinG: 1.5, carbsG: 2, fatG: 7, equivalentGroupCode: 'GRASAS_CP' },
  { id: 'f-18', name: 'Espinaca fresca cruda', servingSize: '2 tazas (120g)', servingWeightG: 120, energyKcal: 25, proteinG: 2.5, carbsG: 3.5, fatG: 0.3, fiberG: 2.5, equivalentGroupCode: 'VERDURAS' },
  { id: 'f-19', name: 'Jitomate guaje bola', servingSize: '1 pieza mediana (120g)', servingWeightG: 120, energyKcal: 25, proteinG: 1.2, carbsG: 4.8, fatG: 0.2, fiberG: 1.5, equivalentGroupCode: 'VERDURAS' },
  { id: 'f-20', name: 'Nopales cocidos picados', servingSize: '1 taza (150g)', servingWeightG: 150, energyKcal: 25, proteinG: 1.8, carbsG: 4, fatG: 0.2, fiberG: 3.2, equivalentGroupCode: 'VERDURAS' },
  { id: 'f-21', name: 'Brócoli al vapor', servingSize: '1 taza (100g)', servingWeightG: 100, energyKcal: 25, proteinG: 2.5, carbsG: 4.5, fatG: 0.3, fiberG: 2.8, equivalentGroupCode: 'VERDURAS' },
  { id: 'f-22', name: 'Manzana roja/verde', servingSize: '1 pieza chica (100g)', servingWeightG: 100, energyKcal: 60, proteinG: 0.3, carbsG: 15, fatG: 0.2, fiberG: 2.5, equivalentGroupCode: 'FRUTAS' },
  { id: 'f-23', name: 'Plátano tabasco', servingSize: '1/2 pieza (60g)', servingWeightG: 60, energyKcal: 60, proteinG: 0.8, carbsG: 15, fatG: 0.2, fiberG: 1.6, equivalentGroupCode: 'FRUTAS' },
  { id: 'f-24', name: 'Fresas rebanadas frescas', servingSize: '1 taza (150g)', servingWeightG: 150, energyKcal: 60, proteinG: 1, carbsG: 14, fatG: 0.4, fiberG: 3, equivalentGroupCode: 'FRUTAS' },
  { id: 'f-25', name: 'Papaya picada', servingSize: '1 taza (140g)', servingWeightG: 140, energyKcal: 60, proteinG: 0.8, carbsG: 15, fatG: 0.2, fiberG: 2.2, equivalentGroupCode: 'FRUTAS' },
  { id: 'f-26', name: 'Yogur griego Fage 0% o Chobani natural', servingSize: '3/4 taza (150g)', servingWeightG: 150, energyKcal: 95, proteinG: 15, carbsG: 6, fatG: 0, equivalentGroupCode: 'LECHE_DESC' },
  { id: 'f-27', name: 'Leche de vaca descremada (Santa Clara)', servingSize: '1 taza (240ml)', servingWeightG: 240, energyKcal: 95, proteinG: 9, carbsG: 12, fatG: 1, equivalentGroupCode: 'LECHE_DESC' },
  { id: 'f-28', name: 'Bebida de almendras sin azúcar (Silk/Nature\'s Heart)', servingSize: '1 taza (240ml)', servingWeightG: 240, energyKcal: 35, proteinG: 1, carbsG: 1, fatG: 2.5, equivalentGroupCode: 'GRASAS_SP' },
  { id: 'f-29', name: 'Miel de abeja pura', servingSize: '2 cucharaditas (10g)', servingWeightG: 10, energyKcal: 40, proteinG: 0, carbsG: 10, fatG: 0, equivalentGroupCode: 'AZUCARES_SG' },
  { id: 'f-30', name: 'Semillas de chía', servingSize: '1 cucharada sopera (12g)', servingWeightG: 12, energyKcal: 70, proteinG: 2.5, carbsG: 4.5, fatG: 4, fiberG: 4, equivalentGroupCode: 'GRASAS_CP' },
];

export const initialRecipes: Recipe[] = [
  {
    id: 'rec-1',
    name: 'Omelette Verde con Espinacas y Queso Panela',
    description: 'Delicioso desayuno alto en proteína y fibra con vegetales frescos y aguacate sobre tortilla de maíz.',
    photoUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
    category: 'Desayuno',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    difficulty: 'Fácil',
    servings: 1,
    caloriesKcal: 385,
    proteinG: 26,
    carbsG: 32,
    fatG: 16,
    fiberG: 6,
    tags: ['Alta proteína', 'Mexicana', 'Fácil', 'Vegetariana'],
    ingredients: [
      { id: 'i-1', foodName: 'Huevo entero fresco', amount: 2, unit: 'piezas (100g)', gramWeight: 100, prepState: 'Batido con sal marina y orégano', equivalentGroupName: 'AOA Moderado Aporte' },
      { id: 'i-2', foodName: 'Espinaca baby fresca', amount: 1, unit: 'taza colmada (60g)', gramWeight: 60, prepState: 'Lavada, desinfectada y salteada', equivalentGroupName: 'Verduras' },
      { id: 'i-3', foodName: 'Queso panela pasteurizado', amount: 40, unit: 'g (1 rebanada gruesa)', gramWeight: 40, prepState: 'En cubos pequeños', equivalentGroupName: 'AOA Bajo Aporte' },
      { id: 'i-4', foodName: 'Tortilla de maíz nixtamalizado', amount: 2, unit: 'piezas (60g)', gramWeight: 60, prepState: 'Calientes en comal', equivalentGroupName: 'Cereales sin grasa' },
      { id: 'i-5', foodName: 'Aguacate Hass', amount: 35, unit: 'g (1/3 pieza)', gramWeight: 35, prepState: 'En rebanadas firmes', equivalentGroupName: 'Grasas sin proteína' },
      { id: 'i-5b', foodName: 'Aceite de oliva extravirgen', amount: 5, unit: 'ml (1 cucharadita)', gramWeight: 5, prepState: 'En sartén antiadherente', equivalentGroupName: 'Grasas sin proteína', isSeasoning: true },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Bate los 2 huevos enteros en un tazón con una pizca de sal marina, pimienta negra molida y orégano.' },
      { stepNumber: 2, instruction: 'En un sartén antiadherente con la cucharadita (5 ml) de aceite de oliva, sofríe las espinacas frescas por 1 minuto hasta que reduzcan.' },
      { stepNumber: 3, instruction: 'Vierte los huevos batidos sobre las espinacas a fuego medio-bajo.' },
      { stepNumber: 4, instruction: 'Agrega los 40 g de queso panela en cubos en una mitad, dobla el omelette y cocina 2 minutos tapado.' },
      { stepNumber: 5, instruction: 'Sirve acompañado de 2 tortillas de maíz calientes y las rebanadas de aguacate fresco.' },
    ],
  },
  {
    id: 'rec-2',
    name: 'Pechuga a la Plancha con Arroz al Vapor y Nopales Asados',
    description: 'Plato balanceado perfecto para comida principal con proteína magra, carbohidrato complejo y fibra.',
    photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    category: 'Comida',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    difficulty: 'Fácil',
    servings: 1,
    caloriesKcal: 490,
    proteinG: 38,
    carbsG: 50,
    fatG: 14,
    fiberG: 8,
    tags: ['Alta proteína', 'Mexicana', 'Económica', 'Sin gluten'],
    ingredients: [
      { id: 'i-6', foodName: 'Pechuga de pollo limpia sin piel', amount: 130, unit: 'g en crudo (100g cocida)', gramWeight: 130, prepState: 'Fileteada y marinada con ajo y limón', equivalentGroupName: 'AOA Bajo Aporte' },
      { id: 'i-7', foodName: 'Arroz integral cocido al vapor', amount: 120, unit: 'g (3/4 taza cocido)', gramWeight: 120, prepState: 'Al vapor sin grasa', equivalentGroupName: 'Cereales sin grasa' },
      { id: 'i-8', foodName: 'Nopales tiernos medianos', amount: 2, unit: 'piezas (140g)', gramWeight: 140, prepState: 'Asados enteros a la plancha con orégano', equivalentGroupName: 'Verduras' },
      { id: 'i-9', foodName: 'Frijoles negros de la olla', amount: 86, unit: 'g (1/2 taza con poco caldo)', gramWeight: 86, prepState: 'Cocidos con epazote', equivalentGroupName: 'Leguminosas' },
      { id: 'i-10', foodName: 'Aceite de oliva extravirgen', amount: 5, unit: 'ml (1 cucharadita)', gramWeight: 5, prepState: 'Para barnizar la plancha', equivalentGroupName: 'Grasas sin proteína', isSeasoning: true },
      { id: 'i-10b', foodName: 'Pico de gallo fresco', amount: 45, unit: 'g (3 cucharadas)', gramWeight: 45, prepState: 'Jitomate, cebolla y cilantro con limón', equivalentGroupName: 'Verduras', isSeasoning: true },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Sazona la pechuga de pollo con ajo en polvo, paprika, sal marina y pimienta negra molida.' },
      { stepNumber: 2, instruction: 'Asa los 2 nopales y la pechuga en una plancha caliente con la cucharadita de aceite de oliva por 6-8 minutos por lado.' },
      { stepNumber: 3, instruction: 'Calienta el arroz integral al vapor y los frijoles negros de la olla.' },
      { stepNumber: 4, instruction: 'Monta en un plato amplio con una porción generosa de pico de gallo fresco o salsa verde al gusto.' },
    ],
  },
  {
    id: 'rec-3',
    name: 'Tazón de Yogur Griego con Frutos Rojos y Almendras',
    description: 'Colación refrescante rica en probióticos, proteína de alto valor biológico y antioxidantes.',
    photoUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80',
    category: 'Colación',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    difficulty: 'Fácil',
    servings: 1,
    caloriesKcal: 235,
    proteinG: 18,
    carbsG: 22,
    fatG: 7,
    fiberG: 4,
    tags: ['Rápida', 'Sin cocción', 'Vegetariana', 'Baja en azúcar'],
    ingredients: [
      { id: 'i-11', foodName: 'Yogur griego natural 0% sin azúcar', amount: 170, unit: 'g (3/4 taza)', gramWeight: 170, prepState: 'Frío de refrigerador', equivalentGroupName: 'Leche descremada' },
      { id: 'i-12', foodName: 'Frutos rojos frescos (fresas y moras)', amount: 140, unit: 'g (1 taza)', gramWeight: 140, prepState: 'Lavados, desinfectados y rebanados', equivalentGroupName: 'Frutas' },
      { id: 'i-13', foodName: 'Almendras naturales enteras o fileteadas', amount: 10, unit: 'piezas (14g)', gramWeight: 14, prepState: 'Tostadas ligeramente sin sal', equivalentGroupName: 'Grasas con proteína' },
      { id: 'i-14', foodName: 'Canela en polvo', amount: 2, unit: 'g (1/2 cucharadita)', gramWeight: 2, prepState: 'Espolvoreada encima', equivalentGroupName: 'Libre', isSeasoning: true },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Coloca el yogur griego frío en un tazón hondo.' },
      { stepNumber: 2, instruction: 'Lava y rebana las fresas; colócalas sobre el yogur junto con las moras.' },
      { stepNumber: 3, instruction: 'Espolvorea las almendras tostadas y la canela en polvo. Disfruta de inmediato.' },
    ],
  },
  {
    id: 'rec-4',
    name: 'Tostadas de Atún a la Mexicana con Aguacate',
    description: 'Cena ligera, saciante, rápida de preparar y excelente para días con poco tiempo.',
    photoUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
    category: 'Cena',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    difficulty: 'Fácil',
    servings: 1,
    caloriesKcal: 320,
    proteinG: 27,
    carbsG: 30,
    fatG: 9,
    fiberG: 5,
    tags: ['Rápida', 'Económica', 'Alta proteína', 'Mexicana'],
    ingredients: [
      { id: 'i-15', foodName: 'Atún claro en agua', amount: 1, unit: 'lata (100g masa drenada)', gramWeight: 100, prepState: 'Completamente drenado y exprimido', equivalentGroupName: 'AOA Muy Bajo Aporte' },
      { id: 'i-16', foodName: 'Verduras frescas mixtas (jitomate, cebolla y cilantro)', amount: 1, unit: 'taza colmada (120g)', gramWeight: 120, prepState: 'Picadas en cubos con jugo de 1 limón', equivalentGroupName: 'Verduras' },
      { id: 'i-17', foodName: 'Tostadas de maíz horneadas (ej. Saníssimo)', amount: 3, unit: 'piezas (36g)', gramWeight: 36, prepState: 'Crujientes sin freír', equivalentGroupName: 'Cereales sin grasa' },
      { id: 'i-18', foodName: 'Aguacate Hass', amount: 35, unit: 'g (1/3 pieza)', gramWeight: 35, prepState: 'En rebanadas firmes', equivalentGroupName: 'Grasas sin proteína' },
      { id: 'i-19', foodName: 'Jugo de limón agrio y sal marina', amount: 15, unit: 'ml (1 cucharada)', gramWeight: 15, prepState: 'Recién exprimido', equivalentGroupName: 'Libre', isSeasoning: true },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Drena el agua de la lata de atún presionando firmemente con la tapa.' },
      { stepNumber: 2, instruction: 'En un tazón mezcla el atún con el jitomate, cebolla, cilantro y jugo de limón fresco con sal.' },
      { stepNumber: 3, instruction: 'Monta la mezcla sobre las 3 tostadas horneadas y decora con rebanadas de aguacate.' },
    ],
  },
  {
    id: 'rec-5',
    name: 'Huevos revueltos con espinacas y jitomate',
    description: 'Desayuno balanceado rico en proteína de alto valor biológico, hierro y antioxidantes naturales.',
    photoUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
    category: 'Desayuno',
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    difficulty: 'Fácil',
    servings: 1,
    caloriesKcal: 380,
    proteinG: 20,
    carbsG: 34,
    fatG: 18,
    fiberG: 6,
    tags: ['Alta proteína', 'Mexicana', 'Rápida', 'Vegetariana'],
    ingredients: [
      { id: 'i-20', foodName: 'Huevo entero fresco', amount: 2, unit: 'piezas (100g)', gramWeight: 100, prepState: 'Batido con sal marina y pimienta molida', equivalentGroupName: 'AOA Moderado Aporte' },
      { id: 'i-21', foodName: 'Espinacas frescas desinfectadas', amount: 1, unit: 'taza colmada (60g)', gramWeight: 60, prepState: 'Lavadas, desinfectadas y troceadas', equivalentGroupName: 'Verduras' },
      { id: 'i-22', foodName: 'Jitomate saladette fresco', amount: 0.5, unit: 'pieza mediana (60g)', gramWeight: 60, prepState: 'Picado en cubos pequeños', equivalentGroupName: 'Verduras' },
      { id: 'i-23', foodName: 'Tortilla de maíz nixtamalizado', amount: 2, unit: 'piezas (50g)', gramWeight: 50, prepState: 'Calientes en comal', equivalentGroupName: 'Cereales sin grasa' },
      { id: 'i-24', foodName: 'Aguacate Hass fresco', amount: 35, unit: 'g (1/3 pieza)', gramWeight: 35, prepState: 'En rebanadas firmes', equivalentGroupName: 'Grasas sin proteína' },
      { id: 'i-25', foodName: 'Aceite de oliva extravirgen', amount: 5, unit: 'ml (1 cucharadita)', gramWeight: 5, prepState: 'En sartén antiadherente', equivalentGroupName: 'Grasas sin proteína', isSeasoning: true },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Lava y desinfecta la taza de espinacas frescas y pica el 1/2 jitomate saladette en cubos pequeños.' },
      { stepNumber: 2, instruction: 'En un tazón, bate los 2 huevos enteros con una pizca de sal marina y pimienta negra molida.' },
      { stepNumber: 3, instruction: 'Calienta 1 cucharadita de aceite de oliva en un sartén a fuego medio; sofríe el jitomate picado y las espinacas durante 1 minuto.' },
      { stepNumber: 4, instruction: 'Vierte los huevos batidos y cocina revolviendo suavemente con espátula a fuego medio-bajo hasta que cuajen al punto deseado.' },
      { stepNumber: 5, instruction: 'Sirve de inmediato acompañado de las 2 tortillas de maíz calientes y el 1/3 de aguacate Hass en rebanadas.' },
    ],
  },
];

export const initialPatients: Patient[] = [];
export const initialAnthropometricRecords: AnthropometricRecord[] = [];
export const initialClinicalRecords: ClinicalRecord[] = [];
export const initialLaboratories: LaboratoryResult[] = [];
export const initialPlans: NutritionPlan[] = [];
export const initialMealLogs: MealLog[] = [];
export const initialWaterLogs: WaterLog[] = [];
export const initialSupplements: SupplementPrescription[] = [];
export const initialSupplementLogs: SupplementLog[] = [];
export const initialAppointments: Appointment[] = [];
export const initialPayments: PaymentRecord[] = [];
export const initialMessages: ChatMessage[] = [];
export const initialNotifications: AppNotification[] = [];
export const initialExerciseRoutines: ExerciseRoutine[] = [];

// Helper to initialize and retrieve typed storage
export const storageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(initialOrganization));
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(initialBranches));
      localStorage.setItem(STORAGE_KEYS.SPECIALISTS, JSON.stringify(initialSpecialists));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(initialSpecialists[0]));
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(initialPatients));
      localStorage.setItem(STORAGE_KEYS.CLINICAL_RECORDS, JSON.stringify(initialClinicalRecords));
      localStorage.setItem(STORAGE_KEYS.ANTHROPOMETRY, JSON.stringify(initialAnthropometricRecords));
      localStorage.setItem(STORAGE_KEYS.LABS, JSON.stringify(initialLaboratories));
      localStorage.setItem(STORAGE_KEYS.EQUIVALENT_GROUPS, JSON.stringify(initialEquivalentGroups));
      localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(initialFoods));
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(initialRecipes));
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(initialPlans));
      localStorage.setItem(STORAGE_KEYS.MEAL_LOGS, JSON.stringify(initialMealLogs));
      localStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(initialWaterLogs));
      localStorage.setItem(STORAGE_KEYS.SUPPLEMENTS, JSON.stringify(initialSupplements));
      localStorage.setItem(STORAGE_KEYS.SUPPLEMENT_LOGS, JSON.stringify(initialSupplementLogs));
      localStorage.setItem(STORAGE_KEYS.EXERCISE_ROUTINES, JSON.stringify(initialExerciseRoutines));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(initialAppointments));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(initialPayments));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(initialMessages));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
    this.purgeMockAndOrphanedData();
  },

  purgeMockAndOrphanedData(): void {
    if (typeof window === 'undefined') return;

    const TEST_PATIENT_IDS = [
      'pat-ana-sofia', 'pat-mariana-t', 'pat-roberto-m', 'pat-diego-s',
      'pat-claudia-h', 'pat-javier-o', 'pat-gabriel-l', 'pat-valeria-s',
      'pat-pablo-c', 'pat-fernanda-p', 'pat-demo', 'test-dummy-delete-123'
    ];

    const currentDeleted = this.getDeletedPatientIds();
    const combinedDeleted = Array.from(new Set([...currentDeleted, ...TEST_PATIENT_IDS]));
    this.saveDeletedPatientIds(combinedDeleted);

    // 1. Clean patients
    const rawPatients: Patient[] = this.get(STORAGE_KEYS.PATIENTS, []);
    const cleanPatients = rawPatients.filter(
      (p) => !combinedDeleted.includes(p.id) && !TEST_PATIENT_IDS.includes(p.id)
    );
    this.set(STORAGE_KEYS.PATIENTS, cleanPatients);
    const activePatientIds = new Set(cleanPatients.map((p) => p.id));

    // 2. Clean specialists
    const cleanSpecialists = this.getSpecialists();
    this.set(STORAGE_KEYS.SPECIALISTS, cleanSpecialists);

    // 3. Clean currentUser
    this.getCurrentUser();

    // 4. Clean payments
    const rawPayments: PaymentRecord[] = this.get(STORAGE_KEYS.PAYMENTS, []);
    const cleanPayments = rawPayments.filter(
      (p) =>
        !['pay-1', 'pay-2', 'pay-3', 'pay-4'].includes(p.id) &&
        !combinedDeleted.includes(p.patientId) &&
        activePatientIds.has(p.patientId)
    );
    this.set(STORAGE_KEYS.PAYMENTS, cleanPayments);

    // 5. Clean messages
    const rawMessages: ChatMessage[] = this.get(STORAGE_KEYS.MESSAGES, []);
    const cleanMessages = rawMessages.filter(
      (m) =>
        !['msg-1', 'msg-2', 'msg-3'].includes(m.id) &&
        m.conversationId !== 'conv-ana' &&
        !combinedDeleted.includes(m.conversationId) &&
        !combinedDeleted.includes(m.senderId) &&
        !m.senderName?.toLowerCase().includes('valeria') &&
        !m.senderName?.toLowerCase().includes('carlos') &&
        (activePatientIds.has(m.conversationId) || activePatientIds.has(m.senderId))
    );
    this.set(STORAGE_KEYS.MESSAGES, cleanMessages);

    // 6. Clean appointments
    const rawAppointments: Appointment[] = this.get(STORAGE_KEYS.APPOINTMENTS, []);
    const cleanAppointments = rawAppointments.filter(
      (a) =>
        !['app-1', 'app-2', 'app-3', 'app-4'].includes(a.id) &&
        !combinedDeleted.includes(a.patientId) &&
        (activePatientIds.size === 0 || activePatientIds.has(a.patientId))
    );
    this.set(STORAGE_KEYS.APPOINTMENTS, cleanAppointments);

    // 7. Clean notifications
    const cleanNotifications = this.getNotifications();
    this.set(STORAGE_KEYS.NOTIFICATIONS, cleanNotifications);

    // 8. Clean clinical records, anthropometry, labs, plans
    const cleanClinical = this.get(STORAGE_KEYS.CLINICAL_RECORDS, [] as ClinicalRecord[]).filter(
      (c) => !combinedDeleted.includes(c.patientId) && activePatientIds.has(c.patientId)
    );
    this.set(STORAGE_KEYS.CLINICAL_RECORDS, cleanClinical);

    const cleanAnthro = this.get(STORAGE_KEYS.ANTHROPOMETRY, [] as AnthropometricRecord[]).filter(
      (a) => !combinedDeleted.includes(a.patientId) && activePatientIds.has(a.patientId)
    );
    this.set(STORAGE_KEYS.ANTHROPOMETRY, cleanAnthro);

    const cleanLabs = this.get(STORAGE_KEYS.LABS, [] as LaboratoryResult[]).filter(
      (l) => !combinedDeleted.includes(l.patientId) && activePatientIds.has(l.patientId)
    );
    this.set(STORAGE_KEYS.LABS, cleanLabs);

    const cleanPlans = this.get(STORAGE_KEYS.PLANS, [] as NutritionPlan[]).filter(
      (p) => !combinedDeleted.includes(p.patientId) && activePatientIds.has(p.patientId)
    );
    this.set(STORAGE_KEYS.PLANS, cleanPlans);

    const cleanMealLogs = this.get(STORAGE_KEYS.MEAL_LOGS, [] as MealLog[]).filter(
      (m) => !combinedDeleted.includes(m.patientId) && activePatientIds.has(m.patientId)
    );
    this.set(STORAGE_KEYS.MEAL_LOGS, cleanMealLogs);

    const cleanWaterLogs = this.get(STORAGE_KEYS.WATER_LOGS, [] as WaterLog[]).filter(
      (w) => !combinedDeleted.includes(w.patientId) && activePatientIds.has(w.patientId)
    );
    this.set(STORAGE_KEYS.WATER_LOGS, cleanWaterLogs);

    const cleanSupplements = this.get(STORAGE_KEYS.SUPPLEMENTS, [] as SupplementPrescription[]).filter(
      (s) => !combinedDeleted.includes(s.patientId) && activePatientIds.has(s.patientId)
    );
    this.set(STORAGE_KEYS.SUPPLEMENTS, cleanSupplements);

    const cleanSupplementLogs = this.get(STORAGE_KEYS.SUPPLEMENT_LOGS, [] as SupplementLog[]).filter(
      (s) => !combinedDeleted.includes(s.patientId) && activePatientIds.has(s.patientId)
    );
    this.set(STORAGE_KEYS.SUPPLEMENT_LOGS, cleanSupplementLogs);

    const cleanExercises = this.get(STORAGE_KEYS.EXERCISE_ROUTINES, [] as ExerciseRoutine[]).filter(
      (e) => !combinedDeleted.includes(e.patientId) && activePatientIds.has(e.patientId)
    );
    this.set(STORAGE_KEYS.EXERCISE_ROUTINES, cleanExercises);

    // Sync cleaned collections to backend server
    if (typeof fetch !== 'undefined') {
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deletedPatientIds: combinedDeleted,
          collections: {
            PATIENTS: cleanPatients,
            SPECIALISTS: cleanSpecialists,
            PAYMENTS: cleanPayments,
            MESSAGES: cleanMessages,
            APPOINTMENTS: cleanAppointments,
            NOTIFICATIONS: cleanNotifications,
            CLINICAL_RECORDS: cleanClinical,
            ANTHROPOMETRY: cleanAnthro,
            LABS: cleanLabs,
            PLANS: cleanPlans,
            MEAL_LOGS: cleanMealLogs,
            WATER_LOGS: cleanWaterLogs,
            SUPPLEMENTS: cleanSupplements,
            SUPPLEMENT_LOGS: cleanSupplementLogs,
            EXERCISE_ROUTINES: cleanExercises,
          },
        }),
      }).catch(() => {});
    }
  },

  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  getOrganization(): Organization {
    const org: Organization = this.get(STORAGE_KEYS.ORGANIZATION, initialOrganization);
    if (!org.logoUrl) {
      const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('nutriluz_organization_logo') : null;
      if (savedLogo) {
        org.logoUrl = savedLogo;
      } else if (initialOrganization.logoUrl) {
        org.logoUrl = initialOrganization.logoUrl;
      }
    }
    if (typeof org.watermarkOpacity !== 'number') {
      const savedOpacity = typeof window !== 'undefined' ? localStorage.getItem('nutriluz_watermark_opacity') : null;
      if (savedOpacity) {
        const parsed = parseFloat(savedOpacity);
        if (!isNaN(parsed)) org.watermarkOpacity = parsed;
      } else {
        org.watermarkOpacity = 0.22;
      }
    }
    return org;
  },
  saveOrganization(org: Organization) {
    this.set(STORAGE_KEYS.ORGANIZATION, org);
    if (org.logoUrl && typeof window !== 'undefined') {
      localStorage.setItem('nutriluz_organization_logo', org.logoUrl);
    }
    if (typeof org.watermarkOpacity === 'number' && typeof window !== 'undefined') {
      localStorage.setItem('nutriluz_watermark_opacity', org.watermarkOpacity.toString());
    }
    // Synchronize to backend server database
    if (typeof fetch !== 'undefined') {
      fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization: org }),
      }).catch((err) => {
        console.warn('[Storage] Server organization sync fallback:', err);
      });
    }
    // Real-time synchronization to Supabase PostgreSQL
    supabaseDb.saveOrganization(org).catch((err) => {
      console.warn('[Storage] Background error syncing organization to Supabase:', err);
    });
    safeDispatchEvent('nutriluz:organization_updated', org);
    safeDispatchEvent('nutriluz:db_updated', { type: 'organization', data: org });
  },

  getBranches(): Branch[] {
    return this.get(STORAGE_KEYS.BRANCHES, initialBranches);
  },
  saveBranches(branches: Branch[]) {
    this.set(STORAGE_KEYS.BRANCHES, branches);
  },

  getSpecialists(): UserProfile[] {
    const raw = this.get(STORAGE_KEYS.SPECIALISTS, initialSpecialists);
    const clean = raw
      .filter((s) => {
        const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        if (s.id === 'user-dr-carlos' || s.email === 'dr.carlos@nutriluz.mx') return false;
        if (name.includes('carlos mendoza')) return false;
        if (name.includes('valeria') && !name.includes('luz elena')) return false;
        if (s.email?.includes('valeria') && !s.email?.includes('luzelena')) return false;
        return true;
      })
      .map((s) => {
        if (s.id === 'user-dra-valeria' || s.firstName?.toLowerCase().includes('luz')) {
          return {
            ...s,
            id: 'user-lic-luz-elena',
            firstName: 'Luz Elena',
            lastName: 'Alcocer',
            email: 'luzelenaalcocer14@gmail.com',
            professionalTitle: 'Lic. en Nutrición',
            publicSlug: 'luz-elena-alcocer',
          };
        }
        return s;
      });

    if (
      clean.length === 0 ||
      !clean.some((s) => s.email === 'luzelenaalcocer14@gmail.com' || s.firstName?.toLowerCase().includes('luz'))
    ) {
      clean.unshift(initialSpecialists[0]);
    }
    return clean;
  },
  saveSpecialists(specialists: UserProfile[]) {
    this.set(STORAGE_KEYS.SPECIALISTS, specialists);
    // Background sync to database
    specialists.forEach((s) => {
      supabaseDb.saveNutritionistProfile(s).catch(() => {});
    });
  },

  getCurrentUser(): UserProfile {
    const user = this.get(STORAGE_KEYS.CURRENT_USER, initialSpecialists[0]);
    const isValeriaOrMock =
      !user ||
      user.email === 'dra.valeria@nutriluz.mx' ||
      user.email === 'valeria.gomez@nutriluz.com' ||
      user.firstName === 'Valeria' ||
      user.id === 'user-dra-valeria';

    if (isValeriaOrMock) {
      const updated: UserProfile = {
        ...initialSpecialists[0],
        ...user,
        id: 'user-lic-luz-elena',
        firstName: 'Luz Elena',
        lastName: 'Alcocer',
        email: 'luzelenaalcocer14@gmail.com',
        professionalTitle: 'Lic. en Nutrición',
        publicSlug: 'luz-elena-alcocer',
      };
      this.set(STORAGE_KEYS.CURRENT_USER, updated);
      return updated;
    }
    return user;
  },

  getNutritionistPassword(): string {
    return this.get('nutriluz_nutritionist_password', 'nutriluz128');
  },

  setNutritionistPassword(newPass: string) {
    this.set('nutriluz_nutritionist_password', newPass);
  },

  isNutritionistAuthenticated(): boolean {
    return this.get('nutriluz_nutritionist_authenticated', false);
  },

  setNutritionistAuthenticated(auth: boolean) {
    this.set('nutriluz_nutritionist_authenticated', auth);
    safeDispatchEvent('nutriluz:nutritionist_auth_changed', { isAuthenticated: auth });
  },

  authenticateNutritionist(emailInput: string, passwordInput: string): { success: boolean; user?: UserProfile; error?: string } {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();
    const storedPass = this.getNutritionistPassword();
    const currentUser = this.getCurrentUser();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Por favor ingresa tu correo y contraseña.' };
    }

    const validEmails = [
      'luzelenaalcocer14@gmail.com',
      'luzelena',
      'nutriluz',
      'luzelenaalcocer',
      currentUser.email?.toLowerCase(),
    ].filter(Boolean);

    const emailMatches = validEmails.some((e) => e?.toLowerCase() === cleanEmail);
    const passMatches = cleanPass === storedPass || cleanPass === 'nutriluz128';

    if (emailMatches && passMatches) {
      this.setNutritionistAuthenticated(true);
      const updatedUser: UserProfile = {
        ...currentUser,
        firstName: 'Luz Elena',
        lastName: 'Alcocer',
        email: 'luzelenaalcocer14@gmail.com',
        role: 'NUTRIOLOGO',
      };
      this.saveCurrentUser(updatedUser);
      return { success: true, user: updatedUser };
    }

    if (!emailMatches) {
      return { success: false, error: 'El correo electrónico no coincide con la cuenta de la nutrióloga.' };
    }

    return { success: false, error: 'Contraseña incorrecta. Por favor verifica e intenta nuevamente.' };
  },

  authenticateUnified(identifier: string, pass: string): {
    success: boolean;
    role?: 'NUTRIOLOGO' | 'PACIENTE';
    user?: UserProfile;
    patient?: Patient;
    error?: string;
  } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Por favor ingresa tu usuario, correo o teléfono y tu contraseña.' };
    }

    // 1. Try nutritionist authentication first
    const nutResult = this.authenticateNutritionist(cleanId, cleanPass);
    if (nutResult.success && nutResult.user) {
      return {
        success: true,
        role: 'NUTRIOLOGO',
        user: nutResult.user,
      };
    }

    // 2. Try patient authentication
    const patient = this.authenticatePatient(cleanId, cleanPass);
    if (patient) {
      return {
        success: true,
        role: 'PACIENTE',
        patient,
      };
    }

    // If identifier matched nutritionist account but password was wrong
    if (nutResult.error && nutResult.error.includes('Contraseña incorrecta')) {
      return {
        success: false,
        error: 'Contraseña incorrecta para la cuenta de nutrióloga.',
      };
    }

    return {
      success: false,
      error: 'Credenciales no encontradas. Verifica tu usuario, correo o teléfono y contraseña.',
    };
  },

  logoutNutritionist() {
    this.setNutritionistAuthenticated(false);
  },
  saveCurrentUserLocally(user: UserProfile) {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  },
  saveCurrentUser(user: UserProfile) {
    this.set(STORAGE_KEYS.CURRENT_USER, user);

    // 1. Direct real-time sync to Supabase PostgreSQL cloud database
    supabaseDb.saveNutritionistProfile(user).then((success) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutriluz:cloud_synced', {
          detail: { type: 'user_profile', id: user.id, name: `${user.firstName} ${user.lastName}`, success }
        }));
      }
    }).catch((err) => {
      console.error('[Storage] Error syncing nutritionist profile to Supabase:', err);
    });

    // 2. Direct real-time sync to server backend database API
    if (typeof fetch !== 'undefined') {
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      }).catch((err) => {
        console.warn('[Storage] Server user profile sync fallback:', err);
      });
    }

    // 3. Keep specialists list synchronized with updated current user
    const specs = this.getSpecialists();
    const idx = specs.findIndex((s) => s.id === user.id);
    if (idx >= 0) {
      specs[idx] = user;
      this.set(STORAGE_KEYS.SPECIALISTS, specs);
    }

    // 4. Dispatch live DOM events safely across the application
    safeDispatchEvent('nutriluz:db_updated', { type: 'current_user', user });
    safeDispatchEvent('nutriluz:user_updated', { user });
  },

  getDeletedPatientIds(): string[] {
    return this.get(STORAGE_KEYS.DELETED_PATIENT_IDS, [] as string[]);
  },
  saveDeletedPatientIds(ids: string[]) {
    this.set(STORAGE_KEYS.DELETED_PATIENT_IDS, Array.from(new Set(ids)));
  },

  getPatients(): Patient[] {
    const raw = this.get(STORAGE_KEYS.PATIENTS, [] as Patient[]);
    const TEST_PATIENT_IDS = new Set([
      'pat-ana-sofia', 'pat-mariana-t', 'pat-roberto-m', 'pat-diego-s',
      'pat-claudia-h', 'pat-javier-o', 'pat-gabriel-l', 'pat-valeria-s',
      'pat-pablo-c', 'pat-fernanda-p', 'pat-demo', 'test-dummy-delete-123'
    ]);
    const deletedIds = new Set([...this.getDeletedPatientIds(), ...TEST_PATIENT_IDS]);
    const filtered = raw.filter((p) => !deletedIds.has(p.id) && !TEST_PATIENT_IDS.has(p.id));
    return filtered.map((p) => ({
      ...p,
      portalAccessEnabled: p.portalAccessEnabled !== undefined ? p.portalAccessEnabled : true,
      portalUsername: p.portalUsername || p.email || `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}`.replace(/\s+/g, ''),
      portalPassword: p.portalPassword || 'Nutri2026!',
      assignedRecipeIds: Array.isArray(p.assignedRecipeIds) ? p.assignedRecipeIds : [],
    }));
  },
  savePatients(patients: Patient[]) {
    const deletedIds = new Set(this.getDeletedPatientIds());
    const filtered = patients.filter((p) => !deletedIds.has(p.id));
    this.set(STORAGE_KEYS.PATIENTS, filtered);
  },

  getClinicalRecords(): ClinicalRecord[] {
    return this.get(STORAGE_KEYS.CLINICAL_RECORDS, initialClinicalRecords);
  },
  saveClinicalRecords(records: ClinicalRecord[]) {
    this.set(STORAGE_KEYS.CLINICAL_RECORDS, records);
  },

  getAnthropometrics(): AnthropometricRecord[] {
    return this.get(STORAGE_KEYS.ANTHROPOMETRY, initialAnthropometricRecords);
  },
  getAnthropometry(): AnthropometricRecord[] {
    return this.get(STORAGE_KEYS.ANTHROPOMETRY, initialAnthropometricRecords);
  },
  getAnthropometricRecords(): AnthropometricRecord[] {
    return this.get(STORAGE_KEYS.ANTHROPOMETRY, initialAnthropometricRecords);
  },
  saveAnthropometrics(records: AnthropometricRecord[]) {
    this.set(STORAGE_KEYS.ANTHROPOMETRY, records);
  },
  saveAnthropometry(records: AnthropometricRecord[]) {
    this.set(STORAGE_KEYS.ANTHROPOMETRY, records);
  },

  getLaboratories(): LaboratoryResult[] {
    return this.get(STORAGE_KEYS.LABS, initialLaboratories);
  },
  getLabs(): LaboratoryResult[] {
    return this.get(STORAGE_KEYS.LABS, initialLaboratories);
  },
  getLaboratoryResults(): LaboratoryResult[] {
    return this.get(STORAGE_KEYS.LABS, initialLaboratories);
  },
  saveLaboratories(labs: LaboratoryResult[]) {
    this.set(STORAGE_KEYS.LABS, labs);
  },
  saveLabs(labs: LaboratoryResult[]) {
    this.set(STORAGE_KEYS.LABS, labs);
  },

  getEquivalentGroups(): FoodEquivalentGroup[] {
    return this.get(STORAGE_KEYS.EQUIVALENT_GROUPS, initialEquivalentGroups);
  },

  getFoods(): Food[] {
    return this.get(STORAGE_KEYS.FOODS, initialFoods);
  },
  saveFoods(foods: Food[]) {
    this.set(STORAGE_KEYS.FOODS, foods);
  },

  getRecipes(): Recipe[] {
    return this.get(STORAGE_KEYS.RECIPES, initialRecipes);
  },
  saveRecipes(recipes: Recipe[]) {
    this.set(STORAGE_KEYS.RECIPES, recipes);
  },

  getPlans(): NutritionPlan[] {
    const raw = this.get(STORAGE_KEYS.PLANS, initialPlans);
    return raw.map((plan) => {
      if (plan.id === 'plan-ana-integral' && (!plan.days || plan.days.length < 7)) {
        const defaultAnaPlan = initialPlans.find((p) => p.id === 'plan-ana-integral');
        if (defaultAnaPlan && defaultAnaPlan.days.length === 7) {
          return { ...plan, days: defaultAnaPlan.days };
        }
      }
      return plan;
    });
  },
  savePlans(plans: NutritionPlan[]) {
    this.set(STORAGE_KEYS.PLANS, plans);
  },

  getMealLogs(): MealLog[] {
    return this.get(STORAGE_KEYS.MEAL_LOGS, initialMealLogs);
  },
  saveMealLogs(logs: MealLog[]) {
    this.set(STORAGE_KEYS.MEAL_LOGS, logs);
  },

  getWaterLogs(): WaterLog[] {
    return this.get(STORAGE_KEYS.WATER_LOGS, initialWaterLogs);
  },
  saveWaterLogs(logs: WaterLog[]) {
    this.set(STORAGE_KEYS.WATER_LOGS, logs);
  },

  getSupplements(): SupplementPrescription[] {
    return this.get(STORAGE_KEYS.SUPPLEMENTS, initialSupplements);
  },
  saveSupplements(sups: SupplementPrescription[]) {
    this.set(STORAGE_KEYS.SUPPLEMENTS, sups);
  },

  getSupplementLogs(): SupplementLog[] {
    return this.get(STORAGE_KEYS.SUPPLEMENT_LOGS, initialSupplementLogs);
  },
  saveSupplementLogs(logs: SupplementLog[]) {
    this.set(STORAGE_KEYS.SUPPLEMENT_LOGS, logs);
  },

  getExerciseRoutines(): ExerciseRoutine[] {
    return this.get(STORAGE_KEYS.EXERCISE_ROUTINES, initialExerciseRoutines);
  },
  saveExerciseRoutines(routines: ExerciseRoutine[]) {
    this.set(STORAGE_KEYS.EXERCISE_ROUTINES, routines);
  },

  getAppointments(): Appointment[] {
    const raw = this.get(STORAGE_KEYS.APPOINTMENTS, [] as Appointment[]);
    const deletedIds = new Set(this.getDeletedPatientIds());
    const activePatients = this.getPatients();
    const activeIds = new Set(activePatients.map((p) => p.id));
    const activePortalId = this.getActivePortalPatientId();
    const activeClinicalId = this.getActiveClinicalPatientId();

    return raw.filter((a) => {
      if (!a) return false;
      if (['app-1', 'app-2', 'app-3', 'app-4'].includes(a.id)) return false;
      if (deletedIds.has(a.patientId)) return false;
      if (activePatients.length === 0) return true;
      if (activeIds.has(a.patientId)) return true;
      if (activePortalId && a.patientId === activePortalId) return true;
      if (activeClinicalId && a.patientId === activeClinicalId) return true;
      return false;
    });
  },
  saveAppointments(apps: Appointment[]) {
    this.set(STORAGE_KEYS.APPOINTMENTS, apps);
  },

  getPayments(): PaymentRecord[] {
    const raw = this.get(STORAGE_KEYS.PAYMENTS, [] as PaymentRecord[]);
    const TEST_PATIENT_IDS = new Set([
      'pat-ana-sofia', 'pat-mariana-t', 'pat-roberto-m', 'pat-diego-s',
      'pat-claudia-h', 'pat-javier-o', 'pat-gabriel-l', 'pat-valeria-s',
      'pat-pablo-c', 'pat-fernanda-p', 'pat-demo', 'test-dummy-delete-123'
    ]);
    const deletedIds = new Set([...this.getDeletedPatientIds(), ...TEST_PATIENT_IDS]);
    const activePatients = this.getPatients();
    const activeIds = new Set(activePatients.map((p) => p.id));

    return raw.filter(
      (p) =>
        !['pay-1', 'pay-2', 'pay-3', 'pay-4'].includes(p.id) &&
        !deletedIds.has(p.patientId) &&
        !TEST_PATIENT_IDS.has(p.patientId) &&
        activeIds.has(p.patientId)
    );
  },
  savePayments(pays: PaymentRecord[]) {
    this.set(STORAGE_KEYS.PAYMENTS, pays);
  },

  getMessages(): ChatMessage[] {
    const raw = this.get(STORAGE_KEYS.MESSAGES, [] as ChatMessage[]);
    const TEST_PATIENT_IDS = new Set([
      'pat-ana-sofia', 'pat-mariana-t', 'pat-roberto-m', 'pat-diego-s',
      'pat-claudia-h', 'pat-javier-o', 'pat-gabriel-l', 'pat-valeria-s',
      'pat-pablo-c', 'pat-fernanda-p', 'pat-demo', 'test-dummy-delete-123',
      'conv-ana'
    ]);
    const deletedIds = new Set([...this.getDeletedPatientIds(), ...TEST_PATIENT_IDS]);
    const activePatients = this.getPatients();
    const activeIds = new Set(activePatients.map((p) => p.id));

    return raw.filter((m) => {
      if (['msg-1', 'msg-2', 'msg-3'].includes(m.id)) return false;
      if (m.conversationId === 'conv-ana') return false;
      if (deletedIds.has(m.conversationId) || deletedIds.has(m.senderId)) return false;
      if (TEST_PATIENT_IDS.has(m.conversationId) || TEST_PATIENT_IDS.has(m.senderId)) return false;
      if (m.senderName?.toLowerCase().includes('valeria') || m.senderName?.toLowerCase().includes('carlos')) return false;
      if (!activeIds.has(m.conversationId) && !activeIds.has(m.senderId)) return false;
      return true;
    });
  },
  saveMessages(msgs: ChatMessage[]) {
    this.set(STORAGE_KEYS.MESSAGES, msgs);
  },

  getNotifications(): AppNotification[] {
    const raw = this.get(STORAGE_KEYS.NOTIFICATIONS, [] as AppNotification[]);
    const testKeywords = ['diego salazar', 'javier orozco', 'ana sofía', 'ana sofia', 'pat-diego-s', 'pat-ana-sofia', 'nutricopilot ai listo'];
    return raw.filter((n) => {
      if (['notif-1', 'notif-2', 'notif-3'].includes(n.id)) return false;
      const text = `${n.title || ''} ${n.message || ''} ${n.actionLink || ''}`.toLowerCase();
      return !testKeywords.some((k) => text.includes(k));
    });
  },
  saveNotifications(notifs: AppNotification[]) {
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  getPrescriptionPresets(): ClinicalPreset[] {
    const saved = this.get(STORAGE_KEYS.PRESCRIPTION_PRESETS, [] as ClinicalPreset[]);
    if (!saved || saved.length === 0) {
      this.set(STORAGE_KEYS.PRESCRIPTION_PRESETS, INITIAL_CLINICAL_PRESETS);
      return INITIAL_CLINICAL_PRESETS;
    }
    return saved;
  },
  savePrescriptionPresets(presets: ClinicalPreset[]) {
    this.set(STORAGE_KEYS.PRESCRIPTION_PRESETS, presets);
    // Real-time synchronization to Supabase PostgreSQL
    supabaseDb.savePrescriptionPresets(presets).catch((err) => {
      console.warn('[Storage] Background error syncing prescription presets to Supabase:', err);
    });
    safeDispatchEvent('nutriluz:db_updated', { detail: { type: 'prescription_presets_updated' } });
  },
  resetPrescriptionPresets(): ClinicalPreset[] {
    this.set(STORAGE_KEYS.PRESCRIPTION_PRESETS, INITIAL_CLINICAL_PRESETS);
    supabaseDb.savePrescriptionPresets(INITIAL_CLINICAL_PRESETS).catch((err) => {
      console.warn('[Storage] Background error resetting prescription presets in Supabase:', err);
    });
    safeDispatchEvent('nutriluz:db_updated', { detail: { type: 'prescription_presets_updated' } });
    return INITIAL_CLINICAL_PRESETS;
  },

  getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id);
  },

  updatePatientCredentials(
    patientId: string,
    credentials: {
      portalAccessEnabled?: boolean;
      portalUsername?: string;
      portalPassword?: string;
    }
  ): Patient | undefined {
    const patient = this.getPatientById(patientId);
    if (!patient) return undefined;
    const updated: Patient = {
      ...patient,
      ...credentials,
      updatedAt: new Date().toISOString(),
    };
    this.savePatient(updated);
    return updated;
  },

  getActivePortalPatientId(): string | null {
    return this.get('nutriluz_active_patient_id', null as string | null);
  },

  setActivePortalPatientId(id: string | null) {
    try {
      if (id) {
        this.set('nutriluz_active_patient_id', id);
      } else {
        this.remove('nutriluz_active_patient_id');
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('nutriluz_active_patient_id');
        }
      }
    } catch (e) {
      console.error('Error updating active portal patient ID in storage:', e);
    }

    safeDispatchEvent('nutriluz:patient_session_updated', { patientId: id });
    safeDispatchEvent('nutriluz:db_updated', { type: 'patient_session', patientId: id });
  },

  getActiveClinicalPatientId(): string | null {
    return this.get('nutriluz_active_clinical_patient_id', null as string | null);
  },

  setActiveClinicalPatientId(id: string | null) {
    try {
      if (id) {
        this.set('nutriluz_active_clinical_patient_id', id);
      } else {
        this.remove('nutriluz_active_clinical_patient_id');
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('nutriluz_active_clinical_patient_id');
        }
      }
    } catch (e) {
      console.error('Error updating active clinical patient ID in storage:', e);
    }

    safeDispatchEvent('nutriluz:active_patient_changed', { patientId: id });
    safeDispatchEvent('nutriluz:db_updated', { type: 'active_patient', patientId: id });
  },

  authenticatePatient(login: string, pass: string): Patient | null {
    const cleanLogin = login.trim().toLowerCase();
    const cleanPass = pass.trim();
    const patients = this.getPatients();
    const found = patients.find((p) => {
      const uMatch =
        (p.portalUsername && p.portalUsername.toLowerCase() === cleanLogin) ||
        (p.email && p.email.toLowerCase() === cleanLogin) ||
        (p.phone && p.phone.replace(/\D/g, '') === cleanLogin.replace(/\D/g, ''));
      const pMatch = p.portalPassword === cleanPass;
      return Boolean(uMatch && pMatch && p.portalAccessEnabled !== false);
    });
    if (found) {
      this.setActivePortalPatientId(found.id);
      found.portalLastLogin = new Date().toISOString();
      this.savePatient(found);
    }
    return found || null;
  },

  savePatient(patient: Patient): Promise<boolean> {
    const list = this.getPatients();
    const idx = list.findIndex((p) => p.id === patient.id);
    const sanitizedPatient: Patient = {
      ...patient,
      assignedRecipeIds: Array.isArray(patient.assignedRecipeIds) ? patient.assignedRecipeIds : [],
    };
    if (idx >= 0) {
      list[idx] = sanitizedPatient;
    } else {
      list.unshift(sanitizedPatient);
    }
    this.savePatients(list);
    safeDispatchEvent('nutriluz:db_updated', { type: 'patient', id: sanitizedPatient.id, patientId: sanitizedPatient.id });

    // Direct sync with Supabase PostgreSQL cloud database with logging
    return supabaseDb.savePatient(sanitizedPatient).then((success) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutriluz:cloud_synced', { detail: { type: 'patient', id: sanitizedPatient.id, patientId: sanitizedPatient.id, success } }));
      }
      return success;
    }).catch((err) => {
      console.error('[Storage] Error syncing patient to Supabase:', err);
      return false;
    });
  },

  deletePatient(patientId: string): boolean {
    // 1. Record ID in deleted tombstones list so it never resurrects
    const deletedIds = this.getDeletedPatientIds();
    if (!deletedIds.includes(patientId)) {
      this.saveDeletedPatientIds([...deletedIds, patientId]);
    }

    const list = this.getPatients();
    const filtered = list.filter((p) => p.id !== patientId);
    this.set(STORAGE_KEYS.PATIENTS, filtered);

    // 2. Remove or clean up associated records
    const anthroList = this.getAnthropometry().filter((a) => a.patientId !== patientId);
    this.saveAnthropometry(anthroList);

    const plansList = this.getPlans().filter((p) => p.patientId !== patientId);
    this.savePlans(plansList);

    const appointmentsList = this.getAppointments().filter((a) => a.patientId !== patientId);
    this.saveAppointments(appointmentsList);

    const clinicalList = this.getClinicalRecords().filter((c) => c.patientId !== patientId);
    this.saveClinicalRecords(clinicalList);

    const labsList = this.getLabs().filter((l) => l.patientId !== patientId);
    this.saveLabs(labsList);

    const paymentsList = this.getPayments().filter((p) => p.patientId !== patientId);
    this.savePayments(paymentsList);

    const messagesList = this.getMessages().filter((m) => m.conversationId !== patientId && m.senderId !== patientId);
    this.saveMessages(messagesList);

    const mealLogsList = this.getMealLogs().filter((m) => m.patientId !== patientId);
    this.saveMealLogs(mealLogsList);

    const waterLogsList = this.getWaterLogs().filter((w) => w.patientId !== patientId);
    this.saveWaterLogs(waterLogsList);

    const suppList = this.getSupplements().filter((s) => s.patientId !== patientId);
    this.saveSupplements(suppList);

    const suppLogsList = this.getSupplementLogs().filter((s) => s.patientId !== patientId);
    this.saveSupplementLogs(suppLogsList);

    const exList = this.getExerciseRoutines().filter((e) => e.patientId !== patientId);
    this.saveExerciseRoutines(exList);

    // 3. Sync deletion to Supabase Cloud Database
    supabaseDb.deletePatient(patientId).catch((err) => {
      console.error('[Storage] Error deleting patient from Supabase:', err);
    });

    // 4. Sync deletion to backend server database
    if (typeof fetch !== 'undefined') {
      fetch(`/api/patients/${patientId}`, { method: 'DELETE' }).catch(() => {});
    }

    // 5. Broadcast deletion across window and cross-tab
    safeDispatchEvent('nutriluz:db_updated', { type: 'patient_deleted', id: patientId });
    safeDispatchEvent('nutriluz:patient_deleted', { detail: { patientId } });
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('nutriluz_sync_channel');
        bc.postMessage({ type: 'patient_deleted', patientId });
        bc.close();
      } catch {}
    }
    return true;
  },

  getPlansByPatientId(patientId: string): NutritionPlan[] {
    const plans = this.getPlans().filter((p) => p.patientId === patientId);
    return plans.sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
      return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
    });
  },
  saveNutritionPlan(plan: NutritionPlan) {
    const list = this.getPlans();
    
    // If newly saved plan is ACTIVE, mark other plans of the same patient as INACTIVE
    if (plan.status === 'ACTIVE') {
      for (const p of list) {
        if (p.patientId === plan.patientId && p.id !== plan.id && p.status === 'ACTIVE') {
          p.status = 'INACTIVE';
          p.updatedAt = new Date().toISOString();
        }
      }
    }

    const idx = list.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      list[idx] = plan;
    } else {
      list.unshift(plan);
    }
    this.savePlans(list);

    // Sync to Supabase PostgreSQL in background
    supabaseDb.savePlan(plan).then((success) => {
      safeDispatchEvent('nutriluz:cloud_synced', { type: 'plan', id: plan.id, patientId: plan.patientId, success });
    }).catch((err) => console.error('[Storage] Error syncing plan to Supabase:', err));

    safeDispatchEvent('nutriluz:db_updated', { type: 'plan', id: plan.id, patientId: plan.patientId });
    safeDispatchEvent('nutriluz_plan_updated', { type: 'plan', id: plan.id, patientId: plan.patientId });
  },

  savePlan(plan: NutritionPlan) {
    this.saveNutritionPlan(plan);
  },

  async fetchPatientPlans(patientId: string): Promise<NutritionPlan[]> {
    let patientPlans = this.getPlansByPatientId(patientId);
    try {
      // 1. Direct query for the specific patient's plans (fast & targeted)
      const directPlans = await supabaseDb.getPlansByPatientId(patientId);
      if (directPlans && directPlans.length > 0) {
        const localPlans = this.getPlans();
        const map = new Map<string, NutritionPlan>();
        localPlans.forEach((p) => map.set(p.id, p));
        directPlans.forEach((p) => map.set(p.id, p));
        this.savePlans(Array.from(map.values()));
        patientPlans = this.getPlansByPatientId(patientId);
      }

      // 2. Also sync all plans across cloud to keep database cache fully consistent
      const cloudPlans = await supabaseDb.getPlans();
      if (cloudPlans && cloudPlans.length > 0) {
        const deletedIds = new Set(this.getDeletedPatientIds());
        const localPlans = this.getPlans();
        const map = new Map<string, NutritionPlan>();
        localPlans.forEach((p) => {
          if (!deletedIds.has(p.patientId)) map.set(p.id, p);
        });
        cloudPlans.forEach((p) => {
          if (!deletedIds.has(p.patientId)) map.set(p.id, p);
        });
        const finalPlans = Array.from(map.values());
        this.savePlans(finalPlans);
        patientPlans = this.getPlansByPatientId(patientId);
      }
    } catch (e) {
      console.warn('[Storage] Error in fetchPatientPlans:', e);
    }
    return patientPlans;
  },

  getAnthropometricsByPatientId(patientId: string): AnthropometricRecord[] {
    return this.getAnthropometry().filter((a) => a.patientId === patientId);
  },
  saveAnthropometricRecord(record: AnthropometricRecord): Promise<boolean> {
    const list = this.getAnthropometry();
    const idx = list.findIndex((a) => a.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    this.saveAnthropometry(list);
    safeDispatchEvent('nutriluz:db_updated', { type: 'anthropometry', id: record.id });
    return supabaseDb.saveAnthropometric(record).then((success) => {
      safeDispatchEvent('nutriluz:cloud_synced', { type: 'anthropometry', id: record.id, success });
      return success;
    }).catch((err) => {
      console.error('[Storage] Error syncing anthropometry to Supabase:', err);
      return false;
    });
  },

  getAppointmentsByPatientId(patientId: string): Appointment[] {
    if (!patientId) return [];
    const raw = this.get(STORAGE_KEYS.APPOINTMENTS, [] as Appointment[]);
    const patient = this.getPatients().find((p) => p.id === patientId);
    const fullName = patient ? `${patient.firstName} ${patient.lastName}`.trim().toLowerCase() : '';
    const deletedIds = new Set(this.getDeletedPatientIds());

    return raw.filter((a) => {
      if (!a) return false;
      if (['app-1', 'app-2', 'app-3', 'app-4'].includes(a.id)) return false;
      if (deletedIds.has(a.patientId)) return false;
      if (a.patientId === patientId) return true;
      if (fullName && a.patientName) {
        const aName = a.patientName.trim().toLowerCase();
        if (aName === fullName || aName.includes(fullName) || fullName.includes(aName)) return true;
      }
      return false;
    });
  },

  async fetchPatientAppointments(patientId: string): Promise<Appointment[]> {
    let patientAppts = this.getAppointmentsByPatientId(patientId);
    if (!patientId) return patientAppts;
    try {
      const cloudAppts = await supabaseDb.getAppointmentsByPatientId(patientId);
      if (cloudAppts && cloudAppts.length > 0) {
        const allLocal = this.get(STORAGE_KEYS.APPOINTMENTS, [] as Appointment[]);
        const map = new Map<string, Appointment>();
        allLocal.forEach((a) => map.set(a.id, a));
        cloudAppts.forEach((a) => {
          map.set(a.id, a);
        });
        const merged = Array.from(map.values());
        this.saveAppointments(merged);
        patientAppts = this.getAppointmentsByPatientId(patientId);
      }
    } catch (e) {
      console.warn('[Storage] Error in fetchPatientAppointments:', e);
    }
    return patientAppts;
  },

  saveAppointment(app: Appointment) {
    const list = this.getAppointments();
    const idx = list.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      list[idx] = app;
    } else {
      list.unshift(app);
    }
    this.saveAppointments(list);
    supabaseDb.saveAppointment(app).then((success) => {
      safeDispatchEvent('nutriluz:cloud_synced', { type: 'appointment', id: app.id, success });
    }).catch((err) => console.error('[Storage] Error syncing appointment to Supabase:', err));
    safeDispatchEvent('nutriluz:db_updated', { type: 'appointment', id: app.id, patientId: app.patientId });
    safeDispatchEvent('nutriluz_appointment_updated', { appointment: app, patientId: app.patientId });
  },

  getClinicalRecordByPatientId(patientId: string): ClinicalRecord | undefined {
    const rec = this.getClinicalRecords().find((c) => c.patientId === patientId);
    if (!rec) return undefined;
    // If the record was explicitly saved/customized by a nutritionist, never wipe out their inputs!
    if (rec.isCustomized) return rec;

    const isMockRecall = !!(rec.recall24h && rec.recall24h.includes('Café con leche y pan tostado'));
    // Only strip dummy placeholder habits if this is the unedited mock template
    const isAutoStubHabits =
      isMockRecall &&
      rec.lifestyleHabits?.sleepHours === 7 &&
      rec.lifestyleHabits?.waterDailyLiters === 2.0 &&
      rec.lifestyleHabits?.alcohol === 'Ocasional' &&
      rec.physicalActivity?.frequencyDaysPerWeek === 3;
    const isAutoStubNotes =
      rec.familyHistory?.notes === 'Sin antecedentes graves reportados.' ||
      rec.familyHistory?.notes === 'Sin antecedentes patológicos familiares graves.';

    if (isMockRecall || isAutoStubHabits || isAutoStubNotes) {
      const sanitized: ClinicalRecord = {
        ...rec,
        recall24h: isMockRecall ? '' : rec.recall24h,
        lifestyleHabits: isAutoStubHabits ? undefined : rec.lifestyleHabits,
        physicalActivity: isAutoStubHabits ? undefined : rec.physicalActivity,
        dietaryHabits: isAutoStubHabits ? undefined : rec.dietaryHabits,
        familyHistory:
          isAutoStubNotes &&
          !rec.familyHistory?.diabetes &&
          !rec.familyHistory?.hypertension &&
          !rec.familyHistory?.cancer
            ? undefined
            : rec.familyHistory,
      };
      return sanitized;
    }
    return rec;
  },

  saveClinicalRecordSilent(rec: ClinicalRecord) {
    const list = this.getClinicalRecords();
    const idx = list.findIndex((c) => c.id === rec.id);
    if (idx >= 0) {
      list[idx] = rec;
    } else {
      list.unshift(rec);
    }
    this.saveClinicalRecords(list);
  },

  saveClinicalRecord(rec: ClinicalRecord): Promise<boolean> {
    const list = this.getClinicalRecords();
    const idx = list.findIndex((c) => c.id === rec.id);
    if (idx >= 0) {
      list[idx] = rec;
    } else {
      list.unshift(rec);
    }
    this.saveClinicalRecords(list);
    // Also save patient state if clinical record changed
    const pat = this.getPatientById(rec.patientId);
    if (pat) {
      supabaseDb.savePatient(pat).catch(() => {});
    }
    return supabaseDb.saveClinicalRecord(rec).then((success) => {
      safeDispatchEvent('nutriluz:cloud_synced', { type: 'clinical_record', id: rec.id, success });
      safeDispatchEvent('nutriluz:db_updated', { type: 'clinical_record', id: rec.id });
      return success;
    }).catch((err) => {
      console.warn('[Storage] Error syncing clinical record to Supabase:', err);
      safeDispatchEvent('nutriluz:db_updated', { type: 'clinical_record', id: rec.id });
      return false;
    });
  },

  getLabRecordsByPatientId(patientId: string): LaboratoryResult[] {
    return this.getLabs().filter((l) => l.patientId === patientId);
  },
  saveLabRecord(lab: LaboratoryResult) {
    const list = this.getLabs();
    const idx = list.findIndex((l) => l.id === lab.id);
    if (idx >= 0) {
      list[idx] = lab;
    } else {
      list.unshift(lab);
    }
    this.saveLabs(list);
    supabaseDb.saveLabRecord(lab).then((success) => {
      safeDispatchEvent('nutriluz:cloud_synced', { type: 'lab', id: lab.id, success });
    }).catch((err) => console.error('[Storage] Error syncing lab to Supabase:', err));
    safeDispatchEvent('nutriluz:db_updated', { type: 'lab', id: lab.id });
  },

  getExerciseRoutinesByPatientId(patientId: string): ExerciseRoutine[] {
    return this.getExerciseRoutines().filter((e) => e.patientId === patientId);
  },
  getSupplementsByPatientId(patientId: string): SupplementPrescription[] {
    return this.getSupplements().filter((s) => s.patientId === patientId);
  },

  getSmaeGroups(): FoodEquivalentGroup[] {
    return this.getEquivalentGroups();
  },

  saveFood(food: Food) {
    const list = this.getFoods();
    const idx = list.findIndex((f) => f.id === food.id);
    if (idx >= 0) {
      list[idx] = food;
    } else {
      list.unshift(food);
    }
    this.saveFoods(list);
    supabaseDb.saveFood(food as any).catch(() => {});
  },

  deleteFood(id: string) {
    const list = this.getFoods().filter((f) => f.id !== id);
    this.saveFoods(list);
    supabaseDb.deleteFood(id).catch(() => {});
  },

  saveRecipe(recipe: Recipe) {
    const list = this.getRecipes();
    const idx = list.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) {
      list[idx] = recipe;
    } else {
      list.unshift(recipe);
    }
    this.saveRecipes(list);
    supabaseDb.saveRecipe(recipe).then((success) => {
      safeDispatchEvent('nutriluz:cloud_synced', { type: 'recipe', id: recipe.id, success });
    }).catch(() => {});
    safeDispatchEvent('nutriluz:db_updated', { type: 'recipe', id: recipe.id });
    safeDispatchEvent('nutriluz:recipes_updated', { recipe });
  },

  deleteRecipe(recipeId: string) {
    const list = this.getRecipes().filter((r) => r.id !== recipeId);
    this.saveRecipes(list);
    supabaseDb.deleteRecipe(recipeId).then((success) => {
      safeDispatchEvent('nutriluz:cloud_synced', { type: 'recipe_deleted', id: recipeId, success });
    }).catch(() => {});
    safeDispatchEvent('nutriluz:db_updated', { type: 'recipe_deleted', id: recipeId });
    safeDispatchEvent('nutriluz:recipes_updated', { recipeId });
  },

  savePayment(payment: PaymentRecord) {
    const list = this.getPayments();
    const idx = list.findIndex((p) => p.id === payment.id);
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.unshift(payment);
    }
    this.savePayments(list);
    supabaseDb.savePayment(payment).then((success) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutriluz:cloud_synced', { detail: { type: 'payment', id: payment.id, success } }));
      }
    }).catch((err) => console.error('[Storage] Error syncing payment to Supabase:', err));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutriluz:db_updated', { detail: { type: 'payment', id: payment.id } }));
    }
  },

  getAllDatabaseSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([keyName, storageKey]) => {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          snapshot[keyName] = JSON.parse(raw);
        } catch {
          snapshot[keyName] = raw;
        }
      }
    });
    return snapshot;
  },

  async forceSyncAllToCloud() {
    const snapshot = {
      patients: this.getPatients(),
      plans: this.getPlans(),
      anthropometrics: this.getAnthropometrics(),
      appointments: this.getAppointments(),
      payments: this.getPayments(),
      labs: this.getLabs(),
      foods: this.getFoods() as any[],
      recipes: this.getRecipes(),
      messages: this.getMessages(),
      organization: this.getOrganization(),
      user: this.getCurrentUser(),
    };
    return await supabaseDb.forceSyncAllToCloud(snapshot);
  },

  async syncWithSupabase(): Promise<void> {
    try {
      // 1. Fetch organization from cloud first to ensure logo and branding match across all devices
      try {
        const cloudOrg = await supabaseDb.getOrganization();
        if (cloudOrg && cloudOrg.logoUrl) {
          const currentOrg = this.getOrganization();
          if (currentOrg.logoUrl !== cloudOrg.logoUrl || currentOrg.name !== cloudOrg.name) {
            const mergedOrg: Organization = {
              ...currentOrg,
              ...cloudOrg,
            };
            this.set(STORAGE_KEYS.ORGANIZATION, mergedOrg);
            safeDispatchEvent('nutriluz:organization_updated', mergedOrg);
            safeDispatchEvent('nutriluz:db_updated', { type: 'organization', data: mergedOrg });
          }
        }
      } catch (errOrg) {
        console.warn('[Storage] Error hydrating organization from Supabase:', errOrg);
      }

      // 2. Ensure organization & user exists in Supabase
      await supabaseDb.ensureOrganizationAndUser(this.getOrganization(), this.getCurrentUser());

      // 3. Fetch and hydrate nutritionist profile if stored in cloud
      try {
        const cloudUser = await supabaseDb.getNutritionistProfile(this.getCurrentUser().id);
        if (cloudUser && cloudUser.firstName && cloudUser.firstName !== 'Valeria') {
          const current = this.getCurrentUser();
          const mergedUser: UserProfile = {
            ...current,
            firstName: cloudUser.firstName,
            lastName: cloudUser.lastName || current.lastName,
            email: cloudUser.email || current.email,
            phone: cloudUser.phone || current.phone,
            avatarUrl: cloudUser.avatarUrl || current.avatarUrl,
          };
          this.set(STORAGE_KEYS.CURRENT_USER, mergedUser);
        }
      } catch {
        // non-blocking
      }

      // 4. Hydrate Prescription Presets / Plantillas from Supabase Cloud
      try {
        const cloudPresets = await supabaseDb.getPrescriptionPresets();
        if (cloudPresets && Array.isArray(cloudPresets) && cloudPresets.length > 0) {
          const localPresets = this.getPrescriptionPresets();
          const presetsMap = new Map<string, ClinicalPreset>();
          // Start with initial/local presets
          localPresets.forEach((p) => presetsMap.set(p.id, p));
          // Cloud presets overwrite/augment
          cloudPresets.forEach((p) => presetsMap.set(p.id, p));
          const finalPresets = Array.from(presetsMap.values());
          this.set(STORAGE_KEYS.PRESCRIPTION_PRESETS, finalPresets);
          safeDispatchEvent('nutriluz:db_updated', { detail: { type: 'prescription_presets_updated' } });
        } else {
          // If cloud has none, upload local presets to cloud so other devices get them
          const currentPresets = this.getPrescriptionPresets();
          if (currentPresets.length > 0) {
            supabaseDb.savePrescriptionPresets(currentPresets).catch(() => {});
          }
        }
      } catch (errPresets) {
        console.warn('[Storage] Error hydrating prescription presets from Supabase:', errPresets);
      }

      // 5. Hydrate Recipes from Supabase Cloud
      try {
        const cloudRecipes = await supabaseDb.getRecipes();
        if (cloudRecipes && cloudRecipes.length > 0) {
          const localRecipes = this.getRecipes();
          const recipesMap = new Map<string, Recipe>();
          localRecipes.forEach((r) => recipesMap.set(r.id, r));
          cloudRecipes.forEach((r) => recipesMap.set(r.id, r));
          const finalRecipes = Array.from(recipesMap.values());
          this.set(STORAGE_KEYS.RECIPES, finalRecipes);
          safeDispatchEvent('nutriluz:db_updated', { type: 'recipes_synced' });
          safeDispatchEvent('nutriluz:recipes_updated', { recipes: finalRecipes });
        } else {
          // If cloud has none or only initial, upload any local recipes to cloud
          const currentRecipes = this.getRecipes();
          for (const rec of currentRecipes) {
            supabaseDb.saveRecipe(rec).catch(() => {});
          }
        }
      } catch (errRec) {
        console.warn('[Storage] Error hydrating recipes from Supabase:', errRec);
      }

      // 6. Check if Supabase has patients
      // First, fetch any cloud tombstones from messages
      try {
        const cloudTombstones = await supabaseDb.getCloudTombstonePatientIds();
        if (cloudTombstones && cloudTombstones.length > 0) {
          const currentDeleted = this.getDeletedPatientIds();
          const combined = Array.from(new Set([...currentDeleted, ...cloudTombstones]));
          this.saveDeletedPatientIds(combined);
        }
      } catch (errTombstones) {
        console.warn('[Storage] Error checking cloud tombstones:', errTombstones);
      }

      const cloudPatients = await supabaseDb.getPatients();
      const deletedIds = new Set(this.getDeletedPatientIds());

      if (cloudPatients !== null) {
        if (cloudPatients.length === 0) {
          // If the user deleted all patients in Supabase, DO NOT re-upload them! Synchronize local to empty state!
          console.log('[Storage] Cloud database has 0 patients. Syncing local state to reflect empty database.');
          const currentLocal = this.getPatients();
          if (currentLocal.length > 0) {
            this.savePatients([]);
            safeDispatchEvent('nutriluz:db_updated', { type: 'patients_cleared' });
            safeDispatchEvent('nutriluz:patient_deleted', { detail: { count: currentLocal.length } });
          }
        } else {
          console.log(`[Storage] Hydrating from Supabase (${cloudPatients.length} patients found in cloud)...`);
          const localPatients = this.getPatients();
          const localPatientsMap = new Map<string, Patient>();
          localPatients.forEach((p) => localPatientsMap.set(p.id, p));
          const cloudIds = new Set(cloudPatients.map((p) => p.id));

          // Detect any local patients that were deleted from the cloud database or on another device
          const newlyDetectedDeletedIds: string[] = [];
          localPatients.forEach((lp) => {
            if (!cloudIds.has(lp.id) && !deletedIds.has(lp.id)) {
              newlyDetectedDeletedIds.push(lp.id);
            }
          });

          if (newlyDetectedDeletedIds.length > 0) {
            console.log(`[Storage] Detected ${newlyDetectedDeletedIds.length} patients removed from database:`, newlyDetectedDeletedIds);
            const updatedDeleted = Array.from(new Set([...this.getDeletedPatientIds(), ...newlyDetectedDeletedIds]));
            this.saveDeletedPatientIds(updatedDeleted);
            newlyDetectedDeletedIds.forEach((id) => deletedIds.add(id));
          }

          // Build final patient list strictly from active cloud patients (never re-adding deleted ones)
          const mergedPatients: Patient[] = cloudPatients
            .filter((cloudP) => !deletedIds.has(cloudP.id))
            .map((cloudP) => {
              const existingLocal = localPatientsMap.get(cloudP.id);
              const resolvedAssignedRecipes = (cloudP.assignedRecipeIds && cloudP.assignedRecipeIds.length > 0)
                ? cloudP.assignedRecipeIds
                : (existingLocal?.assignedRecipeIds || []);

              return {
                ...(existingLocal || {}),
                ...cloudP,
                assignedRecipeIds: resolvedAssignedRecipes,
                portalAccessEnabled: cloudP.portalAccessEnabled !== undefined
                  ? cloudP.portalAccessEnabled
                  : (existingLocal?.portalAccessEnabled ?? true),
                portalUsername: cloudP.portalUsername || existingLocal?.portalUsername,
                portalPassword: cloudP.portalPassword || existingLocal?.portalPassword,
              };
            });

          const countChanged = mergedPatients.length !== localPatients.length || newlyDetectedDeletedIds.length > 0;
          this.savePatients(mergedPatients);

          if (countChanged) {
            safeDispatchEvent('nutriluz:db_updated', { type: 'patients_synced' });
            safeDispatchEvent('nutriluz:patient_deleted', { detail: { deletedIds: newlyDetectedDeletedIds } });
          }
        }
      }

      // 7. Hydrate Nutrition Plans from Supabase Cloud
      try {
        const cloudPlans = await supabaseDb.getPlans();
        if (cloudPlans && cloudPlans.length > 0) {
          console.log(`[Storage] Hydrating from Supabase (${cloudPlans.length} nutrition plans found in cloud)...`);
          const localPlans = this.getPlans();
          const mergedPlansMap = new Map<string, NutritionPlan>();
          // Add local plans first
          localPlans.forEach((plan) => {
            if (!deletedIds.has(plan.patientId)) {
              mergedPlansMap.set(plan.id, plan);
            }
          });
          // Cloud plans overwrite or add (cloud is authoritative across devices)
          cloudPlans.forEach((plan) => {
            if (!deletedIds.has(plan.patientId)) {
              mergedPlansMap.set(plan.id, plan);
            }
          });
          this.savePlans(Array.from(mergedPlansMap.values()));
          safeDispatchEvent('nutriluz:db_updated', { type: 'plans_synced' });
          safeDispatchEvent('nutriluz_plan_updated', { type: 'plans_synced' });
        }
      } catch (errPlans) {
        console.warn('[Storage] Error hydrating plans from Supabase:', errPlans);
      }

      // 5. Hydrate Anthropometric Records from Supabase Cloud
      try {
        const cloudAnthro = await supabaseDb.getAnthropometrics();
        if (cloudAnthro && cloudAnthro.length > 0) {
          const localAnthro = this.getAnthropometrics();
          const mergedAnthroMap = new Map<string, AnthropometricRecord>();
          localAnthro.forEach((a) => {
            if (!deletedIds.has(a.patientId)) mergedAnthroMap.set(a.id, a);
          });
          cloudAnthro.forEach((a) => {
            if (!deletedIds.has(a.patientId)) mergedAnthroMap.set(a.id, a);
          });
          this.saveAnthropometrics(Array.from(mergedAnthroMap.values()));
          safeDispatchEvent('nutriluz:db_updated', { type: 'anthro_synced' });
        }
      } catch (errAnthro) {
        console.warn('[Storage] Error hydrating anthropometrics from Supabase:', errAnthro);
      }

      // 6. Hydrate Appointments from Supabase Cloud
      try {
        const cloudAppointments = await supabaseDb.getAppointments();
        if (cloudAppointments && cloudAppointments.length > 0) {
          const localAppointments = this.getAppointments();
          const mergedApptsMap = new Map<string, Appointment>();
          localAppointments.forEach((app) => {
            if (!deletedIds.has(app.patientId)) mergedApptsMap.set(app.id, app);
          });
          cloudAppointments.forEach((app) => {
            if (!deletedIds.has(app.patientId)) mergedApptsMap.set(app.id, app);
          });
          this.saveAppointments(Array.from(mergedApptsMap.values()));
          safeDispatchEvent('nutriluz:db_updated', { type: 'appointments_synced' });
        }
      } catch (errAppts) {
        console.warn('[Storage] Error hydrating appointments from Supabase:', errAppts);
      }
    } catch (e) {
      console.warn('[Storage] Supabase background sync failed:', e);
    }
  },

  async syncWithServer(): Promise<{ success: boolean; syncedAt?: string }> {
    try {
      // First fetch server's deletedPatientIds to keep this browser in sync
      try {
        const deletedRes = await fetch('/api/patients/deleted');
        if (deletedRes.ok) {
          const { deletedPatientIds } = await deletedRes.json();
          if (deletedPatientIds && Array.isArray(deletedPatientIds) && deletedPatientIds.length > 0) {
            const currentDeleted = this.getDeletedPatientIds();
            const combined = Array.from(new Set([...currentDeleted, ...deletedPatientIds]));
            this.saveDeletedPatientIds(combined);
            // Purge local patients matching deleted IDs
            const currentPatients = this.getPatients();
            const filtered = currentPatients.filter((p) => !combined.includes(p.id));
            if (filtered.length !== currentPatients.length) {
              this.set(STORAGE_KEYS.PATIENTS, filtered);
              safeDispatchEvent('nutriluz:db_updated', { type: 'patient_purged' });
            }
          }
        }
      } catch {}

      await this.syncWithSupabase();
      const snapshot = this.getAllDatabaseSnapshot();
      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collections: snapshot,
          deletedPatientIds: this.getDeletedPatientIds(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.deletedPatientIds && Array.isArray(data.deletedPatientIds)) {
          const currentDeleted = this.getDeletedPatientIds();
          const combined = Array.from(new Set([...currentDeleted, ...data.deletedPatientIds]));
          this.saveDeletedPatientIds(combined);

          // Purge local patients matching deleted IDs from another device
          const currentPatients = this.getPatients();
          const filtered = currentPatients.filter((p) => !combined.includes(p.id));
          if (filtered.length !== currentPatients.length) {
            this.set(STORAGE_KEYS.PATIENTS, filtered);
            safeDispatchEvent('nutriluz:db_updated', { type: 'patient_purged' });
            safeDispatchEvent('nutriluz:patient_deleted', { detail: { count: currentPatients.length - filtered.length } });
          }
        }
        return { success: true, syncedAt: data.syncedAt };
      }
      return { success: true, syncedAt: new Date().toISOString() };
    } catch {
      return { success: true, syncedAt: new Date().toISOString() };
    }
  },

  exportDatabaseJson(): string {
    const data = {
      app: 'NUTRILUZ',
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      database: this.getAllDatabaseSnapshot(),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabaseJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      const db = parsed.database || parsed;
      Object.entries(STORAGE_KEYS).forEach(([keyName, storageKey]) => {
        if (db[keyName]) {
          localStorage.setItem(storageKey, JSON.stringify(db[keyName]));
        }
      });
      return true;
    } catch (e) {
      console.error('Failed to import database:', e);
      return false;
    }
  },

  resetToDemo() {
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    this.init();
  },
};

// Auto-run init and background sync across all devices
storageService.init();
if (typeof window !== 'undefined') {
  // Immediate sync on load to hydrate plans and patients from Supabase without delay
  setTimeout(() => {
    storageService.syncWithSupabase().catch(() => {});
  }, 50);

  setTimeout(() => {
    storageService.syncWithServer().catch(() => {});
  }, 600);

  // Sync when user focuses or returns to the browser tab
  window.addEventListener('focus', () => {
    storageService.syncWithServer().catch(() => {});
    storageService.syncWithSupabase().catch(() => {});
  });
  window.addEventListener('online', () => {
    storageService.syncWithServer().catch(() => {});
    storageService.syncWithSupabase().catch(() => {});
  });

  // Multi-device background interval sync every 6 seconds
  setInterval(() => {
    storageService.syncWithServer().catch(() => {});
    storageService.syncWithSupabase().catch(() => {});
  }, 6000);
}

