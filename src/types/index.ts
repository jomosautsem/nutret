export type UserRole =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'ADMIN'
  | 'NUTRIOLOGO'
  | 'ASISTENTE'
  | 'ENTRENADOR'
  | 'PACIENTE';

export type PatientStatus = 'Activo' | 'Inactivo' | 'En pausa' | 'Alta';
export type RiskLevel = 'NORMAL' | 'MEDIUM_RISK' | 'HIGH_RISK';
export type AppointmentType = 'PRIMERA_CONSULTA' | 'SEGUIMIENTO' | 'EVALUACION' | 'ONLINE' | 'PRESENCIAL';
export type AppointmentStatus = 'PENDIENTE' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA' | 'NO_ASISTIO' | 'REPROGRAMADA';
export type PaymentStatus = 'PAGADO' | 'PENDIENTE' | 'CANCELADO' | 'REEMBOLSADO';
export type AdherenceStatus = 'Cumplí' | 'Parcialmente' | 'No cumplí';
export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  watermarkOpacity?: number;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  country: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  taxId?: string;
  website?: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  code?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  organizationId: string;
  branchId?: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
  professionalTitle: string;
  licenseNumber?: string; // Cédula Profesional
  specialties: string[];
  avatarUrl?: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  digitalSignatureUrl?: string;
  publicProfileEnabled: boolean;
  publicSlug: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  organizationId: string;
  branchId?: string;
  specialistId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  birthDate: string;
  gender: 'M' | 'F' | 'Otro';
  occupation?: string;
  address?: string;
  photoUrl?: string;
  goal: string;
  status: PatientStatus;
  riskLevel: RiskLevel;
  adherenceRate: number; // e.g. 88.5%
  initialWeight: number; // kg
  currentWeight: number; // kg
  targetWeight: number; // kg
  height: number; // cm
  lastConsultationDate?: string;
  nextConsultationDate?: string;
  notes?: string;
  allergies?: string;
  pathologies?: string;
  portalAccessEnabled?: boolean;
  portalUsername?: string;
  portalPassword?: string;
  portalLastLogin?: string;
  assignedRecipeIds?: string[]; // IDs de recetas asignadas específicamente al paciente
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  specialistId?: string;
  familyHistory?: {
    diabetes: boolean;
    hypertension: boolean;
    cancer: boolean;
    cardiovascular: boolean;
    thyroid: boolean;
    notes?: string;
  };
  pathologicalHistory?: {
    diagnosedDiseases: string[];
    previousTreatments?: string;
    surgeries: string[];
  };
  allergies?: string[];
  medications?: Array<{
    name: string;
    dose: string;
    frequency: string;
  }>;
  lifestyleHabits?: {
    sleepHours: number;
    sleepQuality: string;
    smoking: boolean;
    alcohol: string;
    stressLevel: string;
    waterDailyLiters: number;
  };
  physicalActivity?: {
    activityLevel: string;
    exerciseType: string;
    frequencyDaysPerWeek: number;
    durationMinutes: number;
  };
  dietaryHabits?: {
    mealsPerDay: number;
    preferredFoods: string[];
    dislikedFoods: string[];
    eatingOutFrequency: string;
    bingeEating: boolean;
    preferredDiet?: string;
  };
  recall24h?: string;
  recall24hAiAnalysis?: any;
  clinicalGoals?: string;
  clinicalObservations?: string;
  customFields?: Record<string, any>;
  isCustomized?: boolean;
  updatedAt: string;
}

export interface AnthropometricRecord {
  id: string;
  patientId: string;
  date: string;
  weight: number; // kg
  height: number; // cm
  bmi: number;
  bodyFatPercentage?: number;
  fatMassKg?: number;
  muscleMassKg?: number;
  boneMassKg?: number;
  bodyWaterPercentage?: number;
  visceralFatLevel?: number;
  basalMetabolicRateKcal?: number;
  metabolicAge?: number;
  waistCircumference?: number; // cm
  hipCircumference?: number; // cm
  waistHipRatio?: number;
  chestCircumference?: number;
  relaxedArmCircumference?: number;
  contractedArmCircumference?: number;
  thighCircumference?: number;
  calfCircumference?: number;
  neckCircumference?: number;
  measurementDevice?: string;
  notes?: string;
}

export interface LaboratoryResult {
  id: string;
  patientId: string;
  testDate: string;
  laboratoryName?: string;
  glucoseMgDl?: number;
  hba1cPercentage?: number;
  totalCholesterolMgDl?: number;
  hdlCholesterolMgDl?: number;
  ldlCholesterolMgDl?: number;
  triglyceridesMgDl?: number;
  uricAcidMgDl?: number;
  creatinineMgDl?: number;
  ureaMgDl?: number;
  tgoAstUL?: number;
  tgpAltUL?: number;
  hemoglobinGDl?: number;
  tshUiuMl?: number;
  vitaminDNgMl?: number;
  customParameters?: Array<{
    name: string;
    value: string;
    unit: string;
    refRange: string;
  }>;
  documentUrl?: string;
  fileName?: string;
  fileData?: string;
  aiAnalysisSummary?: string;
  specialistInterpretation?: string;
}

export interface FoodEquivalentGroup {
  id: string;
  name: string;
  code: string;
  colorHex: string;
  avgEnergyKcal: number;
  avgProteinG: number;
  avgCarbsG: number;
  avgFatG: number;
  description?: string;
}

export interface Food {
  id: string;
  organizationId?: string;
  categoryId?: string;
  equivalentGroupId?: string;
  equivalentGroupCode?: string;
  name: string;
  brand?: string;
  servingSize: string; // e.g. '1 taza', '100g'
  servingWeightG: number;
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  glycemicIndex?: 'Bajo' | 'Medio' | 'Alto';
  isCustom?: boolean;
}

export interface Recipe {
  id: string;
  organizationId?: string;
  name: string;
  description: string;
  photoUrl: string;
  category: 'Desayuno' | 'Comida' | 'Cena' | 'Colación' | 'Pre-entreno' | 'Post-entreno' | 'Bebidas';
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'Fácil' | 'Media' | 'Avanzada';
  servings: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  tags: string[];
  ingredients: Array<{
    id: string;
    foodName: string;
    amount: number;
    unit: string;
    equivalentGroupName?: string;
    gramWeight?: number;
    prepState?: string;
    isSeasoning?: boolean;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    timerMinutes?: number;
  }>;
}

export interface NutritionPlanItem {
  id: string;
  itemType: 'FOOD' | 'RECIPE' | 'EQUIVALENT_GROUP';
  name: string;
  portionDescription: string;
  portionQuantity: number;
  equivalentGroupCode?: string;
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  preparationTip?: string;
  interchangeOptions?: string[];
}

export interface NutritionPlanMeal {
  id: string;
  name: string; // 'Desayuno', 'Colación 1', 'Comida', 'Colación 2', 'Cena'
  mealOrder: number;
  suggestedTime?: string;
  items: NutritionPlanItem[];
  notes?: string;
}

export interface NutritionPlanDay {
  id: string;
  dayOfWeek: number; // 1 = Lunes, 7 = Domingo (or 0 for generic day)
  dayName: string;
  meals: NutritionPlanMeal[];
  notes?: string;
}

export interface NutritionPlan {
  id: string;
  organizationId: string;
  patientId: string;
  specialistId: string;
  title: string;
  goal: string;
  status: PlanStatus;
  durationMode?: '7_DIAS' | '15_DIAS' | '30_DIAS' | '60_DIAS' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'CUSTOM';
  durationDays?: number;
  validityWeeks?: number;
  startDate: string;
  endDate?: string;
  targetCaloriesKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetWaterLiters: number;
  days: NutritionPlanDay[];
  generalInstructions?: string;
  hydrationInstructions?: string;
  allowedSubstitutionsPolicy?: string;
  approvedBySpecialist: boolean;
  digitalSignatureApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealLog {
  id: string;
  patientId: string;
  date: string;
  mealType: string;
  loggedAt: string;
  status: AdherenceStatus;
  description?: string;
  photoUrl?: string;
  aiEstimatedCalories?: number;
  aiEstimatedMacros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  patientComment?: string;
  specialistFeedback?: string;
}

export interface WaterLog {
  id: string;
  patientId: string;
  date: string;
  amountMl: number;
  loggedAt: string;
}

export interface SupplementPrescription {
  id: string;
  patientId: string;
  specialistId: string;
  productName: string;
  dosage: string;
  timing: string;
  frequency: string;
  durationWeeks: number;
  specialistInstructions?: string;
  isActive: boolean;
}

export interface SupplementLog {
  id: string;
  patientId: string;
  date: string;
  supplementName: string;
  dosage: string;
  isTaken: boolean;
  takenAt?: string;
}

export interface ProgressPhoto {
  id: string;
  patientId: string;
  date: string;
  poseType: 'FRONT' | 'SIDE' | 'BACK';
  photoUrl: string;
  weightAtPhoto?: number;
  bodyFatAtPhoto?: number;
  notes?: string;
}

export interface ExerciseItem {
  id: string;
  dayLabel: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  weightTarget?: string;
  notes?: string;
}

export interface ExerciseRoutine {
  id: string;
  patientId: string;
  title: string;
  goal?: string;
  frequencyPerWeek: number;
  items: ExerciseItem[];
  isActive: boolean;
}

export interface Appointment {
  id: string;
  organizationId: string;
  branchId?: string;
  specialistId: string;
  patientId: string;
  patientName: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  price: number;
  currency: string;
  meetingLink?: string;
  locationNotes?: string;
  consultationSummary?: string;
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  patientId: string;
  patientName: string;
  concept: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  paidAt: string;
  invoiceRfc?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
  isRead: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  category: 'PACIENTE' | 'AGENDA' | 'PAGOS' | 'IA' | 'SISTEMA';
  title: string;
  message: string;
  actionLink?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  title: string;
  documentType: 'PLAN_NUTRICIONAL_PDF' | 'CONSENTIMIENTO_INFORMADO' | 'RESUMEN_CONSULTA' | 'EVOLUCION';
  createdAt: string;
  isSignedByPatient: boolean;
  isApprovedBySpecialist: boolean;
}

// Aliases for seamless feature integration
export type FoodItem = Food;
export type SmaeGroup = FoodEquivalentGroup;
export type MealItem = NutritionPlanItem;
export type PlanMeal = NutritionPlanMeal;
export type PlanDay = NutritionPlanDay;
export type LabRecord = LaboratoryResult;
export type Payment = PaymentRecord;
