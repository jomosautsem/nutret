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
  {
    id: 'user-dr-carlos',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-gdl-prov',
    role: 'NUTRIOLOGO',
    email: 'dr.carlos@nutriluz.mx',
    firstName: 'Carlos',
    lastName: 'Mendoza Ruiz',
    professionalTitle: 'Mtro. en Nutrición Deportiva y Alto Rendimiento',
    licenseNumber: '12493019 / SSA 9410',
    specialties: ['Nutrición Deportiva', 'Hipertrofia', 'Atletas de Resistencia'],
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    phone: '+52 33 3615 2201',
    whatsapp: '+52 33 3615 2201',
    bio: 'Maestría en ciencias del deporte, enfocado en optimización de rendimiento atlético, pérdida de grasa acelerada manteniendo masa muscular magra.',
    publicProfileEnabled: true,
    publicSlug: 'carlos-mendoza',
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

export const initialPatients: Patient[] = [
  {
    id: 'pat-ana-sofia',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    firstName: 'Ana Sofía',
    lastName: 'García Rivas',
    email: 'ana.garcia@gmail.com',
    phone: '+52 55 9182 3344',
    whatsapp: '+52 55 9182 3344',
    birthDate: '1995-04-18',
    gender: 'F',
    occupation: 'Diseñadora UX / Home Office',
    address: 'Col. Del Valle Sur, Benito Juárez, CDMX',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    goal: 'Pérdida de grasa y mejora de energía diaria',
    status: 'Activo',
    riskLevel: 'NORMAL',
    adherenceRate: 92.5,
    initialWeight: 72.4,
    currentWeight: 67.8,
    targetWeight: 63.0,
    height: 165,
    lastConsultationDate: '2026-08-01',
    nextConsultationDate: '2026-08-22',
    notes: 'Paciente muy constante con el registro de agua y comidas. Excelente evolución antropométrica.',
    assignedRecipeIds: ['rec-1', 'rec-2', 'rec-3'],
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-08-10T14:30:00Z',
  },
  {
    id: 'pat-roberto-m',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    firstName: 'Roberto',
    lastName: 'Navarro Ruiz',
    email: 'roberto.navarro@outlook.com',
    phone: '+52 55 2381 9901',
    whatsapp: '+52 55 2381 9901',
    birthDate: '1988-11-23',
    gender: 'M',
    occupation: 'Gerente Comercial',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    goal: 'Recomposición corporal y control de glucosa',
    status: 'Activo',
    riskLevel: 'MEDIUM_RISK',
    adherenceRate: 68.0,
    initialWeight: 89.5,
    currentWeight: 86.2,
    targetWeight: 79.0,
    height: 178,
    lastConsultationDate: '2026-07-20',
    nextConsultationDate: '2026-08-18',
    notes: 'Viaja frecuentemente por trabajo; se le asignaron opciones de restaurantes y equivalencias.',
    createdAt: '2026-04-15T09:00:00Z',
    updatedAt: '2026-08-08T11:00:00Z',
  },
  {
    id: 'pat-mariana-t',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-gdl-prov',
    specialistId: 'user-dr-carlos',
    firstName: 'Mariana',
    lastName: 'Torres Vega',
    email: 'mariana.torres@gmail.com',
    phone: '+52 33 1120 4455',
    whatsapp: '+52 33 1120 4455',
    birthDate: '1998-07-09',
    gender: 'F',
    occupation: 'Estudiante de Posgrado',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    goal: 'Aumento de masa muscular (Hipertrofia)',
    status: 'Activo',
    riskLevel: 'NORMAL',
    adherenceRate: 94.0,
    initialWeight: 52.0,
    currentWeight: 55.4,
    targetWeight: 57.0,
    height: 160,
    lastConsultationDate: '2026-08-05',
    nextConsultationDate: '2026-08-26',
    notes: 'Entrenamiento de fuerza 5 días por semana. Excelente ganancia de masa magra.',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-08-05T16:00:00Z',
  },
  {
    id: 'pat-diego-s',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    firstName: 'Diego',
    lastName: 'Salazar Gómez',
    email: 'diego.salazar@live.com',
    phone: '+52 55 7712 3901',
    whatsapp: '+52 55 7712 3901',
    birthDate: '1982-03-14',
    gender: 'M',
    occupation: 'Arquitecto',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    goal: 'Salud cardiovascular y reducción de triglicéridos',
    status: 'Activo',
    riskLevel: 'HIGH_RISK',
    adherenceRate: 45.0,
    initialWeight: 96.0,
    currentWeight: 94.8,
    targetWeight: 82.0,
    height: 175,
    lastConsultationDate: '2026-07-02',
    nextConsultationDate: undefined,
    notes: '⚠️ Paciente sin registrar actividad hace 12 días y sin cita próxima agendada. Requiere contacto de reactivación.',
    createdAt: '2026-06-01T11:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'pat-claudia-h',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-gdl-prov',
    specialistId: 'user-dr-carlos',
    firstName: 'Claudia',
    lastName: 'Hernández Soto',
    email: 'clau.hernandez@hotmail.com',
    phone: '+52 33 2291 0041',
    whatsapp: '+52 33 2291 0041',
    birthDate: '1991-09-30',
    gender: 'F',
    occupation: 'Abogada Corporativa',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    goal: 'Pérdida de grasa corporal y control de ansiedad',
    status: 'Activo',
    riskLevel: 'NORMAL',
    adherenceRate: 88.0,
    initialWeight: 68.0,
    currentWeight: 64.1,
    targetWeight: 60.0,
    height: 168,
    lastConsultationDate: '2026-08-08',
    nextConsultationDate: '2026-08-29',
    createdAt: '2026-05-18T10:00:00Z',
    updatedAt: '2026-08-08T12:00:00Z',
  },
  {
    id: 'pat-javier-o',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    firstName: 'Javier',
    lastName: 'Orozco Peñaloza',
    email: 'javier.orozco@gmail.com',
    phone: '+52 55 6601 2289',
    whatsapp: '+52 55 6601 2289',
    birthDate: '1975-12-05',
    gender: 'M',
    occupation: 'Consultor Financiero',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    goal: 'Control de hipertensión y pérdida de peso',
    status: 'Activo',
    riskLevel: 'NORMAL',
    adherenceRate: 86.5,
    initialWeight: 102.0,
    currentWeight: 93.5,
    targetWeight: 85.0,
    height: 182,
    lastConsultationDate: '2026-07-28',
    nextConsultationDate: '2026-08-19',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-08-02T15:00:00Z',
  },
  {
    id: 'pat-fernanda-p',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    firstName: 'Fernanda',
    lastName: 'Pérez Cantú',
    email: 'fernanda.perez@gmail.com',
    phone: '+52 55 8891 0022',
    birthDate: '2000-02-14',
    gender: 'F',
    occupation: 'Nutrición Deportiva / Triatleta',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    goal: 'Rendimiento deportivo para Medio Maratón',
    status: 'Activo',
    riskLevel: 'NORMAL',
    adherenceRate: 97.0,
    initialWeight: 56.5,
    currentWeight: 55.0,
    targetWeight: 54.5,
    height: 167,
    lastConsultationDate: '2026-08-11',
    nextConsultationDate: '2026-09-01',
    createdAt: '2026-06-15T14:00:00Z',
    updatedAt: '2026-08-11T16:00:00Z',
  },
  {
    id: 'pat-gabriel-l',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-gdl-prov',
    specialistId: 'user-dr-carlos',
    firstName: 'Gabriel',
    lastName: 'Lara Méndez',
    email: 'gabriel.lara@corp.com',
    phone: '+52 33 4401 9922',
    birthDate: '1985-05-20',
    gender: 'M',
    occupation: 'Empresario',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    goal: 'Disminución de porcentaje de grasa y aumento de fuerza',
    status: 'En pausa',
    riskLevel: 'MEDIUM_RISK',
    adherenceRate: 70.0,
    initialWeight: 84.0,
    currentWeight: 81.5,
    targetWeight: 76.0,
    height: 176,
    lastConsultationDate: '2026-06-25',
    notes: 'Puso el plan en pausa por viaje internacional de trabajo hasta septiembre.',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'pat-valeria-s',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    firstName: 'Valeria',
    lastName: 'Santos Domínguez',
    email: 'vale.santos@gmail.com',
    phone: '+52 55 3302 9911',
    birthDate: '1993-10-12',
    gender: 'F',
    occupation: 'Chef Repostera',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    goal: 'Control de glucosa y hábitos saludables en cocina',
    status: 'Activo',
    riskLevel: 'NORMAL',
    adherenceRate: 85.0,
    initialWeight: 70.0,
    currentWeight: 65.5,
    targetWeight: 62.0,
    height: 163,
    lastConsultationDate: '2026-08-04',
    nextConsultationDate: '2026-08-25',
    createdAt: '2026-04-01T11:00:00Z',
    updatedAt: '2026-08-04T12:00:00Z',
  },
  {
    id: 'pat-pablo-c',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    firstName: 'Pablo',
    lastName: 'Castillo Cruz',
    email: 'pablo.castillo@gmail.com',
    phone: '+52 55 1190 2234',
    birthDate: '1990-08-08',
    gender: 'M',
    occupation: 'Ingeniero de Software',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    goal: 'Pérdida de grasa visceral y mejora de postura',
    status: 'Alta',
    riskLevel: 'NORMAL',
    adherenceRate: 98.0,
    initialWeight: 88.0,
    currentWeight: 75.0,
    targetWeight: 75.0,
    height: 179,
    lastConsultationDate: '2026-07-30',
    notes: '🎉 ¡Paciente dado de alta por cumplimiento de meta! Mantenimiento exitoso.',
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2026-07-30T17:00:00Z',
  },
];

export const initialAnthropometricRecords: AnthropometricRecord[] = [
  {
    id: 'anthro-ana-1',
    patientId: 'pat-ana-sofia',
    date: '2026-05-10',
    weight: 72.4,
    height: 165,
    bmi: 26.59,
    bodyFatPercentage: 31.8,
    fatMassKg: 23.0,
    muscleMassKg: 46.5,
    bodyWaterPercentage: 50.2,
    visceralFatLevel: 6,
    basalMetabolicRateKcal: 1420,
    waistCircumference: 84.0,
    hipCircumference: 104.0,
    waistHipRatio: 0.81,
    relaxedArmCircumference: 29.5,
    thighCircumference: 58.0,
    measurementDevice: 'InBody 270 Clínico',
    notes: 'Medición basal inicial. Grasa visceral moderada.',
  },
  {
    id: 'anthro-ana-2',
    patientId: 'pat-ana-sofia',
    date: '2026-06-12',
    weight: 70.1,
    height: 165,
    bmi: 25.75,
    bodyFatPercentage: 29.2,
    fatMassKg: 20.4,
    muscleMassKg: 46.8,
    bodyWaterPercentage: 52.0,
    visceralFatLevel: 5,
    basalMetabolicRateKcal: 1425,
    waistCircumference: 80.5,
    hipCircumference: 101.5,
    waistHipRatio: 0.79,
    relaxedArmCircumference: 28.5,
    thighCircumference: 56.5,
    measurementDevice: 'InBody 270 Clínico',
    notes: 'Excelente reducción de 2.6kg de masa grasa pura manteniendo músculo.',
  },
  {
    id: 'anthro-ana-3',
    patientId: 'pat-ana-sofia',
    date: '2026-07-10',
    weight: 68.9,
    height: 165,
    bmi: 25.31,
    bodyFatPercentage: 27.5,
    fatMassKg: 18.9,
    muscleMassKg: 47.0,
    bodyWaterPercentage: 53.4,
    visceralFatLevel: 4,
    basalMetabolicRateKcal: 1430,
    waistCircumference: 77.0,
    hipCircumference: 99.0,
    waistHipRatio: 0.78,
    relaxedArmCircumference: 27.8,
    thighCircumference: 55.0,
    measurementDevice: 'InBody 270 Clínico',
    notes: 'Circunferencia de cintura disminuyó 7cm desde el inicio.',
  },
  {
    id: 'anthro-ana-4',
    patientId: 'pat-ana-sofia',
    date: '2026-08-01',
    weight: 67.8,
    height: 165,
    bmi: 24.90,
    bodyFatPercentage: 26.0,
    fatMassKg: 17.6,
    muscleMassKg: 47.2,
    bodyWaterPercentage: 54.5,
    visceralFatLevel: 4,
    basalMetabolicRateKcal: 1435,
    waistCircumference: 75.0,
    hipCircumference: 97.5,
    waistHipRatio: 0.77,
    relaxedArmCircumference: 27.2,
    thighCircumference: 54.0,
    measurementDevice: 'InBody 270 Clínico',
    notes: '¡Alcanzó rango de IMC normal (<25)! Músculo en incremento.',
  },
];

export const initialClinicalRecords: ClinicalRecord[] = [
  {
    id: 'clin-ana-1',
    patientId: 'pat-ana-sofia',
    specialistId: 'user-dra-valeria',
    familyHistory: {
      diabetes: true,
      hypertension: true,
      cancer: false,
      cardiovascular: false,
      thyroid: false,
      notes: 'Abuela materna con Diabetes Tipo 2; Padre con hipertensión controlada.',
    },
    pathologicalHistory: {
      diagnosedDiseases: ['Resistencia a la insulina leve (diagnosticada en 2024)'],
      previousTreatments: 'Manejo dietético previo sin adherencia sostenida.',
      surgeries: ['Apendicectomía (2018)'],
    },
    allergies: ['Camarón y mariscos'],
    medications: [],
    lifestyleHabits: {
      sleepHours: 7.5,
      sleepQuality: 'Buena',
      smoking: false,
      alcohol: 'Ocasional (social 1 copa de vino tinto fin de semana)',
      stressLevel: 'Moderado',
      waterDailyLiters: 2.5,
    },
    physicalActivity: {
      activityLevel: 'Moderada',
      exerciseType: 'Entrenamiento funcional de fuerza + caminatas diarias',
      frequencyDaysPerWeek: 4,
      durationMinutes: 50,
    },
    dietaryHabits: {
      mealsPerDay: 4,
      preferredFoods: ['Pollo', 'Aguacate', 'Frutos rojos', 'Avena', 'Huevos', 'Espinacas'],
      dislikedFoods: ['Hígado', 'Pescados muy grasos con espinas'],
      eatingOutFrequency: '1 vez por semana los domingos',
      bingeEating: false,
    },
    recall24h: 'Desayuno: Café con leche de almendras y 2 tostadas con huevo y aguacate. Comida: Pechuga de pollo asada con arroz integral y ensalada mixta. Colación: Manzana con 10 almendras. Cena: Omelette de claras con espinaca y 1 tortilla de maíz.',
    clinicalGoals: 'Mantener control glucémico, optimizar composición corporal reduciendo grasa visceral y fortalecer masa magra.',
    clinicalObservations: 'Paciente muy receptiva y disciplinada. Comprende el uso de la tabla de equivalencias para intercambiar alimentos en comidas fuera de casa.',
    updatedAt: '2026-08-01T11:00:00Z',
  },
];

export const initialLaboratories: LaboratoryResult[] = [
  {
    id: 'lab-ana-1',
    patientId: 'pat-ana-sofia',
    testDate: '2026-07-25',
    laboratoryName: 'Laboratorios Médicos Chopo CDMX',
    glucoseMgDl: 89,
    hba1cPercentage: 5.2,
    totalCholesterolMgDl: 178,
    hdlCholesterolMgDl: 58,
    ldlCholesterolMgDl: 102,
    triglyceridesMgDl: 90,
    uricAcidMgDl: 4.1,
    creatinineMgDl: 0.8,
    ureaMgDl: 28,
    tgoAstUL: 22,
    tgpAltUL: 20,
    hemoglobinGDl: 14.1,
    tshUiuMl: 1.85,
    vitaminDNgMl: 38,
    customParameters: [
      { name: 'Insulina en Ayuno', value: '7.8', unit: 'uUI/ml', refRange: '2.6 - 24.9' },
      { name: 'Índice HOMA-IR', value: '1.71', unit: 'índice', refRange: '< 2.5 (Normal)' },
    ],
    aiAnalysisSummary: 'Perfil metabólico dentro de rangos óptimos. Glucosa en ayuno (89 mg/dL) y HbA1c (5.2%) normales. HOMA-IR de 1.71 indica reversión de la resistencia a la insulina.',
    specialistInterpretation: 'Resultados excelentes. Se confirma normoglucemia y perfil lipídico protector con triglicéridos en 90 mg/dL.',
  },
];

export const initialPlans: NutritionPlan[] = [
  {
    id: 'plan-ana-recomp',
    organizationId: 'org-nutriluz-mexico',
    patientId: 'pat-ana-sofia',
    specialistId: 'user-dra-valeria',
    title: 'Plan de Recomposición y Balance Metabólico 1,600 kcal',
    goal: 'Pérdida de grasa preservando masa muscular',
    status: 'ACTIVE',
    startDate: '2026-08-01',
    endDate: '2026-08-22',
    targetCaloriesKcal: 1600,
    targetProteinG: 120,
    targetCarbsG: 155,
    targetFatG: 55,
    targetWaterLiters: 2.5,
    generalInstructions: 'Realiza tus 4 tiempos de comida en horarios regulares. Recuerda masticar despacio y priorizar alimentos enteros y frescos.',
    hydrationInstructions: 'Meta: 2.5 Litros al día. Tomar 500ml al despertar y distribuir el resto durante el día.',
    allowedSubstitutionsPolicy: 'Puedes utilizar la tabla de equivalentes del SMAE para cambiar pechuga de pollo por pescado blanco o queso panela en las porciones marcadas.',
    approvedBySpecialist: true,
    digitalSignatureApprovedAt: '2026-08-01T10:00:00Z',
    days: [
      {
        id: 'day-1-lunes',
        dayOfWeek: 1,
        dayName: 'Lunes',
        meals: [
          {
            id: 'm-1-desayuno',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '08:00',
            items: [
              {
                id: 'it-1',
                itemType: 'RECIPE',
                name: 'Omelette Verde con Espinacas y Queso Panela',
                portionDescription: '1 porción completa con 2 tortillas y aguacate',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 385,
                proteinG: 26,
                carbsG: 32,
                fatG: 16,
                interchangeOptions: ['Huevos revueltos a la mexicana con frijoles', 'Chilaquiles ligeros con pechuga de pollo'],
              },
            ],
          },
          {
            id: 'm-2-colacion1',
            name: 'Colación Matutina',
            mealOrder: 2,
            suggestedTime: '11:30',
            items: [
              {
                id: 'it-2',
                itemType: 'FOOD',
                name: 'Manzana verde con 10 almendras',
                portionDescription: '1 manzana mediana (100g) + 10 almendras naturales',
                portionQuantity: 1,
                equivalentGroupCode: 'FRUTAS',
                energyKcal: 130,
                proteinG: 3.3,
                carbsG: 17.5,
                fatG: 6.2,
              },
            ],
          },
          {
            id: 'm-3-comida',
            name: 'Comida',
            mealOrder: 3,
            suggestedTime: '14:30',
            items: [
              {
                id: 'it-3',
                itemType: 'RECIPE',
                name: 'Pechuga a la Plancha con Arroz al Vapor y Nopales Asados',
                portionDescription: '130g pechuga + 1 taza arroz integral + nopales + 1/2 taza frijoles',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 490,
                proteinG: 38,
                carbsG: 50,
                fatG: 14,
                interchangeOptions: ['Filete de pescado a la veracruzana', 'Bistec magro asado con quinoa'],
              },
            ],
          },
          {
            id: 'm-4-colacion2',
            name: 'Colación Vespertina',
            mealOrder: 4,
            suggestedTime: '17:30',
            items: [
              {
                id: 'it-4',
                itemType: 'RECIPE',
                name: 'Tazón de Yogur Griego con Frutos Rojos y Almendras',
                portionDescription: '170g yogur griego + 1 taza moras + canela',
                portionQuantity: 1,
                equivalentGroupCode: 'LECHE_DESC',
                energyKcal: 235,
                proteinG: 18,
                carbsG: 22,
                fatG: 7,
              },
            ],
          },
          {
            id: 'm-5-cena',
            name: 'Cena',
            mealOrder: 5,
            suggestedTime: '20:30',
            items: [
              {
                id: 'it-5',
                itemType: 'RECIPE',
                name: 'Tostadas de Atún a la Mexicana con Aguacate',
                portionDescription: '1 lata atún + 3 tostadas horneadas + pico de gallo + aguacate',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_MBA',
                energyKcal: 320,
                proteinG: 27,
                carbsG: 30,
                fatG: 9,
              },
            ],
          },
        ],
      },
      {
        id: 'day-2-martes',
        dayOfWeek: 2,
        dayName: 'Martes',
        meals: [
          {
            id: 'm-2-1-desayuno',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '08:00',
            items: [
              {
                id: 'it-2-1',
                itemType: 'RECIPE',
                name: 'Huevos revueltos a la mexicana con frijoles negros',
                portionDescription: '2 huevos enteros + 1/2 taza frijoles de la olla + 2 tortillas de maíz',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 390,
                proteinG: 25,
                carbsG: 34,
                fatG: 15,
              },
            ],
          },
          {
            id: 'm-2-2-colacion1',
            name: 'Colación Matutina',
            mealOrder: 2,
            suggestedTime: '11:30',
            items: [
              {
                id: 'it-2-2',
                itemType: 'FOOD',
                name: 'Tazón de papaya fresca con semillas de chía',
                portionDescription: '1 taza de papaya picada (140g) + 1 cda de semillas de chía',
                portionQuantity: 1,
                equivalentGroupCode: 'FRUTAS',
                energyKcal: 115,
                proteinG: 3,
                carbsG: 18,
                fatG: 3.5,
              },
            ],
          },
          {
            id: 'm-2-3-comida',
            name: 'Comida',
            mealOrder: 3,
            suggestedTime: '14:30',
            items: [
              {
                id: 'it-2-3',
                itemType: 'RECIPE',
                name: 'Filete de pescado blanco al limón con quinoa y ensalada verde',
                portionDescription: '140g filete de tilapia o robalo + 1/2 taza quinoa + ensalada fresca con vinagreta de oliva',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_MBA',
                energyKcal: 460,
                proteinG: 40,
                carbsG: 44,
                fatG: 12,
              },
            ],
          },
          {
            id: 'm-2-4-colacion2',
            name: 'Colación Vespertina',
            mealOrder: 4,
            suggestedTime: '17:30',
            items: [
              {
                id: 'it-2-4',
                itemType: 'FOOD',
                name: 'Gelatina ligera con 5 mitades de nuez de castilla',
                portionDescription: '1 tazón de gelatina sin azúcar + 5 mitades de nuez',
                portionQuantity: 1,
                equivalentGroupCode: 'GRASAS_SP',
                energyKcal: 120,
                proteinG: 4,
                carbsG: 3,
                fatG: 10,
              },
            ],
          },
          {
            id: 'm-2-5-cena',
            name: 'Cena',
            mealOrder: 5,
            suggestedTime: '20:30',
            items: [
              {
                id: 'it-2-5',
                itemType: 'RECIPE',
                name: 'Quesadillas en comal de maíz con queso panela y pico de gallo',
                portionDescription: '2 tortillas de maíz + 60g queso panela asado + pico de gallo + 1/3 aguacate',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 340,
                proteinG: 22,
                carbsG: 32,
                fatG: 13,
              },
            ],
          },
        ],
      },
      {
        id: 'day-3-miercoles',
        dayOfWeek: 3,
        dayName: 'Miércoles',
        meals: [
          {
            id: 'm-3-1-desayuno',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '08:00',
            items: [
              {
                id: 'it-3-1',
                itemType: 'RECIPE',
                name: 'Pancakes de avena y plátano con canela y claras',
                portionDescription: '45g avena molida + 3 claras de huevo + 1/2 plátano + canela en polvo',
                portionQuantity: 1,
                equivalentGroupCode: 'CEREALES_SG',
                energyKcal: 360,
                proteinG: 24,
                carbsG: 48,
                fatG: 6,
              },
            ],
          },
          {
            id: 'm-3-2-colacion1',
            name: 'Colación Matutina',
            mealOrder: 2,
            suggestedTime: '11:30',
            items: [
              {
                id: 'it-3-2',
                itemType: 'FOOD',
                name: 'Yogur griego natural sin azúcar con fresas rebanadas',
                portionDescription: '150g yogur griego + 1 taza de fresas rebanadas',
                portionQuantity: 1,
                equivalentGroupCode: 'LECHE_DESC',
                energyKcal: 140,
                proteinG: 15,
                carbsG: 14,
                fatG: 2,
              },
            ],
          },
          {
            id: 'm-3-3-comida',
            name: 'Comida',
            mealOrder: 3,
            suggestedTime: '14:30',
            items: [
              {
                id: 'it-3-3',
                itemType: 'RECIPE',
                name: 'Pechuga marinada al romero con camote al horno y espárragos',
                portionDescription: '130g pechuga de pollo + 1/2 taza de camote horneado + 6 espárragos al vapor',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 475,
                proteinG: 39,
                carbsG: 46,
                fatG: 11,
              },
            ],
          },
          {
            id: 'm-3-4-colacion2',
            name: 'Colación Vespertina',
            mealOrder: 4,
            suggestedTime: '17:30',
            items: [
              {
                id: 'it-3-4',
                itemType: 'FOOD',
                name: 'Jícama y pepino con limón y chilito en polvo',
                portionDescription: '1.5 tazas con limón y una pizca de sal y chilito tajín',
                portionQuantity: 1,
                equivalentGroupCode: 'VERDURAS',
                energyKcal: 65,
                proteinG: 2,
                carbsG: 14,
                fatG: 0.5,
              },
            ],
          },
          {
            id: 'm-3-5-cena',
            name: 'Cena',
            mealOrder: 5,
            suggestedTime: '20:30',
            items: [
              {
                id: 'it-3-5',
                itemType: 'RECIPE',
                name: 'Fajitas de pollo con pimientos tricolores y aguacate',
                portionDescription: '100g fajitas de pechuga + pimientos asados + 2 tortillas de maíz + aguacate',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 350,
                proteinG: 28,
                carbsG: 30,
                fatG: 12,
              },
            ],
          },
        ],
      },
      {
        id: 'day-4-jueves',
        dayOfWeek: 4,
        dayName: 'Jueves',
        meals: [
          {
            id: 'm-4-1-desayuno',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '08:00',
            items: [
              {
                id: 'it-4-1',
                itemType: 'RECIPE',
                name: 'Omelette de claras con champiñones salteados y espinacas baby',
                portionDescription: '3 claras + 1 huevo entero + 1 taza champiñones + 1 tortilla de maíz + 1/3 aguacate',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 370,
                proteinG: 26,
                carbsG: 25,
                fatG: 16,
              },
            ],
          },
          {
            id: 'm-4-2-colacion1',
            name: 'Colación Matutina',
            mealOrder: 2,
            suggestedTime: '11:30',
            items: [
              {
                id: 'it-4-2',
                itemType: 'FOOD',
                name: 'Frutos rojos mixtos con 10 almendras tostadas',
                portionDescription: '1 taza de moras y frambuesas + 10 almendras naturales',
                portionQuantity: 1,
                equivalentGroupCode: 'FRUTAS',
                energyKcal: 135,
                proteinG: 3.5,
                carbsG: 16,
                fatG: 7,
              },
            ],
          },
          {
            id: 'm-4-3-comida',
            name: 'Comida',
            mealOrder: 3,
            suggestedTime: '14:30',
            items: [
              {
                id: 'it-4-3',
                itemType: 'RECIPE',
                name: 'Filete de res magro con puré de papa rústico y brócoli al vapor',
                portionDescription: '120g filete magro asado + 1/2 taza puré casero + 1 taza brócoli al vapor',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 480,
                proteinG: 38,
                carbsG: 42,
                fatG: 14,
              },
            ],
          },
          {
            id: 'm-4-4-colacion2',
            name: 'Colación Vespertina',
            mealOrder: 4,
            suggestedTime: '17:30',
            items: [
              {
                id: 'it-4-4',
                itemType: 'FOOD',
                name: 'Licuado ligero de fresa con leche de almendras y canela',
                portionDescription: '1 taza leche de almendras s/azúcar + 1/2 taza fresas + pizca de canela',
                portionQuantity: 1,
                equivalentGroupCode: 'LECHE_DESC',
                energyKcal: 85,
                proteinG: 2.5,
                carbsG: 12,
                fatG: 3,
              },
            ],
          },
          {
            id: 'm-4-5-cena',
            name: 'Cena',
            mealOrder: 5,
            suggestedTime: '20:30',
            items: [
              {
                id: 'it-4-5',
                itemType: 'RECIPE',
                name: 'Tacos ligeros de atún sellado con aderezo de yogur y lechuga',
                portionDescription: '1 lata atún en agua o 100g medallón + 2 tortillas maíz + ensalada de col y limón',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_MBA',
                energyKcal: 330,
                proteinG: 30,
                carbsG: 28,
                fatG: 8,
              },
            ],
          },
        ],
      },
      {
        id: 'day-5-viernes',
        dayOfWeek: 5,
        dayName: 'Viernes',
        meals: [
          {
            id: 'm-5-1-desayuno',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '08:00',
            items: [
              {
                id: 'it-5-1',
                itemType: 'RECIPE',
                name: 'Chilaquiles verdes ligeros con pechuga deshebrada y queso panela',
                portionDescription: '2 tortillas horneadas en salsa verde + 80g pechuga deshebrada + 30g panela rallado',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 395,
                proteinG: 29,
                carbsG: 35,
                fatG: 14,
              },
            ],
          },
          {
            id: 'm-5-2-colacion1',
            name: 'Colación Matutina',
            mealOrder: 2,
            suggestedTime: '11:30',
            items: [
              {
                id: 'it-5-2',
                itemType: 'FOOD',
                name: 'Tazón de moras silvestres con semillas de girasol',
                portionDescription: '1 taza de moras + 1 cda de semillas de girasol tostadas',
                portionQuantity: 1,
                equivalentGroupCode: 'FRUTAS',
                energyKcal: 125,
                proteinG: 3.5,
                carbsG: 16,
                fatG: 6,
              },
            ],
          },
          {
            id: 'm-5-3-comida',
            name: 'Comida',
            mealOrder: 3,
            suggestedTime: '14:30',
            items: [
              {
                id: 'it-5-3',
                itemType: 'RECIPE',
                name: 'Salmón a la plancha con ensalada mediterránea y arroz al vapor',
                portionDescription: '120g salmón fresco + 1 taza ensalada de pepino, tomate y orégano + 1/2 taza arroz integral',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_MA',
                energyKcal: 510,
                proteinG: 36,
                carbsG: 40,
                fatG: 18,
              },
            ],
          },
          {
            id: 'm-5-4-colacion2',
            name: 'Colación Vespertina',
            mealOrder: 4,
            suggestedTime: '17:30',
            items: [
              {
                id: 'it-5-4',
                itemType: 'FOOD',
                name: 'Yogur griego con manzana verde picada y canela',
                portionDescription: '140g yogur griego + 1/2 manzana picada + canela molida',
                portionQuantity: 1,
                equivalentGroupCode: 'LECHE_DESC',
                energyKcal: 155,
                proteinG: 14,
                carbsG: 18,
                fatG: 2,
              },
            ],
          },
          {
            id: 'm-5-5-cena',
            name: 'Cena',
            mealOrder: 5,
            suggestedTime: '20:30',
            items: [
              {
                id: 'it-5-5',
                itemType: 'RECIPE',
                name: 'Ensalada tibia de pollo a la parrilla con aguacate y jitomates cherry',
                portionDescription: '100g pechuga asada + hojas verdes variadas + 1/3 aguacate + 2 tostadas horneadas',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 340,
                proteinG: 28,
                carbsG: 26,
                fatG: 12,
              },
            ],
          },
        ],
      },
      {
        id: 'day-6-sabado',
        dayOfWeek: 6,
        dayName: 'Sábado',
        meals: [
          {
            id: 'm-6-1-desayuno',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '08:30',
            items: [
              {
                id: 'it-6-1',
                itemType: 'RECIPE',
                name: 'Huevos pochados sobre tostadas horneadas con aguacate',
                portionDescription: '2 huevos pochados + 2 tostadas horneadas + 1/3 aguacate + salsa martajada',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 380,
                proteinG: 22,
                carbsG: 28,
                fatG: 18,
              },
            ],
          },
          {
            id: 'm-6-2-colacion1',
            name: 'Colación Matutina',
            mealOrder: 2,
            suggestedTime: '11:30',
            items: [
              {
                id: 'it-6-2',
                itemType: 'FOOD',
                name: 'Manzana verde con una cucharadita de crema de almendra',
                portionDescription: '1 manzana mediana en rebanadas + 1 cdita de crema de almendra natural',
                portionQuantity: 1,
                equivalentGroupCode: 'FRUTAS',
                energyKcal: 140,
                proteinG: 3,
                carbsG: 20,
                fatG: 6,
              },
            ],
          },
          {
            id: 'm-6-3-comida',
            name: 'Comida',
            mealOrder: 3,
            suggestedTime: '14:30',
            items: [
              {
                id: 'it-6-3',
                itemType: 'RECIPE',
                name: 'Bowl de quinoa con pechuga al chipotle suave y verduras salteadas',
                portionDescription: '130g pechuga en cubos + 1/2 taza quinoa + calabacita y zanahoria al sartén',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 480,
                proteinG: 38,
                carbsG: 46,
                fatG: 12,
              },
            ],
          },
          {
            id: 'm-6-4-colacion2',
            name: 'Colación Vespertina',
            mealOrder: 4,
            suggestedTime: '17:30',
            items: [
              {
                id: 'it-6-4',
                itemType: 'FOOD',
                name: 'Barra artesanal de amaranto tostado y té verde',
                portionDescription: '1 barra de amaranto con miel de agave + taza de té verde caliente',
                portionQuantity: 1,
                equivalentGroupCode: 'CEREALES_SG',
                energyKcal: 110,
                proteinG: 3.5,
                carbsG: 18,
                fatG: 2.5,
              },
            ],
          },
          {
            id: 'm-6-5-cena',
            name: 'Cena',
            mealOrder: 5,
            suggestedTime: '20:30',
            items: [
              {
                id: 'it-6-5',
                itemType: 'RECIPE',
                name: 'Tostadas horneadas de tinga de pechuga casera con lechuga',
                portionDescription: '90g tinga de pechuga de pollo s/grasa + 2 tostadas horneadas + lechuga y salsa',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 325,
                proteinG: 27,
                carbsG: 28,
                fatG: 8,
              },
            ],
          },
        ],
      },
      {
        id: 'day-7-domingo',
        dayOfWeek: 7,
        dayName: 'Domingo',
        meals: [
          {
            id: 'm-7-1-desayuno',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '09:00',
            items: [
              {
                id: 'it-7-1',
                itemType: 'RECIPE',
                name: 'Waffles ligeros de avena con claras y frutos del bosque',
                portionDescription: '1 waffle de avena casero + 4 claras + 1/2 taza de frambuesas y canela',
                portionQuantity: 1,
                equivalentGroupCode: 'CEREALES_SG',
                energyKcal: 370,
                proteinG: 25,
                carbsG: 45,
                fatG: 7,
              },
            ],
          },
          {
            id: 'm-7-2-colacion1',
            name: 'Colación Matutina',
            mealOrder: 2,
            suggestedTime: '11:30',
            items: [
              {
                id: 'it-7-2',
                itemType: 'FOOD',
                name: 'Licuado verde détox con espinaca fresca, apio y piña natural',
                portionDescription: '1 vaso (250ml) de agua con espinaca, apio, 1 rebanada de piña y limón',
                portionQuantity: 1,
                equivalentGroupCode: 'VERDURAS',
                energyKcal: 85,
                proteinG: 2,
                carbsG: 18,
                fatG: 0.5,
              },
            ],
          },
          {
            id: 'm-7-3-comida',
            name: 'Comida',
            mealOrder: 3,
            suggestedTime: '14:30',
            items: [
              {
                id: 'it-7-3',
                itemType: 'RECIPE',
                name: 'Pechuga a las finas hierbas con verduras al vapor y frijoles de la olla',
                portionDescription: '130g pechuga con orégano y tomillo + 1/2 taza frijoles + brócoli y zanahorias baby',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 485,
                proteinG: 39,
                carbsG: 48,
                fatG: 12,
              },
            ],
          },
          {
            id: 'm-7-4-colacion2',
            name: 'Colación Vespertina',
            mealOrder: 4,
            suggestedTime: '17:30',
            items: [
              {
                id: 'it-7-4',
                itemType: 'FOOD',
                name: 'Requesón fresco campesino con 4 nueces y canela',
                portionDescription: '60g requesón bajo en sodio + 4 mitades de nuez + canela espolvoreada',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_MBA',
                energyKcal: 130,
                proteinG: 10,
                carbsG: 3,
                fatG: 8,
              },
            ],
          },
          {
            id: 'm-7-5-cena',
            name: 'Cena',
            mealOrder: 5,
            suggestedTime: '20:30',
            items: [
              {
                id: 'it-7-5',
                itemType: 'RECIPE',
                name: 'Crema ligera de calabacita con queso panela y pechuga deshebrada',
                portionDescription: '1 tazón de crema de calabacita natural s/crema + 70g pechuga + 30g queso panela en cubos',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 320,
                proteinG: 28,
                carbsG: 18,
                fatG: 10,
              },
            ],
          },
        ],
      },
    ],
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'plan-roberto-glucosa',
    organizationId: 'org-nutriluz-mexico',
    patientId: 'pat-roberto-m',
    specialistId: 'user-dra-valeria',
    title: 'Plan de Control Glucémico y Recomposición 2,100 kcal',
    goal: 'Recomposición corporal y control de glucosa',
    status: 'ACTIVE',
    startDate: '2026-08-01',
    endDate: '2026-09-01',
    targetCaloriesKcal: 2100,
    targetProteinG: 155,
    targetCarbsG: 210,
    targetFatG: 65,
    targetWaterLiters: 3.0,
    generalInstructions: 'Mantener horarios consistentes para evitar picos de insulina. Priorizar cereales de grano entero y vegetales ricos en fibra soluble.',
    hydrationInstructions: 'Meta: 3.0 Litros de agua natural al día.',
    allowedSubstitutionsPolicy: 'Intercambios libres con la tabla de equivalentes SMAE en porciones calculadas.',
    approvedBySpecialist: true,
    digitalSignatureApprovedAt: '2026-08-01T10:00:00Z',
    days: [
      {
        id: 'day-roberto-base',
        dayOfWeek: 1,
        dayName: 'Lunes a Domingo (Menú Base Clínico)',
        meals: [
          {
            id: 'm-rob-1',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '07:30',
            items: [
              {
                id: 'it-rob-1',
                itemType: 'RECIPE',
                name: 'Huevos revueltos con nopales y frijoles de la olla',
                portionDescription: '2 huevos enteros + 1 taza de nopales al vapor + 1/2 taza frijoles + 2 tortillas de maíz',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 440,
                proteinG: 28,
                carbsG: 45,
                fatG: 16,
              },
            ],
          },
          {
            id: 'm-rob-2',
            name: 'Colación Matutina',
            mealOrder: 2,
            suggestedTime: '11:00',
            items: [
              {
                id: 'it-rob-2',
                itemType: 'FOOD',
                name: 'Tazón de requesón campesino con nueces',
                portionDescription: '80g de requesón + 6 mitades de nuez de castilla + canela en polvo',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_MBA',
                energyKcal: 180,
                proteinG: 14,
                carbsG: 6,
                fatG: 11,
              },
            ],
          },
          {
            id: 'm-rob-3',
            name: 'Comida',
            mealOrder: 3,
            suggestedTime: '14:30',
            items: [
              {
                id: 'it-rob-3',
                itemType: 'RECIPE',
                name: 'Fajitas de Sirloin magro con pimientos y arroz integral',
                portionDescription: '150g de sirloin asado + 3/4 taza arroz integral al vapor + 1.5 tazas ensalada verde con 1 cdta aceite de oliva',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 560,
                proteinG: 44,
                carbsG: 52,
                fatG: 18,
              },
            ],
          },
          {
            id: 'm-rob-4',
            name: 'Colación Vespertina',
            mealOrder: 4,
            suggestedTime: '18:00',
            items: [
              {
                id: 'it-rob-4',
                itemType: 'FOOD',
                name: 'Bastones de pepino y jícama con semillas de calabaza',
                portionDescription: '1 taza de pepino y jícama con limón + 2 cdas de pepitas tostadas',
                portionQuantity: 1,
                equivalentGroupCode: 'VERDURAS',
                energyKcal: 150,
                proteinG: 7,
                carbsG: 12,
                fatG: 8,
              },
            ],
          },
          {
            id: 'm-rob-5',
            name: 'Cena',
            mealOrder: 5,
            suggestedTime: '21:00',
            items: [
              {
                id: 'it-rob-5',
                itemType: 'RECIPE',
                name: 'Tacos de lechuga con pechuga de pavo y aguacate',
                portionDescription: '120g pechuga de pavo deshebrada + 4 hojas lechuga orejona + 1/3 de aguacate Hass + salsa verde martajada',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_MBA',
                energyKcal: 380,
                proteinG: 34,
                carbsG: 10,
                fatG: 14,
              },
            ],
          },
        ],
      },
    ],
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'plan-mariana-rendimiento',
    organizationId: 'org-nutriluz-mexico',
    patientId: 'pat-mariana-t',
    specialistId: 'user-dr-carlos',
    title: 'Plan de Rendimiento Físico y Tonificación 1,850 kcal',
    goal: 'Aumento de masa muscular y definición',
    status: 'ACTIVE',
    startDate: '2026-08-01',
    endDate: '2026-08-30',
    targetCaloriesKcal: 1850,
    targetProteinG: 135,
    targetCarbsG: 195,
    targetFatG: 52,
    targetWaterLiters: 2.8,
    generalInstructions: 'Consumir el pre-entreno 45 minutos antes de la sesión de fuerza. Priorizar proteína de alta biodisponibilidad.',
    hydrationInstructions: 'Meta: 2.8 Litros diarios.',
    allowedSubstitutionsPolicy: 'Intercambios SMAE equivalentes permitidos.',
    approvedBySpecialist: true,
    digitalSignatureApprovedAt: '2026-08-01T10:00:00Z',
    days: [
      {
        id: 'day-mariana-base',
        dayOfWeek: 1,
        dayName: 'Lunes a Domingo (Menú Base Fitness)',
        meals: [
          {
            id: 'm-mar-1',
            name: 'Desayuno',
            mealOrder: 1,
            suggestedTime: '07:30',
            items: [
              {
                id: 'it-mar-1',
                itemType: 'RECIPE',
                name: 'Pancakes de avena con claras y crema de almendras',
                portionDescription: '50g harina de avena + 4 claras de huevo + 1 cda crema de almendras + 1/2 plátano rebanado',
                portionQuantity: 1,
                equivalentGroupCode: 'CEREALES_SG',
                energyKcal: 420,
                proteinG: 28,
                carbsG: 52,
                fatG: 12,
              },
            ],
          },
          {
            id: 'm-mar-2',
            name: 'Comida',
            mealOrder: 2,
            suggestedTime: '13:30',
            items: [
              {
                id: 'it-mar-2',
                itemType: 'RECIPE',
                name: 'Salmón a la plancha con quinoa y espárragos',
                portionDescription: '140g filete de salmón + 3/4 taza quinoa cocida + espárragos y calabacitas asadas con aceite de oliva',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_MA',
                energyKcal: 520,
                proteinG: 38,
                carbsG: 42,
                fatG: 18,
              },
            ],
          },
          {
            id: 'm-mar-3',
            name: 'Colación Vespertina (Post-Entreno)',
            mealOrder: 3,
            suggestedTime: '17:00',
            items: [
              {
                id: 'it-mar-3',
                itemType: 'RECIPE',
                name: 'Yogur griego con frutos rojos y chía',
                portionDescription: '170g yogur griego sin azúcar + 1 taza moras frescas + 1 cdta semillas de chía',
                portionQuantity: 1,
                equivalentGroupCode: 'LECHE_DESC',
                energyKcal: 210,
                proteinG: 19,
                carbsG: 24,
                fatG: 4,
              },
            ],
          },
          {
            id: 'm-mar-4',
            name: 'Cena',
            mealOrder: 4,
            suggestedTime: '20:30',
            items: [
              {
                id: 'it-mar-4',
                itemType: 'RECIPE',
                name: 'Omelette de claras con champiñones y tostadas horneadas',
                portionDescription: '4 claras de huevo + 1 taza champiñones salteados + 30g queso panela + 2 tostadas de maíz horneadas',
                portionQuantity: 1,
                equivalentGroupCode: 'AOA_BA',
                energyKcal: 320,
                proteinG: 27,
                carbsG: 28,
                fatG: 9,
              },
            ],
          },
        ],
      },
    ],
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
];

export const initialMealLogs: MealLog[] = [
  {
    id: 'ml-1',
    patientId: 'pat-ana-sofia',
    date: '2026-08-13',
    mealType: 'Desayuno',
    loggedAt: '2026-08-13T08:30:00Z',
    status: 'Cumplí',
    description: 'Omelette de espinaca con queso panela y 2 tortillas de maíz como indica el plan.',
    photoUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&auto=format&fit=crop&q=80',
    aiEstimatedCalories: 380,
    aiEstimatedMacros: { protein: 26, carbs: 32, fat: 15 },
    patientComment: 'Me sentí muy satisfecha con buena energía durante la mañana.',
  },
  {
    id: 'ml-2',
    patientId: 'pat-ana-sofia',
    date: '2026-08-13',
    mealType: 'Comida',
    loggedAt: '2026-08-13T14:45:00Z',
    status: 'Cumplí',
    description: 'Pechuga a la plancha con arroz integral y nopales asados con pico de gallo.',
    photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
    aiEstimatedCalories: 485,
    aiEstimatedMacros: { protein: 38, carbs: 49, fat: 13 },
  },
  {
    id: 'ml-3',
    patientId: 'pat-ana-sofia',
    date: '2026-08-12',
    mealType: 'Cena',
    loggedAt: '2026-08-12T21:00:00Z',
    status: 'Cumplí',
    description: '3 tostadas horneadas Sanissimo con atún y aguacate.',
    aiEstimatedCalories: 315,
  },
];

export const initialWaterLogs: WaterLog[] = [
  { id: 'wl-1', patientId: 'pat-ana-sofia', date: '2026-08-13', amountMl: 500, loggedAt: '2026-08-13T08:00:00Z' },
  { id: 'wl-2', patientId: 'pat-ana-sofia', date: '2026-08-13', amountMl: 500, loggedAt: '2026-08-13T11:00:00Z' },
  { id: 'wl-3', patientId: 'pat-ana-sofia', date: '2026-08-13', amountMl: 750, loggedAt: '2026-08-13T15:00:00Z' },
  { id: 'wl-4', patientId: 'pat-ana-sofia', date: '2026-08-13', amountMl: 500, loggedAt: '2026-08-13T18:00:00Z' },
];

export const initialSupplements: SupplementPrescription[] = [
  {
    id: 'sup-1',
    patientId: 'pat-ana-sofia',
    specialistId: 'user-dra-valeria',
    productName: 'Omega 3 Ultra Puro (EPA/DHA 1000mg)',
    dosage: '1 cápsula blanda',
    timing: 'Con el desayuno junto con alimentos',
    frequency: 'Diario',
    durationWeeks: 12,
    specialistInstructions: 'Para apoyo cardiovascular y optimización de sensibilidad a la insulina.',
    isActive: true,
  },
  {
    id: 'sup-2',
    patientId: 'pat-ana-sofia',
    specialistId: 'user-dra-valeria',
    productName: 'Citrato de Magnesio 400mg',
    dosage: '1 scoop o cápsula',
    timing: '30-45 minutos antes de dormir en agua tibia',
    frequency: 'Diario en las noches',
    durationWeeks: 12,
    specialistInstructions: 'Para relajación muscular y calidad de sueño profundo.',
    isActive: true,
  },
];

export const initialSupplementLogs: SupplementLog[] = [
  { id: 'supl-1', patientId: 'pat-ana-sofia', date: '2026-08-13', supplementName: 'Omega 3 Ultra Puro (EPA/DHA 1000mg)', dosage: '1 cápsula', isTaken: true, takenAt: '2026-08-13T08:35:00Z' },
  { id: 'supl-2', patientId: 'pat-ana-sofia', date: '2026-08-13', supplementName: 'Citrato de Magnesio 400mg', dosage: '400mg', isTaken: false },
];

export const initialAppointments: Appointment[] = [
  {
    id: 'app-1',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    patientId: 'pat-ana-sofia',
    patientName: 'Ana Sofía García',
    appointmentType: 'SEGUIMIENTO',
    status: 'CONFIRMADA',
    startTime: '2026-08-22T10:00:00Z',
    endTime: '2026-08-22T10:45:00Z',
    price: 850,
    currency: 'MXN',
    locationNotes: 'Consultorio 204 - Sucursal CDMX Sur',
  },
  {
    id: 'app-2',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    patientId: 'pat-roberto-m',
    patientName: 'Roberto Navarro',
    appointmentType: 'ONLINE',
    status: 'PENDIENTE',
    startTime: '2026-08-18T16:00:00Z',
    endTime: '2026-08-18T16:45:00Z',
    price: 850,
    currency: 'MXN',
    meetingLink: 'https://meet.google.com/nutriluz-valeria-roberto',
  },
  {
    id: 'app-3',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-gdl-prov',
    specialistId: 'user-dr-carlos',
    patientId: 'pat-mariana-t',
    patientName: 'Mariana Torres',
    appointmentType: 'EVALUACION',
    status: 'CONFIRMADA',
    startTime: '2026-08-26T11:00:00Z',
    endTime: '2026-08-26T12:00:00Z',
    price: 950,
    currency: 'MXN',
    locationNotes: 'Sucursal Providencia GDL',
  },
  {
    id: 'app-4',
    organizationId: 'org-nutriluz-mexico',
    branchId: 'branch-cdmx-sur',
    specialistId: 'user-dra-valeria',
    patientId: 'pat-javier-o',
    patientName: 'Javier Orozco',
    appointmentType: 'SEGUIMIENTO',
    status: 'CONFIRMADA',
    startTime: '2026-08-19T09:00:00Z',
    endTime: '2026-08-19T09:45:00Z',
    price: 850,
    currency: 'MXN',
  },
];

export const initialPayments: PaymentRecord[] = [
  {
    id: 'pay-1',
    organizationId: 'org-nutriluz-mexico',
    patientId: 'pat-ana-sofia',
    patientName: 'Ana Sofía García',
    concept: 'Paquete de Seguimiento Nutricional 3 Meses',
    amount: 2400,
    currency: 'MXN',
    status: 'PAGADO',
    paymentMethod: 'Tarjeta de Crédito (Stripe)',
    paidAt: '2026-08-01T10:30:00Z',
    invoiceRfc: 'GARA950418XYZ',
  },
  {
    id: 'pay-2',
    organizationId: 'org-nutriluz-mexico',
    patientId: 'pat-mariana-t',
    patientName: 'Mariana Torres',
    concept: 'Consulta de Evaluación Antropométrica InBody',
    amount: 950,
    currency: 'MXN',
    status: 'PAGADO',
    paymentMethod: 'Transferencia SPEI',
    paidAt: '2026-08-05T12:15:00Z',
  },
  {
    id: 'pay-3',
    organizationId: 'org-nutriluz-mexico',
    patientId: 'pat-roberto-m',
    patientName: 'Roberto Navarro',
    concept: 'Consulta Online Nutrición',
    amount: 850,
    currency: 'MXN',
    status: 'PENDIENTE',
    paymentMethod: 'Pendiente de pago (Mercado Pago)',
    paidAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'pay-4',
    organizationId: 'org-nutriluz-mexico',
    patientId: 'pat-claudia-h',
    patientName: 'Claudia Hernández',
    concept: 'Consulta de Seguimiento Quincenal',
    amount: 850,
    currency: 'MXN',
    status: 'PAGADO',
    paymentMethod: 'Terminal Clip / Tarjeta Débito',
    paidAt: '2026-08-08T13:00:00Z',
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-ana',
    senderId: 'user-dra-valeria',
    senderName: 'Dra. Valeria López',
    senderRole: 'NUTRIOLOGO',
    content: '¡Hola Ana Sofía! Vi tus registros de comida y agua de esta semana. ¡Excelente adherencia con el nuevo desayuno!',
    isRead: true,
    createdAt: '2026-08-12T16:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-ana',
    senderId: 'pat-ana-sofia',
    senderName: 'Ana Sofía García',
    senderRole: 'PACIENTE',
    content: '¡Hola Dra.! Muchas gracias. La verdad me he sentido con mucha más energía por las tardes. ¿Para la cena del sábado puedo cambiar el atún por salmón a la plancha?',
    isRead: true,
    createdAt: '2026-08-12T17:15:00Z',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-ana',
    senderId: 'user-dra-valeria',
    senderName: 'Dra. Valeria López',
    senderRole: 'NUTRIOLOGO',
    content: '¡Claro que sí! Puedes usar 120g de salmón fresco. Como aporta un poco más de grasa saludable, solo omite la porción de aguacate en esa comida.',
    isRead: false,
    createdAt: '2026-08-12T18:00:00Z',
  },
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    category: 'PACIENTE',
    title: '⚠️ Atención requerida: Paciente en riesgo',
    message: 'Diego Salazar lleva 12 días sin registrar comidas y no tiene cita futura agendada.',
    actionLink: '/pacientes/pat-diego-s',
    isRead: false,
    createdAt: '2026-08-13T09:00:00Z',
  },
  {
    id: 'notif-2',
    category: 'AGENDA',
    title: 'Próxima consulta hoy',
    message: 'Tienes consulta programada con Javier Orozco en 2 horas.',
    actionLink: '/agenda',
    isRead: false,
    createdAt: '2026-08-13T07:00:00Z',
  },
  {
    id: 'notif-3',
    category: 'IA',
    title: 'NutriCopilot AI listo',
    message: 'Se generó automáticamente el borrador de consulta para Ana Sofía García.',
    actionLink: '/nutricopilot',
    isRead: true,
    createdAt: '2026-08-12T20:00:00Z',
  },
];

export const initialExerciseRoutines: ExerciseRoutine[] = [
  {
    id: 'ex-ana-1',
    patientId: 'pat-ana-sofia',
    title: 'Rutina de Tonificación y Fuerza Funcional',
    goal: 'Preservación de masa muscular y acondicionamiento cardiovascular',
    frequencyPerWeek: 4,
    isActive: true,
    items: [
      { id: 'ex-it-1', dayLabel: 'Día 1 - Tren Inferior', exerciseName: 'Sentadillas Goblet con Mancuerna', muscleGroup: 'Pierna / Glúteo', sets: 4, reps: '12-15', restSeconds: 60, weightTarget: '10 kg' },
      { id: 'ex-it-2', dayLabel: 'Día 1 - Tren Inferior', exerciseName: 'Puente de Glúteo con Banda', muscleGroup: 'Glúteo', sets: 4, reps: '15-20', restSeconds: 45 },
      { id: 'ex-it-3', dayLabel: 'Día 1 - Tren Inferior', exerciseName: 'Desplantes Estáticos', muscleGroup: 'Cuádriceps', sets: 3, reps: '12 por pierna', restSeconds: 60 },
      { id: 'ex-it-4', dayLabel: 'Día 2 - Tren Superior & Core', exerciseName: 'Press Militar con Mancuernas', muscleGroup: 'Hombro', sets: 4, reps: '12', restSeconds: 60, weightTarget: '5 kg c/u' },
      { id: 'ex-it-5', dayLabel: 'Día 2 - Tren Superior & Core', exerciseName: 'Remo con Mancuerna a 1 brazo', muscleGroup: 'Espalda', sets: 4, reps: '12 por lado', restSeconds: 60, weightTarget: '8 kg' },
      { id: 'ex-it-6', dayLabel: 'Día 2 - Tren Superior & Core', exerciseName: 'Plancha Abdominal Frontal', muscleGroup: 'Core', sets: 3, reps: '45 segundos', restSeconds: 45 },
    ],
  },
];

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
    return this.get(STORAGE_KEYS.SPECIALISTS, initialSpecialists);
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
    if (!user || user.email === 'dra.valeria@nutriluz.mx' || user.firstName === 'Valeria') {
      const updated: UserProfile = {
        ...initialSpecialists[0],
        ...user,
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
      'dra.valeria',
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
    const raw = this.get(STORAGE_KEYS.PATIENTS, initialPatients);
    const deletedIds = new Set(this.getDeletedPatientIds());
    const filtered = deletedIds.size === 0 ? raw : raw.filter((p) => !deletedIds.has(p.id));
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
    return this.get(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
  },
  saveAppointments(apps: Appointment[]) {
    this.set(STORAGE_KEYS.APPOINTMENTS, apps);
  },

  getPayments(): PaymentRecord[] {
    return this.get(STORAGE_KEYS.PAYMENTS, initialPayments);
  },
  savePayments(pays: PaymentRecord[]) {
    this.set(STORAGE_KEYS.PAYMENTS, pays);
  },

  getMessages(): ChatMessage[] {
    return this.get(STORAGE_KEYS.MESSAGES, initialMessages);
  },
  saveMessages(msgs: ChatMessage[]) {
    this.set(STORAGE_KEYS.MESSAGES, msgs);
  },

  getNotifications(): AppNotification[] {
    return this.get(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
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

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nutriluz:db_updated', { detail: { type: 'plans_synced', patientId } }));
          window.dispatchEvent(new CustomEvent('nutriluz_plan_updated', { detail: { type: 'plans_synced', patientId } }));
        }
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

        safeDispatchEvent('nutriluz:db_updated', { type: 'plans_synced', patientId });
        safeDispatchEvent('nutriluz_plan_updated', { type: 'plans_synced', patientId });
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
    const all = this.getAppointments();
    const patient = this.getPatients().find((p) => p.id === patientId);
    const fullName = patient ? `${patient.firstName} ${patient.lastName}`.trim().toLowerCase() : '';
    return all.filter((a) => {
      if (a.patientId === patientId) return true;
      if (fullName && a.patientName) {
        const aName = a.patientName.trim().toLowerCase();
        if (aName === fullName || aName.includes(fullName) || fullName.includes(aName)) return true;
      }
      return false;
    });
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
    safeDispatchEvent('nutriluz_appointment_updated', { appointment: app });
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

