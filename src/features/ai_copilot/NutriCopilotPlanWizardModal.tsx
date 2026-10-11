import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  UserCheck,
  Scale,
  Activity,
  AlertTriangle,
  HeartPulse,
  Utensils,
  Clock,
  CheckCircle2,
  Check,
  ChevronRight,
  ChevronLeft,
  Flame,
  Info,
  Layers,
  FileText,
  ShieldCheck,
  Zap,
  RotateCcw,
  Copy,
  Download,
  BookOpen,
  Apple,
  Salad,
  Pill,
  Sliders,
  DollarSign,
  Settings,
  MoreVertical,
  Edit2,
  Trash2,
  Star,
  EyeOff,
  Plus,
  Edit3,
  Calculator,
  FlaskConical,
  FileCheck,
} from 'lucide-react';
import {
  Patient,
  NutritionPlan,
  NutritionPlanDay,
  NutritionPlanMeal,
  NutritionPlanItem,
  AnthropometricRecord,
  ClinicalRecord,
  LaboratoryResult,
} from '../../types';
import { storageService } from '../../lib/storage';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { ClinicalPreset, INITIAL_CLINICAL_PRESETS } from './prescriptionPresetsData';
import { PrescriptionTemplateEditorModal } from './PrescriptionTemplateEditorModal';
import { PrescriptionTemplatesManagerModal } from './PrescriptionTemplatesManagerModal';
import { generateScaled7DaysPlan, SEVEN_DAYS_CLINICAL_TEMPLATES } from '../planner/planPresetsGenerator';
import { ClinicalEngineSmaePanel } from './ClinicalEngineSmaePanel';

export interface NutriCopilotWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialPatientId?: string;
  onApplyPlanToPlanner?: (generatedPlanData: {
    planTitle: string;
    targetKcal: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    targetWater: number;
    generalInstructions: string;
    patientId: string;
    durationMode?: '7_DIAS' | '15_DIAS' | '30_DIAS' | '60_DIAS' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'CUSTOM';
    durationDays?: number;
    startDate?: string;
    endDate?: string;
    days?: NutritionPlanDay[];
  }) => void;
  onOpenPdfEditor?: (plan: NutritionPlan) => void;
}

export type MetabolicFormula = 'MIFFLIN' | 'HARRIS' | 'CUNNINGHAM' | 'KATCH' | 'FAO_OMS';

const COMMON_CONDITIONS = [
  'Diabetes Tipo 2',
  'Diabetes Tipo 1',
  'Resistencia a la Insulina',
  'Hipertensión Arterial',
  'Hipotiroidismo',
  'Dislipidemia (Colesterol/Triglicéridos)',
  'Síndrome de Ovario Poliquístico (SOP)',
  'Hígado Graso No Alcohólico (EHGNA)',
  'Gastritis / Reflujo Gastroesofágico',
  'Síndrome de Intestino Irritable (SII)',
  'Hiperuricemia / Gota',
  'Enfermedad Renal Crónica (Estadios 1-3)',
  'Sobrepeso / Obesidad',
];

const COMMON_ALLERGIES = [
  'Gluten / Celíaco',
  'Lactosa',
  'Proteína de Leche de Vaca (APLV)',
  'Mariscos / Pescados',
  'Frutos Secos (Nueces, Almendras)',
  'Cacahuates',
  'Huevo',
  'Soya',
  'Fresas',
  'Sulfitos',
];

export const NutriCopilotPlanWizardModal: React.FC<NutriCopilotWizardProps> = ({
  isOpen,
  onClose,
  initialPatientId,
  onApplyPlanToPlanner,
  onOpenPdfEditor,
}) => {
  const { showToast } = useToast();
  const { organization, currentUser } = useAuth();
  const [patients, setPatients] = useState<Patient[]>(() => storageService.getPatients());
  const [patientLabRecord, setPatientLabRecord] = useState<LaboratoryResult | null>(null);

  // Wizard Step: 1 = Biometrics & Goal, 2 = Clinical & Allergies, 3 = Habits & Meals, 4 = Clinical SMAE Engine, 5 = Review & AI Generate
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [overrideTargetKcal, setOverrideTargetKcal] = useState<number | null>(null);

  // Selected Patient
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    const active = storageService.getActiveClinicalPatientId();
    const all = storageService.getPatients();
    if (initialPatientId && all.some((p) => p.id === initialPatientId)) return initialPatientId;
    if (active && all.some((p) => p.id === active)) return active;
    return all[0]?.id || '';
  });
  const [patientAutoFilled, setPatientAutoFilled] = useState(false);

  // --- STEP 1: Somatometría & Perfil Biológico ---
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'F' | 'M'>('F');
  const [heightCm, setHeightCm] = useState<number>(165);
  const [weightKg, setWeightKg] = useState<number>(65);
  const [bodyFatPct, setBodyFatPct] = useState<number | ''>('');
  const [muscleMassKg, setMuscleMassKg] = useState<number | ''>('');
  const [visceralFatLevel, setVisceralFatLevel] = useState<number | ''>('');
  const [metabolicFormula, setMetabolicFormula] = useState<MetabolicFormula>('MIFFLIN');

  // --- STEP 1 (B & C): Objetivo Nutricional & Actividad Física ---
  const [goal, setGoal] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'deficit_kcal' | 'deficit_pct' | 'surplus_kcal' | 'surplus_pct' | 'maintenance'>('maintenance');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [activityLevel, setActivityLevel] = useState<'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'ATHLETE'>('MODERATE');
  const [trainingType, setTrainingType] = useState<string>('');
  const [trainingFrequencyDays, setTrainingFrequencyDays] = useState<number>(3);
  const [trainingDurationMinutes, setTrainingDurationMinutes] = useState<number>(45);

  // --- STEP 2: Condiciones Clínicas, Alergias y Fármacos ---
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState<string>('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState<string>('');
  const [medications, setMedications] = useState<string>('');

  // --- STEP 3: Hábitos, Preferencias y Estructura del Día ---
  const [durationMode, setDurationMode] = useState<'7_DIAS' | '15_DIAS' | '30_DIAS' | '60_DIAS' | 'CUSTOM'>('30_DIAS');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [customDaysInput, setCustomDaysInput] = useState<number>(30);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dietStyle, setDietStyle] = useState<string>('Omnívora Flexible');
  const [dislikedFoods, setDislikedFoods] = useState<string>('');
  const [mealsCount, setMealsCount] = useState<number>(4);
  const [budgetPrepStyle, setBudgetPrepStyle] = useState<string>('Práctica y Equilibrada');

  // --- 7-Day Multi-Menu State (Lunes a Domingo) ---
  const [varietyCounter, setVarietyCounter] = useState<number>(0);

  const patientVarietySeed = useMemo(() => {
    let h = 0;
    const str = `${selectedPatientId || 'pat'}_${goal}_${dietStyle}`;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000000;
    return h;
  }, [selectedPatientId, goal, dietStyle]);

  const [wizardDays, setWizardDays] = useState<NutritionPlanDay[]>(() =>
    generateScaled7DaysPlan(1750, 130, 170, 48, 4)
  );
  const [activeWizardDayIdx, setActiveWizardDayIdx] = useState<number>(0);
  
  // Macronutrient targeting
  const [proteinGKg, setProteinGKg] = useState<number>(1.8);
  const [carbsPct, setCarbsPct] = useState<number>(45);
  const [fatPct, setFatPct] = useState<number>(25);
  const [proteinControlMode, setProteinControlMode] = useState<'percent' | 'gkg'>('percent');
  // Manual override modes for macros
  const [macroEditMode, setMacroEditMode] = useState<'percent' | 'grams'>('percent');
  const [manualCarbsG, setManualCarbsG] = useState<number | null>(null);
  const [manualProteinG, setManualProteinG] = useState<number | null>(null);
  const [manualFatG, setManualFatG] = useState<number | null>(null);

  // --- STEP 4 & Output Generation State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlanOutput, setGeneratedPlanOutput] = useState<string | null>(null);
  const [activePresetApplied, setActivePresetApplied] = useState<string | null>(null);

  // --- RECOMENDACIONES GENERALES State ---
  const [includeGeneralRecommendations, setIncludeGeneralRecommendations] = useState(true);
  const [generalRecommendations, setGeneralRecommendations] = useState<string>(() => {
    return [
      '• Hidratación Inteligente: Beber un mínimo de 2.5 a 3.0 litros de agua natural al día distribuidos entre comidas. Evitar bebidas azucaradas, jugos y refrescos.',
      '• Horarios y Masticación: Mantener horarios consistentes para los tiempos de comida. Masticar despacio cada bocado (mínimo 20 masticaciones) para favorecer la digestión y saciedad.',
      '• Técnicas Culinarias: Priorizar preparaciones al vapor, a la plancha, asadas, al horno o en freidora de aire; erradicar frituras, capeados y empanizados.',
      '• Intercambios y Equivalencias SMAE: Para variar cualquier alimento, consultar la tabla de equivalentes del mismo grupo respetando la porción indicada.',
      '• Descanso y Sueño Reparador: Procurar 7 a 8 horas de sueño continuo para optimizar el balance metabólico, control de la grelina/leptina y regulación de la glucosa.',
    ].join('\n');
  });
  const [isGeneratingAiRecs, setIsGeneratingAiRecs] = useState(false);

  // --- Dynamic Presets Management State ---
  const [presets, setPresets] = useState<ClinicalPreset[]>(() => storageService.getPrescriptionPresets());
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [presetEditing, setPresetEditing] = useState<ClinicalPreset | null>(null);
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>('all');
  const [openMenuPresetId, setOpenMenuPresetId] = useState<string | null>(null);

  // Reload presets on sync event
  useEffect(() => {
    const handleSync = () => {
      setPresets(storageService.getPrescriptionPresets());
    };
    window.addEventListener('nutriluz:db_updated', handleSync);
    return () => window.removeEventListener('nutriluz:db_updated', handleSync);
  }, []);

  // Close card context menu on outside click
  useEffect(() => {
    const handleWindowClick = () => setOpenMenuPresetId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Calculate BMI
  const bmi = useMemo(() => {
    if (!heightCm || !weightKg) return 0;
    const hM = heightCm / 100;
    return Number((weightKg / (hM * hM)).toFixed(1));
  }, [heightCm, weightKg]);

  // Calculate PAL (Physical Activity Level Factor)
  const palFactor = useMemo(() => {
    switch (activityLevel) {
      case 'SEDENTARY': return 1.2;
      case 'LIGHT': return 1.375;
      case 'MODERATE': return 1.55;
      case 'VERY_ACTIVE': return 1.725;
      case 'ATHLETE': return 1.9;
      default: return 1.55;
    }
  }, [activityLevel]);

  // Calculate BMR (Basal Metabolic Rate) based on formula
  const calculatedBmr = useMemo(() => {
    const w = weightKg || 70;
    const h = heightCm || 165;
    const a = age || 30;
    const isFemale = gender === 'F';

    switch (metabolicFormula) {
      case 'MIFFLIN':
        // Mifflin-St Jeor: 10*w + 6.25*h - 5*age + (s ? 5 : -161)
        return Math.round(10 * w + 6.25 * h - 5 * a + (isFemale ? -161 : 5));
      case 'HARRIS':
        // Harris-Benedict revisada por Roza y Shizgal
        if (isFemale) {
          return Math.round(447.593 + 9.247 * w + 3.098 * h - 4.33 * a);
        } else {
          return Math.round(88.362 + 13.397 * w + 4.799 * h - 5.677 * a);
        }
      case 'CUNNINGHAM':
        // Cunningham: 500 + 22 * LBM (Lean Body Mass)
        if (muscleMassKg && typeof muscleMassKg === 'number') {
          const lbm = bodyFatPct ? w * (1 - Number(bodyFatPct) / 100) : muscleMassKg;
          return Math.round(500 + 22 * lbm);
        }
        // Fallback to estimation from fat pct
        const lbmEst = bodyFatPct ? w * (1 - Number(bodyFatPct) / 100) : w * (isFemale ? 0.72 : 0.82);
        return Math.round(500 + 22 * lbmEst);
      case 'KATCH':
        // Katch-McArdle: 370 + 21.6 * LBM
        const lbmK = bodyFatPct ? w * (1 - Number(bodyFatPct) / 100) : w * (isFemale ? 0.72 : 0.82);
        return Math.round(370 + 21.6 * lbmK);
      case 'FAO_OMS':
        // FAO/OMS por rangos de edad
        if (a < 30) {
          return isFemale ? Math.round(14.7 * w + 496) : Math.round(15.3 * w + 679);
        } else if (a <= 60) {
          return isFemale ? Math.round(8.7 * w + 829) : Math.round(11.6 * w + 879);
        } else {
          return isFemale ? Math.round(10.5 * w + 596) : Math.round(13.5 * w + 487);
        }
      default:
        return Math.round(10 * w + 6.25 * h - 5 * a + (isFemale ? -161 : 5));
    }
  }, [weightKg, heightCm, age, gender, metabolicFormula, bodyFatPct, muscleMassKg]);

  // Total Daily Energy Expenditure (TDEE / GET)
  const calculatedTdee = useMemo(() => {
    return Math.round(calculatedBmr * palFactor);
  }, [calculatedBmr, palFactor]);

  // Target Daily Calories with adjustment (or manual clinical engine override)
  const targetKcal = useMemo(() => {
    if (overrideTargetKcal !== null && overrideTargetKcal > 0) {
      return overrideTargetKcal;
    }
    let finalKcal = calculatedTdee;
    if (adjustmentType === 'deficit_kcal') {
      finalKcal = calculatedTdee + adjustmentValue; // adjustmentValue is negative
    } else if (adjustmentType === 'deficit_pct') {
      finalKcal = Math.round(calculatedTdee * (1 - Math.abs(adjustmentValue) / 100));
    } else if (adjustmentType === 'surplus_kcal') {
      finalKcal = calculatedTdee + Math.abs(adjustmentValue);
    } else if (adjustmentType === 'surplus_pct') {
      finalKcal = Math.round(calculatedTdee * (1 + Math.abs(adjustmentValue) / 100));
    }
    return Math.max(finalKcal, 1100); // Clinical safe minimum
  }, [calculatedTdee, adjustmentType, adjustmentValue, overrideTargetKcal]);

  // Target Macros in grams with full bidirectional manual editability
  const macroGrams = useMemo(() => {
    const w = weightKg || 70;
    
    // 1. Protein calculation
    let pG: number;
    let pPct: number;
    if (manualProteinG !== null) {
      pG = Math.max(10, manualProteinG);
      pPct = Math.round(((pG * 4) / targetKcal) * 100);
    } else {
      pG = Math.round(w * proteinGKg);
      pPct = Math.round(((pG * 4) / targetKcal) * 100);
    }
    const pKcal = pG * 4;

    // 2. Fat calculation
    let fG: number;
    let fPct = fatPct;
    if (manualFatG !== null) {
      fG = Math.max(5, manualFatG);
      fPct = Math.round(((fG * 9) / targetKcal) * 100);
    } else {
      const fKcal = Math.round(targetKcal * (fatPct / 100));
      fG = Math.round(fKcal / 9);
    }
    const fKcal = fG * 9;

    // 3. Carbs calculation
    let cG: number;
    let cPct: number;
    if (manualCarbsG !== null) {
      cG = Math.max(10, manualCarbsG);
      cPct = Math.round(((cG * 4) / targetKcal) * 100);
    } else {
      const cKcal = targetKcal - (pKcal + fKcal);
      cG = Math.max(Math.round(cKcal / 4), 10);
      cPct = Math.max(0, 100 - (pPct + fPct));
    }
    const cKcal = cG * 4;

    const totalCalculatedKcal = pKcal + fKcal + cKcal;
    const totalPct = pPct + fPct + cPct;

    return {
      proteinG: pG,
      proteinPct: pPct,
      proteinKcal: pKcal,
      fatG: fG,
      fatPct: fPct,
      fatKcal: fKcal,
      carbsG: cG,
      carbsPct: cPct,
      carbsKcal: cKcal,
      totalKcal: totalCalculatedKcal,
      totalPct: totalPct,
      waterLiters: Number((w * 0.035).toFixed(1)),
    };
  }, [weightKg, proteinGKg, fatPct, targetKcal, manualProteinG, manualFatG, manualCarbsG]);

  // Compute calculated end date for the plan
  const calculatedEndDate = useMemo(() => {
    try {
      const start = new Date(startDate || new Date().toISOString().slice(0, 10));
      const end = new Date(start.getTime() + (durationDays || 30) * 24 * 60 * 60 * 1000);
      return end.toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, [startDate, durationDays]);

  // Keep 7-day menus in sync with calculated macros, meals count and culinary variety
  useEffect(() => {
    setWizardDays((prev) => {
      // Regenerate scaled 7 days whenever targetKcal or mealsCount updates
      return generateScaled7DaysPlan(
        targetKcal,
        macroGrams.proteinG,
        macroGrams.carbsG,
        macroGrams.fatG,
        mealsCount,
        {
          dietStyle,
          varietySeed: patientVarietySeed + varietyCounter * 137,
          excludedFoods: (dislikedFoods || '').split(',').map((s) => s.trim()).filter(Boolean),
        }
      );
    });
  }, [targetKcal, mealsCount, patientVarietySeed, varietyCounter, dietStyle]);

  // Helper to adjust duration mode and days
  const handleSelectDurationMode = (mode: '7_DIAS' | '15_DIAS' | '30_DIAS' | '60_DIAS' | 'CUSTOM', customDays?: number) => {
    setDurationMode(mode);
    if (mode === '7_DIAS') {
      setDurationDays(7);
    } else if (mode === '15_DIAS') {
      setDurationDays(15);
    } else if (mode === '30_DIAS') {
      setDurationDays(30);
    } else if (mode === '60_DIAS') {
      setDurationDays(60);
    } else if (mode === 'CUSTOM') {
      const val = customDays !== undefined ? customDays : customDaysInput;
      setDurationDays(val || 30);
    }
  };

  // Helper to regenerate the 7 days with fresh culinary variety
  const handleRegenerate7Days = () => {
    const nextCounter = varietyCounter + 1;
    setVarietyCounter(nextCounter);
    const newDays = generateScaled7DaysPlan(
      targetKcal,
      macroGrams.proteinG,
      macroGrams.carbsG,
      macroGrams.fatG,
      mealsCount,
      {
        dietStyle,
        varietySeed: patientVarietySeed + nextCounter * 137 + (Date.now() % 500),
        excludedFoods: (dislikedFoods || '').split(',').map((s) => s.trim()).filter(Boolean),
      }
    );
    setWizardDays(newDays);
    showToast('Nueva Variedad Culinaria', 'Se regeneraron combinaciones y platillos completamente frescos adaptados a la meta calórica.', 'success');
  };

  // Helper to insert a colación right into the active day of the wizard
  const handleAddWizardColacion = (dayIdx: number) => {
    const updated = JSON.parse(JSON.stringify(wizardDays)) as NutritionPlanDay[];
    const targetDay = updated[dayIdx];
    if (!targetDay) return;

    const count = targetDay.meals.length;
    const isMorning = count < 4;
    const colName = isMorning ? '🍏 Colación Matutina' : '🍓 Colación Vespertina';
    const colTime = isMorning ? '11:00' : '17:30';

    targetDay.meals.push({
      id: `meal-col-${dayIdx}-${Date.now()}`,
      name: colName,
      suggestedTime: colTime,
      mealOrder: count + 1,
      items: [
        {
          id: `item-col-${Date.now()}`,
          name: isMorning ? 'Manzana verde con canela y almendras tostadas' : 'Yogur griego con moras azules y semillas de chía',
          portionDescription: isMorning ? '1 manzana verde + 12 almendras' : '1/2 taza yogur griego + 1/2 taza moras',
          portionQuantity: 1,
          energyKcal: isMorning ? 150 : 130,
          proteinG: isMorning ? 3 : 11,
          carbsG: isMorning ? 22 : 14,
          fatG: isMorning ? 7 : 2,
          itemType: 'FOOD',
        },
      ],
    });

    setWizardDays(updated);
    showToast('Colación Añadida', `Se insertó "${colName}" en ${targetDay.dayName}.`, 'success');
  };

  // Helper to replicate active day's menu to all 7 days
  const handleReplicateDayToAll = (sourceDayIdx: number) => {
    const sourceDay = wizardDays[sourceDayIdx];
    if (!sourceDay) return;

    const DAY_NAMES = [
      'Lunes (Plan Base)',
      'Martes (Plan Base)',
      'Miércoles (Plan Base)',
      'Jueves (Plan Base)',
      'Viernes (Plan Base)',
      'Sábado (Plan Base)',
      'Domingo (Plan Base)',
    ];

    const updated = wizardDays.map((d, idx) => {
      if (idx === sourceDayIdx) return d;
      return {
        ...d,
        dayName: DAY_NAMES[idx] || `Día ${idx + 1}`,
        meals: sourceDay.meals.map((m) => ({
          ...m,
          id: `m-copy-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          items: m.items.map((it) => ({
            ...it,
            id: `it-copy-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          })),
        })),
      };
    });

    setWizardDays(updated);
    showToast('Menú Replicado', `El menú de ${sourceDay.dayName.split(' ')[0]} ha sido copiado a todos los días de la semana.`, 'info');
  };

  // Helper to adjust portion quantity of an item on active day
  const handleAdjustWizardItemQty = (mealId: string, itemId: string, delta: number) => {
    setWizardDays((prevDays) => {
      const copy = [...prevDays];
      const activeDay = { ...copy[activeWizardDayIdx] };
      if (!activeDay) return prevDays;

      activeDay.meals = activeDay.meals.map((meal) => {
        if (meal.id !== mealId) return meal;
        return {
          ...meal,
          items: meal.items.map((item) => {
            if (item.id !== itemId) return item;
            const newQty = Math.max(0.25, Number(((item.portionQuantity || 1) + delta).toFixed(2)));
            const ratio = newQty / (item.portionQuantity || 1);
            return {
              ...item,
              portionQuantity: newQty,
              energyKcal: Math.round(item.energyKcal * ratio),
              proteinG: Number((item.proteinG * ratio).toFixed(1)),
              carbsG: Number((item.carbsG * ratio).toFixed(1)),
              fatG: Number((item.fatG * ratio).toFixed(1)),
            };
          }),
        };
      });

      copy[activeWizardDayIdx] = activeDay;
      return copy;
    });
  };

  // Helper to remove an item from active day
  const handleRemoveWizardItem = (mealId: string, itemId: string) => {
    setWizardDays((prevDays) => {
      const copy = [...prevDays];
      const activeDay = { ...copy[activeWizardDayIdx] };
      if (!activeDay) return prevDays;

      activeDay.meals = activeDay.meals.map((meal) => {
        if (meal.id !== mealId) return meal;
        return {
          ...meal,
          items: meal.items.filter((item) => item.id !== itemId),
        };
      });

      copy[activeWizardDayIdx] = activeDay;
      return copy;
    });
  };

  // Clinical Completeness Indicator (0-100%) & Smart Clinical Tips
  const completenessAnalysis = useMemo(() => {
    let score = 0;
    const tips: { type: 'success' | 'suggestion' | 'missing'; text: string }[] = [];

    // Check Bio & Somatometry (30 pts)
    if (age > 0 && gender && heightCm > 0 && weightKg > 0) score += 20;
    if (bodyFatPct !== '' && muscleMassKg !== '') {
      score += 10;
      tips.push({
        type: 'success',
        text: 'Composición corporal completa: Permite usar fórmulas avanzadas de masa magra (Cunningham/Katch-McArdle).',
      });
    } else {
      tips.push({
        type: 'suggestion',
        text: 'Sugerencia: Ingresar % de grasa corporal o masa muscular para calcular TMB con mayor exactitud en deportistas.',
      });
    }

    // Check Physical Activity & Training (20 pts)
    if (activityLevel) score += 10;
    if (trainingType && trainingFrequencyDays > 0) {
      score += 10;
    } else {
      tips.push({
        type: 'suggestion',
        text: 'Detallar tipo y frecuencia de ejercicio para afinar el aporte de carbohidratos peri-entrenamiento.',
      });
    }

    // Check Clinical Pathologies & Allergies (25 pts)
    if (selectedConditions.length > 0 || medications.trim()) {
      score += 15;
    }
    if (selectedConditions.includes('Resistencia a la Insulina') || selectedConditions.includes('Diabetes Tipo 2')) {
      tips.push({
        type: 'suggestion',
        text: 'Alerta Clínica: Resistencia a la Insulina detectada. NutriCopilot priorizará fibra >30g/día y bajo índice glucémico.',
      });
    }
    if (selectedConditions.includes('Hipertensión Arterial')) {
      tips.push({
        type: 'suggestion',
        text: 'Alerta Clínica: Hipertensión detectada. Se regulará sodio <1,500mg y se incrementarán fuentes de potasio.',
      });
    }
    if (selectedAllergies.length > 0) {
      score += 10;
      tips.push({
        type: 'success',
        text: `Restricciones activas: ${selectedAllergies.join(', ')}.`,
      });
    } else {
      score += 5;
    }

    // Check Diet Preferences & Macros (25 pts)
    if (dietStyle && mealsCount > 0) score += 15;
    if (dislikedFoods.trim()) score += 5;
    if (proteinGKg > 0 && fatPct > 0) score += 5;

    let gradeText = 'Datos Básicos (60%)';
    let gradeColor = 'text-amber-500';
    if (score >= 90) {
      gradeText = 'Alta Precisión Clínica (95-100%)';
      gradeColor = 'text-emerald-500';
    } else if (score >= 75) {
      gradeText = 'Buena Precisión Clínica (75-89%)';
      gradeColor = 'text-teal-500';
    }

    return { score: Math.min(score, 100), gradeText, gradeColor, tips };
  }, [
    age,
    gender,
    heightCm,
    weightKg,
    bodyFatPct,
    muscleMassKg,
    activityLevel,
    trainingType,
    trainingFrequencyDays,
    selectedConditions,
    selectedAllergies,
    medications,
    dietStyle,
    mealsCount,
    dislikedFoods,
    proteinGKg,
    fatPct,
  ]);

  // Auto-fill from patient file when patient changes (Strict: NEVER invent clinical, bioimpedance, or medical data)
  const handleAutoFillFromPatient = (patientId: string) => {
    const pat = storageService.getPatientById(patientId);
    if (!pat) return;

    setSelectedPatientId(pat.id);

    // 1. Reset base fields to clean state
    setSelectedConditions([]);
    setCustomCondition('');
    setSelectedAllergies([]);
    setCustomAllergy('');
    setMedications('');
    setDislikedFoods('');
    setTrainingType('');
    setBodyFatPct('');
    setMuscleMassKg('');
    setVisceralFatLevel('');
    setGoal(pat.goal || '');
    setAdjustmentType('maintenance');
    setAdjustmentValue(0);
    setOverrideTargetKcal(null);
    setActivePresetApplied(null);

    // 2. Biological Profile from real patient profile
    if (pat.birthDate) {
      const birthYear = new Date(pat.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - birthYear;
      if (calculatedAge > 0 && calculatedAge < 120) {
        setAge(calculatedAge);
      }
    }
    if (pat.gender) setGender(pat.gender as 'F' | 'M');
    if (pat.height) setHeightCm(pat.height);
    if (pat.currentWeight) setWeightKg(pat.currentWeight);

    // 3. Anthropometrics from REAL measurements (Bioimpedancia)
    const anthros = storageService.getAnthropometricsByPatientId(pat.id);
    if (anthros && anthros.length > 0) {
      const latest = anthros[0];
      if (latest.bodyFatPercentage !== undefined && latest.bodyFatPercentage !== null && Number(latest.bodyFatPercentage) > 0) {
        setBodyFatPct(Number(latest.bodyFatPercentage));
      }
      if (latest.muscleMassKg !== undefined && latest.muscleMassKg !== null && Number(latest.muscleMassKg) > 0) {
        setMuscleMassKg(Number(latest.muscleMassKg));
      }
      if (latest.visceralFatLevel !== undefined && latest.visceralFatLevel !== null && Number(latest.visceralFatLevel) > 0) {
        setVisceralFatLevel(Number(latest.visceralFatLevel));
      }
    }

    // 4. Medical Record & Clinical History from REAL record
    const clin = storageService.getClinicalRecordByPatientId(pat.id);
    let hasClinicalData = false;
    if (clin) {
      if (clin.pathologicalHistory?.diagnosedDiseases && Array.isArray(clin.pathologicalHistory.diagnosedDiseases) && clin.pathologicalHistory.diagnosedDiseases.length > 0) {
        setSelectedConditions([...clin.pathologicalHistory.diagnosedDiseases]);
        hasClinicalData = true;
      }
      if (clin.allergies && Array.isArray(clin.allergies) && clin.allergies.length > 0) {
        setSelectedAllergies([...clin.allergies]);
      }
      if (clin.medications && Array.isArray(clin.medications) && clin.medications.length > 0) {
        const medString = clin.medications
          .map((m) => `${m.name || ''} ${m.dose || ''}`.trim())
          .filter(Boolean)
          .join(', ');
        if (medString) {
          setMedications(medString);
          hasClinicalData = true;
        }
      }
      if (clin.dietaryHabits?.dislikedFoods && Array.isArray(clin.dietaryHabits.dislikedFoods) && clin.dietaryHabits.dislikedFoods.length > 0) {
        setDislikedFoods(clin.dietaryHabits.dislikedFoods.join(', '));
      }
      if (clin.dietaryHabits?.mealsPerDay && clin.dietaryHabits.mealsPerDay > 0) {
        setMealsCount(clin.dietaryHabits.mealsPerDay);
      }
      if (clin.dietaryHabits?.preferredDiet) {
        setDietStyle(clin.dietaryHabits.preferredDiet);
      }
      if (clin.physicalActivity) {
        if (clin.physicalActivity.activityLevel) {
          setActivityLevel(clin.physicalActivity.activityLevel as any);
        }
        if (clin.physicalActivity.exerciseType) {
          setTrainingType(clin.physicalActivity.exerciseType);
        }
        if (clin.physicalActivity.frequencyDaysPerWeek) {
          setTrainingFrequencyDays(clin.physicalActivity.frequencyDaysPerWeek);
        }
        if (clin.physicalActivity.durationMinutes) {
          setTrainingDurationMinutes(clin.physicalActivity.durationMinutes);
        }
      }
    }

    // 5. Laboratory Results / Estudios Clínicos
    const labs = storageService.getLabRecordsByPatientId(pat.id);
    const latestLab = labs && labs.length > 0 ? labs[0] : null;
    setPatientLabRecord(latestLab);

    if (latestLab) {
      const autoConds: string[] = [];
      if (latestLab.glucoseMgDl && latestLab.glucoseMgDl >= 100) {
        autoConds.push(latestLab.glucoseMgDl >= 126 ? 'Diabetes Tipo 2' : 'Resistencia a la Insulina');
      }
      if ((latestLab.triglyceridesMgDl && latestLab.triglyceridesMgDl > 150) || (latestLab.totalCholesterolMgDl && latestLab.totalCholesterolMgDl > 200)) {
        autoConds.push('Dislipidemia (Colesterol/Triglicéridos)');
      }
      if (latestLab.uricAcidMgDl && latestLab.uricAcidMgDl > 7.0) {
        autoConds.push('Hiperuricemia / Gota');
      }
      if (autoConds.length > 0) {
        setSelectedConditions((prev) => Array.from(new Set([...prev, ...autoConds])));
        hasClinicalData = true;
      }
    }

    // 6. Preload Nutrition Plan, Target Calories, and Exact 100% Macros Distribution
    const existingPlans = storageService.getPlansByPatientId(pat.id);
    const activePlan = existingPlans && existingPlans.length > 0 ? existingPlans[0] : null;
    let hasPlanData = false;

    if (activePlan) {
      if (activePlan.targetCaloriesKcal && activePlan.targetCaloriesKcal > 0) {
        setOverrideTargetKcal(activePlan.targetCaloriesKcal);
        hasPlanData = true;
      }

      if (activePlan.targetCaloriesKcal && activePlan.targetProteinG && activePlan.targetFatG && activePlan.targetCarbsG) {
        const k = activePlan.targetCaloriesKcal;
        const pG = activePlan.targetProteinG;
        const fG = activePlan.targetFatG;

        const calculatedProteinPct = Math.round(((pG * 4) / k) * 100);
        const calculatedFatPct = Math.round(((fG * 9) / k) * 100);
        const calculatedCarbsPct = Math.max(0, 100 - (calculatedProteinPct + calculatedFatPct));

        setCarbsPct(calculatedCarbsPct);
        setFatPct(calculatedFatPct);
        if (pat.currentWeight && pat.currentWeight > 0) {
          setProteinGKg(Number((pG / pat.currentWeight).toFixed(1)));
        }
      }

      if (activePlan.days && activePlan.days[0]?.meals && activePlan.days[0].meals.length > 0) {
        setMealsCount(activePlan.days[0].meals.length);
      }

      if (activePlan.generalInstructions) {
        setGeneralRecommendations(activePlan.generalInstructions);
        setIncludeGeneralRecommendations(true);
      }
    }

    // 7. Synchronize Quick Prescription Preset (Plantilla de Selección Rápida 1-Clic)
    const candidatePresetId =
      (pat as any).selectedPresetId ||
      (pat as any).presetId ||
      (clin as any)?.selectedPresetId ||
      (clin as any)?.presetId ||
      (activePlan as any)?.selectedPresetId ||
      (activePlan as any)?.presetId;

    const allPresets = storageService.getPrescriptionPresets();
    let matchedPreset: ClinicalPreset | undefined = undefined;

    if (candidatePresetId) {
      matchedPreset = allPresets.find((p) => p.id === candidatePresetId);
    }

    // Fallback: match by dietStyle or preset name in clinical record
    if (!matchedPreset && clin?.dietaryHabits?.preferredDiet) {
      matchedPreset = allPresets.find(
        (p) =>
          p.dietStyle.toLowerCase() === clin.dietaryHabits?.preferredDiet?.toLowerCase() ||
          p.name.toLowerCase().includes(clin.dietaryHabits?.preferredDiet?.toLowerCase() || '')
      );
    }

    if (matchedPreset) {
      setActivePresetApplied(matchedPreset.id);

      // If category filter is active and doesn't match, show all so doctor sees the selected preset
      if (selectedQuickCategory !== 'all' && matchedPreset.badge && selectedQuickCategory !== matchedPreset.badge) {
        setSelectedQuickCategory('all');
      }

      // If patient didn't already have overridden macros from a saved plan, sync preset parameters
      if (!hasPlanData) {
        if (matchedPreset.goal) setGoal(matchedPreset.goal);
        if (matchedPreset.caloricAdjustmentType) {
          setAdjustmentType(matchedPreset.caloricAdjustmentType);
          setAdjustmentValue(matchedPreset.adjustmentValue);
        }
        if (matchedPreset.proteinGKg) setProteinGKg(matchedPreset.proteinGKg);
        if (matchedPreset.proteinMode) setProteinControlMode(matchedPreset.proteinMode);
        if (matchedPreset.fatPct) setFatPct(matchedPreset.fatPct);
        if (matchedPreset.carbsPct) setCarbsPct(matchedPreset.carbsPct);
        if (matchedPreset.dietStyle) setDietStyle(matchedPreset.dietStyle);
        if (matchedPreset.mealsCount) setMealsCount(matchedPreset.mealsCount);
        if (matchedPreset.prepStyle) setBudgetPrepStyle(matchedPreset.prepStyle);
      }

      // Merge preset clinical recommendations if not already customized
      if (matchedPreset.recommendations && !generalRecommendations) {
        setGeneralRecommendations(matchedPreset.recommendations);
        setIncludeGeneralRecommendations(true);
      }
    } else {
      setActivePresetApplied(null);
    }

    setPatientAutoFilled(true);
    showToast(
      'Expediente Sincronizado',
      `Datos de ${pat.firstName} ${pat.lastName} sincronizados: somatometría, ${matchedPreset ? `plantilla "${matchedPreset.name}", ` : ''}${latestLab ? 'laboratorios, ' : ''}${hasPlanData ? 'meta calórica y macros (100%), ' : ''}patologías y fármacos.`,
      'success'
    );
  };

  // Trigger auto-fill on mount, modal open, or patient change
  useEffect(() => {
    if (isOpen) {
      const freshPatients = storageService.getPatients();
      setPatients(freshPatients);
      const active = storageService.getActiveClinicalPatientId();
      const patientIdToLoad = (initialPatientId && freshPatients.some((p) => p.id === initialPatientId))
        ? initialPatientId
        : (active && freshPatients.some((p) => p.id === active))
        ? active
        : selectedPatientId || freshPatients[0]?.id || '';

      if (patientIdToLoad) {
        setSelectedPatientId(patientIdToLoad);
        handleAutoFillFromPatient(patientIdToLoad);
      }
    }
  }, [isOpen, initialPatientId]);

  // Apply a Preset
  const handleApplyPreset = (preset: ClinicalPreset) => {
    setActivePresetApplied(preset.id);
    setGoal(preset.goal);
    setAdjustmentType(preset.caloricAdjustmentType);
    setAdjustmentValue(preset.adjustmentValue);
    setProteinGKg(preset.proteinGKg);
    if (preset.proteinMode) {
      setProteinControlMode(preset.proteinMode);
    }
    setFatPct(preset.fatPct);
    setCarbsPct(preset.carbsPct);
    setManualProteinG(null);
    setManualFatG(null);
    setManualCarbsG(null);
    setOverrideTargetKcal(null);
    setDietStyle(preset.dietStyle);
    setMealsCount(preset.mealsCount);
    setBudgetPrepStyle(preset.prepStyle);

    if (preset.conditions && preset.conditions.length > 0) {
      setSelectedConditions((prev) => Array.from(new Set([...prev, ...preset.conditions])));
    }
    if (preset.allergies && preset.allergies.length > 0) {
      setSelectedAllergies((prev) => Array.from(new Set([...prev, ...preset.allergies])));
    }
    if (preset.recommendations) {
      setGeneralRecommendations(preset.recommendations);
      setIncludeGeneralRecommendations(true);
    }

    // Persist preset selection on current patient
    if (selectedPatientId) {
      const currentPat = storageService.getPatientById(selectedPatientId);
      if (currentPat) {
        storageService.savePatient({
          ...currentPat,
          selectedPresetId: preset.id,
          presetId: preset.id,
        });
      }
    }

    showToast(
      'Plantilla Aplicada',
      `Se configuraron los parámetros del protocolo "${preset.name}".${preset.recommendations ? ' Incluye recomendaciones clínicas.' : ''}`,
      'info'
    );
  };

  // Preset CRUD and Action Handlers
  const handleSavePresets = (newPresets: ClinicalPreset[]) => {
    setPresets(newPresets);
    storageService.savePrescriptionPresets(newPresets);
  };

  const handleSaveSinglePreset = (preset: ClinicalPreset) => {
    const exists = presets.some((p) => p.id === preset.id);
    let updated: ClinicalPreset[];
    if (exists) {
      updated = presets.map((p) => (p.id === preset.id ? preset : p));
    } else {
      updated = [preset, ...presets];
    }
    handleSavePresets(updated);
    showToast(
      exists ? 'Plantilla Actualizada' : 'Nueva Plantilla Creada',
      `La plantilla "${preset.name}" se ha guardado exitosamente.`,
      'success'
    );
  };

  const handleResetPresets = () => {
    const restored = storageService.resetPrescriptionPresets();
    setPresets(restored);
    showToast(
      'Plantillas Restablecidas',
      'Se han recuperado las plantillas clínicas predeterminadas de fábrica.',
      'info'
    );
  };

  const handleToggleFavoritePreset = (presetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = presets.map((p) =>
      p.id === presetId ? { ...p, isFavorite: !p.isFavorite } : p
    );
    handleSavePresets(updated);
  };

  const handleDuplicatePreset = (preset: ClinicalPreset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuPresetId(null);
    const clone: ClinicalPreset = {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: `${preset.name} (Copia)`,
      isCustom: true,
      isVisibleInQuickBar: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleSavePresets([clone, ...presets]);
    showToast('Plantilla Duplicada', `Se creó una copia de "${preset.name}".`, 'success');
  };

  const handleHideFromQuickBar = (presetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuPresetId(null);
    const updated = presets.map((p) =>
      p.id === presetId ? { ...p, isVisibleInQuickBar: false } : p
    );
    handleSavePresets(updated);
    showToast('Plantilla Ocultada', 'La plantilla se ocultó de la barra de 1-Clic. Puedes volver a activarla en "⚙️ Administrar".', 'info');
  };

  const handleDeletePreset = (presetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuPresetId(null);
    const preset = presets.find((p) => p.id === presetId);
    const updated = presets.filter((p) => p.id !== presetId);
    handleSavePresets(updated);
    showToast('Plantilla Eliminada', `Se eliminó la plantilla "${preset?.name || ''}".`, 'info');
  };

  const handleOpenCreateNew = () => {
    setPresetEditing(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditPreset = (preset: ClinicalPreset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuPresetId(null);
    setPresetEditing(preset);
    setIsEditorOpen(true);
  };

  // Toggle Condition / Allergy
  const toggleCondition = (cond: string) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const addCustomCondition = () => {
    if (!customCondition.trim()) return;
    if (!selectedConditions.includes(customCondition.trim())) {
      setSelectedConditions((prev) => [...prev, customCondition.trim()]);
    }
    setCustomCondition('');
  };

  const toggleAllergy = (all: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(all) ? prev.filter((a) => a !== all) : [...prev, all]
    );
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    if (!selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies((prev) => [...prev, customAllergy.trim()]);
    }
    setCustomAllergy('');
  };

  // Run AI Generation with NutriCoPilot Gemini
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setGeneratedPlanOutput(null);

    const pat = storageService.getPatientById(selectedPatientId);
    const patientName = pat ? `${pat.firstName} ${pat.lastName}` : 'Paciente';

    const comprehensivePayload = {
      // 1. Somatometría & Perfil Biológico
      patientName,
      age,
      gender: gender === 'F' ? 'Femenino' : 'Masculino',
      height: heightCm,
      weight: weightKg,
      bmi,
      bodyFatPercentage: bodyFatPct !== '' ? bodyFatPct : undefined,
      muscleMassKg: muscleMassKg !== '' ? muscleMassKg : undefined,
      visceralFatLevel: visceralFatLevel !== '' ? visceralFatLevel : undefined,
      metabolicFormula,
      bmrCalculated: calculatedBmr,

      // 2. Objetivos & Gasto Energético
      goal,
      activityLevel,
      palFactor,
      tdeeCalculated: calculatedTdee,
      caloricAdjustment: `${adjustmentValue} (${adjustmentType})`,
      targetCalories: targetKcal,
      trainingDetails: `${trainingType} (${trainingFrequencyDays} días/semana, ${trainingDurationMinutes} min/sesión)`,

      // 3. Macronutrientes
      macroTargets: {
        protein: `${macroGrams.proteinG}g (${macroGrams.proteinPct}% | ${proteinGKg} g/kg)`,
        carbs: `${macroGrams.carbsG}g (${macroGrams.carbsPct}%)`,
        fat: `${macroGrams.fatG}g (${macroGrams.fatPct}%)`,
        waterLiters: `${macroGrams.waterLiters} L`,
      },

      // 4. Condiciones Clínicas & Restricciones
      medicalConditions: selectedConditions.join(', ') || 'Ninguna patología reportada',
      allergiesAndIntolerances: selectedAllergies.join(', ') || 'Sin alergias conocidas',
      currentMedications: medications || 'Sin fármacos',

      // 5. Hábitos y Preferencias
      dietStyle,
      dislikedFoods: dislikedFoods || 'Ninguno',
      mealsCount,
      budgetAndPrepStyle: budgetPrepStyle,
      clinicalCompletenessScore: `${completenessAnalysis.score}%`,

      // 6. Estudios Clínicos y Laboratorios Sincronizados
      laboratorySummary: patientLabRecord
        ? [
            patientLabRecord.glucoseMgDl !== undefined ? `Glucosa: ${patientLabRecord.glucoseMgDl} mg/dL` : null,
            patientLabRecord.ureaMgDl !== undefined ? `Urea: ${patientLabRecord.ureaMgDl} mg/dL` : null,
            patientLabRecord.uricAcidMgDl !== undefined ? `Ácido Úrico: ${patientLabRecord.uricAcidMgDl} mg/dL` : null,
            patientLabRecord.creatinineMgDl !== undefined ? `Creatinina: ${patientLabRecord.creatinineMgDl} mg/dL` : null,
            patientLabRecord.triglyceridesMgDl !== undefined ? `Triglicéridos: ${patientLabRecord.triglyceridesMgDl} mg/dL` : null,
            patientLabRecord.totalCholesterolMgDl !== undefined ? `Colesterol Total: ${patientLabRecord.totalCholesterolMgDl} mg/dL` : null,
            patientLabRecord.customParameters && patientLabRecord.customParameters.length > 0
              ? `Estudios Adicionales: ${patientLabRecord.customParameters.map((c) => `${c.name}: ${c.value} ${c.unit}`).join(', ')}`
              : null,
            patientLabRecord.fileName ? `Documento adjunto: ${patientLabRecord.fileName}` : null,
          ]
            .filter(Boolean)
            .join(' | ')
        : 'Sin estudios de laboratorio registrados',
    };

    try {
      const response = await aiService.queryNutriCopilot({
        action: 'draft_plan',
        payload: comprehensivePayload,
        systemContext: {
          organization: organization.name,
          specialist: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'Nutriólogo Certificado',
        },
      });

      setGeneratedPlanOutput(response.result);
      if (response.result) {
        setGeneralRecommendations(response.result.trim());
        setIncludeGeneralRecommendations(true);
      }
      setCurrentStep(4);
      showToast(
        'Plan Clínico Diseñado',
        'NutriCoPilot ha estructurado el plan nutricional con cálculo exacto de SMAE y consideraciones clínicas.',
        'success'
      );
    } catch (err: any) {
      showToast('Error', err.message || 'No se pudo generar el plan con IA', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RECOMENDACIONES GENERALES Handlers ---
  const handleResetToStandardRecommendations = () => {
    const waterL = macroGrams.waterLiters || 2.5;
    const condText = selectedConditions.length > 0 ? ` Especial atención a: ${selectedConditions.join(', ')}.` : '';
    const text = [
      `• Hidratación Inteligente: Beber un mínimo de ${waterL} litros de agua natural al día distribuidos entre comidas. Evitar bebidas azucaradas, refrescos y jugos procesados.`,
      `• Horarios y Masticación: Mantener los ${mealsCount} tiempos de comida en horarios consistentes. Dedicar al menos 20 minutos por comida y masticar pausadamente cada bocado.`,
      `• Técnicas Culinarias: Priorizar cocciones al vapor, a la plancha, asadas, al horno o en freidora de aire; erradicar frituras, capeados y empanizados.`,
      `• Intercambios y Equivalencias SMAE: Para variar cualquier alimento, consultar la tabla de equivalentes del mismo grupo respetando la porción indicada.`,
      `• Aporte de Fibra y Vegetales: Incluir al menos una porción generosa de verduras frescas o al vapor en comida y cena para regular glucosa y aportar saciedad.`,
      `• Descanso y Sueño Reparador: Procurar 7 a 8 horas de sueño continuo para optimizar el balance metabólico, control del apetito y sensibilidad a la insulina.${condText}`,
    ].join('\n');
    setGeneralRecommendations(text);
    setIncludeGeneralRecommendations(true);
    showToast('Recomendaciones Aplicadas', 'Se cargaron las pautas clínicas base con cálculo de agua para este paciente.', 'info');
  };

  const handleAppendRecommendation = (title: string, content: string) => {
    setIncludeGeneralRecommendations(true);
    if (generalRecommendations.toLowerCase().includes(title.toLowerCase())) {
      showToast('Pauta Existente', `Ya existe una recomendación de ${title}.`, 'info');
      return;
    }
    const bullet = `• ${title}: ${content}`;
    setGeneralRecommendations((prev) => {
      if (!prev || !prev.trim()) return bullet;
      return `${prev.trim()}\n${bullet}`;
    });
    showToast('Pauta Agregada', `Se añadió la recomendación de ${title}.`, 'success');
  };

  const handleGenerateAiRecommendations = async () => {
    setIsGeneratingAiRecs(true);
    const pat = storageService.getPatientById(selectedPatientId);
    const patientName = pat ? `${pat.firstName} ${pat.lastName}` : 'el paciente';

    try {
      const response = await aiService.queryNutriCopilot({
        action: 'chat',
        payload: {
          message: `Genera una lista de 5 a 6 RECOMENDACIONES GENERALES clínicas clave (en formato de viñetas estructuradas con '• Título: Pauta') para ${patientName}.
Datos clínicos:
- Objetivo: ${goal}
- Calorías meta: ${targetKcal} kcal/día (${adjustmentValue} ${adjustmentType})
- Macronutrientes: ${macroGrams.proteinG}g Proteína, ${macroGrams.carbsG}g Carbohidratos, ${macroGrams.fatG}g Grasa
- Hidratación calculada: ${macroGrams.waterLiters} Litros de agua/día
- Tiempos de comida: ${mealsCount} comidas/día
- Patologías/Condiciones: ${selectedConditions.join(', ') || 'Ninguna'}
- Alergias: ${selectedAllergies.join(', ') || 'Ninguna'}
- Fármacos: ${medications || 'Ninguno'}
- Estilo dietético: ${dietStyle}
Requisitos: Sé muy riguroso, profesional y empático. Incluye hidratación con la cantidad exacta de ${macroGrams.waterLiters}L, masticación y horarios para las ${mealsCount} comidas, técnicas culinarias cardiosaludables, intercambios SMAE y recomendaciones específicas para ${selectedConditions.join(', ') || 'su condición'}. Redacta directamente los puntos para el expediente y PDF.`,
        },
        systemContext: {
          organization: organization.name,
          specialist: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'Nutriólogo Certificado',
        },
      });

      if (response && response.result) {
        setGeneralRecommendations(response.result.trim());
        setIncludeGeneralRecommendations(true);
        showToast('Recomendaciones Generadas', 'NutriCopilot redactó las RECOMENDACIONES GENERALES con IA.', 'success');
      }
    } catch (err: any) {
      handleResetToStandardRecommendations();
    } finally {
      setIsGeneratingAiRecs(false);
    }
  };

  // Apply and Save Plan to Storage & Planner
  const handleApplyToPlanner = (openPdfEditor: boolean = false) => {
    const pat = storageService.getPatientById(selectedPatientId);
    const planTitle = `Plan ${goal} - ${selectedConditions[0] || 'NutriCoPilot AI'}`;

    const startDateStr = startDate || new Date().toISOString().slice(0, 10);
    const endDateStr = calculatedEndDate;
    const validityWeeks = Math.max(1, Math.round((durationDays || 7) / 7));

    const finalRecommendations = includeGeneralRecommendations ? generalRecommendations.trim() : '';
    const finalInstructions =
      finalRecommendations ||
      generatedPlanOutput ||
      `Objetivo: ${goal}\nDistribución: ${macroGrams.proteinG}g P | ${macroGrams.carbsG}g C | ${macroGrams.fatG}g G\nDuración del Plan: ${durationDays} Días (${validityWeeks} semanas)\nRestricciones Clínicas: ${selectedConditions.join(', ') || 'Ninguna'}\nAlergias: ${selectedAllergies.join(', ') || 'Ninguna'}\nFármacos: ${medications || 'Ninguno'}`;

    const newPlan: NutritionPlan = {
      id: `plan-copilot-${Date.now()}`,
      organizationId: organization.id,
      patientId: selectedPatientId,
      specialistId: currentUser.id,
      title: planTitle,
      goal: goal,
      durationMode: durationMode,
      durationDays: durationDays,
      validityWeeks: validityWeeks,
      targetCaloriesKcal: targetKcal,
      targetProteinG: macroGrams.proteinG,
      targetCarbsG: macroGrams.carbsG,
      targetFatG: macroGrams.fatG,
      targetWaterLiters: macroGrams.waterLiters,
      startDate: startDateStr,
      endDate: endDateStr,
      status: 'ACTIVE',
      days: wizardDays.length > 0 ? wizardDays : generateScaled7DaysPlan(targetKcal, macroGrams.proteinG, macroGrams.carbsG, macroGrams.fatG, mealsCount),
      generalInstructions: finalInstructions,
      selectedPresetId: activePresetApplied || undefined,
      presetId: activePresetApplied || undefined,
      approvedBySpecialist: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Always persist to storage
    storageService.saveNutritionPlan(newPlan);

    // Persist applied preset to patient record
    if (selectedPatientId && activePresetApplied) {
      const currentPat = storageService.getPatientById(selectedPatientId);
      if (currentPat) {
        storageService.savePatient({
          ...currentPat,
          selectedPresetId: activePresetApplied,
          presetId: activePresetApplied,
        });
      }
    }

    if (onApplyPlanToPlanner) {
      onApplyPlanToPlanner({
        planTitle: planTitle,
        targetKcal,
        targetProtein: macroGrams.proteinG,
        targetCarbs: macroGrams.carbsG,
        targetFat: macroGrams.fatG,
        targetWater: macroGrams.waterLiters,
        generalInstructions: finalInstructions,
        patientId: selectedPatientId,
        durationMode: durationMode,
        durationDays: durationDays,
        startDate: startDateStr,
        endDate: endDateStr,
        days: newPlan.days,
      });
    }

    if (openPdfEditor && onOpenPdfEditor) {
      onOpenPdfEditor(newPlan);
    }

    showToast('Plan Guardado y Asignado', `Plan nutricional de ${durationDays} días con menú diferenciado de Lunes a Domingo registrado exitosamente para ${pat ? `${pat.firstName} ${pat.lastName}` : 'el paciente'}.`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asistente de Prescripción Nutricional NutriCoPilot AI"
      maxWidth="5xl"
    >
      <div id="nutricopilot-wizard" className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* Top Header & Patient Sync Bar */}
        <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-slate-900 rounded-2xl p-4 sm:p-5 text-white border border-emerald-500/20 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  Prescripción Clínica Guiada con IA
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    SMAE & Bioimpedancia
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  NutriCoPilot calcula gasto energético, formula macronutrientes y genera el plan adaptado a patologías.
                </p>
              </div>
            </div>

            {/* Patient Selector */}
            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-700/60">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
              <div className="text-xs">
                <label className="block text-[10px] text-slate-400 font-semibold">Paciente:</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedPatientId(newId);
                    handleAutoFillFromPatient(newId);
                  }}
                  className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.firstName} {p.lastName} ({p.currentWeight} kg)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sync Badge Notification */}
          {patientAutoFilled && (
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {activePresetApplied
                  ? `Expediente vinculado: Somatometría, plantilla "${presets.find((p) => p.id === activePresetApplied)?.name || 'Seleccionada'}" y parámetros sincronizados fielmente.`
                  : selectedConditions.length > 0 || medications
                  ? 'Expediente vinculado: Somatometría y antecedentes clínicos sincronizados fielmente.'
                  : 'Expediente vinculado: Somatometría sincronizada (sin diagnósticos patológicos ni fármacos en el historial).'}
              </span>
              <button
                type="button"
                onClick={() => handleAutoFillFromPatient(selectedPatientId)}
                className="text-[11px] underline hover:text-white cursor-pointer font-semibold"
              >
                Re-sincronizar
              </button>
            </div>
          )}
        </div>

        {/* Clinical Completeness Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Indicador de Completitud Clínica:
            </span>
            <span className={`font-bold ${completenessAnalysis.gradeColor}`}>
              {completenessAnalysis.score}% • {completenessAnalysis.gradeText}
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completenessAnalysis.score}%` }}
            />
          </div>

          {/* Active Tip */}
          {completenessAnalysis.tips.length > 0 && (
            <div className="mt-2.5 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <Info className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{completenessAnalysis.tips[0].text}</span>
            </div>
          )}
        </div>

        {/* Quick Presets Carousel / Badges */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Plantillas de Prescripción Rápida (1-Clic):
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {presets.filter((p) => p.isVisibleInQuickBar !== false).length} Activas
                </span>
                {activePresetApplied && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Activa: {presets.find((p) => p.id === activePresetApplied)?.name || 'Personalizada'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Aplica macros, fórmulas y objetivos clínicos instantáneamente.
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleOpenCreateNew}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title="Crear una nueva plantilla personalizada"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Plantilla</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManagerOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Administrar visibilidad, editar o eliminar plantillas"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>⚙️ Administrar</span>
              </button>
            </div>
          </div>

          {/* Quick Bar Category Tabs */}
          {presets.some((p) => p.isVisibleInQuickBar !== false) && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedQuickCategory('all')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  selectedQuickCategory === 'all'
                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                Todas ({presets.filter((p) => p.isVisibleInQuickBar !== false).length})
              </button>
              {presets.some((p) => p.isFavorite && p.isVisibleInQuickBar !== false) && (
                <button
                  type="button"
                  onClick={() => setSelectedQuickCategory('favorites')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                    selectedQuickCategory === 'favorites'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span>Favoritas</span>
                </button>
              )}
              {Array.from(
                new Set(
                  presets
                    .filter((p) => p.isVisibleInQuickBar !== false && p.badge)
                    .map((p) => p.badge)
                )
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedQuickCategory(cat)}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedQuickCategory === cat
                      ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Cards Grid */}
          {(() => {
            const visibleList = presets
              .filter((p) => p.isVisibleInQuickBar !== false || p.id === activePresetApplied)
              .filter((p) => {
                if (p.id === activePresetApplied) return true;
                if (selectedQuickCategory === 'favorites') return Boolean(p.isFavorite);
                if (selectedQuickCategory !== 'all') return p.badge === selectedQuickCategory;
                return true;
              })
              .sort((a, b) => {
                if (a.id === activePresetApplied) return -1;
                if (b.id === activePresetApplied) return 1;
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return a.name.localeCompare(b.name);
              });

            if (visibleList.length === 0) {
              return (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-semibold">
                    No hay plantillas visibles en esta categoría o todas están ocultas de la barra de 1-Clic.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenCreateNew}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs"
                    >
                      + Crear Plantilla
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManagerOpen(true)}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs"
                    >
                      Ver Ocultas en Administrador
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {visibleList.map((preset) => {
                  const isApplied = activePresetApplied === preset.id;
                  const isMenuOpen = openMenuPresetId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2.5 rounded-2xl border text-left transition-all relative group cursor-pointer ${
                        isApplied
                          ? 'border-emerald-500 bg-emerald-50/95 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-emerald-400 hover:shadow-2xs'
                      }`}
                    >
                      {/* Top Row: Badge, Caloric adjustment, Star, Context Menu */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {isApplied && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[9px] flex items-center gap-0.5 shadow-2xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              Seleccionada
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-bold text-[10px] text-slate-700 dark:text-slate-200">
                            {preset.badge}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                              preset.caloricAdjustmentType === 'deficit_kcal' || preset.caloricAdjustmentType === 'deficit_pct'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : preset.caloricAdjustmentType === 'surplus_kcal' || preset.caloricAdjustmentType === 'surplus_pct'
                                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {preset.caloricAdjustmentType === 'maintenance'
                              ? 'Mantenimiento'
                              : `${preset.adjustmentValue > 0 ? `+${preset.adjustmentValue}` : preset.adjustmentValue} ${
                                  preset.caloricAdjustmentType.includes('pct') ? '%' : 'kcal'
                                }`}
                          </span>
                        </div>

                        {/* Top Right Quick Actions */}
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavoritePreset(preset.id, e)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              preset.isFavorite
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                                : 'text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                            title={preset.isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
                          >
                            <Star className={`w-3.5 h-3.5 ${preset.isFavorite ? 'fill-current' : ''}`} />
                          </button>

                          {/* Context Menu Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuPresetId(isMenuOpen ? null : preset.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Opciones de plantilla"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 text-xs animate-fade-in"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditPreset(preset, e)}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-semibold cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Editar parámetros</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDuplicatePreset(preset, e)}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-semibold cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Duplicar plantilla</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleHideFromQuickBar(preset.id, e)}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-semibold cursor-pointer"
                                >
                                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Ocultar de 1-Clic</span>
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePreset(preset.id, e)}
                                  className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Eliminar plantilla</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Preset Name */}
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1 mb-1">
                        {preset.name}
                      </h4>

                      {/* Macros Info */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {preset.proteinPct ? `${preset.proteinPct}% VET (${preset.proteinGKg}g/kg)` : `${preset.proteinGKg}g/kg P`}
                        </span>
                        <span>•</span>
                        <span>{preset.fatPct}% G</span>
                        <span>•</span>
                        <span>{preset.carbsPct}% C</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Stepper Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          {[
            { step: 1, label: '1. Somatometría & Objetivos', icon: Scale },
            { step: 2, label: '2. Clínica & Alergias', icon: HeartPulse },
            { step: 3, label: '3. Macros & Comidas', icon: Utensils },
            { step: 4, label: '4. Motor Clínico SMAE', icon: Calculator },
            { step: 5, label: '5. Resumen & Plan IA', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step as any)}
                className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">Paso {item.step}</span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: Somatometría, Biometría, Fórmula & Gasto Energético */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in text-xs">
            {/* Somatometry Inputs */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-500" />
                A. Somatometría y Perfil Biológico
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Edad (Años):</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Sexo Biológico:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'F' | 'M')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Estatura (cm):</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Peso Actual (kg):</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* Bioimpedance / Body Composition */}
              <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Composición Corporal (Bioimpedancia InBody):
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">IMC: {bmi} kg/m²</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">% Grasa Corporal:</label>
                    <input
                      type="number"
                      placeholder="Ej. 24"
                      value={bodyFatPct}
                      onChange={(e) => setBodyFatPct(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Masa Muscular (kg):</label>
                    <input
                      type="number"
                      placeholder="Ej. 48"
                      value={muscleMassKg}
                      onChange={(e) => setMuscleMassKg(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Nivel Grasa Visceral:</label>
                    <input
                      type="number"
                      placeholder="Ej. 4"
                      value={visceralFatLevel}
                      onChange={(e) => setVisceralFatLevel(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Formula & Energy Calculations */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                B. Fórmula Metabólica y Objetivos Energéticos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Fórmula de Gasto Energético Basal:
                  </label>
                  <select
                    value={metabolicFormula}
                    onChange={(e) => setMetabolicFormula(e.target.value as MetabolicFormula)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="MIFFLIN">Mifflin-St Jeor (Clínica / Recomendada)</option>
                    <option value="HARRIS">Harris-Benedict (Clásica)</option>
                    <option value="CUNNINGHAM">Cunningham (Basada en Masa Magra)</option>
                    <option value="KATCH">Katch-McArdle (Atletas)</option>
                    <option value="FAO_OMS">FAO / OMS / UNU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Meta Principal:</label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              {/* Adjustments & Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Ajuste Calórico (Déficit / Superávit):
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value as any)}
                      className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      <option value="deficit_kcal">Déficit (kcal fijas)</option>
                      <option value="deficit_pct">Déficit (% del GET)</option>
                      <option value="surplus_kcal">Superávit (kcal fijas)</option>
                      <option value="surplus_pct">Superávit (% del GET)</option>
                      <option value="maintenance">Mantenimiento (0 kcal)</option>
                    </select>
                    <input
                      type="number"
                      value={adjustmentValue}
                      onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Nivel de Actividad Física Cotidiana:
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="SEDENTARY">Sedentario (Oficina / Factor 1.20)</option>
                    <option value="LIGHT">Ligero (1-3 días ejercicio / Factor 1.375)</option>
                    <option value="MODERATE">Moderado (3-5 días ejercicio / Factor 1.55)</option>
                    <option value="VERY_ACTIVE">Muy Activo (6-7 días ejercicio / Factor 1.725)</option>
                    <option value="ATHLETE">Atleta de Alto Rendimiento (Factor 1.90)</option>
                  </select>
                </div>
              </div>

              {/* Specific Training */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-0.5">Entrenamiento Específico:</label>
                  <input
                    type="text"
                    value={trainingType}
                    onChange={(e) => setTrainingType(e.target.value)}
                    placeholder="Ej. Pesas + HIIT"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Frecuencia:</label>
                  <input
                    type="number"
                    value={trainingFrequencyDays}
                    onChange={(e) => setTrainingFrequencyDays(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              {/* Calculated Results Card */}
              <div className="mt-4 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-around text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Tasa Metabólica Basal</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{calculatedBmr} kcal</span>
                </div>
                <div className="h-8 w-px bg-emerald-300 dark:bg-emerald-700" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Gasto Total (GET)</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{calculatedTdee} kcal</span>
                </div>
                <div className="h-8 w-px bg-emerald-300 dark:bg-emerald-700" />
                <div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-bold block">Prescripción Meta</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{targetKcal} kcal/día</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                <span>Siguiente: Condiciones Clínicas & Alergias</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Condiciones Médicas, Alergias & Fármacos */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in text-xs">
            {/* Medical Conditions */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                D. Condiciones Médicas y Diagnósticos
              </h4>
              <p className="text-slate-500 mb-2.5">
                Selecciona las condiciones clínicas diagnosticadas para que NutriCoPilot adapte el índice glucémico, sodio, grasas y micronutrientes.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_CONDITIONS.map((cond) => {
                  const isSelected = selectedConditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-700 dark:text-rose-300 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>

              {/* Add custom condition */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar otra patología o diagnóstico clínico..."
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCondition())}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="button"
                  onClick={addCustomCondition}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl hover:bg-slate-300"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Allergies & Intolerances */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alergias e Intolerancias Alimentarias
              </h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_ALLERGIES.map((allergy) => {
                  const isSelected = selectedAllergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {allergy}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar otra alergia o intolerancia..."
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="button"
                  onClick={addCustomAllergy}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl hover:bg-slate-300"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Current Medications */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-indigo-500" />
                Fármacos y Medicamentos Actuales
              </h4>
              <p className="text-slate-500 mb-2">
                NutriCoPilot evalúa posibles interacciones fármaco-nutrimento (ej. Metformina y B12, Levotiroxina en ayuno, etc.).
              </p>
              <textarea
                rows={2}
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="Ej. Metformina 850mg (1 vez al día con la cena), Levotiroxina 50mcg (ayuno)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-sans"
              />
            </div>

            {/* Estudios Clínicos y Laboratorios Sincronizados */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/60 to-cyan-50/60 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Estudios Clínicos & Resultados de Laboratorio</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold">
                        ✓ Sincronizado
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Resultados basales del expediente que nutren el razonamiento clínico de NutriCopilot AI.
                    </p>
                  </div>
                </div>
              </div>

              {patientLabRecord ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {/* Glucosa */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Glucosa</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {patientLabRecord.glucoseMgDl !== undefined ? `${patientLabRecord.glucoseMgDl} mg/dL` : '—'}
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${
                        !patientLabRecord.glucoseMgDl ? 'text-slate-400' :
                        patientLabRecord.glucoseMgDl > 125 ? 'text-rose-600 font-black' :
                        patientLabRecord.glucoseMgDl >= 100 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {!patientLabRecord.glucoseMgDl ? 'Sin registro' :
                         patientLabRecord.glucoseMgDl > 125 ? '⚠️ Diabetes' :
                         patientLabRecord.glucoseMgDl >= 100 ? '⚠️ Prediabetes' : 'Normal (70-99)'}
                      </span>
                    </div>

                    {/* Urea */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Urea</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {patientLabRecord.ureaMgDl !== undefined ? `${patientLabRecord.ureaMgDl} mg/dL` : '—'}
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${
                        !patientLabRecord.ureaMgDl ? 'text-slate-400' :
                        patientLabRecord.ureaMgDl > 45 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {!patientLabRecord.ureaMgDl ? 'Sin registro' :
                         patientLabRecord.ureaMgDl > 45 ? '⚠️ Elevada' : 'Normal (15-45)'}
                      </span>
                    </div>

                    {/* Ácido Úrico */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Ácido Úrico</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {patientLabRecord.uricAcidMgDl !== undefined ? `${patientLabRecord.uricAcidMgDl} mg/dL` : '—'}
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${
                        !patientLabRecord.uricAcidMgDl ? 'text-slate-400' :
                        patientLabRecord.uricAcidMgDl > 7.0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {!patientLabRecord.uricAcidMgDl ? 'Sin registro' :
                         patientLabRecord.uricAcidMgDl > 7.0 ? '⚠️ Hiperuricemia' : 'Normal (<7.0)'}
                      </span>
                    </div>

                    {/* Creatinina */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Creatinina</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {patientLabRecord.creatinineMgDl !== undefined ? `${patientLabRecord.creatinineMgDl} mg/dL` : '—'}
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${
                        !patientLabRecord.creatinineMgDl ? 'text-slate-400' :
                        patientLabRecord.creatinineMgDl > 1.3 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {!patientLabRecord.creatinineMgDl ? 'Sin registro' :
                         patientLabRecord.creatinineMgDl > 1.3 ? '⚠️ Revisar FG' : 'Normal (0.6-1.2)'}
                      </span>
                    </div>

                    {/* Triglicéridos */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Triglicéridos</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {patientLabRecord.triglyceridesMgDl !== undefined ? `${patientLabRecord.triglyceridesMgDl} mg/dL` : '—'}
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${
                        !patientLabRecord.triglyceridesMgDl ? 'text-slate-400' :
                        patientLabRecord.triglyceridesMgDl > 150 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {!patientLabRecord.triglyceridesMgDl ? 'Sin registro' :
                         patientLabRecord.triglyceridesMgDl > 150 ? '⚠️ Dislipidemia' : 'Óptimo (<150)'}
                      </span>
                    </div>

                    {/* Colesterol Total */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Colesterol</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {patientLabRecord.totalCholesterolMgDl !== undefined ? `${patientLabRecord.totalCholesterolMgDl} mg/dL` : '—'}
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${
                        !patientLabRecord.totalCholesterolMgDl ? 'text-slate-400' :
                        patientLabRecord.totalCholesterolMgDl > 200 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {!patientLabRecord.totalCholesterolMgDl ? 'Sin registro' :
                         patientLabRecord.totalCholesterolMgDl > 200 ? '⚠️ Elevado' : 'Deseable (<200)'}
                      </span>
                    </div>
                  </div>

                  {/* Custom Parameters if any */}
                  {patientLabRecord.customParameters && patientLabRecord.customParameters.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {patientLabRecord.customParameters.map((cp, idx) => (
                        <div key={idx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-teal-700 dark:text-teal-400">{cp.name}:</span> {cp.value} {cp.unit}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attached file if any */}
                  {(patientLabRecord.fileName || patientLabRecord.documentUrl) && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-teal-200 dark:border-teal-800">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Documento de laboratorio adjunto: <strong>{patientLabRecord.fileName || 'Reporte de laboratorio'}</strong></span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-slate-400 text-xs">Sin estudios clínicos registrados aún en el expediente.</p>
                  <p className="text-slate-400 text-[11px]">NutriCopilot basará su propuesta en la somatometría y metas del paciente.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                <span>Siguiente: Macros & Estructura de Comidas</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Hábitos, Estructura de Comidas & Macronutrientes */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in text-xs">
            {/* Diet Style & Preferences */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-500" />
                E. Hábitos, Preferencias y Estructura del Día
              </h4>

              {/* Modalidad de Duración */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                    Duración y Vigencia del Plan Clínico:
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    {durationDays} Días • Vigente hasta {calculatedEndDate}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: '7_DIAS', days: 7, label: '📅 7 Días', desc: '1 Sem (Rotación L-D)' },
                    { id: '15_DIAS', days: 15, label: '🗓️ 15 Días', desc: 'Quincenal (2 Sem)' },
                    { id: '30_DIAS', days: 30, label: '📆 30 Días', desc: 'Mensual (4 Sem)' },
                    { id: '60_DIAS', days: 60, label: '⏳ 60 Días', desc: 'Bimestral (8 Sem)' },
                    { id: 'CUSTOM', days: customDaysInput, label: '⚙️ A Medida', desc: `${durationDays} Días` },
                  ].map((m) => {
                    const isSelected = durationMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectDurationMode(m.id as any, m.days)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs">{m.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Date range & custom days input if custom */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Fecha Inicio:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    />
                    <span className="text-[11px] font-semibold text-slate-500">→ Término:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {calculatedEndDate}
                    </span>
                  </div>

                  {durationMode === 'CUSTOM' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Días exactos:</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={customDaysInput}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setCustomDaysInput(val);
                          setDurationDays(val);
                        }}
                        className="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-emerald-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Tipo de Alimentación / Estilo Dietético:
                  </label>
                  <select
                    value={dietStyle}
                    onChange={(e) => setDietStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="Omnívora Flexible / Mediterránea">Omnívora Flexible / Mediterránea</option>
                    <option value="Vegetariana (Ovolactovegetariana)">Vegetariana (Ovolactovegetariana)</option>
                    <option value="Vegana Estricta (Plant-Based)">Vegana Estricta (Plant-Based)</option>
                    <option value="Baja en FODMAPs (Gastroprotectora)">Baja en FODMAPs (Gastroprotectora)</option>
                    <option value="Dieta DASH (Cardioprotectora)">Dieta DASH (Cardioprotectora)</option>
                    <option value="Baja en Carbohidratos / Low Carb">Baja en Carbohidratos / Low Carb</option>
                    <option value="Cetogénica Terapéutica">Cetogénica Terapéutica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Número de Tomas / Comidas al Día:
                  </label>
                  <select
                    value={mealsCount}
                    onChange={(e) => setMealsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value={3}>3 Comidas (Desayuno, Comida, Cena)</option>
                    <option value={4}>4 Comidas (Desayuno, Colación, Comida, Cena)</option>
                    <option value={5}>5 Comidas (3 Comidas + 2 Colaciones)</option>
                    <option value={6}>6 Comidas (Atletas / Fraccionado)</option>
                  </select>
                </div>
              </div>

              {/* Aversions & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Aversiones / Alimentos que no le gustan:
                  </label>
                  <input
                    type="text"
                    value={dislikedFoods}
                    onChange={(e) => setDislikedFoods(e.target.value)}
                    placeholder="Ej. Brócoli, hígado, atún enlatado, etc."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Presupuesto y Practicidad:
                  </label>
                  <select
                    value={budgetPrepStyle}
                    onChange={(e) => setBudgetPrepStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="Práctica (<25 min) y Económica">Práctica (&lt;25 min) y Económica</option>
                    <option value="Meal Prep (Preparación de fin de semana)">Meal Prep (Preparación de fin de semana)</option>
                    <option value="Recetas Gourmet / Variadas">Recetas Gourmet / Variadas</option>
                    <option value="Oficina / Tupper Transportable">Oficina / Tupper Transportable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Macronutrient Distribution Sliders & Manual Inputs */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-3">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Distribución Sugerida de Macronutrientes</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ajusta arrastrando los círculos o escribiendo manualmente la cantidad en gramos o porcentaje.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Meta: {targetKcal} kcal/día
                  </span>
                  {(manualCarbsG !== null || manualProteinG !== null || manualFatG !== null) && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualProteinG(null);
                        setManualFatG(null);
                        setManualCarbsG(null);
                        showToast('Macros restablecidos', 'Se volvió a la distribución clínica automática proporcional.', 'info');
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Auto-Equilibrar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Protein Control */}
                <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Proteína</span>
                      </span>
                      {/* Mode toggle between % VET and g/kg for protein slider */}
                      <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setProteinControlMode('percent')}
                          className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                            proteinControlMode === 'percent'
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          % VET
                        </button>
                        <button
                          type="button"
                          onClick={() => setProteinControlMode('gkg')}
                          className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                            proteinControlMode === 'gkg'
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          g/kg clínico
                        </button>
                      </div>
                      <span className="text-[10px] font-normal text-slate-400">
                        ({proteinGKg.toFixed(1)} g/kg • {macroGrams.proteinPct}% del plan)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* % VET Input for Protein */}
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">% VET:</label>
                        <input
                          type="number"
                          min="5"
                          max="60"
                          value={macroGrams.proteinPct}
                          onChange={(e) => {
                            const valPct = parseInt(e.target.value) || 0;
                            const calculatedGrams = Math.round((targetKcal * (valPct / 100)) / 4);
                            setManualProteinG(calculatedGrams);
                            const w = weightKg || 70;
                            if (w > 0) {
                              setProteinGKg(Number((calculatedGrams / w).toFixed(2)));
                            }
                          }}
                          className="w-14 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="text-[10px] font-semibold text-slate-400">%</span>
                      </div>

                      {/* g/kg Input */}
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">g/kg:</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.8"
                          max="3.5"
                          value={proteinGKg}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setProteinGKg(val);
                            setManualProteinG(null);
                          }}
                          className="w-16 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                        />
                      </div>

                      {/* Grams Input */}
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Gramos:</label>
                        <input
                          type="number"
                          min="10"
                          max="400"
                          value={macroGrams.proteinG}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setManualProteinG(val);
                            const w = weightKg || 70;
                            if (w > 0) {
                              setProteinGKg(Number((val / w).toFixed(2)));
                            }
                          }}
                          className="w-16 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="text-[10px] font-semibold text-slate-400">g</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 text-xs pl-1">
                        {macroGrams.proteinKcal} kcal
                      </span>
                    </div>
                  </div>

                  {/* Slider: either % VET or g/kg according to mode */}
                  {proteinControlMode === 'percent' ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Ajustar por Porcentaje: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{macroGrams.proteinPct}%</strong></span>
                        <span>Rango: 10% - 50% VET</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        step="1"
                        value={macroGrams.proteinPct}
                        onChange={(e) => {
                          const newPct = Number(e.target.value);
                          const calculatedGrams = Math.round((targetKcal * (newPct / 100)) / 4);
                          setManualProteinG(calculatedGrams);
                          const w = weightKg || 70;
                          if (w > 0) {
                            setProteinGKg(Number((calculatedGrams / w).toFixed(2)));
                          }
                        }}
                        className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Ajustar por g/kg de peso: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{proteinGKg.toFixed(2)} g/kg</strong></span>
                        <span>Rango: 0.8 - 3.5 g/kg</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="3.5"
                        step="0.05"
                        value={proteinGKg}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProteinGKg(val);
                          setManualProteinG(null);
                        }}
                        className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Fats Control */}
                <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Grasas Saludables</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        ({macroGrams.fatPct}% del plan)
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">% VET:</label>
                        <input
                          type="number"
                          min="10"
                          max="60"
                          value={fatPct}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setFatPct(val);
                            setManualFatG(null);
                          }}
                          className="w-14 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-amber-600 dark:text-amber-400"
                        />
                        <span className="text-[10px] font-semibold text-slate-400">%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Gramos:</label>
                        <input
                          type="number"
                          min="5"
                          max="250"
                          value={macroGrams.fatG}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setManualFatG(val);
                            if (targetKcal > 0) {
                              setFatPct(Math.round(((val * 9) / targetKcal) * 100));
                            }
                          }}
                          className="w-16 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-amber-600 dark:text-amber-400"
                        />
                        <span className="text-[10px] font-semibold text-slate-400">g</span>
                      </div>
                      <span className="font-mono font-bold text-amber-600 text-xs pl-1">
                        {macroGrams.fatKcal} kcal
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="1"
                    value={fatPct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFatPct(val);
                      setManualFatG(null);
                    }}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>

                {/* Carbs Control with Interactive Slider + Direct Manual Inputs */}
                <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <span>Carbohidratos Complejos</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        ({macroGrams.carbsPct}% • {manualCarbsG !== null ? 'Ajuste manual' : 'Residual'} )
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">% VET:</label>
                        <input
                          type="number"
                          min="5"
                          max="80"
                          value={macroGrams.carbsPct}
                          onChange={(e) => {
                            const valPct = parseInt(e.target.value) || 0;
                            const calculatedGrams = Math.round((targetKcal * (valPct / 100)) / 4);
                            setManualCarbsG(calculatedGrams);
                          }}
                          className="w-14 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-teal-600 dark:text-teal-400"
                        />
                        <span className="text-[10px] font-semibold text-slate-400">%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Gramos:</label>
                        <input
                          type="number"
                          min="10"
                          max="600"
                          value={macroGrams.carbsG}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setManualCarbsG(val);
                          }}
                          className="w-16 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-teal-600 dark:text-teal-400"
                        />
                        <span className="text-[10px] font-semibold text-slate-400">g</span>
                      </div>
                      <span className="font-mono font-bold text-teal-600 text-xs pl-1">
                        {macroGrams.carbsKcal} kcal
                      </span>
                    </div>
                  </div>
                  {/* Slider for Carbs */}
                  <input
                    type="range"
                    min="15"
                    max="75"
                    step="1"
                    value={macroGrams.carbsPct}
                    onChange={(e) => {
                      const newPct = Number(e.target.value);
                      const calculatedG = Math.round((targetKcal * (newPct / 100)) / 4);
                      setManualCarbsG(calculatedG);
                    }}
                    className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Visual Macro Percentage Breakdown Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Proteína <strong className="text-slate-700 dark:text-slate-300">{macroGrams.proteinPct}%</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span>Grasas <strong className="text-slate-700 dark:text-slate-300">{macroGrams.fatPct}%</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                    <span>Carbohidratos <strong className="text-slate-700 dark:text-slate-300">{macroGrams.carbsPct}%</strong></span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, macroGrams.proteinPct))}%` }}
                    className="bg-emerald-500 h-full transition-all duration-150"
                    title={`Proteína: ${macroGrams.proteinPct}%`}
                  />
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, macroGrams.fatPct))}%` }}
                    className="bg-amber-500 h-full transition-all duration-150"
                    title={`Grasas: ${macroGrams.fatPct}%`}
                  />
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, macroGrams.carbsPct))}%` }}
                    className="bg-teal-500 h-full transition-all duration-150"
                    title={`Carbohidratos: ${macroGrams.carbsPct}%`}
                  />
                </div>
              </div>

              {/* Total Calorie & Percentage Summary Gauge */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">
                    Suma total calculada: <strong className="text-slate-800 dark:text-white font-mono">{macroGrams.totalKcal} kcal</strong> ({macroGrams.totalPct}%)
                  </span>
                  {Math.abs(macroGrams.totalKcal - targetKcal) > 30 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium text-[10px]">
                      Δ {macroGrams.totalKcal > targetKcal ? `+${macroGrams.totalKcal - targetKcal}` : `${macroGrams.totalKcal - targetKcal}`} kcal de la meta
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>Agua estimada (35 ml/kg):</span>
                  <strong className="text-sky-600 dark:text-sky-400 font-bold">{macroGrams.waterLiters} L/día</strong>
                </div>
              </div>
              {/* Quick shortcut banner to Clinical SMAE Engine */}
              <div className="p-3.5 bg-gradient-to-r from-teal-950/40 via-emerald-950/30 to-slate-900/40 rounded-xl border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-white flex items-center gap-2">
                      Motor Clínico Algorítmico y Evaluador Antropométrico SMAE
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">
                        5 Fórmulas & Matriz SMAE
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-300">
                      Calcula con precisión estricta Harris-Benedict, Mifflin, Schofield, tabla proteica (0.8-2.0 g/kg) y exporta JSON estricto.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0 self-end sm:self-auto"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Abrir Evaluador SMAE</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>Siguiente: 4. Motor Clínico SMAE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Motor Clínico Algorítmico y Evaluador Antropométrico SMAE */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fade-in text-xs">
            {(() => {
              const activePat = storageService.getPatientById(selectedPatientId);
              const fullName = activePat ? `${activePat.firstName} ${activePat.lastName}` : 'Paciente';
              return (
                <ClinicalEngineSmaePanel
                  patientName={fullName}
                  gender={gender}
                  age={age}
                  weightKg={weightKg}
                  heightCm={heightCm}
                  activityFactor={palFactor}
                  targetKcal={targetKcal}
                  carbsPct={macroGrams.carbsPct}
                  proteinPct={macroGrams.proteinPct}
                  fatPct={macroGrams.fatPct}
                  onApplyTargetKcal={(kcal) => {
                    setOverrideTargetKcal(kcal);
                    setAdjustmentType('maintenance');
                    setAdjustmentValue(0);
                  }}
                  onApplyProteinFactor={(factor, grams) => {
                    setProteinGKg(factor);
                    setProteinControlMode('gkg');
                    setManualProteinG(grams);
                  }}
                  onApplyMacroDistribution={(dist) => {
                    setCarbsPct(Math.round(dist.hc_pct * 100));
                    setFatPct(Math.round(dist.lip_pct * 100));
                  }}
                />
              );
            })()}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior: 3. Macros & Comidas</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold cursor-pointer transition-all shadow-md"
              >
                <span>Avanzar a 5. Resumen & Plan IA</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Revisión de Resumen Clínico y Generación con NutriCoPilot */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-fade-in text-xs">
            {/* Clinical Summary Matrix */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Resumen de Parámetros Clínicos del Plan:</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    Fórmula: {metabolicFormula}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                    {durationDays} Días ({Math.round(durationDays / 7)} sem)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Paciente:</span>
                  <span className="font-bold">{storageService.getPatientById(selectedPatientId)?.firstName || 'Paciente'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Somatometría:</span>
                  <span className="font-bold">{weightKg} kg • {heightCm} cm (IMC {bmi})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Meta Calórica:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{targetKcal} kcal/día</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Distribución Macronutrientes:</span>
                  <span className="font-bold">{macroGrams.proteinG}g P • {macroGrams.carbsG}g C • {macroGrams.fatG}g G</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5 items-center justify-between text-[11px]">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Patologías & Filtros:</span>
                  {selectedConditions.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-medium text-[10px]">
                      {c}
                    </span>
                  ))}
                  {selectedAllergies.map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium text-[10px]">
                      Sin {a}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Vigencia: <span className="font-bold text-slate-700 dark:text-slate-200">{startDate} al {calculatedEndDate}</span>
                </div>
              </div>
            </div>

            {/* --- 7-Day Navigation Bar (Lunes a Domingo) & Daily Menus View --- */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-500" />
                    <span>Estructura del Menú por Días (Lunes a Domingo)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cada día cuenta con combinaciones y recetas diferenciadas escaladas a {targetKcal} kcal.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleRegenerate7Days}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-emerald-300 dark:border-emerald-800 transition-all shadow-2xs"
                    title="Generar combinaciones y recetas totalmente diferentes"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>🎲 Más Variedad de Platillos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddWizardColacion(activeWizardDayIdx)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Insertar una colación a este día"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>➕ Agregar Colación</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReplicateDayToAll(activeWizardDayIdx)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Replicar a los 7 días</span>
                  </button>
                </div>
              </div>

              {/* 7-Days Horizontal Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {wizardDays.map((day, idx) => {
                  const isSelected = activeWizardDayIdx === idx;
                  const dayKcal = day.meals.reduce(
                    (sum, m) => sum + m.items.reduce((iSum, it) => iSum + it.energyKcal, 0),
                    0
                  );
                  const dayShortLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                  const dayShort = dayShortLabels[idx] || `Día ${idx + 1}`;

                  return (
                    <button
                      key={day.id || idx}
                      type="button"
                      onClick={() => setActiveWizardDayIdx(idx)}
                      className={`flex-1 min-w-[100px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102 font-bold ring-2 ring-emerald-400/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center justify-center gap-1">
                        <span>{dayShort}</span>
                        <span className={`text-[10px] opacity-80 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          (Día {idx + 1})
                        </span>
                      </div>
                      <div className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-emerald-100 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {dayKcal} kcal
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Day Content */}
              {wizardDays[activeWizardDayIdx] && (
                <div className="space-y-3 pt-2">
                  {/* Active Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60">
                    <div>
                      <span className="font-extrabold text-sm text-emerald-950 dark:text-emerald-200">
                        {wizardDays[activeWizardDayIdx].dayName}
                      </span>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                        {wizardDays[activeWizardDayIdx].meals.length} tiempos de comida configurados para este día.
                      </p>
                    </div>
                    {(() => {
                      const activeDay = wizardDays[activeWizardDayIdx];
                      const dKcal = activeDay.meals.reduce((s, m) => s + m.items.reduce((is, it) => is + it.energyKcal, 0), 0);
                      const dP = Number(activeDay.meals.reduce((s, m) => s + m.items.reduce((is, it) => is + it.proteinG, 0), 0).toFixed(1));
                      const dC = Number(activeDay.meals.reduce((s, m) => s + m.items.reduce((is, it) => is + it.carbsG, 0), 0).toFixed(1));
                      const dF = Number(activeDay.meals.reduce((s, m) => s + m.items.reduce((is, it) => is + it.fatG, 0), 0).toFixed(1));
                      return (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-bold text-emerald-700 dark:text-emerald-300">
                            {dKcal} kcal
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            P: {dP}g
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            C: {dC}g
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            G: {dF}g
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Meals List for this Day */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {wizardDays[activeWizardDayIdx].meals.map((meal) => {
                      const mealKcal = meal.items.reduce((sum, it) => sum + it.energyKcal, 0);
                      const mealProtein = meal.items.reduce((sum, it) => sum + it.proteinG, 0).toFixed(1);

                      return (
                        <div
                          key={meal.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700 pb-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{meal.name}</span>
                              {meal.suggestedTime && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({meal.suggestedTime})
                                </span>
                              )}
                            </span>
                            <span className="font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                              {mealKcal} kcal • {mealProtein}g P
                            </span>
                          </div>

                          {/* Items */}
                          <div className="space-y-1.5">
                            {meal.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 text-[11px]"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {item.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {item.portionDescription}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                                    {item.energyKcal} kcal
                                  </span>

                                  {/* Stepper */}
                                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-slate-700">
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustWizardItemQty(meal.id, item.id, -0.25)}
                                      className="w-4 h-4 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="text-[10px] font-mono font-bold px-1">
                                      {item.portionQuantity || 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustWizardItemQty(meal.id, item.id, 0.25)}
                                      className="w-4 h-4 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveWizardItem(meal.id, item.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Quitar alimento"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* --- SECCIÓN RECOMENDACIONES GENERALES (Pautas Clínicas, Hábitos e Hidratación) --- */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        RECOMENDACIONES GENERALES
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Para el PDF y Expediente
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Pautas clínicas, hidratación, horarios, cocina y hábitos que acompañarán este plan de alimentación.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleGenerateAiRecommendations}
                    disabled={isGeneratingAiRecs || isGenerating}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                    title="NutriCopilot redacta recomendaciones personalizadas para la patología y metas de este paciente"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiRecs ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAiRecs ? 'Redactando con IA...' : '✨ Redactar con IA'}</span>
                  </button>

                  <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeGeneralRecommendations}
                      onChange={(e) => setIncludeGeneralRecommendations(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600"
                    />
                    <span>Incluir en el Plan</span>
                  </label>
                </div>
              </div>

              {includeGeneralRecommendations ? (
                <div className="space-y-3">
                  {/* Quick Preset Pills to append common clinical guidelines */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                      Agregar pauta rápida (+ clic para insertar):
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Hidratación', `Beber un mínimo de ${macroGrams.waterLiters} L de agua natural al día distribuidos a lo largo de la jornada; evitar refrescos y bebidas azucaradas.`)}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 font-medium cursor-pointer transition-colors"
                      >
                        + 💧 Agua ({macroGrams.waterLiters} L)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Horarios & Masticación', `Mantener los ${mealsCount} tiempos de comida en horarios consistentes y dedicar al menos 20 minutos por comida masticando pausadamente.`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium cursor-pointer transition-colors"
                      >
                        + ⏰ Horarios & Masticación
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Técnicas de Cocción', 'Priorizar cocción al vapor, plancha, asada, horneada o air fryer; erradicar frituras, capeados y empanizados.')}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 font-medium cursor-pointer transition-colors"
                      >
                        + 🍳 Técnicas de Cocción
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Sustituciones SMAE', 'En caso de no tener un ingrediente, sustituirlo por otro de la misma categoría de equivalentes respetando las porciones indicadas.')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-medium cursor-pointer transition-colors"
                      >
                        + 🔄 Intercambios SMAE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Verduras y Fibra', 'Acompañar comidas y cenas con abundante verdura verde o ensalada fresca para aportar fibra saciante y regular glucosa.')}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 font-medium cursor-pointer transition-colors"
                      >
                        + 🥦 Verduras & Fibra
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Actividad Física', 'Complementar este plan con un mínimo de 30-45 minutos de ejercicio diario según las metas acordadas.')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 font-medium cursor-pointer transition-colors"
                      >
                        + 🏃 Actividad Física
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Higiene de Sueño', 'Procurar 7 a 8 horas de sueño reparador continuo para optimizar el balance hormonal (leptina, grelina y cortisol).')}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 font-medium cursor-pointer transition-colors"
                      >
                        + 😴 Sueño & Recuperación
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Ultraprocesados & Sodio', 'Limitar productos empaquetados con sellos de exceso de sodio, grasas trans o azúcares añadidos.')}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-medium cursor-pointer transition-colors"
                      >
                        + 🧂 Menos Sodio/Sellos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendRecommendation('Suplementación', 'Tomar la suplementación indicada exactamente en los horarios y dosis pautadas en consulta.')}
                        className="px-2.5 py-1 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 font-medium cursor-pointer transition-colors"
                      >
                        + 💊 Suplementación
                      </button>
                    </div>
                  </div>

                  {/* Textarea for general recommendations */}
                  <div className="relative">
                    <textarea
                      rows={5}
                      value={generalRecommendations}
                      onChange={(e) => setGeneralRecommendations(e.target.value)}
                      placeholder="Escribe aquí las RECOMENDACIONES GENERALES del plan (ej. hidratación mínima, horarios, sustituciones SMAE, técnicas culinarias, suplementación o indicaciones especiales)..."
                      className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans transition-all"
                    />
                  </div>

                  {/* Bottom bar inside editor */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetToStandardRecommendations}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Restablecer plantilla clínica con cálculo exacto para este paciente"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Restablecer Pautas Base</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGeneralRecommendations('')}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-400 hover:text-rose-600 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Dejar en blanco las recomendaciones"
                      >
                        <Trash2 className="w-3 h-3 text-slate-400" />
                        <span>Limpiar</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      {generalRecommendations.trim()
                        ? `${generalRecommendations.split('\n').filter(Boolean).length} pautas registradas • ${generalRecommendations.length} caracteres`
                        : 'Sin recomendaciones redactadas'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Las <strong>RECOMENDACIONES GENERALES</strong> están desactivadas para este plan. No se incluirán en el reporte PDF.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeGeneralRecommendations(true)}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-500 cursor-pointer transition-all"
                  >
                    Activar
                  </button>
                </div>
              )}

              {/* NutriCoPilot Full Proposal Toggle if available */}
              {generatedPlanOutput && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    Propuesta Completa NutriCopilot AI (Referencia Clínica):
                  </span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-300 text-xs whitespace-pre-line max-h-40 overflow-y-auto leading-relaxed">
                    {generatedPlanOutput}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation and Apply Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a 4. Motor Clínico SMAE</span>
              </button>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyToPlanner(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-extrabold text-xs shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer transition-all"
                  title="Abrir el editor completo del PDF para meter colaciones, cambiar fotos y textos"
                >
                  <Edit3 className="w-4 h-4 text-emerald-200" />
                  <span>Editar PDF & Colaciones</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyToPlanner(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold text-xs shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aplicar Plan de {durationDays} Días al Paciente</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Template Editor Modal */}
        <PrescriptionTemplateEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setPresetEditing(null);
          }}
          presetToEdit={presetEditing}
          onSave={handleSaveSinglePreset}
        />

        {/* Prescription Templates Manager Modal */}
        <PrescriptionTemplatesManagerModal
          isOpen={isManagerOpen}
          onClose={() => setIsManagerOpen(false)}
          presets={presets}
          onSavePresets={handleSavePresets}
          onOpenCreateNew={handleOpenCreateNew}
          onOpenEdit={(p) => {
            setPresetEditing(p);
            setIsEditorOpen(true);
          }}
          onResetDefaults={handleResetPresets}
        />
      </div>
    </Modal>
  );
};
