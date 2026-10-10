import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  BookOpen,
  Utensils,
  ShoppingCart,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  Image as ImageIcon,
  Check,
  Camera,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Copy,
  ChevronRight,
  ListPlus,
  Sliders,
  Droplets,
  AlertCircle,
  MessageCircle,
  Send,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { NutritionPlan, Patient, Organization, UserProfile } from '../types';
import { storageService } from '../lib/storage';
import {
  pdfService,
  DEFAULT_WEEKLY_MEAL_PRESETS,
  getSavedMealPhotos,
  saveMealPhotos,
  generateDishCanvasThumbnail,
  formatCleanItemDescription,
  cleanPdfText,
  PdfExportResult,
} from '../lib/pdf';
import { optimizeMealPhoto } from '../lib/imageOptimizer';
import { isMobileOrAndroid } from '../lib/pdfDelivery';

export interface ExecutivePdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: NutritionPlan;
  patient: Patient;
  organization: Organization;
  specialist: UserProfile;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  initialPhotoCustomizerOpen?: boolean;
  initialDayIdx?: number;
  initialTab?: 'download' | 'editor' | 'photos';
  onPlanUpdate?: (updatedPlan: NutritionPlan) => void;
  readOnly?: boolean;
}

export const DAYS_CONFIG = [
  { name: 'Lunes', color: '#e02f89' },
  { name: 'Martes', color: '#9333ea' },
  { name: 'Miércoles', color: '#3b82f6' },
  { name: 'Jueves', color: '#f97316' },
  { name: 'Viernes', color: '#eab308' },
  { name: 'Sábado', color: '#38bdf8' },
  { name: 'Domingo', color: '#06b6d4' },
];

interface ColacionPreset {
  label: string;
  name: string;
  time: string;
  defaultDish: string;
  defaultBullets: string[];
}

const COLACION_PRESETS: ColacionPreset[] = [
  {
    label: '🍏 Colación Matutina',
    name: 'Colación Matutina',
    time: '11:00',
    defaultDish: 'Manzana verde con canela y almendras tostadas',
    defaultBullets: ['1 manzana verde mediana', '12 almendras naturales tostadas'],
  },
  {
    label: '🥗 Almuerzo Ligero',
    name: 'Almuerzo Ligero',
    time: '12:30',
    defaultDish: 'Tostadas horneadas con aguacate y queso panela',
    defaultBullets: ['2 tostadas de maíz horneadas', '40g queso panela fresco', '1/3 aguacate Hass'],
  },
  {
    label: '🍓 Colación Vespertina',
    name: 'Colación Vespertina',
    time: '17:30',
    defaultDish: 'Yogur griego con moras azules y semillas de chía',
    defaultBullets: ['1/2 taza yogur griego sin azúcar (100g)', '1/2 taza moras azules frescas', '1 cdta semillas de chía'],
  },
  {
    label: '⚡ Pre-Entrenamiento',
    name: 'Snack Pre-Entreno',
    time: '16:30',
    defaultDish: 'Medio plátano con crema de cacahuate natural',
    defaultBullets: ['1/2 plátano maduro en rodajas', '1 cda mantequilla de maní 100% natural'],
  },
  {
    label: '💪 Post-Entrenamiento',
    name: 'Recuperación Post-Entreno',
    time: '18:30',
    defaultDish: 'Batido de proteína o claras con avena y canela',
    defaultBullets: ['1 vaso leche vegetal o descremada (240ml)', '20g proteína o 2 claras', '3 cdas avena en hojuelas'],
  },
  {
    label: '✨ Colación Nocturna',
    name: 'Colación Nocturna',
    time: '21:30',
    defaultDish: 'Infusión relajante con nueces de castilla',
    defaultBullets: ['1 taza té de manzanilla o lavanda', '4 mitades nueces de castilla (10g)'],
  },
];

export const ExecutivePdfExportModal: React.FC<ExecutivePdfExportModalProps> = ({
  isOpen,
  onClose,
  plan,
  patient,
  organization,
  specialist,
  showToast,
  initialPhotoCustomizerOpen,
  initialDayIdx,
  initialTab,
  onPlanUpdate,
  readOnly = false,
}) => {
  const [currentPlan, setCurrentPlan] = useState<NutritionPlan>(plan);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [customPhotos, setCustomPhotos] = useState<Record<string, string>>(() => getSavedMealPhotos(plan?.id || ''));
  const [selectedDayIdx, setSelectedDayIdx] = useState(initialDayIdx ?? 0);
  const [activeTab, setActiveTab] = useState<'download' | 'editor' | 'photos'>(
    readOnly ? 'download' : (initialTab || (initialPhotoCustomizerOpen ? 'photos' : 'download'))
  );
  const effectiveTab: 'download' | 'editor' | 'photos' = readOnly ? 'download' : activeTab;

  // Photo editing states
  const [editingUrlKey, setEditingUrlKey] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [processingPhotoKey, setProcessingPhotoKey] = useState<string | null>(null);

  // States for adding a colación / meal
  const [isAddingMealOpen, setIsAddingMealOpen] = useState(false);
  const [insertAfterMealIdx, setInsertAfterMealIdx] = useState<number | null>(null);
  const [newMealName, setNewMealName] = useState('Colación Matutina');
  const [newMealTime, setNewMealTime] = useState('11:00');
  const [newDishTitle, setNewDishTitle] = useState('Manzana verde con canela y almendras tostadas');
  const [newBulletsText, setNewBulletsText] = useState('1 manzana verde mediana\n12 almendras naturales tostadas');
  const [applyToAllDays, setApplyToAllDays] = useState(true);

  // Inline editing states for existing meals in Editor tab
  const [editingMealMetaKey, setEditingMealMetaKey] = useState<string | null>(null); // dayIdx_mealIdx
  const [tempMealName, setTempMealName] = useState('');
  const [tempMealTime, setTempMealTime] = useState('');

  const [editingTitleKey, setEditingTitleKey] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  const [editingBulletsKey, setEditingBulletsKey] = useState<string | null>(null);
  const [tempBullets, setTempBullets] = useState('');

  // Editing General Clinical Notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [generalNotesText, setGeneralNotesText] = useState(plan.generalInstructions || '');
  const [planTitleText, setPlanTitleText] = useState(plan.title || '');
  const [waterLitersValue, setWaterLitersValue] = useState(plan.targetWaterLiters || 2.5);

  // Delivery Modal State (Solo Descarga vs Enviar por WhatsApp)
  const [deliveryModalDoc, setDeliveryModalDoc] = useState<'dossier' | 'weekly-landscape' | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState(patient.whatsapp || patient.phone || '');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsappSentSuccess, setWhatsappSentSuccess] = useState(false);

  useEffect(() => {
    if (plan) {
      // Sanitize plan meals to remove any legacy emojis or corrupted mojibake symbols
      const sanitized = JSON.parse(JSON.stringify(plan)) as NutritionPlan;
      if (sanitized.days) {
        sanitized.days.forEach((d) => {
          (d.meals || []).forEach((m) => {
            if (m.name) m.name = cleanPdfText(m.name);
            if (m.suggestedTime) m.suggestedTime = cleanPdfText(m.suggestedTime);
          });
        });
      }
      setCurrentPlan(sanitized);
      setCustomPhotos(getSavedMealPhotos(plan.id || ''));
      setGeneralNotesText(plan.generalInstructions || '');
      setPlanTitleText(plan.title || '');
      setWaterLitersValue(plan.targetWaterLiters || 2.5);
    }
  }, [plan]);

  useEffect(() => {
    if (readOnly) {
      setActiveTab('download');
      return;
    }
    if (initialPhotoCustomizerOpen) {
      setActiveTab('photos');
    }
  }, [initialPhotoCustomizerOpen, readOnly]);

  useEffect(() => {
    if (readOnly) {
      setActiveTab('download');
      return;
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, readOnly]);

  useEffect(() => {
    if (initialDayIdx !== undefined) {
      setSelectedDayIdx(initialDayIdx);
    }
  }, [initialDayIdx]);

  if (!isOpen) return null;

  // Extract shopping items from plan recipes
  const getShoppingItems = (): string[] => {
    const collected: string[] = [];
    (currentPlan.days || []).forEach((d) => {
      (d.meals || []).forEach((m) => {
        (m.items || []).forEach((it) => {
          collected.push(`${it.name} (${it.portionDescription || '1 porción'})`);
        });
      });
    });
    return Array.from(new Set(collected));
  };

  // Helper to extract meal data for a day and meal index
  const getMealData = (dayIdx: number, mealIdx: number) => {
    const sample = DEFAULT_WEEKLY_MEAL_PRESETS[mealIdx] || DEFAULT_WEEKLY_MEAL_PRESETS[0];
    const mName = mealIdx === 0 ? 'Desayuno' : mealIdx === 1 ? 'Colación' : mealIdx === 2 ? 'Comida' : 'Cena';
    const mTime = mealIdx === 0 ? '08:00' : mealIdx === 1 ? '11:00' : mealIdx === 2 ? '14:30' : '20:30';

    if (currentPlan.days && currentPlan.days[dayIdx] && currentPlan.days[dayIdx].meals && currentPlan.days[dayIdx].meals[mealIdx]) {
      const m = currentPlan.days[dayIdx].meals[mealIdx];
      let title = m.items && m.items.length > 0 ? m.items[0].name : m.name;
      if (title) {
        title = title.trim().replace(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?|\d+\/\d+)\s+/i, '$2 ');
      }
      const bullets = (m.items || []).map((it) => formatCleanItemDescription(it)).filter(Boolean);
      return {
        mealId: m.id,
        mealName: m.name || mName,
        suggestedTime: m.suggestedTime || mTime,
        dishTitle: title,
        bullets: bullets.length > 0 ? bullets : (sample ? sample.days[dayIdx]?.bullets : []),
        rawPhotoUrl: (m as any).photoUrl,
        itemsCount: m.items?.length || 0,
      };
    }

    return {
      mealId: `default-${mealIdx}`,
      mealName: mName,
      suggestedTime: mTime,
      dishTitle: sample?.days[dayIdx]?.dishTitle || 'Platillo balanceado',
      bullets: sample?.days[dayIdx]?.bullets || [],
      rawPhotoUrl: undefined,
      itemsCount: 1,
    };
  };

  // Ensure currentPlan.days is initialized with 7 days if empty
  const ensureDaysStructure = (draft: NutritionPlan) => {
    if (!draft.days || draft.days.length < 7) {
      const existing = draft.days || [];
      draft.days = DAYS_CONFIG.map((d, idx) => {
        return existing[idx] || {
          id: `day-${idx + 1}`,
          dayOfWeek: idx + 1,
          dayName: d.name,
          meals: [],
        };
      });
    }
  };

  // Handlers for modifying meals & colaciones
  const handleSaveTitle = (dayIdx: number, mealIdx: number) => {
    if (!tempTitle.trim()) {
      setEditingTitleKey(null);
      return;
    }
    const updated = JSON.parse(JSON.stringify(currentPlan)) as NutritionPlan;
    ensureDaysStructure(updated);
    if (!updated.days[dayIdx].meals[mealIdx]) {
      setEditingTitleKey(null);
      return;
    }
    const m = updated.days[dayIdx].meals[mealIdx];
    if (!m.items || m.items.length === 0) {
      m.items = [{
        id: `item-${Date.now()}`,
        name: tempTitle.trim(),
        portionDescription: tempTitle.trim(),
        portionQuantity: 1,
        energyKcal: 150,
        proteinG: 10,
        carbsG: 15,
        fatG: 5,
        itemType: 'FOOD',
      }];
    } else {
      m.items[0].name = tempTitle.trim();
    }

    setCurrentPlan(updated);
    storageService.saveNutritionPlan(updated);
    onPlanUpdate?.(updated);
    setEditingTitleKey(null);
    showToast('Título Actualizado', 'El nombre del platillo se modificó para el PDF.', 'success');
  };

  const handleSaveMealMeta = (dayIdx: number, mealIdx: number) => {
    if (!tempMealName.trim()) {
      setEditingMealMetaKey(null);
      return;
    }
    const updated = JSON.parse(JSON.stringify(currentPlan)) as NutritionPlan;
    ensureDaysStructure(updated);
    if (updated.days[dayIdx].meals[mealIdx]) {
      updated.days[dayIdx].meals[mealIdx].name = cleanPdfText(tempMealName.trim());
      updated.days[dayIdx].meals[mealIdx].suggestedTime = cleanPdfText(tempMealTime.trim()) || 'Libre';
    }

    setCurrentPlan(updated);
    storageService.saveNutritionPlan(updated);
    onPlanUpdate?.(updated);
    setEditingMealMetaKey(null);
    showToast('Tiempo Actualizado', 'Se actualizó el nombre y horario del tiempo de comida.', 'success');
  };

  const handleSaveBullets = (dayIdx: number, mealIdx: number) => {
    const updated = JSON.parse(JSON.stringify(currentPlan)) as NutritionPlan;
    ensureDaysStructure(updated);
    if (!updated.days[dayIdx].meals[mealIdx]) {
      setEditingBulletsKey(null);
      return;
    }
    const m = updated.days[dayIdx].meals[mealIdx];
    const lines = tempBullets.split('\n').map((l) => l.trim().replace(/^[\*\•\-]\s*/, '')).filter(Boolean);
    const existingDishName = m.items && m.items.length > 0 ? m.items[0].name : (m.name || 'Platillo');

    m.items = lines.map((line, idx) => ({
      id: `item-bullet-${Date.now()}-${idx}`,
      name: idx === 0 ? existingDishName : line,
      portionDescription: line,
      portionQuantity: 1,
      energyKcal: Math.round(180 / Math.max(1, lines.length)),
      proteinG: 5,
      carbsG: 12,
      fatG: 3,
      itemType: 'FOOD',
    }));

    setCurrentPlan(updated);
    storageService.saveNutritionPlan(updated);
    onPlanUpdate?.(updated);
    setEditingBulletsKey(null);
    showToast('Ingredientes Actualizados', 'Las porciones e ingredientes se sincronizaron con el PDF.', 'success');
  };

  const handleDeleteMeal = (dayIdx: number, mealIdx: number) => {
    const updated = JSON.parse(JSON.stringify(currentPlan)) as NutritionPlan;
    if (!updated.days || !updated.days[dayIdx] || !updated.days[dayIdx].meals) return;
    const removedName = updated.days[dayIdx].meals[mealIdx]?.name || 'Tiempo de comida';
    updated.days[dayIdx].meals.splice(mealIdx, 1);

    // Re-index meal orders
    updated.days[dayIdx].meals.forEach((m, idx) => {
      m.mealOrder = idx + 1;
    });

    setCurrentPlan(updated);
    storageService.saveNutritionPlan(updated);
    onPlanUpdate?.(updated);
    showToast('Tiempo Eliminado', `Se quitó "${removedName}" del PDF para este día.`, 'info');
  };

  const handleReplicateMealToAllDays = (sourceDayIdx: number, mealIdx: number) => {
    const updated = JSON.parse(JSON.stringify(currentPlan)) as NutritionPlan;
    ensureDaysStructure(updated);
    const sourceMeal = updated.days[sourceDayIdx]?.meals[mealIdx];
    if (!sourceMeal) return;

    [0, 1, 2, 3, 4, 5, 6].forEach((dIdx) => {
      if (dIdx === sourceDayIdx) return;
      const cloneMeal = JSON.parse(JSON.stringify(sourceMeal));
      cloneMeal.id = `meal-rep-${dIdx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      cloneMeal.items = (cloneMeal.items || []).map((it: any) => ({
        ...it,
        id: `item-rep-${dIdx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      }));

      if (updated.days[dIdx].meals[mealIdx]) {
        updated.days[dIdx].meals[mealIdx] = cloneMeal;
      } else {
        updated.days[dIdx].meals.push(cloneMeal);
      }
    });

    setCurrentPlan(updated);
    storageService.saveNutritionPlan(updated);
    onPlanUpdate?.(updated);
    showToast('Platillo Replicado', `Se replicó "${sourceMeal.name}" a los 7 días de la semana en el PDF.`, 'success');
  };

  // Open modal to add a colación between meals
  const handleOpenAddMeal = (afterIdx: number | null = null, preset?: ColacionPreset) => {
    setInsertAfterMealIdx(afterIdx);
    const chosenPreset = preset || COLACION_PRESETS[0];
    setNewMealName(chosenPreset.name);
    setNewMealTime(chosenPreset.time);
    setNewDishTitle(chosenPreset.defaultDish);
    setNewBulletsText(chosenPreset.defaultBullets.join('\n'));
    setIsAddingMealOpen(true);
  };

  const handleApplyAddMealOrColacion = () => {
    const updated = JSON.parse(JSON.stringify(currentPlan)) as NutritionPlan;
    ensureDaysStructure(updated);

    const targetDaysIndices = applyToAllDays ? [0, 1, 2, 3, 4, 5, 6] : [selectedDayIdx];

    targetDaysIndices.forEach((dIdx) => {
      const dayMeals = updated.days[dIdx].meals || [];
      const bulletsLines = newBulletsText.split('\n').map((l) => l.trim().replace(/^[\*\•\-]\s*/, '')).filter(Boolean);
      const dishTitleClean = newDishTitle.trim() || newMealName.replace(/^[^\w\s]+/, '').trim() || 'Colación balanceada';

      const items: any[] = bulletsLines.length > 0
        ? bulletsLines.map((line, itIdx) => ({
            id: `item-${Date.now()}-${dIdx}-${itIdx}`,
            name: itIdx === 0 ? dishTitleClean : line,
            portionDescription: line,
            portionQuantity: 1,
            energyKcal: 60,
            proteinG: 3,
            carbsG: 8,
            fatG: 2,
            itemType: 'FOOD',
          }))
        : [{
            id: `item-${Date.now()}-${dIdx}`,
            name: dishTitleClean,
            portionDescription: dishTitleClean,
            portionQuantity: 1,
            energyKcal: 120,
            proteinG: 5,
            carbsG: 15,
            fatG: 4,
            itemType: 'FOOD',
          }];

      const newMeal = {
        id: `meal-${dIdx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: cleanPdfText(newMealName.trim()),
        suggestedTime: cleanPdfText(newMealTime.trim()) || '11:00',
        mealOrder: 1,
        items,
      };

      if (insertAfterMealIdx !== null && insertAfterMealIdx >= 0 && insertAfterMealIdx < dayMeals.length) {
        dayMeals.splice(insertAfterMealIdx + 1, 0, newMeal);
      } else {
        dayMeals.push(newMeal);
      }

      // Re-order mealOrder
      dayMeals.forEach((m, idx) => {
        m.mealOrder = idx + 1;
      });

      updated.days[dIdx].meals = dayMeals;
    });

    setCurrentPlan(updated);
    storageService.saveNutritionPlan(updated);
    onPlanUpdate?.(updated);
    setIsAddingMealOpen(false);
    showToast(
      'Colación Insertada',
      applyToAllDays
        ? `Se añadió "${newMealName}" a los 7 días de la semana y al PDF.`
        : `Se añadió "${newMealName}" al día seleccionado en el PDF.`,
      'success'
    );
  };

  // Helper to get display photo info
  const getMealPhotoInfo = (dayIdx: number, mealIdx: number, dishTitle: string, mealName: string) => {
    const key = `${dayIdx}_${mealIdx}`;
    const custom = customPhotos[key];
    if (custom) {
      return { url: custom, isCustom: true };
    }
    const mealData = getMealData(dayIdx, mealIdx);
    if (mealData.rawPhotoUrl) {
      return { url: mealData.rawPhotoUrl, isCustom: true };
    }
    const fallback = generateDishCanvasThumbnail(dishTitle, mealName);
    return { url: fallback, isCustom: false };
  };

  // Upload photo from device (PNG, JPG, WEBP)
  const handleFileUpload = async (dayIdx: number, mealIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = `${dayIdx}_${mealIdx}`;
    setProcessingPhotoKey(key);

    try {
      const optimizedRes = await optimizeMealPhoto(file);
      const dataUrl = typeof optimizedRes === 'string' ? optimizedRes : optimizedRes.dataUrl;
      const updated: Record<string, string> = { ...customPhotos, [key]: dataUrl };
      setCustomPhotos(updated);
      saveMealPhotos(plan?.id || '', updated);
      showToast(
        'Foto Asignada',
        `Se vinculó la fotografía para ${DAYS_CONFIG[dayIdx].name} (${file.name})`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      showToast('Error', err.message || 'No se pudo procesar la foto', 'error');
    } finally {
      setProcessingPhotoKey(null);
      e.target.value = '';
    }
  };

  // Save URL for a meal photo
  const handleSaveUrl = (dayIdx: number, mealIdx: number) => {
    const key = `${dayIdx}_${mealIdx}`;
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setEditingUrlKey(null);
      return;
    }
    const updated = { ...customPhotos, [key]: trimmed };
    setCustomPhotos(updated);
    saveMealPhotos(plan?.id || '', updated);
    setEditingUrlKey(null);
    setInputUrl('');
    showToast(
      'Enlace Guardado',
      `Se vinculó la foto desde internet para ${DAYS_CONFIG[dayIdx].name}`,
      'success'
    );
  };

  // Reset a specific photo
  const handleResetPhoto = (dayIdx: number, mealIdx: number) => {
    const key = `${dayIdx}_${mealIdx}`;
    const updated = { ...customPhotos };
    delete updated[key];
    setCustomPhotos(updated);
    saveMealPhotos(plan?.id || '', updated);
    showToast('Foto Restablecida', `Se restauró la ilustración automática para ${DAYS_CONFIG[dayIdx].name}`, 'info');
  };

  const handleResetAllPhotos = () => {
    setCustomPhotos({});
    saveMealPhotos(plan?.id || '', {});
    showToast('Fotos Restablecidas', 'Todos los platillos usarán sus ilustraciones automáticas', 'info');
  };

  // Save General Clinical Notes
  const handleSaveGeneralNotes = () => {
    const updated = JSON.parse(JSON.stringify(currentPlan)) as NutritionPlan;
    updated.title = planTitleText.trim() || 'Plan de Alimentación';
    updated.generalInstructions = generalNotesText;
    updated.targetWaterLiters = Number(waterLitersValue) || 2.5;

    setCurrentPlan(updated);
    storageService.saveNutritionPlan(updated);
    onPlanUpdate?.(updated);
    setIsEditingNotes(false);
    showToast('Notas Clínicas Guardadas', 'Las recomendaciones generales del PDF han sido actualizadas.', 'success');
  };

  // 1. Weekly Schedule Landscape (Identical to user's screenshots)
  const handleDownloadWeeklyLandscape = async () => {
    setDownloadingType('weekly-landscape');
    try {
      await pdfService.generateWeeklyScheduleLandscapePdf(currentPlan, patient, organization, specialist, customPhotos);
      if (isMobileOrAndroid()) {
        showToast(
          'PDF Preparado',
          'Se ha abierto el menú de compartir. Puedes guardarlo en tu dispositivo o enviarlo por WhatsApp.',
          'success'
        );
      } else {
        showToast(
          'Planeación Semanal Generada',
          'Descargando PDF horizontal con fotografías de platillos y columnas de colores',
          'success'
        );
      }
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo generar la planeación semanal', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  // 2. Full Clinical Dossier
  const handleDownloadFullDossier = async () => {
    setDownloadingType('dossier');
    try {
      await pdfService.generateNutritionPlanPdf(currentPlan, patient, organization, specialist, 'clinical_modern', customPhotos);
      if (isMobileOrAndroid()) {
        showToast(
          'Dossier PDF Preparado',
          'Se ha abierto el menú de compartir de tu dispositivo para guardarlo o enviarlo.',
          'success'
        );
      } else {
        showToast(
          'Dossier Clínico Generado',
          'Descargando expediente clínico integral con planeación semanal y guías',
          'success'
        );
      }
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo generar el documento', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  // Delivery Modal Handlers (Solo Descarga vs Enviar por WhatsApp)
  const handleOpenDeliveryModal = (docType: 'dossier' | 'weekly-landscape') => {
    setDeliveryModalDoc(docType);
    setWhatsappSentSuccess(false);
    const initialPhone = patient.whatsapp || patient.phone || '';
    setWhatsappPhone(initialPhone);
    const patientName = patient.firstName || 'estimado(a) paciente';
    const clinicName = organization.name || 'nuestro consultorio';
    const specialistName = specialist.firstName ? `${specialist.firstName} ${specialist.lastName || ''}`.trim() : 'tu especialista en nutrición';
    const docName = docType === 'dossier' ? 'Dossier Clínico Integral y Plan Nutricional' : 'Planeación Semanal de Alimentación con Fotos';

    const greeting = readOnly
      ? `¡Hola! 👋 Te comparto mi ${docName} personalizado elaborado en ${clinicName}.\n\n`
      : `¡Hola ${patientName}! 👋 Te comparto tu ${docName} personalizado elaborado en ${clinicName} por ${specialistName}.\n\n`;

    setWhatsappMessage(
      greeting +
      `🎯 Objetivo: ${currentPlan.goal || 'Salud y bienestar'}\n` +
      `🔥 Meta energética: ${currentPlan.targetCaloriesKcal || 2000} kcal/día\n\n` +
      `Cualquier duda con tiempos de comida o porciones, con gusto la revisamos. ¡Mucho éxito con el plan! 🥦✨`
    );
  };

  const handleExecuteSoloDescarga = async () => {
    if (deliveryModalDoc === 'dossier') {
      await handleDownloadFullDossier();
    } else {
      await handleDownloadWeeklyLandscape();
    }
    setDeliveryModalDoc(null);
  };

  const handleExecuteSendWhatsApp = async () => {
    if (!whatsappPhone.trim()) {
      showToast('Teléfono Requerido', 'Por favor ingresa o confirma el número de WhatsApp del paciente.', 'error');
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      let exportResult: PdfExportResult;
      if (deliveryModalDoc === 'dossier') {
        exportResult = await pdfService.generateNutritionPlanPdf(currentPlan, patient, organization, specialist, 'clinical_modern', customPhotos, { autoSave: true });
      } else {
        exportResult = await pdfService.generateWeeklyScheduleLandscapePdf(currentPlan, patient, organization, specialist, customPhotos, { autoSave: true });
      }

      let cleanPhone = whatsappPhone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = `52${cleanPhone}`;
      }

      const encodedMsg = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      const pdfFile = new File([exportResult.blob], exportResult.fileName, { type: 'application/pdf' });
      let sharedNatively = false;

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: exportResult.fileName,
            text: whatsappMessage,
          });
          sharedNatively = true;
          showToast('Compartido con Éxito', 'El archivo PDF y mensaje se abrieron en WhatsApp.', 'success');
        } catch (shareErr: any) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Web Share failed, falling back to WhatsApp Web link', shareErr);
          }
        }
      }

      if (!sharedNatively) {
        window.open(whatsappUrl, '_blank');
        showToast(
          'WhatsApp Abierto & PDF Descargado',
          'El PDF se guardó en tu equipo y se abrió el chat de WhatsApp. Arrastra el archivo a la ventana para enviarlo.',
          'success'
        );
      }

      setWhatsappSentSuccess(true);
    } catch (err: any) {
      console.error(err);
      showToast('Error', err.message || 'No se pudo generar el envío', 'error');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // 3. SMAE Educational Guide
  const handleDownloadSmaeGuide = async () => {
    setDownloadingType('smae');
    try {
      await pdfService.generateSmaeGuidePdf(currentPlan, patient, organization, specialist);
      showToast('Guía SMAE Generada', 'Descargando guía explicativa con tabla de intercambios', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo generar el documento', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  // 4. Smart Shopping List
  const handleDownloadShopping = async () => {
    setDownloadingType('shopping');
    try {
      const items = getShoppingItems();
      await pdfService.generateShoppingListPdf(items, `${patient.firstName} ${patient.lastName}`, organization);
      showToast('Lista Generada', 'Descargando lista de compras clasificada para el supermercado', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo generar el documento', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  // 5. Weekly Meal Plan & Detailed Recipes PDF
  const handleDownloadMealPlan = async () => {
    setDownloadingType('meal-plan');
    try {
      await pdfService.generateMealPlanPdf(currentPlan, patient, organization, specialist, 'clinical_modern');
      if (isMobileOrAndroid()) {
        showToast('Recetario Preparado', 'Menú y recetario generado para compartir o descargar.', 'success');
      } else {
        showToast('Recetario Semanal Generado', 'Descargando plan con recetas detalladas e ingredientes específicos.', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo generar el recetario semanal.', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  const customCount = Object.keys(customPhotos).filter((k) => !!customPhotos[k]).length;
  const currentDayMeals = currentPlan.days?.[selectedDayIdx]?.meals || [];
  const currentDayKcal = currentDayMeals.reduce(
    (sum, m) => sum + (m.items || []).reduce((is, it) => is + (it.energyKcal || 0), 0),
    0
  );
  const currentDayProt = currentDayMeals.reduce(
    (sum, m) => sum + (m.items || []).reduce((is, it) => is + (it.proteinG || 0), 0),
    0
  ).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 px-6 py-4 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold tracking-tight">Centro de Exportación & Edición PDF</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
                  Alta Definición
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Edita colaciones, platillos, porciones y notas o descarga el PDF final
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs Bar / Header */}
        {readOnly ? (
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/40">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-extrabold text-xs text-emerald-950 dark:text-emerald-100">
                Centro de Descarga Oficial & Envío por WhatsApp
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dossier Oficial Prescrito</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center px-6 pt-2.5 pb-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 gap-2 shrink-0 overflow-x-auto scrollbar-thin">
            <button
              type="button"
              onClick={() => setActiveTab('download')}
              className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'download'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-4 h-4 text-emerald-500" />
              <span>Editar PDF & Colaciones</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Personalizar
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'photos'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4 text-purple-500" />
              <span>Personalizar Fotos</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                {customCount}
              </span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Patient Quick Info Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">Paciente:</span>
              <span className="text-slate-600 dark:text-slate-400">
                {patient.firstName} {patient.lastName} ({patient.currentWeight || 70} kg •{' '}
                <strong className="text-sky-600 dark:text-sky-400 font-extrabold">
                  {currentPlan.targetCaloriesKcal || 1800} kcal
                </strong>
                )
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Membrete Oficial, Cédula Profesional y QR Digital</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: DOWNLOAD PDF FORMATS (DEFAULT OVERVIEW) */}
          {/* ======================================================== */}
          {effectiveTab === 'download' && (
            <div className="space-y-4 animate-fade-in">
              {readOnly ? (
                /* FEATURED FOR PATIENT: FULL CLINICAL DOSSIER (READ ONLY) */
                <div className="p-5 rounded-3xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> DOSSIER CLÍNICO INTEGRAL
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
                      Formato Horizontal Ejecutivo
                    </span>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                      Dossier Nutricional Completo con Membrete y Firma (Horizontal)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Tu expediente clínico integral personalizado: portada oficial con QR, somatometría y metas calóricas, tarjetas Bento de equivalencias SMAE, recetas y menús de Lunes a Domingo prescritos por tu especialista. <strong>Todas las páginas en formato apaisado (landscape) profesional.</strong>
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadFullDossier}
                      disabled={downloadingType !== null}
                      className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {downloadingType === 'dossier'
                          ? 'Generando Dossier Completo...'
                          : 'Descargar Dossier Completo (PDF)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDeliveryModal('dossier')}
                      disabled={downloadingType !== null}
                      className="py-3.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Enviar Dossier a mi WhatsApp</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* FEATURED FOR SPECIALIST: Landscape Weekly Schedule with Edit Access */
                <div className="p-5 rounded-3xl border-2 border-sky-500 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/50 dark:from-sky-950/40 dark:via-slate-900 dark:to-indigo-950/30 shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> FORMATO HORIZONTAL LANDSCAPE
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar colaciones e ingredientes antes de descargar</span>
                    </button>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-sky-600" />
                      Planeación Semanal con Fotos & Columnas de Colores
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Diseño apaisado con título <strong>"Planeación semanal"</strong>, tabla de 8 columnas con encabezados de colores (Horario, Lunes a Domingo), fondos en tonos pastel, <strong>fotografías de cada platillo</strong> en las casillas y listas de porciones limpias.
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className="py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-emerald-600" />
                      <span>Editar Colaciones & Tiempos de Comida</span>
                    </button>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenDeliveryModal('weekly-landscape')}
                        disabled={downloadingType !== null}
                        className="py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          {downloadingType === 'weekly-landscape'
                            ? 'Generando Planeación con Fotos...'
                            : 'Descargar Planeación Semanal con Fotos'}
                        </span>
                      </button>
                      <div className="flex items-center justify-end gap-2 pr-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDeliveryModal('weekly-landscape')}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Opciones: Solo Descarga o Enviar por WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other PDF formats */}
              <div>
                <h4 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Otros Formatos Clínicos Disponibles
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {readOnly ? (
                    /* Weekly Landscape card for Patient */
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                            Menú Visual
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">Horizontal</span>
                        </div>
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                          Planeación con Fotos
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          Tabla apaisada de Lunes a Domingo con fotos de platillos e ingredientes por tiempo de comida.
                        </p>
                      </div>
                      <div className="mt-3 flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadWeeklyLandscape()}
                          disabled={downloadingType !== null}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeliveryModal('weekly-landscape')}
                          className="w-full py-1.5 px-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>Enviar a WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Full Clinical Dossier for Specialist */
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            100% Horizontal
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">Landscape</span>
                        </div>
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          Dossier Clínico Integral (Horizontal)
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          Expediente maestro apaisado: ficha antropométrica, planeación semanal con fotos, tarjetas SMAE y firma digital.
                        </p>
                      </div>
                      <div className="mt-3 flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDeliveryModal('dossier')}
                          disabled={downloadingType !== null}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                          title="Abrir opciones de descarga o envío por WhatsApp"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Dossier Completo</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={handleDownloadFullDossier}
                            disabled={downloadingType !== null}
                            className="py-1 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            title="Descargar PDF directamente en este equipo"
                          >
                            <Download className="w-3 h-3 text-slate-500" />
                            <span>Solo Descarga</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDeliveryModal('dossier')}
                            className="py-1 px-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                            title="Enviar al paciente por WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>Por WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recetario Semanal y Menú Clínico */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Recetas & Gramajes
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Detallado</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                        Recetario Semanal Clínico
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Menú semanal con ingredientes específicos, medidas caseras, gramajes exactos y modo de preparación.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadMealPlan}
                      disabled={downloadingType !== null}
                      className="mt-3 w-full py-2 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3 h-3 text-emerald-600" />
                      <span>{downloadingType === 'meal-plan' ? 'Generando...' : 'Descargar Recetario'}</span>
                    </button>
                  </div>

                  {/* SMAE Guide */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Educativo
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">~3 Págs</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        Guía Educativa SMAE
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Infografía moderna en tarjetas Bento Cards con cálculo de déficit y tabla de intercambios.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSmaeGuide}
                      disabled={downloadingType !== null}
                      className="mt-3 w-full py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3 h-3 text-amber-600" />
                      <span>{downloadingType === 'smae' ? 'Generando...' : 'Guía SMAE'}</span>
                    </button>
                  </div>

                  {/* Shopping List */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                          Despensa
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">~1 Pág</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-teal-600" />
                        Lista de Supermercado
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Lista clasificada de alimentos por pasillo para llevar en las compras del súper.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadShopping}
                      disabled={downloadingType !== null}
                      className="mt-3 w-full py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3 h-3 text-teal-600" />
                      <span>{downloadingType === 'shopping' ? 'Generando...' : 'Lista de Súper'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: FULL PDF & MEALS/COLACIONES EDITOR */}
          {/* ======================================================== */}
          {effectiveTab === 'editor' && (
            <div className="space-y-5 animate-fade-in text-xs">
              {/* Day Selector Pills Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Selecciona el día a editar en el PDF:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddMeal(null)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insertar Nueva Colación</span>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {DAYS_CONFIG.map((day, dIdx) => {
                    const isSelected = selectedDayIdx === dIdx;
                    const dMeals = currentPlan.days?.[dIdx]?.meals || [];
                    return (
                      <button
                        key={day.name}
                        type="button"
                        onClick={() => setSelectedDayIdx(dIdx)}
                        className={`py-2 px-1 rounded-2xl text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white shadow-sm'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        }`}
                        style={{
                          backgroundColor: isSelected ? day.color : undefined,
                          color: isSelected ? '#ffffff' : undefined,
                          borderColor: !isSelected ? day.color + '40' : undefined,
                        }}
                      >
                        <span className="truncate w-full text-[11px] sm:text-xs font-extrabold">{day.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {dMeals.length} comidas
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day Metrics Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm">
                    {DAYS_CONFIG[selectedDayIdx].name.slice(0, 1)}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Menú para {DAYS_CONFIG[selectedDayIdx].name}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentDayMeals.length} tiempos de comida configurados • Los cambios se guardan y reflejan de inmediato en el PDF.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    {currentDayKcal} kcal
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold font-mono text-slate-700 dark:text-slate-300">
                    {currentDayProt}g Proteína
                  </span>
                </div>
              </div>

              {/* Chronological Meals Timeline */}
              <div className="space-y-3">
                {currentDayMeals.map((meal, mealIdx) => {
                  const mealData = getMealData(selectedDayIdx, mealIdx);
                  const isEditingMeta = editingMealMetaKey === `${selectedDayIdx}_${mealIdx}`;
                  const isEditingTitle = editingTitleKey === `${selectedDayIdx}_${mealIdx}`;
                  const isEditingBullets = editingBulletsKey === `${selectedDayIdx}_${mealIdx}`;

                  return (
                    <React.Fragment key={meal.id || mealIdx}>
                      {/* Insertion separator before first meal or between meals */}
                      <div className="relative py-1 flex items-center justify-center group">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenAddMeal(mealIdx - 1)}
                          className="relative px-3 py-1 bg-white dark:bg-slate-900 border border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 rounded-full font-bold text-[10px] flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer opacity-70 hover:opacity-100"
                        >
                          <Plus className="w-3 h-3 text-emerald-500" />
                          <span>Insertar colación aquí</span>
                        </button>
                      </div>

                      {/* Meal Card */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-sky-300 dark:hover:border-sky-800 transition-all">
                        {/* Meal Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
                          {isEditingMeta ? (
                            <div className="flex items-center gap-2 flex-1 animate-fade-in">
                              <input
                                type="text"
                                value={tempMealName}
                                onChange={(e) => setTempMealName(e.target.value)}
                                placeholder="Nombre (ej. 🍏 Colación Matutina)"
                                className="px-2.5 py-1 text-xs rounded-lg border border-emerald-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold flex-1"
                              />
                              <input
                                type="text"
                                value={tempMealTime}
                                onChange={(e) => setTempMealTime(e.target.value)}
                                placeholder="Horario (ej. 11:00)"
                                className="w-24 px-2 py-1 text-xs rounded-lg border border-emerald-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveMealMeta(selectedDayIdx, mealIdx)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingMealMetaKey(null)}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{meal.name}</span>
                              </span>
                              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {meal.suggestedTime || 'Libre'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMealMetaKey(`${selectedDayIdx}_${mealIdx}`);
                                  setTempMealName(meal.name || 'Colación');
                                  setTempMealTime(meal.suggestedTime || '11:00');
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                title="Editar nombre u horario"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Quick Card Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleReplicateMealToAllDays(selectedDayIdx, mealIdx)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:text-emerald-700 font-semibold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                              title="Replicar este platillo a toda la semana"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Replicar a la semana</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMeal(selectedDayIdx, mealIdx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                              title="Eliminar este tiempo de comida"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dish Title Section */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Título del Platillo (Nombre que aparece en la casilla del PDF):
                          </span>

                          {isEditingTitle ? (
                            <div className="flex items-center gap-2 animate-fade-in">
                              <input
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-sky-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(selectedDayIdx, mealIdx);
                                  if (e.key === 'Escape') setEditingTitleKey(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveTitle(selectedDayIdx, mealIdx)}
                                className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTitleKey(null)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 group">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                {mealData.dishTitle}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTitleKey(`${selectedDayIdx}_${mealIdx}`);
                                  setTempTitle(mealData.dishTitle);
                                }}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>Cambiar</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Ingredients & Bullets Section */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Ingredientes y Porciones Limpias (Viñetas del PDF):
                            </span>
                            {!isEditingBullets && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBulletsKey(`${selectedDayIdx}_${mealIdx}`);
                                  setTempBullets((mealData.bullets || []).join('\n'));
                                }}
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>Editar viñetas</span>
                              </button>
                            )}
                          </div>

                          {isEditingBullets ? (
                            <div className="space-y-2 animate-fade-in">
                              <textarea
                                value={tempBullets}
                                onChange={(e) => setTempBullets(e.target.value)}
                                rows={Math.max(3, tempBullets.split('\n').length)}
                                placeholder="Escribe un ingrediente por línea, ej:&#10;2 huevos enteros&#10;1 taza espinaca fresca&#10;2 tortillas de maíz"
                                className="w-full p-2.5 text-xs rounded-xl border border-emerald-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono leading-relaxed"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveBullets(selectedDayIdx, mealIdx)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" /> Guardar Viñetas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingBulletsKey(null)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 space-y-1">
                              {mealData.bullets && mealData.bullets.length > 0 ? (
                                mealData.bullets.map((b, bIdx) => (
                                  <div key={bIdx} className="flex items-start gap-1.5 text-[11px]">
                                    <span className="text-emerald-500 font-bold">•</span>
                                    <span>{b}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  Sin ingredientes específicos. Se utilizará la pauta clínica.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Final insertion separator after last meal */}
                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800"></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddMeal(currentDayMeals.length - 1, COLACION_PRESETS[5])}
                    className="relative px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 text-purple-700 dark:text-purple-400 rounded-full font-bold text-[11px] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insertar Colación Nocturna al final</span>
                  </button>
                </div>
              </div>

              {/* Edit General Clinical Notes & PDF Cover Info */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Recomendaciones Generales & Pautas del PDF
                    </span>
                  </div>
                  {!isEditingNotes && (
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(true)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar Textos del PDF</span>
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-3 animate-fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Título del Plan Nutricional:
                      </label>
                      <input
                        type="text"
                        value={planTitleText}
                        onChange={(e) => setPlanTitleText(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-sky-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          Meta de Hidratación (Litros/día):
                        </label>
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-sky-500" />
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="6"
                            value={waterLitersValue}
                            onChange={(e) => setWaterLitersValue(parseFloat(e.target.value) || 2)}
                            className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-center font-bold"
                          />
                          <span className="text-slate-500 text-xs">Litros al día</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Pautas e Instrucciones Clínicas Generales (Aparecen en la portada y resumen del PDF):
                      </label>
                      <textarea
                        value={generalNotesText}
                        onChange={(e) => setGeneralNotesText(e.target.value)}
                        rows={4}
                        className="w-full p-2.5 text-xs rounded-xl border border-sky-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveGeneralNotes}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Guardar Cambios en el PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingNotes(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-pre-line text-[11px] leading-relaxed max-h-32 overflow-y-auto">
                    {generalNotesText || 'Pautas clínicas generales adaptadas al perfil del paciente.'}
                  </div>
                )}
              </div>

              {/* Sticky bottom bar inside editor */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Todos los cambios quedan guardados automáticamente para este paciente.</span>
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenDeliveryModal('weekly-landscape')}
                    disabled={downloadingType !== null}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Planeación Semanal (Descarga / WhatsApp)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDeliveryModal('dossier')}
                    disabled={downloadingType !== null}
                    className="py-2.5 px-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dossier Completo (Descarga / WhatsApp)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PHOTO CUSTOMIZATION */}
          {/* ======================================================== */}
          {effectiveTab === 'photos' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Day Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Selecciona el día a personalizar:
                  </span>
                  {customCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAllPhotos}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restablecer todas a ilustraciones
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {DAYS_CONFIG.map((day, dIdx) => {
                    const isSelected = selectedDayIdx === dIdx;
                    return (
                      <button
                        key={day.name}
                        type="button"
                        onClick={() => setSelectedDayIdx(dIdx)}
                        className={`py-2 px-1 rounded-2xl text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white shadow-sm'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        }`}
                        style={{
                          backgroundColor: isSelected ? day.color : undefined,
                          color: isSelected ? '#ffffff' : undefined,
                          borderColor: !isSelected ? day.color + '40' : undefined,
                        }}
                      >
                        <span className="truncate w-full text-[11px] sm:text-xs font-extrabold">{day.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Meals Grid for selected day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {currentDayMeals.map((meal, mealIdx) => {
                  const key = `${selectedDayIdx}_${mealIdx}`;
                  const mealData = getMealData(selectedDayIdx, mealIdx);
                  const photoInfo = getMealPhotoInfo(selectedDayIdx, mealIdx, mealData.dishTitle, mealData.mealName);
                  const isProcessing = processingPhotoKey === key;
                  const isEditingUrl = editingUrlKey === key;

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {meal.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                            {meal.suggestedTime || 'Libre'}
                          </span>
                        </div>

                        {/* Photo Preview Container */}
                        <div className="relative aspect-[160/95] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-2 shadow-2xs">
                          <img
                            src={photoInfo.url}
                            alt={mealData.dishTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                            {photoInfo.isCustom ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                <Check className="w-2.5 h-2.5" /> Foto Personalizada
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900/75 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Ilustración
                              </span>
                            )}
                          </div>

                          {isProcessing && (
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                              <span>Optimizando...</span>
                            </div>
                          )}
                        </div>

                        <div className="mb-2">
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1" title={mealData.dishTitle}>
                            {mealData.dishTitle}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                            {(mealData.bullets || []).join(' • ')}
                          </p>
                        </div>
                      </div>

                      {/* Photo Actions */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <input
                          type="file"
                          id={`file-input-${key}`}
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => handleFileUpload(selectedDayIdx, mealIdx, e)}
                          disabled={isProcessing}
                        />

                        {isEditingUrl ? (
                          <div className="space-y-1.5 animate-fade-in">
                            <input
                              type="url"
                              value={inputUrl}
                              onChange={(e) => setInputUrl(e.target.value)}
                              placeholder="https://... (Pinterest, Unsplash, Google Fotos)"
                              className="w-full px-2 py-1 text-[11px] rounded-lg border border-sky-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveUrl(selectedDayIdx, mealIdx);
                                if (e.key === 'Escape') setEditingUrlKey(null);
                              }}
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveUrl(selectedDayIdx, mealIdx)}
                                disabled={isProcessing || !inputUrl.trim()}
                                className="flex-1 py-1 rounded-lg bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingUrlKey(null); setInputUrl(''); }}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold text-[10px] cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            <label
                              htmlFor={`file-input-${key}`}
                              className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer text-center"
                            >
                              <Upload className="w-3 h-3 text-sky-600" />
                              <span>Subir foto</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingUrlKey(key);
                                setInputUrl(photoInfo.isCustom && photoInfo.url.startsWith('http') ? photoInfo.url : '');
                              }}
                              className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <LinkIcon className="w-3 h-3 text-sky-600" />
                              <span>Pegar link</span>
                            </button>
                          </div>
                        )}

                        {photoInfo.isCustom && !isEditingUrl && (
                          <button
                            type="button"
                            onClick={() => handleResetPhoto(selectedDayIdx, mealIdx)}
                            className="w-full py-1 text-[10px] text-slate-400 hover:text-rose-500 font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Restablecer a ilustración</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal for Inserting a Colación or Meal */}
        {isAddingMealOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-4.5 text-white flex items-center justify-between border-b border-emerald-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <ListPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">
                      Insertar Colación o Tiempo de Comida
                    </h4>
                    <p className="text-[11px] text-emerald-200">
                      {DAYS_CONFIG[selectedDayIdx].name} • Se agregará a la tabla del PDF
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingMealOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {/* Presets Chips */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Elige un tipo rápido o escribe uno personalizado:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COLACION_PRESETS.map((p) => {
                      const isSelected = newMealName === p.name;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setNewMealName(p.name);
                            setNewMealTime(p.time);
                            setNewDishTitle(p.defaultDish);
                            setNewBulletsText(p.defaultBullets.join('\n'));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Nombre del tiempo de comida:
                    </label>
                    <input
                      type="text"
                      value={newMealName}
                      onChange={(e) => setNewMealName(e.target.value)}
                      placeholder="ej. 🍏 Colación Matutina"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Horario sugerido:
                    </label>
                    <input
                      type="text"
                      value={newMealTime}
                      onChange={(e) => setNewMealTime(e.target.value)}
                      placeholder="ej. 11:00"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Dish Title */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Título o Nombre del Platillo:
                  </label>
                  <input
                    type="text"
                    value={newDishTitle}
                    onChange={(e) => setNewDishTitle(e.target.value)}
                    placeholder="ej. Manzana verde con canela y almendras tostadas"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-emerald-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Ingredients Bullets Textarea */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Ingredientes / Viñetas del PDF (un alimento por línea):
                  </label>
                  <textarea
                    value={newBulletsText}
                    onChange={(e) => setNewBulletsText(e.target.value)}
                    rows={3}
                    placeholder="1 manzana verde mediana&#10;12 almendras naturales tostadas"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono leading-relaxed"
                  />
                </div>

                {/* Apply to All Days Checkbox */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                      Aplicar a los 7 días de la semana
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Si se marca, añadirá esta colación de Lunes a Domingo en el PDF.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyToAllDays}
                    onChange={(e) => setApplyToAllDays(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMealOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyAddMealOrColacion}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Insertar Colación en el PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL DE ENTREGA: SOLO DESCARGA VS ENVIAR POR WHATSAPP */}
        {/* ======================================================== */}
        {deliveryModalDoc && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col p-5 sm:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    {deliveryModalDoc === 'dossier' ? (
                      <Layers className="w-5 h-5" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {deliveryModalDoc === 'dossier' ? 'Dossier Clínico Integral' : 'Planeación Semanal con Fotos'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Elige cómo deseas obtener o compartir este plan para {patient.firstName} {patient.lastName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryModalDoc(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Opción 1: Solo Descargar */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Solo Descargar PDF
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Guarda el archivo PDF directamente en tu computadora o dispositivo móvil.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteSoloDescarga}
                  disabled={downloadingType !== null}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shrink-0 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                >
                  {downloadingType ? 'Generando...' : 'Descargar'}
                </button>
              </div>

              {/* Opción 2: Enviar al cliente por WhatsApp */}
              <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <span>Enviar al Cliente por WhatsApp</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-extrabold">Recomendado</span>
                    </h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      Envía el archivo y mensaje personalizado directo a su chat de WhatsApp.
                    </p>
                  </div>
                </div>

                {/* WhatsApp Phone Number */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Número de WhatsApp del Paciente:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="Ej. +52 55 1234 5678"
                      className="w-full pl-3 pr-20 py-2 text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-medium">
                      Editable
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Se detecta automáticamente de la ficha del paciente; puedes ajustarlo con su lada si es necesario.
                  </p>
                </div>

                {/* Customizable Message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Mensaje de Acompañamiento:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(whatsappMessage);
                        showToast('Mensaje Copiado', 'Texto copiado al portapapeles listo para WhatsApp.', 'success');
                      }}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar mensaje</span>
                    </button>
                  </div>
                  <textarea
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-emerald-500"
                  />
                </div>

                {/* Send WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleExecuteSendWhatsApp}
                  disabled={isSendingWhatsApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isSendingWhatsApp ? 'Preparando archivo y abriendo WhatsApp...' : 'Continuar y Abrir WhatsApp'}</span>
                </button>

                {whatsappSentSuccess && (
                  <div className="p-3 bg-emerald-100/80 dark:bg-emerald-900/40 rounded-xl border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">¡PDF generado y WhatsApp abierto!</p>
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                        En celulares se adjunta directamente; en computadoras, el PDF se descargó a tu carpeta de descargas para que solo lo arrastres a la ventana de WhatsApp que se acaba de abrir.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
