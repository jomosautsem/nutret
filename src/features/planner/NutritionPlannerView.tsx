import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Sparkles,
  Download,
  Copy,
  Trash2,
  Save,
  CheckCircle2,
  Scale,
  Calendar,
  Layers,
  ArrowRight,
  Flame,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  Sliders,
  ShoppingCart,
  Edit3,
  Check,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  HelpCircle,
  Camera,
} from 'lucide-react';
import { NutritionPlan, Patient, FoodItem, MealItem, PlanMeal, PlanDay, NutritionPlanDay } from '../../types';
import { storageService } from '../../lib/storage';
import { aiService } from '../../services/aiService';
import { pdfService } from '../../lib/pdf';
import { isMobileOrAndroid } from '../../lib/pdfDelivery';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { NutriCopilotPlanWizardModal } from '../ai_copilot/NutriCopilotPlanWizardModal';
import { ExecutivePdfExportModal } from '../../components/ExecutivePdfExportModal';
import { generateScaled7DaysPlan } from './planPresetsGenerator';

const DEFAULT_DAYS_SEMANAL: NutritionPlanDay[] = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
].map((dayName, idx) => ({
  id: `day-${idx + 1}-${Date.now()}`,
  dayOfWeek: idx + 1,
  dayName: `${dayName}`,
  meals: [
    {
      id: `meal-1-${idx}`,
      name: 'Desayuno',
      suggestedTime: '08:30',
      mealOrder: 1,
      items: [
        { id: `i-1-${idx}`, itemType: 'FOOD', portionQuantity: 2, name: 'Huevos enteros al gusto', portionDescription: '2 piezas', energyKcal: 155, proteinG: 13, fatG: 10, carbsG: 1 },
        { id: `i-2-${idx}`, itemType: 'FOOD', portionQuantity: 2, name: 'Tortillas de maíz nixtamalizado', portionDescription: '2 piezas', energyKcal: 130, proteinG: 3, fatG: 1, carbsG: 28 },
        { id: `i-3-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Aguacate Hass', portionDescription: '1/3 pieza (35g)', energyKcal: 50, proteinG: 0.5, fatG: 5, carbsG: 1.5 },
      ],
    },
    {
      id: `meal-2-${idx}`,
      name: 'Colación Matutina',
      suggestedTime: '11:30',
      mealOrder: 2,
      items: [
        { id: `i-4-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Manzana verde', portionDescription: '1 pieza mediana', energyKcal: 72, proteinG: 0.3, fatG: 0.2, carbsG: 19 },
        { id: `i-5-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Almendras naturales', portionDescription: '12 piezas (15g)', energyKcal: 85, proteinG: 3, fatG: 7, carbsG: 3 },
      ],
    },
    {
      id: `meal-3-${idx}`,
      name: 'Comida',
      suggestedTime: '14:30',
      mealOrder: 3,
      items: [
        { id: `i-6-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Pechuga de pollo a la plancha', portionDescription: '140 g cocida', energyKcal: 210, proteinG: 42, fatG: 4, carbsG: 0 },
        { id: `i-7-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Arroz integral al vapor', portionDescription: '3/4 taza cocido', energyKcal: 150, proteinG: 3, fatG: 1, carbsG: 32 },
        { id: `i-8-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Frijoles negros de la olla', portionDescription: '1/2 taza', energyKcal: 110, proteinG: 7, fatG: 0.5, carbsG: 20 },
        { id: `i-9-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Ensalada mixta con aceite de oliva', portionDescription: 'Abundante', energyKcal: 55, proteinG: 1, fatG: 5, carbsG: 2 },
      ],
    },
    {
      id: `meal-4-${idx}`,
      name: 'Cena',
      suggestedTime: '20:30',
      mealOrder: 4,
      items: [
        { id: `i-10-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Atún en agua con verduras', portionDescription: '1 lata (120g)', energyKcal: 120, proteinG: 28, fatG: 1, carbsG: 0 },
        { id: `i-11-${idx}`, itemType: 'FOOD', portionQuantity: 2, name: 'Tostadas horneadas de maíz', portionDescription: '2 piezas', energyKcal: 60, proteinG: 1.5, fatG: 0.5, carbsG: 12 },
        { id: `i-12-${idx}`, itemType: 'FOOD', portionQuantity: 1, name: 'Guacamole fresco', portionDescription: '2 cdas (30g)', energyKcal: 45, proteinG: 0.5, fatG: 4.5, carbsG: 1 },
      ],
    },
  ],
}));

export const NutritionPlannerView: React.FC = () => {
  const { organization, currentUser } = useAuth();
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>(() => storageService.getPatients());
  const foods = storageService.getFoods();
  const recipes = storageService.getRecipes();

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isExecutiveExportModalOpen, setIsExecutiveExportModalOpen] = useState(false);
  const [exportInitialPhotoOpen, setExportInitialPhotoOpen] = useState(false);
  const [exportInitialDay, setExportInitialDay] = useState(0);
  const [exportInitialTab, setExportInitialTab] = useState<'download' | 'editor' | 'photos'>('download');

  // Selected Patient
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => storageService.getPatients()[0]?.id || '');
  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Energy Calculation State (Mifflin-St Jeor)
  const [calcFormula, setCalcFormula] = useState<'MIFFLIN' | 'HARRIS' | 'KATCH'>('MIFFLIN');
  const [activityFactor, setActivityFactor] = useState<number>(1.4); // Moderada
  const [caloricAdjustment, setCaloricAdjustment] = useState<number>(-400); // Déficit

  // Duration & Period State (7_DIAS | 15_DIAS | 30_DIAS | 60_DIAS | SEMANAL | QUINCENAL | MENSUAL | CUSTOM)
  const [durationMode, setDurationMode] = useState<'7_DIAS' | '15_DIAS' | '30_DIAS' | '60_DIAS' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'CUSTOM'>('7_DIAS');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  // Active Plan draft state
  const [planName, setPlanName] = useState('Plan Recomposición Corporal & Pérdida de Grasa');
  const [targetKcal, setTargetKcal] = useState(1750);
  const [targetProtein, setTargetProtein] = useState(130);
  const [targetCarbs, setTargetCarbs] = useState(170);
  const [targetFat, setTargetFat] = useState(48);
  const [targetWater, setTargetWater] = useState(2.5);
  const [generalInstructions, setGeneralInstructions] = useState(
    '1. Priorizar agua natural sobre cualquier otra bebida.\n2. No saltar el desayuno para mantener niveles de energía estables.\n3. Puedes realizar intercambios de alimentos utilizando las equivalencias SMAE indicadas.'
  );

  // Days list state
  const [days, setDays] = useState<NutritionPlanDay[]>(DEFAULT_DAYS_SEMANAL);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Selected Meal for adding food & search
  const [selectedMealForFood, setSelectedMealForFood] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('ALL');

  // Modals for editing Day and Meal
  const [isEditDayModalOpen, setIsEditDayModalOpen] = useState(false);
  const [dayNameEdit, setDayNameEdit] = useState('');
  const [isCloneDayModalOpen, setIsCloneDayModalOpen] = useState(false);
  const [targetCloneDays, setTargetCloneDays] = useState<number[]>([]);

  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealNameEdit, setMealNameEdit] = useState('');
  const [mealTimeEdit, setMealTimeEdit] = useState('');

  // Custom Food Item Modal
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customServing, setCustomServing] = useState('1 porción');
  const [customKcal, setCustomKcal] = useState(150);
  const [customProt, setCustomProt] = useState(10);
  const [customCarb, setCustomCarb] = useState(15);
  const [customFat, setCustomFat] = useState(5);

  // AI State
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Auto calculate EndDate when DurationMode or StartDate changes
  const handleDurationChange = (mode: '7_DIAS' | '15_DIAS' | '30_DIAS' | '60_DIAS' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'CUSTOM') => {
    setDurationMode(mode as any);
    const start = new Date(startDate || new Date().toISOString().slice(0, 10));
    let daysToAdd = 7;
    if (mode === '15_DIAS' || mode === 'QUINCENAL') daysToAdd = 15;
    if (mode === '30_DIAS' || mode === 'MENSUAL') daysToAdd = 30;
    if (mode === '60_DIAS') daysToAdd = 60;

    const end = new Date(start);
    end.setDate(end.getDate() + daysToAdd);
    setEndDate(end.toISOString().slice(0, 10));
    showToast(
      `Vigencia del Plan Actualizada`,
      `Configurado para ${daysToAdd} días (Vigente hasta ${end.toISOString().slice(0, 10)}).`,
      'info'
    );
  };

  // Preset Generation for Days
  const handleGenerateDaysPreset = (type: 'SEMANAL_7' | 'SEMANAL_7_DISTINCT' | 'QUINCENAL_2W' | 'MENSUAL_4W' | 'SINGLE_BASE') => {
    const currentMeals = days[activeDayIdx]?.meals || DEFAULT_DAYS_SEMANAL[0].meals;

    if (type === 'SEMANAL_7_DISTINCT') {
      const scaled7 = generateScaled7DaysPlan(targetKcal || 1800, targetProtein || 120, targetCarbs || 200, targetFat || 55);
      setDays(scaled7);
      setActiveDayIdx(0);
      setDurationMode('7_DIAS' as any);
      showToast('7 Días Diferenciados', 'Se cargaron 7 menús diarios únicos calibrados a tus metas de calorías y macros.', 'success');
    } else if (type === 'SEMANAL_7') {
      const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const newDays: NutritionPlanDay[] = dayNames.map((name, i) => ({
        id: `day-${i + 1}-${Date.now()}`,
        dayOfWeek: i + 1,
        dayName: name,
        meals: JSON.parse(JSON.stringify(currentMeals)),
      }));
      setDays(newDays);
      setActiveDayIdx(0);
      setDurationMode('7_DIAS' as any);
      showToast('Esquema Semanal Generado', 'Se crearon 7 días (Lunes a Domingo) listos para personalizar.', 'success');
    } else if (type === 'QUINCENAL_2W') {
      const newDays: NutritionPlanDay[] = [
        {
          id: `day-1-${Date.now()}`,
          dayOfWeek: 1,
          dayName: 'Semana A (Días 1 a 7 - Fase 1)',
          meals: JSON.parse(JSON.stringify(currentMeals)),
        },
        {
          id: `day-2-${Date.now()}`,
          dayOfWeek: 2,
          dayName: 'Semana B (Días 8 a 14 - Fase 2 / Rotación)',
          meals: JSON.parse(JSON.stringify(currentMeals)),
        },
      ];
      setDays(newDays);
      setActiveDayIdx(0);
      setDurationMode('QUINCENAL');
      showToast('Esquema Quincenal Generado', 'Se configuraron 2 semanas alternadas (Semana A y Semana B).', 'success');
    } else if (type === 'MENSUAL_4W') {
      const newDays: NutritionPlanDay[] = [1, 2, 3, 4].map((num) => ({
        id: `day-${num}-${Date.now()}`,
        dayOfWeek: num,
        dayName: `Semana ${num} (Programación Mes)`,
        meals: JSON.parse(JSON.stringify(currentMeals)),
      }));
      setDays(newDays);
      setActiveDayIdx(0);
      setDurationMode('MENSUAL');
      showToast('Esquema Mensual Generado', 'Se crearon 4 semanas para estructurar la progresión del mes.', 'success');
    } else {
      const newDays: NutritionPlanDay[] = [
        {
          id: `day-base-${Date.now()}`,
          dayOfWeek: 1,
          dayName: 'Menú Base Universal con Intercambios SMAE',
          meals: JSON.parse(JSON.stringify(currentMeals)),
        },
      ];
      setDays(newDays);
      setActiveDayIdx(0);
      showToast('Menú Base Configurado', 'Menú único con equivalencias libres para toda la vigencia.', 'info');
    }
  };

  // Load existing plan when selected patient changes
  useEffect(() => {
    if (!selectedPatient) return;

    const applyPlanToState = (activePlan: NutritionPlan) => {
      setPlanName(activePlan.title || `Plan ${selectedPatient.goal}`);
      setTargetKcal(activePlan.targetCaloriesKcal || 1750);
      setTargetProtein(activePlan.targetProteinG || 130);
      setTargetCarbs(activePlan.targetCarbsG || 170);
      setTargetFat(activePlan.targetFatG || 48);
      setTargetWater(activePlan.targetWaterLiters || 2.5);
      setDurationMode(activePlan.durationMode || 'SEMANAL');
      setStartDate(activePlan.startDate || new Date().toISOString().slice(0, 10));
      setEndDate(activePlan.endDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
      setGeneralInstructions(activePlan.generalInstructions || '');
      if (activePlan.days && activePlan.days.length > 0) {
        setDays(activePlan.days);
        setActiveDayIdx(0);
      }
    };

    const patientPlans = storageService.getPlansByPatientId(selectedPatient.id);
    const activePlan = patientPlans.find((p) => p.status === 'ACTIVE') || patientPlans[0];
    if (activePlan) {
      applyPlanToState(activePlan);
    } else {
      setPlanName(`Plan Nutricional Personalizado - ${selectedPatient.goal || 'Salud Integral'}`);
      const w = selectedPatient.currentWeight || 70;
      const h = selectedPatient.height || 165;
      const age = new Date().getFullYear() - new Date(selectedPatient.birthDate || '1995-01-01').getFullYear();
      const bmr = 10 * w + 6.25 * h - 5 * age + (selectedPatient.gender === 'F' ? -161 : 5);
      const get = Math.round(bmr * 1.35);
      setTargetKcal(get);
      setTargetProtein(Math.round(w * 1.6));
      setTargetFat(Math.round((get * 0.25) / 9));
      setTargetCarbs(Math.round((get - (w * 1.6 * 4 + ((get * 0.25) / 9) * 9)) / 4));
      setTargetWater(Math.round(w * 0.035 * 10) / 10);
    }

    // Also fetch fresh from Supabase to ensure plans created on other devices/local sync immediately
    storageService.fetchPatientPlans(selectedPatient.id).then((cloudPlans) => {
      if (cloudPlans && cloudPlans.length > 0) {
        const freshActive = cloudPlans.find((p) => p.status === 'ACTIVE') || cloudPlans[0];
        if (freshActive) {
          applyPlanToState(freshActive);
        }
      }
    }).catch(() => {});
  }, [selectedPatientId]);

  // Live database synchronization listener (Supabase background sync & cross-tab events)
  useEffect(() => {
    const handleSync = () => {
      const freshPatients = storageService.getPatients();
      setPatients(freshPatients);
      if (selectedPatientId) {
        const freshPlans = storageService.getPlansByPatientId(selectedPatientId);
        const active = freshPlans.find((p) => p.status === 'ACTIVE') || freshPlans[0];
        if (active) {
          setPlanName(active.title || `Plan ${active.goal}`);
          setTargetKcal(active.targetCaloriesKcal || 1750);
          setTargetProtein(active.targetProteinG || 130);
          setTargetCarbs(active.targetCarbsG || 170);
          setTargetFat(active.targetFatG || 48);
          setTargetWater(active.targetWaterLiters || 2.5);
          setDurationMode(active.durationMode || 'SEMANAL');
          setStartDate(active.startDate || new Date().toISOString().slice(0, 10));
          setEndDate(active.endDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
          setGeneralInstructions(active.generalInstructions || '');
          if (active.days && active.days.length > 0) {
            setDays(active.days);
          }
        }
      }
    };

    window.addEventListener('nutriluz_plan_updated', handleSync);
    window.addEventListener('nutriluz:db_updated', handleSync);
    window.addEventListener('nutriluz:cloud_synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('nutriluz_plan_updated', handleSync);
      window.removeEventListener('nutriluz:db_updated', handleSync);
      window.removeEventListener('nutriluz:cloud_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [selectedPatientId]);

  // Recalculate totals for active day
  const currentDay = days[activeDayIdx] || days[0] || { id: 'd-1', dayOfWeek: 1, dayName: 'Día 1', meals: [] };
  const dayCalories = (currentDay.meals || []).reduce(
    (sum, m) => sum + (m.items || []).reduce((s, i) => s + (i.energyKcal || 0), 0),
    0
  );
  const dayProtein = (currentDay.meals || []).reduce(
    (sum, m) => sum + (m.items || []).reduce((s, i) => s + (i.proteinG || 0), 0),
    0
  );
  const dayCarbs = (currentDay.meals || []).reduce(
    (sum, m) => sum + (m.items || []).reduce((s, i) => s + (i.carbsG || 0), 0),
    0
  );
  const dayFat = (currentDay.meals || []).reduce(
    (sum, m) => sum + (m.items || []).reduce((s, i) => s + (i.fatG || 0), 0),
    0
  );

  // Energy expenditure formula (Mifflin-St Jeor)
  const calculateEnergyNeeds = () => {
    if (!selectedPatient) return;
    const w = selectedPatient.currentWeight;
    const h = selectedPatient.height;
    const age = new Date().getFullYear() - new Date(selectedPatient.birthDate).getFullYear();
    const gender = selectedPatient.gender;

    let bmr = 10 * w + 6.25 * h - 5 * age + (gender === 'F' ? -161 : 5);
    const get = Math.round(bmr * activityFactor + caloricAdjustment);

    setTargetKcal(get);
    const pG = Math.round(w * 1.8);
    const fG = Math.round((get * 0.25) / 9);
    const cG = Math.round((get - (pG * 4 + fG * 9)) / 4);

    setTargetProtein(pG);
    setTargetFat(fG);
    setTargetCarbs(cG);
    showToast('Cálculo Energético Actualizado', `GET Meta: ${get} kcal (${pG}g P, ${cG}g C, ${fG}g G)`, 'info');
  };

  // Add Item to Meal
  const handleAddFoodToMeal = (food: FoodItem) => {
    if (!selectedMealForFood) return;

    const newItem: MealItem = {
      id: `item-${Date.now()}`,
      itemType: 'FOOD',
      name: food.name,
      portionDescription: food.servingSize,
      portionQuantity: 1,
      energyKcal: food.energyKcal,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
    };

    const updatedDays = [...days];
    const meal = updatedDays[activeDayIdx]?.meals.find((m) => m.id === selectedMealForFood);
    if (meal) {
      meal.items.push(newItem);
      setDays(updatedDays);
      showToast('Alimento Agregado', `${food.name} añadido a ${meal.name}`, 'success');
    }
  };

  // Add Custom Food to Meal
  const handleAddCustomFood = () => {
    if (!selectedMealForFood || !customFoodName.trim()) {
      showToast('Campos requeridos', 'Por favor ingresa al menos el nombre del alimento', 'error');
      return;
    }

    const newItem: MealItem = {
      id: `custom-${Date.now()}`,
      itemType: 'FOOD',
      name: customFoodName.trim(),
      portionDescription: customServing.trim() || '1 porción',
      portionQuantity: 1,
      energyKcal: customKcal,
      proteinG: customProt,
      carbsG: customCarb,
      fatG: customFat,
    };

    const updatedDays = [...days];
    const meal = updatedDays[activeDayIdx]?.meals.find((m) => m.id === selectedMealForFood);
    if (meal) {
      meal.items.push(newItem);
      setDays(updatedDays);
      setIsCustomFoodModalOpen(false);
      setCustomFoodName('');
      showToast('Alimento Personalizado Agregado', `${customFoodName} añadido a ${meal.name}`, 'success');
    }
  };

  // Stepper: Change Item Portion Quantity & Scale Macros
  const handleAdjustPortion = (mealId: string, itemId: string, delta: number) => {
    const updatedDays = [...days];
    const meal = updatedDays[activeDayIdx]?.meals.find((m) => m.id === mealId);
    if (!meal) return;
    const item = meal.items.find((i) => i.id === itemId);
    if (!item) return;

    const currentQty = item.portionQuantity || 1;
    const newQty = Math.max(0.25, Math.round((currentQty + delta) * 100) / 100);
    const ratio = newQty / currentQty;

    item.portionQuantity = newQty;
    item.energyKcal = Math.round((item.energyKcal || 0) * ratio);
    item.proteinG = Math.round((item.proteinG || 0) * ratio * 10) / 10;
    item.carbsG = Math.round((item.carbsG || 0) * ratio * 10) / 10;
    item.fatG = Math.round((item.fatG || 0) * ratio * 10) / 10;

    setDays(updatedDays);
  };

  // Remove Item from Meal
  const handleRemoveItem = (mealId: string, itemId: string) => {
    const updatedDays = [...days];
    const meal = updatedDays[activeDayIdx]?.meals.find((m) => m.id === mealId);
    if (meal) {
      meal.items = meal.items.filter((i) => i.id !== itemId);
      setDays(updatedDays);
      showToast('Alimento Eliminado', 'Se quitó el alimento del tiempo de comida', 'info');
    }
  };

  // Add new Meal Time
  const handleAddMealTime = () => {
    const updatedDays = [...days];
    const mealOrders = (updatedDays[activeDayIdx]?.meals || []).length + 1;
    const newMeal: PlanMeal = {
      id: `meal-${Date.now()}`,
      name: mealOrders === 5 ? '🌙 Colación Nocturna' : '🍎 Colación Intermedia',
      suggestedTime: '17:30',
      mealOrder: mealOrders,
      items: [],
    };
    updatedDays[activeDayIdx].meals.push(newMeal);
    setDays(updatedDays);
    showToast('Tiempo de Comida Añadido', 'Nuevo tiempo disponible para agregar alimentos', 'success');
  };

  // Delete Meal Time
  const handleDeleteMealTime = (mealId: string) => {
    const updatedDays = [...days];
    updatedDays[activeDayIdx].meals = updatedDays[activeDayIdx].meals.filter((m) => m.id !== mealId);
    setDays(updatedDays);
    if (selectedMealForFood === mealId) setSelectedMealForFood(null);
    showToast('Tiempo de Comida Eliminado', 'Se eliminó el tiempo del menú', 'info');
  };

  // Move Meal Up/Down
  const handleMoveMeal = (mealIdx: number, direction: 'up' | 'down') => {
    const updatedDays = [...days];
    const meals = updatedDays[activeDayIdx].meals;
    const targetIdx = direction === 'up' ? mealIdx - 1 : mealIdx + 1;
    if (targetIdx < 0 || targetIdx >= meals.length) return;

    const temp = meals[mealIdx];
    meals[mealIdx] = meals[targetIdx];
    meals[targetIdx] = temp;
    setDays(updatedDays);
  };

  // Open Edit Meal Modal
  const handleOpenEditMeal = (meal: PlanMeal) => {
    setEditingMealId(meal.id);
    setMealNameEdit(meal.name);
    setMealTimeEdit(meal.suggestedTime || '');
    setIsEditMealModalOpen(true);
  };

  const handleSaveMealEdit = () => {
    if (!editingMealId) return;
    const updatedDays = [...days];
    const meal = updatedDays[activeDayIdx]?.meals.find((m) => m.id === editingMealId);
    if (meal) {
      meal.name = mealNameEdit;
      meal.suggestedTime = mealTimeEdit;
      setDays(updatedDays);
      setIsEditMealModalOpen(false);
      showToast('Tiempo Modificado', 'Se actualizaron los datos del tiempo de comida', 'success');
    }
  };

  // Day Management: Add Day
  const handleAddNewDay = () => {
    const newDay: NutritionPlanDay = {
      id: `day-${Date.now()}`,
      dayOfWeek: days.length + 1,
      dayName: `Día ${days.length + 1}`,
      meals: JSON.parse(JSON.stringify(days[0]?.meals || DEFAULT_DAYS_SEMANAL[0].meals)),
    };
    setDays([...days, newDay]);
    setActiveDayIdx(days.length);
    showToast('Día Agregado', `Día ${days.length + 1} creado con éxito`, 'success');
  };

  // Day Management: Delete Day
  const handleDeleteDay = (idx: number) => {
    if (days.length <= 1) {
      showToast('Acción no permitida', 'El plan debe contener al menos un día', 'error');
      return;
    }
    const updatedDays = days.filter((_, i) => i !== idx);
    setDays(updatedDays);
    setActiveDayIdx(Math.max(0, idx - 1));
    showToast('Día Eliminado', 'Se ha retirado el día del plan nutricional', 'info');
  };

  // Day Management: Save Day Rename
  const handleSaveDayRename = () => {
    if (!dayNameEdit.trim()) return;
    const updatedDays = [...days];
    updatedDays[activeDayIdx].dayName = dayNameEdit.trim();
    setDays(updatedDays);
    setIsEditDayModalOpen(false);
    showToast('Nombre Actualizado', `El día ahora se llama "${dayNameEdit.trim()}"`, 'success');
  };

  // Clone Day to Multiple Selected Days
  const handleExecuteClone = () => {
    if (targetCloneDays.length === 0) {
      showToast('Selecciona destinos', 'Elige al menos un día donde pegar el menú', 'info');
      return;
    }
    const sourceMeals = JSON.parse(JSON.stringify(days[activeDayIdx].meals));
    const updatedDays = [...days];
    targetCloneDays.forEach((idx) => {
      if (updatedDays[idx]) {
        updatedDays[idx].meals = JSON.parse(JSON.stringify(sourceMeals));
      }
    });
    setDays(updatedDays);
    setIsCloneDayModalOpen(false);
    setTargetCloneDays([]);
    showToast('Menú Replicado', `Se copió el menú a ${targetCloneDays.length} día(s) seleccionados.`, 'success');
  };

  // NutriCopilot AI Generator
  const handleGenerateAiPlan = async () => {
    setIsAiDrafting(true);
    const res = await aiService.queryNutriCopilot({
      action: 'draft_plan',
      payload: {
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        age: new Date().getFullYear() - new Date(selectedPatient.birthDate).getFullYear(),
        gender: selectedPatient.gender,
        weight: selectedPatient.currentWeight,
        height: selectedPatient.height,
        goal: selectedPatient.goal,
        durationMode: durationMode,
      },
    });
    setIsAiDrafting(false);
    setIsAiModalOpen(true);
    setGeneralInstructions(res.result);
    showToast('Propuesta Generada', `NutriCopilot AI ha estructurado el plan ${durationMode.toLowerCase()} basado en SMAE`, 'success');
  };

  // Save Plan to Storage
  const handleSavePlan = () => {
    const newPlan: NutritionPlan = {
      id: `plan-${Date.now()}`,
      organizationId: organization.id,
      patientId: selectedPatient.id,
      specialistId: currentUser.id,
      title: planName,
      goal: selectedPatient.goal,
      durationMode: durationMode,
      startDate: startDate,
      endDate: endDate,
      validityWeeks: durationMode === 'SEMANAL' ? 1 : durationMode === 'QUINCENAL' ? 2 : 4,
      targetCaloriesKcal: targetKcal,
      targetProteinG: targetProtein,
      targetCarbsG: targetCarbs,
      targetFatG: targetFat,
      targetWaterLiters: targetWater,
      status: 'ACTIVE',
      days: days.map((d, dIdx) => ({
        id: d.id,
        dayOfWeek: dIdx + 1,
        dayName: d.dayName,
        meals: d.meals.map((m, mIdx) => ({
          id: m.id,
          name: m.name,
          mealOrder: mIdx + 1,
          suggestedTime: m.suggestedTime,
          items: m.items,
        })),
      })),
      generalInstructions: generalInstructions,
      approvedBySpecialist: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveNutritionPlan(newPlan);
    showToast(
      'Plan Guardado',
      `El plan nutricional (${durationMode}) fue guardado y sincronizado con el portal del paciente.`,
      'success'
    );
  };

  const planToExport: NutritionPlan = {
    id: selectedPatient?.id ? `plan-${selectedPatient.id}` : 'active-plan',
    organizationId: organization.id,
    patientId: selectedPatient.id,
    specialistId: currentUser.id,
    title: planName,
    goal: selectedPatient.goal,
    durationMode: durationMode,
    startDate: startDate,
    endDate: endDate,
    validityWeeks: durationMode === 'SEMANAL' ? 1 : durationMode === 'QUINCENAL' ? 2 : 4,
    targetCaloriesKcal: targetKcal,
    targetProteinG: targetProtein,
    targetCarbsG: targetCarbs,
    targetFatG: targetFat,
    targetWaterLiters: targetWater,
    status: 'ACTIVE',
    days: days,
    generalInstructions: generalInstructions,
    approvedBySpecialist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Export to PDF
  const handleExportPdf = () => {
    setIsExecutiveExportModalOpen(true);
  };

  const handleExportShoppingList = async () => {
    const allItems: string[] = [];
    days.forEach((d) => {
      d.meals.forEach((m) => {
        m.items.forEach((item) => {
          allItems.push(`${item.name} (${item.portionDescription})`);
        });
      });
    });
    const uniqueItems = Array.from(new Set(allItems));
    await pdfService.generateShoppingListPdf(uniqueItems, `${selectedPatient.firstName} ${selectedPatient.lastName}`, organization);
    if (isMobileOrAndroid()) {
      showToast('Lista de Compras Lista', 'Se ha abierto el menú para guardar o compartir la lista.', 'success');
    } else {
      showToast('Lista Generada', 'Descargando lista de compras para el paciente', 'success');
    }
  };

  // Filtered Food items
  const filteredFoods = foods.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(foodSearchQuery.toLowerCase());
    const matchesCat =
      selectedFoodCategory === 'ALL' ||
      f.categoryId === selectedFoodCategory ||
      f.equivalentGroupId === selectedFoodCategory ||
      f.equivalentGroupCode === selectedFoodCategory ||
      (f as any).category === selectedFoodCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div id="planner-view" className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Utensils className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              <span>Diseñador de Planes Nutricionales</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              Modo {durationMode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Estructuración de menús con cálculo de macronutrientes en tiempo real, SMAE, modalidades periódicas y edición modular
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="planner-ai-wizard-btn"
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-md shadow-emerald-950/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Prescripción Guiada con IA</span>
          </button>

          <button
            id="planner-export-pdf-btn"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Descargar PDF</span>
          </button>

          <button
            id="planner-edit-pdf-btn"
            onClick={() => {
              setExportInitialTab('editor');
              setExportInitialDay(activeDayIdx);
              setIsExecutiveExportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer shadow-2xs"
            title="Editar colaciones, platillos, porciones y notas completas del PDF"
          >
            <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Editar PDF & Colaciones</span>
          </button>

          <button
            id="planner-custom-photos-btn"
            onClick={() => {
              setExportInitialPhotoOpen(true);
              setExportInitialDay(activeDayIdx);
              setIsExecutiveExportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer shadow-2xs"
            title="Personalizar fotos de los platillos para el PDF"
          >
            <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Fotos del PDF</span>
          </button>

          <button
            id="planner-export-shopping-list-btn"
            onClick={handleExportShoppingList}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>Lista Súper</span>
          </button>

          <button
            id="planner-save-btn"
            onClick={handleSavePlan}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Plan</span>
          </button>
        </div>
      </div>

      {/* DURATION & PERIOD SELECTOR BANNER */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block mb-1">
              Frecuencia y Vigencia del Plan
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                Selecciona la modalidad de prescripción:
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {durationMode === 'SEMANAL' && 'Plan Semanal (7 días / 1 semana): Ideal para rotación diaria constante de Lunes a Domingo.'}
              {durationMode === 'QUINCENAL' && 'Plan Quincenal (14 días / 2 semanas): Esquema de 2 fases o Semana A / Semana B alternadas.'}
              {durationMode === 'MENSUAL' && 'Plan Mensual (30 días / 4 semanas): Programación mensual con progresión y fecha de revaloración.'}
            </p>
          </div>

          {/* Segmented Mode Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: '7_DIAS', label: '📅 7 Días', desc: '1 Sem (L-D)' },
              { id: '15_DIAS', label: '🗓️ 15 Días', desc: 'Quincenal' },
              { id: '30_DIAS', label: '📆 30 Días', desc: 'Mensual' },
              { id: '60_DIAS', label: '⏳ 60 Días', desc: 'Bimestral' },
            ].map((m) => {
              const isSelected = durationMode === m.id || (m.id === '7_DIAS' && durationMode === 'SEMANAL') || (m.id === '15_DIAS' && durationMode === 'QUINCENAL') || (m.id === '30_DIAS' && durationMode === 'MENSUAL');
              return (
                <button
                  key={m.id}
                  id={`duration-mode-btn-${m.id.toLowerCase()}`}
                  onClick={() => handleDurationChange(m.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20 scale-102 ring-2 ring-emerald-400/40'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Ranges & Quick Generation Presets */}
        <div className="mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Inicio:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Término / Cita:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 text-xs"
              />
            </div>
          </div>

          {/* Quick preset generators */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-bold text-slate-400">Generar estructura:</span>
            <button
              onClick={() => handleGenerateDaysPreset('SEMANAL_7_DISTINCT')}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold cursor-pointer hover:bg-emerald-100 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>7 Días Únicos Calibrados</span>
            </button>
            <button
              onClick={() => handleGenerateDaysPreset('SEMANAL_7')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              7 Días (Lun-Dom)
            </button>
            <button
              onClick={() => handleGenerateDaysPreset('QUINCENAL_2W')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              2 Semanas (A/B)
            </button>
            <button
              onClick={() => handleGenerateDaysPreset('MENSUAL_4W')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              4 Semanas
            </button>
            <button
              onClick={() => handleGenerateDaysPreset('SINGLE_BASE')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Plan Base Único
            </button>
          </div>
        </div>
      </div>

      {/* Patient & Energy Needs Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Paciente Asignado
            </label>
            <select
              id="planner-patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.currentWeight} kg • {p.goal})
                </option>
              ))}
            </select>
          </div>

          {/* Plan Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Nombre o Título del Plan
            </label>
            <input
              id="planner-name-input"
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Ej. Plan Recomposición Corporal & Pérdida de Grasa - Fase 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Energy Calculator Quick Row */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-200">Fórmula:</span>
              <select
                value={calcFormula}
                onChange={(e) => setCalcFormula(e.target.value as any)}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs border border-slate-200 dark:border-slate-700 font-medium"
              >
                <option value="MIFFLIN">Mifflin-St Jeor (Clínica)</option>
                <option value="HARRIS">Harris-Benedict</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-200">Factor Actividad:</span>
              <select
                value={activityFactor}
                onChange={(e) => setActivityFactor(Number(e.target.value))}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs border border-slate-200 dark:border-slate-700 font-medium"
              >
                <option value={1.2}>Sedentario (1.2)</option>
                <option value={1.375}>Ligero (1.375)</option>
                <option value={1.55}>Moderado (1.55)</option>
                <option value={1.725}>Intenso (1.725)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-200">Ajuste Calórico:</span>
              <select
                value={caloricAdjustment}
                onChange={(e) => setCaloricAdjustment(Number(e.target.value))}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs border border-slate-200 dark:border-slate-700 font-medium"
              >
                <option value={-500}>Déficit -500 kcal</option>
                <option value={-350}>Déficit -350 kcal</option>
                <option value={0}>Mantenimiento (0 kcal)</option>
                <option value={300}>Superávit +300 kcal</option>
                <option value={500}>Superávit +500 kcal</option>
              </select>
            </div>
          </div>

          <button
            id="planner-recalc-energy-btn"
            onClick={calculateEnergyNeeds}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Auto-Calcular Macros
          </button>
        </div>

        {/* Real-time Target vs Actual Macro Gauges with Inline Editable Targets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
              <span>Calorías Totales</span>
              <span className="text-[9px] text-slate-400 font-normal">Objetivo</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              <span>{dayCalories}</span>
              <span className="text-xs text-slate-400 font-normal">/</span>
              <input
                type="number"
                value={targetKcal}
                onChange={(e) => setTargetKcal(Math.max(500, parseInt(e.target.value) || 0))}
                className="w-16 text-center text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5"
                title="Editar calorías meta"
              />
              <span className="text-xs text-slate-400 font-normal">kcal</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  Math.abs(dayCalories - targetKcal) < 100 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (dayCalories / (targetKcal || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              <span>Proteínas</span>
              <span className="text-[9px] text-slate-400 font-normal">{Math.round(((targetProtein * 4) / (targetKcal || 1)) * 100)}%</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              <span>{Math.round(dayProtein)}</span>
              <span className="text-xs text-slate-400 font-normal">/</span>
              <input
                type="number"
                value={targetProtein}
                onChange={(e) => setTargetProtein(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5"
                title="Editar gramos de proteína"
              />
              <span className="text-xs text-slate-400 font-normal">g</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, (dayProtein / (targetProtein || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              <span>Carbohidratos</span>
              <span className="text-[9px] text-slate-400 font-normal">{Math.round(((targetCarbs * 4) / (targetKcal || 1)) * 100)}%</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              <span>{Math.round(dayCarbs)}</span>
              <span className="text-xs text-slate-400 font-normal">/</span>
              <input
                type="number"
                value={targetCarbs}
                onChange={(e) => setTargetCarbs(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 text-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5"
                title="Editar gramos de carbohidratos"
              />
              <span className="text-xs text-slate-400 font-normal">g</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, (dayCarbs / (targetCarbs || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
              <span>Grasas</span>
              <span className="text-[9px] text-slate-400 font-normal">{Math.round(((targetFat * 9) / (targetKcal || 1)) * 100)}%</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              <span>{Math.round(dayFat)}</span>
              <span className="text-xs text-slate-400 font-normal">/</span>
              <input
                type="number"
                value={targetFat}
                onChange={(e) => setTargetFat(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 text-center text-xs font-bold text-amber-600 dark:text-amber-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5"
                title="Editar gramos de grasas"
              />
              <span className="text-xs text-slate-400 font-normal">g</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(100, (dayFat / (targetFat || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Meal Planner Canvas: Days Bar, Meals, and Food Library */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Day Management & Meals List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Day Navigation Tabs & Day Tools */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Días del Plan ({days.length})
                </span>
              </div>

              {/* Day Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setDayNameEdit(days[activeDayIdx]?.dayName || '');
                    setIsEditDayModalOpen(true);
                  }}
                  title="Renombrar día actual"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Renombrar</span>
                </button>

                <button
                  id="clone-day-btn"
                  onClick={() => {
                    setTargetCloneDays([]);
                    setIsCloneDayModalOpen(true);
                  }}
                  title="Copiar el menú de este día a otros días del plan"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Replicar Menú</span>
                </button>

                <button
                  id="add-day-btn"
                  onClick={handleAddNewDay}
                  title="Añadir un nuevo día"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Día</span>
                </button>

                {days.length > 1 && (
                  <button
                    onClick={() => handleDeleteDay(activeDayIdx)}
                    title="Eliminar este día"
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Day Pills Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {days.map((day, idx) => {
                const isActive = activeDayIdx === idx;
                const dKcal = (day.meals || []).reduce(
                  (s, m) => s + (m.items || []).reduce((is, item) => is + (item.energyKcal || 0), 0),
                  0
                );
                return (
                  <button
                    key={day.id || idx}
                    id={`day-tab-${idx}`}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                        : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day.dayName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                        isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {dKcal} kcal
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meals inside active day */}
          <div className="space-y-4">
            {currentDay.meals.map((meal, mealIdx) => {
              const isSelectedForAdding = selectedMealForFood === meal.id;
              const mealKcal = (meal.items || []).reduce((s, i) => s + (i.energyKcal || 0), 0);
              const mealProt = (meal.items || []).reduce((s, i) => s + (i.proteinG || 0), 0);
              const mealCarb = (meal.items || []).reduce((s, i) => s + (i.carbsG || 0), 0);
              const mealFat = (meal.items || []).reduce((s, i) => s + (i.fatG || 0), 0);

              return (
                <div
                  key={meal.id}
                  id={`meal-block-${meal.id}`}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs space-y-3 transition-all ${
                    isSelectedForAdding
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Meal Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditMeal(meal)}
                        className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer group"
                        title="Haz clic para editar nombre u horario"
                      >
                        <span>{meal.name}</span>
                        <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 opacity-60" />
                      </button>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meal.suggestedTime || 'Libre'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Macro Tag for Meal */}
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
                        {mealKcal} kcal (P: {Math.round(mealProt)}g • C: {Math.round(mealCarb)}g • G: {Math.round(mealFat)}g)
                      </span>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleMoveMeal(mealIdx, 'up')}
                          disabled={mealIdx === 0}
                          title="Mover arriba"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveMeal(mealIdx, 'down')}
                          disabled={mealIdx === currentDay.meals.length - 1}
                          title="Mover abajo"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Photo Button for PDF */}
                      <button
                        onClick={() => {
                          setExportInitialPhotoOpen(true);
                          setExportInitialDay(activeDayIdx);
                          setIsExecutiveExportModalOpen(true);
                        }}
                        title="Personalizar foto de este platillo para el PDF"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-all cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-sky-600" />
                        <span className="hidden sm:inline">Foto PDF</span>
                      </button>

                      {/* Add Food Button */}
                      <button
                        onClick={() => setSelectedMealForFood(isSelectedForAdding ? null : meal.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelectedForAdding
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isSelectedForAdding ? 'Seleccionado' : '+ Alimento'}</span>
                      </button>

                      {/* Delete Meal Button */}
                      <button
                        onClick={() => handleDeleteMealTime(meal.id)}
                        title="Eliminar este tiempo de comida"
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Items list inside this meal */}
                  <div className="space-y-2">
                    {meal.items.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        No hay alimentos en este tiempo de comida. Haz clic en "+ Alimento" o seleccionalo en el catálogo a la derecha.
                      </div>
                    ) : (
                      meal.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs gap-2"
                        >
                          <div className="flex-1 flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</span>
                            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              {item.portionDescription}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-500 font-medium">
                            {/* Stepper for portion quantity */}
                            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-0.5">
                              <button
                                onClick={() => handleAdjustPortion(meal.id, item.id, -0.5)}
                                title="Reducir porción (-0.5)"
                                className="px-1 text-slate-400 hover:text-emerald-600 font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-1.5 font-bold text-slate-800 dark:text-white text-[11px]">
                                {item.portionQuantity || 1}x
                              </span>
                              <button
                                onClick={() => handleAdjustPortion(meal.id, item.id, 0.5)}
                                title="Aumentar porción (+0.5)"
                                className="px-1 text-slate-400 hover:text-emerald-600 font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <span className="text-xs font-semibold">P: {item.proteinG}g</span>
                            <span className="text-xs font-semibold">C: {item.carbsG}g</span>
                            <span className="text-xs font-semibold">G: {item.fatG}g</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">{item.energyKcal} kcal</span>

                            <button
                              onClick={() => handleRemoveItem(meal.id, item.id)}
                              title="Quitar alimento"
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    {meal.notes && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                        <span className="font-bold">📌 Preparación / Instrucciones:</span>
                        <span className="font-medium leading-relaxed">{meal.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              id="add-meal-time-btn"
              onClick={handleAddMealTime}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 hover:border-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Nuevo Tiempo de Comida (Colación, Pre-entreno, etc.)</span>
            </button>
          </div>

          {/* General Instructions & Clinical Notes Textarea */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Pautas Clínicas, Hidratación e Instrucciones
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() =>
                    setGeneralInstructions(
                      (prev) =>
                        prev +
                        '\n• Hidratación: Beber mínimo 2.5 a 3 litros de agua natural al día distribuidos entre comidas.'
                    )
                  }
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  + Pauta Agua
                </button>
                <button
                  onClick={() =>
                    setGeneralInstructions(
                      (prev) =>
                        prev +
                        '\n• Equivalencias SMAE: Puedes sustituir alimentos de la misma categoría respetando la porción indicada.'
                    )
                  }
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  + Pauta SMAE
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={generalInstructions}
              onChange={(e) => setGeneralInstructions(e.target.value)}
              placeholder="Escribe aquí las pautas dietéticas, recomendaciones de preparación, suplementación o indicaciones personalizadas..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Right 1 Column: Food Library SMAE & Custom Food Creator */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Catálogo de Alimentos (SMAE)</h3>
                <p className="text-[11px] text-slate-400">
                  {selectedMealForFood
                    ? `Agregando a: "${currentDay.meals.find((m) => m.id === selectedMealForFood)?.name || 'Tiempo Seleccionado'}"`
                    : 'Selecciona primero "+ Alimento" en el tiempo de comida'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (!selectedMealForFood) {
                    showToast('Selecciona tiempo', 'Primero selecciona "+ Alimento" en el tiempo de comida donde lo agregarás.', 'info');
                    return;
                  }
                  setIsCustomFoodModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold cursor-pointer"
              >
                + Personalizado
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                placeholder="Buscar por alimento (ej. pollo, avena, aguacate...)"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'Verduras', label: 'Verduras' },
                { id: 'Frutas', label: 'Frutas' },
                { id: 'Cereales sin grasa', label: 'Cereales' },
                { id: 'Alimentos de Origen Animal', label: 'Proteínas / AOA' },
                { id: 'Leguminosas', label: 'Leguminosas' },
                { id: 'Leche', label: 'Lácteos' },
                { id: 'Aceites y Grasas', label: 'Grasas' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFoodCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedFoodCategory === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scrollable list of foods */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  onClick={() => {
                    if (selectedMealForFood) {
                      handleAddFoodToMeal(food);
                    } else {
                      showToast('Selecciona tiempo de comida', 'Haz clic primero en "+ Alimento" dentro del tiempo donde deseas agregarlo.', 'info');
                    }
                  }}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600">
                      {food.name}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">{food.energyKcal} kcal</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{food.servingSize}</span>
                    <span>P: {food.proteinG}g • C: {food.carbsG}g • G: {food.fatG}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Day Name Modal */}
      <Modal
        id="edit-day-name-modal"
        isOpen={isEditDayModalOpen}
        onClose={() => setIsEditDayModalOpen(false)}
        title="Renombrar Día del Plan"
        subtitle="Asigna un nombre descriptivo para identificar este menú"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Día:</label>
            <input
              type="text"
              value={dayNameEdit}
              onChange={(e) => setDayNameEdit(e.target.value)}
              placeholder="Ej. Lunes - Entrenamiento de Pierna, Sábado, etc."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleSaveDayRename}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Guardar Nombre
          </button>
        </div>
      </Modal>

      {/* Clone / Replicate Day Modal */}
      <Modal
        id="clone-day-modal"
        isOpen={isCloneDayModalOpen}
        onClose={() => setIsCloneDayModalOpen(false)}
        title={`Replicar Menú de "${days[activeDayIdx]?.dayName}"`}
        subtitle="Selecciona los días a los que deseas copiar esta misma estructura de comidas"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Días destino:</span>
            <div className="grid grid-cols-2 gap-2">
              {days.map((d, idx) => {
                if (idx === activeDayIdx) return null;
                const isChecked = targetCloneDays.includes(idx);
                return (
                  <button
                    key={d.id || idx}
                    onClick={() => {
                      if (isChecked) {
                        setTargetCloneDays(targetCloneDays.filter((i) => i !== idx));
                      } else {
                        setTargetCloneDays([...targetCloneDays, idx]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{d.dayName}</span>
                    {isChecked ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => {
                // Select all other days
                const allOther = days.map((_, i) => i).filter((i) => i !== activeDayIdx);
                setTargetCloneDays(allOther);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
            >
              Seleccionar Todos
            </button>
            <button
              onClick={handleExecuteClone}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-md"
            >
              Replicar Menú ({targetCloneDays.length})
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Meal Name & Time Modal */}
      <Modal
        id="edit-meal-modal"
        isOpen={isEditMealModalOpen}
        onClose={() => setIsEditMealModalOpen(false)}
        title="Editar Tiempo de Comida"
        subtitle="Personaliza el nombre y horario sugerido para el paciente"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Tiempo:</label>
            <input
              type="text"
              value={mealNameEdit}
              onChange={(e) => setMealNameEdit(e.target.value)}
              placeholder="Ej. Desayuno, Pre-entreno, Cena Ligera..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Horario Sugerido:</label>
            <input
              type="time"
              value={mealTimeEdit}
              onChange={(e) => setMealTimeEdit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={handleSaveMealEdit}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </Modal>

      {/* Custom Food Item Creator Modal */}
      <Modal
        id="custom-food-creator-modal"
        isOpen={isCustomFoodModalOpen}
        onClose={() => setIsCustomFoodModalOpen(false)}
        title="Añadir Alimento Personalizado"
        subtitle="Ingresa un alimento específico no listado en el SMAE"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Alimento:</label>
            <input
              type="text"
              value={customFoodName}
              onChange={(e) => setCustomFoodName(e.target.value)}
              placeholder="Ej. Batido de Proteína Whey Isolate con Frutos Rojos"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Descripción de Porción:</label>
            <input
              type="text"
              value={customServing}
              onChange={(e) => setCustomServing(e.target.value)}
              placeholder="Ej. 1 scoop (30g) + 1 taza agua"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kcal:</label>
              <input
                type="number"
                value={customKcal}
                onChange={(e) => setCustomKcal(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Proteína (g):</label>
              <input
                type="number"
                value={customProt}
                onChange={(e) => setCustomProt(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Carbos (g):</label>
              <input
                type="number"
                value={customCarb}
                onChange={(e) => setCustomCarb(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Grasas (g):</label>
              <input
                type="number"
                value={customFat}
                onChange={(e) => setCustomFat(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <button
            onClick={handleAddCustomFood}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-md"
          >
            Añadir a "{currentDay.meals.find((m) => m.id === selectedMealForFood)?.name || 'Tiempo Actual'}"
          </button>
        </div>
      </Modal>

      {/* NutriCoPilot Guided Prescription Wizard */}
      {isWizardOpen && (
        <NutriCopilotPlanWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          initialPatientId={selectedPatientId}
          onApplyPlanToPlanner={(planData) => {
            if (planData.patientId) setSelectedPatientId(planData.patientId);
            if (planData.planTitle) setPlanName(planData.planTitle);
            if (planData.targetKcal) setTargetKcal(planData.targetKcal);
            if (planData.targetProtein) setTargetProtein(planData.targetProtein);
            if (planData.targetCarbs) setTargetCarbs(planData.targetCarbs);
            if (planData.targetFat) setTargetFat(planData.targetFat);
            if (planData.targetWater) setTargetWater(planData.targetWater);
            if (planData.generalInstructions) setGeneralInstructions(planData.generalInstructions);
            if (planData.durationMode) setDurationMode(planData.durationMode as any);
            if (planData.startDate) setStartDate(planData.startDate);
            if (planData.endDate) setEndDate(planData.endDate);
            if (planData.days && planData.days.length > 0) {
              setDays(planData.days);
              setActiveDayIdx(0);
            }
            setIsWizardOpen(false);
            showToast('Plan Clínico Aplicado', `Plan con ${planData.days?.length || 7} días diferenciados cargado exitosamente.`, 'success');
          }}
          onOpenPdfEditor={(createdPlan) => {
            if (createdPlan.days && createdPlan.days.length > 0) {
              setDays(createdPlan.days);
            }
            if (createdPlan.title) setPlanName(createdPlan.title);
            if (createdPlan.generalInstructions) setGeneralInstructions(createdPlan.generalInstructions);
            if (createdPlan.targetWaterLiters) setTargetWater(createdPlan.targetWaterLiters);
            setIsWizardOpen(false);
            setExportInitialTab('editor');
            setExportInitialDay(0);
            setIsExecutiveExportModalOpen(true);
          }}
        />
      )}

      {/* AI Draft Result Modal */}
      <Modal
        id="planner-ai-result-modal"
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="Propuesta Nutricional Inteligente (NutriCopilot)"
        subtitle="Revisa la síntesis clínica generada para integrarla al plan"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-200">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 whitespace-pre-line leading-relaxed">
            {generalInstructions}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Aceptar e Incorporar al Plan
            </button>
          </div>
        </div>
      </Modal>

      {/* Executive PDF Export Center Modal */}
      {selectedPatient && (
        <ExecutivePdfExportModal
          isOpen={isExecutiveExportModalOpen}
          onClose={() => {
            setIsExecutiveExportModalOpen(false);
            setExportInitialPhotoOpen(false);
          }}
          plan={planToExport}
          patient={selectedPatient}
          organization={organization}
          specialist={currentUser}
          showToast={showToast}
          initialPhotoCustomizerOpen={exportInitialPhotoOpen}
          initialDayIdx={exportInitialDay}
          initialTab={exportInitialTab}
          onPlanUpdate={(updated) => {
            if (updated.days && updated.days.length > 0) {
              setDays(updated.days);
            }
            if (updated.title) setPlanName(updated.title);
            if (updated.generalInstructions) setGeneralInstructions(updated.generalInstructions);
            if (updated.targetWaterLiters) setTargetWater(updated.targetWaterLiters);
          }}
        />
      )}
    </div>
  );
};
