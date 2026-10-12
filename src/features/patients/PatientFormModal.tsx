import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Scale,
  Activity,
  AlertCircle,
  FileCheck,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  HeartPulse,
  Upload,
  Camera,
  Trash2,
  Loader2,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  FlaskConical,
  Plus,
  Edit2,
  Apple,
  Utensils,
  BookmarkPlus,
  FileText,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Info,
  Sliders,
  Check,
  Save,
  PieChart,
  FileUp,
  Flame,
  Zap,
} from 'lucide-react';
import {
  Patient,
  RiskLevel,
  PatientStatus,
  AnthropometricRecord,
  ClinicalRecord,
  LaboratoryResult,
  NutritionPlan,
} from '../../types';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { storageService } from '../../lib/storage';
import { optimizeImage, uploadPatientPhotoToSupabase } from '../../lib/imageOptimizer';
import { ClinicalPreset, INITIAL_CLINICAL_PRESETS } from '../ai_copilot/prescriptionPresetsData';
import { SMAE_CONSTANTS, SmaeConstant, computeClinicalEngine, getOmsBmiClassification } from '../../services/clinicalEngineSmae';

const AVATAR_PRESETS = [
  { label: 'Mujer 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', gender: 'F' },
  { label: 'Mujer 2', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80', gender: 'F' },
  { label: 'Mujer 3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', gender: 'F' },
  { label: 'Mujer 4', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', gender: 'F' },
  { label: 'Hombre 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', gender: 'M' },
  { label: 'Hombre 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', gender: 'M' },
  { label: 'Hombre 3', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80', gender: 'M' },
  { label: 'Hombre 4', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80', gender: 'M' },
];

const QUICK_GOALS = [
  'Pérdida de Grasa y Recomposición',
  'Aumento de Masa Muscular (Hipertrofia)',
  'Control Glucémico y Salud Metabólica (SMAE)',
  'Nutrición Deportiva y Rendimiento',
  'Salud Gastrointestinal y Protocolo FODMAPs',
  'Mantenimiento y Estilo de Vida Saludable',
];

const PORTAL_PASSWORD_PRESETS = [
  'Nutri2026!',
  'Saludable26!',
  'Meta2026#',
  'Bienestar26$',
  'FitVida2026!',
];

const ALLERGIES_PRESETS = [
  'Lactosa',
  'Gluten',
  'Mariscos',
  'Frutos secos',
  'Huevo',
  'Cacahuate',
  'Soya',
  'Pescado',
];

const PATHOLOGY_PRESETS = [
  'Resistencia a la Insulina',
  'Diabetes Tipo 2',
  'Hipertensión Arterial',
  'Hipotiroidismo',
  'Dislipidemia',
  'Hígado Graso',
  'Síndrome de Ovario Poliquístico (SOP)',
  'Gastritis / Colitis',
];

export interface ClinicalStudyItem {
  id: string;
  name: string;
  code?: string;
  value: number | string;
  unit: string;
  refRange: string;
  minNormal?: number;
  maxNormal?: number;
}

const INITIAL_STUDIES: ClinicalStudyItem[] = [
  { id: 'study-glucose', name: 'Glucosa en ayuno', code: 'glucose', value: 90, unit: 'mg/dL', refRange: '70 - 99 mg/dL', minNormal: 70, maxNormal: 99 },
  { id: 'study-urea', name: 'Urea sérica', code: 'urea', value: 25, unit: 'mg/dL', refRange: '15 - 45 mg/dL', minNormal: 15, maxNormal: 45 },
  { id: 'study-uric-acid', name: 'Ácido úrico', code: 'uric_acid', value: 4.5, unit: 'mg/dL', refRange: '3.5 - 7.2 mg/dL', minNormal: 3.5, maxNormal: 7.2 },
  { id: 'study-creatinine', name: 'Creatinina sérica', code: 'creatinine', value: 0.9, unit: 'mg/dL', refRange: '0.7 - 1.3 mg/dL', minNormal: 0.7, maxNormal: 1.3 },
  { id: 'study-triglycerides', name: 'Triglicéridos', code: 'triglycerides', value: 120, unit: 'mg/dL', refRange: '< 150 mg/dL', minNormal: 0, maxNormal: 150 },
  { id: 'study-cholesterol', name: 'Colesterol total', code: 'cholesterol', value: 175, unit: 'mg/dL', refRange: '< 200 mg/dL', minNormal: 0, maxNormal: 200 },
];

export type ModalTabType =
  | 'general'
  | 'antropometria'
  | 'clinico'
  | 'estudios'
  | 'smae'
  | 'macros'
  | 'credenciales'
  | 'foto';

export type PredictiveFormulaKey =
  | 'mifflin'
  | 'harris'
  | 'cunningham'
  | 'katch'
  | 'fao_oms'
  | 'schofield'
  | 'hosp'
  | 'amb';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: Patient | null;
  onSuccess?: (savedPatient: Patient) => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  patientToEdit,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const isEditing = Boolean(patientToEdit);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ModalTabType>('general');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    gender: 'F' as 'M' | 'F' | 'Otro',
    birthDate: '1995-05-12',
    occupation: 'Profesionista',
    address: 'CDMX, México',
    height: 165,
    initialWeight: 70,
    currentWeight: 70,
    targetWeight: 62,
    bodyFatPct: '' as number | string,
    muscleMassKg: '' as number | string,
    visceralFatLevel: '' as number | string,
    goal: 'Pérdida de Grasa y Recomposición Corporal',
    status: 'Activo' as PatientStatus,
    riskLevel: 'NORMAL' as RiskLevel,
    adherenceRate: 90,
    allergies: '',
    pathologies: '',
    notes: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    portalAccessEnabled: true,
    portalUsername: '',
    portalPassword: 'Nutri2026!',
    showPassword: false,
  });

  // Expedientes & Anamnesis State
  const [anamnesisData, setAnamnesisData] = useState({
    familyDiabetes: false,
    familyHypertension: false,
    familyCancer: false,
    familyCardiovascular: false,
    familyThyroid: false,
    familyNotes: '',
    surgeries: '',
    medications: '',
    sleepHours: 7,
    waterLiters: 2.5,
    stressLevel: 'Medio',
    smoking: false,
    alcoholFrequency: 'Ocasional',
  });

  // Clinical Studies State
  const [studies, setStudies] = useState<ClinicalStudyItem[]>(INITIAL_STUDIES);
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [newStudyForm, setNewStudyForm] = useState({
    name: '',
    value: '',
    unit: 'mg/dL',
    refRange: '',
  });
  const [showAddStudyModal, setShowAddStudyModal] = useState(false);

  // Lab File Upload State
  const [labFile, setLabFile] = useState<{
    name: string;
    sizeKb: number;
    dataUrl: string;
    type: string;
  } | null>(null);
  const labFileInputRef = useRef<HTMLInputElement>(null);

  // Evaluador SMAE Portions State
  const [smaePortions, setSmaePortions] = useState<Record<string, number>>({
    'Verduras': 4,
    'Frutas': 3,
    'Cereales s/g': 5,
    'Cereales c/g': 1,
    'Leguminosas': 1.5,
    'AOA Muy bajo aporte': 2,
    'AOA Bajo aporte': 3,
    'AOA Moderado aporte': 1,
    'AOA Alto aporte': 0,
    'Leche descremada': 1,
    'Leche semidescremada': 0,
    'Leche entera': 0,
    'Leche c/azúcar': 0,
    'Grasas s/proteína': 3,
    'Grasas c/proteína': 1,
    'Azúcares s/grasa': 0,
  });

  // Macros & Comidas State
  const [activityFactor, setActivityFactor] = useState<number>(1.375); // Actividad ligera
  const [targetKcal, setTargetKcal] = useState<number>(1800);
  
  // SUGGESTED MACRONUTRIENT DISTRIBUTION (MUST SUM TO EXACTLY 100%)
  const [carbsPct, setCarbsPct] = useState<number>(50);
  const [proteinPct, setProteinPct] = useState<number>(25);
  const [fatPct, setFatPct] = useState<number>(25);

  // Meal times distribution
  const [mealDistribution, setMealDistribution] = useState({
    desayuno: 25,
    colacion1: 10,
    comida: 35,
    colacion2: 10,
    cena: 20,
  });

  // Presets & Templates
  const [presets, setPresets] = useState<ClinicalPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  // Fórmulas Predictivas de GEB (Mifflin, Harris, Cunningham, Katch, FAO/OMS, Schofield, Hosp, Amb)
  const [selectedFormulaKey, setSelectedFormulaKey] = useState<PredictiveFormulaKey>('mifflin');
  const [showFormulaComparison, setShowFormulaComparison] = useState(true);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    badge: 'Personalizado',
    description: '',
    dietStyle: 'Equilibrada',
  });

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Photo Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [compressionStats, setCompressionStats] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Track open state to prevent overwriting user input on background sync
  const wasOpenRef = useRef(false);
  const loadedPatientIdRef = useRef<string | null>(null);

  // Load Presets on Mount
  useEffect(() => {
    const loaded = storageService.getPrescriptionPresets();
    setPresets(loaded && loaded.length > 0 ? loaded : INITIAL_CLINICAL_PRESETS);
  }, []);

  // Populate when editing or opening
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      loadedPatientIdRef.current = null;
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;
    const currentId = patientToEdit?.id || null;

    if (!justOpened && loadedPatientIdRef.current === currentId) {
      return;
    }

    loadedPatientIdRef.current = currentId;

    if (patientToEdit) {
      const clinRec = storageService.getClinicalRecordByPatientId(patientToEdit.id);
      const anthros = storageService.getAnthropometricsByPatientId(patientToEdit.id);
      const latestAnthro = anthros && anthros.length > 0 ? anthros[0] : null;
      const allergiesText = Array.isArray((patientToEdit as any).allergies)
        ? (patientToEdit as any).allergies.join(', ')
        : typeof (patientToEdit as any).allergies === 'string'
        ? (patientToEdit as any).allergies
        : clinRec?.allergies?.join(', ') || '';

      const pathologiesText = Array.isArray((patientToEdit as any).pathologies)
        ? (patientToEdit as any).pathologies.join(', ')
        : typeof (patientToEdit as any).pathologies === 'string'
        ? (patientToEdit as any).pathologies
        : clinRec?.pathologicalHistory?.diagnosedDiseases?.join(', ') || '';

      setFormData({
        firstName: patientToEdit.firstName || '',
        lastName: patientToEdit.lastName || '',
        email: patientToEdit.email || '',
        phone: patientToEdit.phone || '',
        whatsapp: patientToEdit.whatsapp || patientToEdit.phone || '',
        gender: (patientToEdit.gender as any) || 'F',
        birthDate: patientToEdit.birthDate || '1995-05-12',
        occupation: patientToEdit.occupation || 'Profesionista',
        address: patientToEdit.address || 'CDMX, México',
        height: patientToEdit.height || 165,
        initialWeight: patientToEdit.initialWeight || patientToEdit.currentWeight || 70,
        currentWeight: patientToEdit.currentWeight || 70,
        targetWeight: patientToEdit.targetWeight || 62,
        bodyFatPct: latestAnthro?.bodyFatPercentage !== undefined ? latestAnthro.bodyFatPercentage : '',
        muscleMassKg: latestAnthro?.muscleMassKg !== undefined ? latestAnthro.muscleMassKg : '',
        visceralFatLevel: latestAnthro?.visceralFatLevel !== undefined ? latestAnthro.visceralFatLevel : '',
        goal: patientToEdit.goal || 'Pérdida de Grasa y Recomposición Corporal',
        status: patientToEdit.status || 'Activo',
        riskLevel: patientToEdit.riskLevel || 'NORMAL',
        adherenceRate: patientToEdit.adherenceRate || 90,
        allergies: allergiesText,
        pathologies: pathologiesText,
        notes: patientToEdit.notes || '',
        photoUrl:
          patientToEdit.photoUrl ||
          (patientToEdit.gender === 'F'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),
        portalAccessEnabled: patientToEdit.portalAccessEnabled !== false,
        portalUsername: patientToEdit.portalUsername || patientToEdit.email || '',
        portalPassword: patientToEdit.portalPassword || 'Nutri2026!',
        showPassword: false,
      });

      if (clinRec) {
        setAnamnesisData({
          familyDiabetes: Boolean(clinRec.familyHistory?.diabetes),
          familyHypertension: Boolean(clinRec.familyHistory?.hypertension),
          familyCancer: Boolean(clinRec.familyHistory?.cancer),
          familyCardiovascular: Boolean(clinRec.familyHistory?.cardiovascular),
          familyThyroid: Boolean(clinRec.familyHistory?.thyroid),
          familyNotes: clinRec.familyHistory?.notes || '',
          surgeries: clinRec.pathologicalHistory?.surgeries?.join(', ') || '',
          medications: clinRec.medications?.map((m) => `${m.name} ${m.dose}`).join(', ') || '',
          sleepHours: clinRec.lifestyleHabits?.sleepHours || 7,
          waterLiters: clinRec.lifestyleHabits?.waterDailyLiters || 2.5,
          stressLevel: clinRec.lifestyleHabits?.stressLevel || 'Medio',
          smoking: Boolean(clinRec.lifestyleHabits?.smoking),
          alcoholFrequency: clinRec.lifestyleHabits?.alcohol || 'Ocasional',
        });
      }

      // Check existing labs
      const existingLabs = storageService.getLabRecordsByPatientId(patientToEdit.id);
      if (existingLabs && existingLabs.length > 0) {
        const latestLab = existingLabs[0];
        const updatedStudies = [...INITIAL_STUDIES];
        if (latestLab.glucoseMgDl) {
          const s = updatedStudies.find((item) => item.code === 'glucose');
          if (s) s.value = latestLab.glucoseMgDl;
        }
        if (latestLab.ureaMgDl) {
          const s = updatedStudies.find((item) => item.code === 'urea');
          if (s) s.value = latestLab.ureaMgDl;
        }
        if (latestLab.uricAcidMgDl) {
          const s = updatedStudies.find((item) => item.code === 'uric_acid');
          if (s) s.value = latestLab.uricAcidMgDl;
        }
        if (latestLab.creatinineMgDl) {
          const s = updatedStudies.find((item) => item.code === 'creatinine');
          if (s) s.value = latestLab.creatinineMgDl;
        }
        if (latestLab.triglyceridesMgDl) {
          const s = updatedStudies.find((item) => item.code === 'triglycerides');
          if (s) s.value = latestLab.triglyceridesMgDl;
        }
        if (latestLab.totalCholesterolMgDl) {
          const s = updatedStudies.find((item) => item.code === 'cholesterol');
          if (s) s.value = latestLab.totalCholesterolMgDl;
        }
        if (latestLab.customParameters && latestLab.customParameters.length > 0) {
          latestLab.customParameters.forEach((cp, idx) => {
            updatedStudies.push({
              id: `custom-load-${idx}`,
              name: cp.name,
              value: cp.value,
              unit: cp.unit,
              refRange: cp.refRange,
            });
          });
        }
        setStudies(updatedStudies);
        if (latestLab.documentUrl || latestLab.fileData) {
          setLabFile({
            name: latestLab.fileName || 'Estudio_Laboratorio_Adjunto.pdf',
            sizeKb: 145,
            dataUrl: latestLab.documentUrl || latestLab.fileData || '',
            type: 'application/pdf',
          });
        }
      }

      // Restore Quick Prescription Preset if previously selected
      const existingPresetId =
        (patientToEdit as any).selectedPresetId ||
        (patientToEdit as any).presetId ||
        (clinRec as any)?.selectedPresetId ||
        (clinRec as any)?.presetId;

      if (existingPresetId) {
        setSelectedPresetId(existingPresetId);
      } else {
        const existingPlans = storageService.getPlansByPatientId(patientToEdit.id);
        const activePlan = existingPlans && existingPlans.length > 0 ? existingPlans[0] : null;
        if ((activePlan as any)?.selectedPresetId || (activePlan as any)?.presetId) {
          setSelectedPresetId((activePlan as any)?.selectedPresetId || (activePlan as any)?.presetId);
        } else {
          setSelectedPresetId(null);
        }
      }

      // Restore Predictive Formula
      const existingFormula = (patientToEdit as any).metabolicFormula || (clinRec as any)?.metabolicFormula;
      if (existingFormula) {
        const lower = String(existingFormula).toLowerCase();
        if (lower.includes('harris')) setSelectedFormulaKey('harris');
        else if (lower.includes('cunningham')) setSelectedFormulaKey('cunningham');
        else if (lower.includes('katch')) setSelectedFormulaKey('katch');
        else if (lower.includes('fao') || lower.includes('fao_oms')) setSelectedFormulaKey('fao_oms');
        else if (lower.includes('schofield')) setSelectedFormulaKey('schofield');
        else if (lower.includes('hosp')) setSelectedFormulaKey('hosp');
        else if (lower.includes('amb')) setSelectedFormulaKey('amb');
        else setSelectedFormulaKey('mifflin');
      } else {
        setSelectedFormulaKey('mifflin');
      }
    } else {
      // Defaults for new patient
      setSelectedPresetId(null);
      setSelectedFormulaKey('mifflin');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        whatsapp: '',
        gender: 'F',
        birthDate: '1995-05-12',
        occupation: 'Profesionista',
        address: 'CDMX, México',
        height: 165,
        initialWeight: 72,
        currentWeight: 72,
        targetWeight: 62,
        bodyFatPct: '',
        muscleMassKg: '',
        visceralFatLevel: '',
        goal: 'Pérdida de Grasa y Recomposición Corporal',
        status: 'Activo',
        riskLevel: 'NORMAL',
        adherenceRate: 90,
        allergies: '',
        pathologies: '',
        notes: '',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        portalAccessEnabled: true,
        portalUsername: '',
        portalPassword: 'Nutri2026!',
        showPassword: false,
      });
      setStudies(INITIAL_STUDIES);
      setLabFile(null);
      setCarbsPct(50);
      setProteinPct(25);
      setFatPct(25);
    }
  }, [patientToEdit, isOpen]);

  // Live Calculations (BMI, Age, Energy Expenditure)
  const heightM = (Number(formData.height) || 165) / 100;
  const currentWeightNum = Number(formData.currentWeight) || 70;
  const liveBmi = Number((currentWeightNum / (heightM * heightM)).toFixed(1));

  const birthYear = formData.birthDate ? new Date(formData.birthDate).getFullYear() : 1995;
  const ageYears = isNaN(birthYear) ? 29 : Math.max(1, new Date().getFullYear() - birthYear);

  // Clinical Engine Algorithmic Calculations (8 Ecuaciones Predictivas de GEB y GET)
  const clinicalEngineData = useMemo(() => {
    return computeClinicalEngine({
      nombre: `${formData.firstName} ${formData.lastName}`.trim() || 'Paciente',
      sexo: formData.gender === 'M' ? 'Masculino' : 'Femenino',
      edad: ageYears,
      peso: currentWeightNum,
      talla_cm: Number(formData.height) || 165,
      factor_actividad: activityFactor,
      meta_kcal: targetKcal,
      porcentaje_grasa: formData.bodyFatPct !== '' ? Number(formData.bodyFatPct) : undefined,
      masa_muscular_kg: formData.muscleMassKg !== '' ? Number(formData.muscleMassKg) : undefined,
      distribucion_macros: {
        hc_pct: (carbsPct || 50) / 100,
        prot_pct: (proteinPct || 25) / 100,
        lip_pct: (fatPct || 25) / 100,
      },
    });
  }, [formData.firstName, formData.lastName, formData.gender, ageYears, currentWeightNum, formData.height, activityFactor, targetKcal, carbsPct, proteinPct, fatPct, formData.bodyFatPct, formData.muscleMassKg]);

  const currentFormulaInfo = useMemo(() => {
    const est = clinicalEngineData.estimaciones_gasto_energetico;
    switch (selectedFormulaKey) {
      case 'harris':
        return {
          key: 'harris' as const,
          name: 'Harris-Benedict',
          subtitle: 'Revisión Roza & Shizgal',
          geb: est.harris_benedict.formula_aplicable_al_sexo.geb,
          get: est.harris_benedict.formula_aplicable_al_sexo.get,
        };
      case 'cunningham':
        return {
          key: 'cunningham' as const,
          name: 'Cunningham',
          subtitle: `Basada en Masa Magra LBM (${est.cunningham.lbm_kg} kg)`,
          geb: est.cunningham.geb,
          get: est.cunningham.get,
        };
      case 'katch':
        return {
          key: 'katch' as const,
          name: 'Katch-McArdle',
          subtitle: `Atletas y Masa Magra (${est.katch_mcardle.lbm_kg} kg)`,
          geb: est.katch_mcardle.geb,
          get: est.katch_mcardle.get,
        };
      case 'fao_oms':
        return {
          key: 'fao_oms' as const,
          name: 'FAO / OMS / UNU',
          subtitle: 'Ecuaciones por rangos de edad',
          geb: est.fao_oms.formula_aplicable_al_sexo.geb,
          get: est.fao_oms.formula_aplicable_al_sexo.get,
        };
      case 'schofield':
        return {
          key: 'schofield' as const,
          name: 'Schofield (OMS)',
          subtitle: '8.4×peso + 4.5×talla + 200',
          geb: est.schofield.geb,
          get: est.schofield.get,
        };
      case 'hosp':
        return {
          key: 'hosp' as const,
          name: 'Fórmula Rápida Hospitalaria',
          subtitle: '30 kcal/kg peso',
          geb: est.formula_rapida_hospitalaria.geb_hombre,
          get: est.formula_rapida_hospitalaria.geb_hombre,
        };
      case 'amb':
        return {
          key: 'amb' as const,
          name: 'Fórmula Rápida Ambulatoria',
          subtitle: formData.gender === 'M' ? '24 kcal/kg peso' : '23 kcal/kg peso',
          geb: est.formula_rapida_ambulatoria.geb_aplicable_al_sexo,
          get: est.formula_rapida_ambulatoria.geb_aplicable_al_sexo,
        };
      case 'mifflin':
      default:
        return {
          key: 'mifflin' as const,
          name: 'Mifflin-St. Jeor',
          subtitle: 'Recomendada (Gold Standard)',
          geb: est.mifflin_st_jeor.formula_aplicable_al_sexo.geb,
          get: est.mifflin_st_jeor.formula_aplicable_al_sexo.get,
        };
    }
  }, [clinicalEngineData, selectedFormulaKey, formData.gender]);

  const computedGeb = useMemo(() => {
    return Math.round(currentFormulaInfo.geb);
  }, [currentFormulaInfo]);

  const computedGet = useMemo(() => {
    return Math.round(currentFormulaInfo.get);
  }, [currentFormulaInfo]);

  // Sync target kcal initially if not manually modified
  useEffect(() => {
    if (!isEditing && targetKcal === 1800 && computedGet > 1000) {
      setTargetKcal(computedGet);
    }
  }, [computedGet, isEditing]);

  const handleSelectFormula = (kcal: number, formulaName: string, formulaKey: PredictiveFormulaKey) => {
    setSelectedFormulaKey(formulaKey);
    setTargetKcal(kcal);
    showToast(
      'Fórmula Aplicada',
      `Meta calórica sincronizada con ${formulaName}: ${kcal} kcal/día (Factor FA = ${activityFactor}).`,
      'success'
    );
  };

  const handleFormulaChange = (newKey: PredictiveFormulaKey) => {
    setSelectedFormulaKey(newKey);
    const est = clinicalEngineData.estimaciones_gasto_energetico;
    let targetKcalVal = Math.round(est.mifflin_st_jeor.formula_aplicable_al_sexo.get);
    let formulaName = 'Mifflin-St. Jeor';
    if (newKey === 'harris') {
      targetKcalVal = Math.round(est.harris_benedict.formula_aplicable_al_sexo.get);
      formulaName = 'Harris-Benedict';
    } else if (newKey === 'cunningham') {
      targetKcalVal = Math.round(est.cunningham.get);
      formulaName = 'Cunningham';
    } else if (newKey === 'katch') {
      targetKcalVal = Math.round(est.katch_mcardle.get);
      formulaName = 'Katch-McArdle';
    } else if (newKey === 'fao_oms') {
      targetKcalVal = Math.round(est.fao_oms.formula_aplicable_al_sexo.get);
      formulaName = 'FAO / OMS / UNU';
    } else if (newKey === 'schofield') {
      targetKcalVal = Math.round(est.schofield.get);
      formulaName = 'Schofield';
    } else if (newKey === 'hosp') {
      targetKcalVal = Math.round(est.formula_rapida_hospitalaria.geb_hombre);
      formulaName = 'Fórmula Rápida Hospitalaria';
    } else if (newKey === 'amb') {
      targetKcalVal = Math.round(est.formula_rapida_ambulatoria.geb_aplicable_al_sexo);
      formulaName = 'Fórmula Rápida Ambulatoria';
    }
    setTargetKcal(targetKcalVal);
    showToast(
      'Fórmula Seleccionada',
      `${formulaName} activada: ${targetKcalVal} kcal/día (Factor FA = ${activityFactor}).`,
      'success'
    );
  };

  // STRICT MACRONUTRIENT SUM VALIDATION (MUST BE EXACTLY 100%)
  const totalMacrosPct = Number((carbsPct + proteinPct + fatPct).toFixed(1));
  const isMacrosValid = totalMacrosPct === 100;

  // Handlers for Macronutrients ensuring they never exceed 100%
  const handleCarbsChange = (newVal: number) => {
    const val = Math.max(0, Number(newVal) || 0);
    const maxAllowed = Math.max(0, 100 - (proteinPct + fatPct));
    if (val > maxAllowed) {
      setCarbsPct(maxAllowed);
      showToast('Límite 100%', `No puedes exceder el 100%. Carbohidratos ajustados a ${maxAllowed}%.`, 'info');
    } else {
      setCarbsPct(val);
    }
  };

  const handleProteinChange = (newVal: number) => {
    const val = Math.max(0, Number(newVal) || 0);
    const maxAllowed = Math.max(0, 100 - (carbsPct + fatPct));
    if (val > maxAllowed) {
      setProteinPct(maxAllowed);
      showToast('Límite 100%', `No puedes exceder el 100%. Proteínas ajustadas a ${maxAllowed}%.`, 'info');
    } else {
      setProteinPct(val);
    }
  };

  const handleFatChange = (newVal: number) => {
    const val = Math.max(0, Number(newVal) || 0);
    const maxAllowed = Math.max(0, 100 - (carbsPct + proteinPct));
    if (val > maxAllowed) {
      setFatPct(maxAllowed);
      showToast('Límite 100%', `No puedes exceder el 100%. Grasas ajustadas a ${maxAllowed}%.`, 'info');
    } else {
      setFatPct(val);
    }
  };

  // Auto-balance remaining macro to reach exactly 100%
  const handleAutoBalanceMacros = () => {
    const currentSum = carbsPct + proteinPct;
    if (currentSum <= 100) {
      setFatPct(100 - currentSum);
    } else {
      setProteinPct(25);
      setFatPct(25);
      setCarbsPct(50);
    }
    showToast('Macros Equilibrados', 'Suma ajustada exactamente al 100%.', 'info');
  };

  // Macro Grams Calculation
  const carbsGrams = Math.round((targetKcal * (carbsPct / 100)) / 4);
  const proteinGrams = Math.round((targetKcal * (proteinPct / 100)) / 4);
  const fatGrams = Math.round((targetKcal * (fatPct / 100)) / 9);
  const proteinGPerKg = (proteinGrams / currentWeightNum).toFixed(2);

  // SMAE Totals Calculation
  const smaeTotals = useMemo(() => {
    let kcal = 0;
    let prot = 0;
    let lip = 0;
    let hc = 0;

    SMAE_CONSTANTS.forEach((c) => {
      const portions = smaePortions[c.grupo] || 0;
      kcal += portions * c.energia_kcal;
      prot += portions * c.prot_g;
      lip += portions * c.lip_g;
      hc += portions * c.hc_g;
    });

    return {
      kcal: Math.round(kcal),
      prot: Math.round(prot),
      lip: Math.round(lip),
      hc: Math.round(hc),
      adequacyPct: targetKcal > 0 ? Number(((kcal / targetKcal) * 100).toFixed(1)) : 100,
    };
  }, [smaePortions, targetKcal]);

  // Apply Quick Prescription Preset
  const handleSelectPreset = (preset: ClinicalPreset) => {
    setSelectedPresetId(preset.id);
    setCarbsPct(preset.carbsPct);
    setFatPct(preset.fatPct);
    const calculatedProtein = Math.max(0, 100 - (preset.carbsPct + preset.fatPct));
    setProteinPct(calculatedProtein);

    // Apply caloric adjustment
    if (preset.caloricAdjustmentType === 'deficit_kcal') {
      setTargetKcal(Math.max(1200, computedGet + preset.adjustmentValue));
    } else if (preset.caloricAdjustmentType === 'surplus_kcal') {
      setTargetKcal(computedGet + preset.adjustmentValue);
    } else if (preset.caloricAdjustmentType === 'deficit_pct') {
      setTargetKcal(Math.round(computedGet * (1 + preset.adjustmentValue / 100)));
    } else {
      setTargetKcal(computedGet);
    }

    showToast(
      'Plantilla Aplicada',
      `"${preset.name}" seleccionada. Macros ajustados a ${preset.carbsPct}% C / ${calculatedProtein}% P / ${preset.fatPct}% G (100%).`,
      'success'
    );
  };

  // Save Current Setup as New Custom Template
  const handleSaveAsNewTemplate = () => {
    if (!newTemplateForm.name.trim()) {
      showToast('Nombre requerido', 'Ingresa un nombre para la nueva plantilla.', 'error');
      return;
    }

    const newPreset: ClinicalPreset = {
      id: `preset-${Date.now()}`,
      name: newTemplateForm.name.trim(),
      badge: newTemplateForm.badge || 'Personalizado',
      description: newTemplateForm.description || `Distribución ${carbsPct}% C / ${proteinPct}% P / ${fatPct}% G`,
      goal: formData.goal,
      caloricAdjustmentType: 'maintenance',
      adjustmentValue: 0,
      proteinGKg: Number(proteinGPerKg),
      carbsPct: carbsPct,
      fatPct: fatPct,
      proteinPct: proteinPct,
      dietStyle: newTemplateForm.dietStyle,
      mealsCount: 5,
      conditions: [],
      allergies: [],
      prepStyle: 'Equilibrada',
      recommendations: 'Prescripción personalizada guardada desde el registro clínico.',
      isVisibleInQuickBar: true,
      isFavorite: true,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPreset, ...presets];
    setPresets(updated);
    storageService.savePrescriptionPresets(updated);
    setSelectedPresetId(newPreset.id);
    setShowNewTemplateModal(false);
    setNewTemplateForm({ name: '', badge: 'Personalizado', description: '', dietStyle: 'Equilibrada' });

    showToast('Plantilla Guardada', `"${newPreset.name}" se guardó en la base de datos de plantillas.`, 'success');
  };

  // Lab File Handler
  const handleLabFileSelected = (file: File) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      showToast('Formato no admitido', 'Sube un archivo en formato PDF o imagen (JPG, PNG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLabFile({
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
        dataUrl,
        type: file.type,
      });
      showToast('Estudio Adjunto', `Archivo "${file.name}" cargado al expediente.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Photo Upload & Compression Handler
  const handlePhotoSelected = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|svg)$/i)) {
      showToast('Formato no válido', 'Selecciona una imagen válida (JPG, PNG, WebP).', 'error');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Optimizando y recortando imagen...');

    try {
      const optResult = await optimizeImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.88,
        format: 'image/webp',
      });

      const compKb = (optResult.compressedSize / 1024).toFixed(0);
      setCompressionStats(`${compKb} KB (Ahorro del ${optResult.savingsPct}%)`);
      setUploadMessage('Guardando imagen...');

      const patientIdentifier = patientToEdit?.id || `patient_${Date.now()}`;
      const uploadRes = await uploadPatientPhotoToSupabase(optResult.blob, patientIdentifier, optResult.fileName);

      if (uploadRes.success && uploadRes.publicUrl) {
        setFormData((prev) => ({ ...prev, photoUrl: uploadRes.publicUrl }));
        showToast('Foto cargada', 'La imagen se subió a la nube y se vinculó al paciente.', 'success');
      } else {
        setFormData((prev) => ({ ...prev, photoUrl: optResult.dataUrl }));
        showToast('Foto optimizada', 'Fotografía procesada con éxito.', 'success');
      }
    } catch (err: any) {
      console.error('Error optimizando imagen del paciente:', err);
      showToast('Error al procesar imagen', err?.message || 'No se pudo procesar la fotografía.', 'error');
    } finally {
      setIsUploading(false);
      setUploadMessage('');
    }
  };

  // TABS DEFINITION IN NATURAL CLINICAL SEQUENCE
  const TABS: { id: ModalTabType; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'general', label: 'Datos Personales', shortLabel: 'Datos', icon: User },
    { id: 'antropometria', label: 'Somatometría & Metas', shortLabel: 'Métricas', icon: Scale },
    { id: 'clinico', label: 'Historial & Alergias', shortLabel: 'Historial', icon: HeartPulse },
    { id: 'estudios', label: 'Estudios Clínicos', shortLabel: 'Estudios', icon: FlaskConical },
    { id: 'macros', label: 'Macros y Comidas', shortLabel: 'Macros', icon: Utensils },
    { id: 'smae', label: 'Evaluador SMAE', shortLabel: 'SMAE', icon: Apple },
    { id: 'credenciales', label: 'Acceso Portal', shortLabel: 'Acceso', icon: KeyRound },
    { id: 'foto', label: 'Foto & Finalizar', shortLabel: 'Foto', icon: ImageIcon },
  ];

  const currentStepIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleNextTab = () => {
    if (currentStepIndex === 0 && !formData.firstName.trim()) {
      showToast('Campo Requerido', 'Ingresa el nombre de pila del paciente.', 'error');
      return;
    }
    if (activeTab === 'macros' && totalMacrosPct !== 100) {
      showToast('Macros Desbalanceados', `La suma de macronutrientes debe ser exactamente 100% (actual: ${totalMacrosPct}%). Haz clic en "Equilibrar al 100%".`, 'error');
      return;
    }
    if (currentStepIndex < TABS.length - 1) {
      setActiveTab(TABS[currentStepIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    if (currentStepIndex > 0) {
      setActiveTab(TABS[currentStepIndex - 1].id);
    }
  };

  // SUBMIT FORM VALIDATION
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      showToast('Campo requerido', 'Ingresa el nombre del paciente.', 'error');
      setActiveTab('general');
      return;
    }
    if (totalMacrosPct !== 100) {
      showToast('Distribución de Macros Incompleta', `La distribución de macronutrientes debe sumar exactamente 100% (actual: ${totalMacrosPct}%).`, 'error');
      setActiveTab('macros');
      return;
    }
    setShowConfirmModal(true);
  };

  // CONFIRM SAVE IMPLEMENTATION
  const handleConfirmSave = async () => {
    setShowConfirmModal(false);

    const cleanFirstName = formData.firstName.trim();
    const cleanLastName = formData.lastName.trim();
    const parsedHeight = Number(formData.height) || 165;
    const parsedCurrentWeight = Number(formData.currentWeight) || 70;
    const parsedInitialWeight = Number(formData.initialWeight) || parsedCurrentWeight;
    const parsedTargetWeight = Number(formData.targetWeight) || Math.round(parsedCurrentWeight * 0.9);

    const allergiesArr = formData.allergies
      ? formData.allergies.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const pathologiesArr = formData.pathologies
      ? formData.pathologies.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const patientId = patientToEdit ? patientToEdit.id : `pat-${Date.now()}`;

    const savedPatient: Patient = {
      id: patientId,
      organizationId: patientToEdit?.organizationId || 'org-nutriluz-mexico',
      branchId: patientToEdit?.branchId || 'branch-cdmx-sur',
      specialistId: patientToEdit?.specialistId || 'user-dra-valeria',
      userId: patientToEdit?.userId,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: formData.email.trim() || `${cleanFirstName.toLowerCase().replace(/\s+/g, '')}.${Date.now().toString().slice(-4)}@correo.com`,
      phone: formData.phone.trim() || '+52 55 1234 5678',
      whatsapp: (formData.whatsapp || formData.phone || '+52 55 1234 5678').trim(),
      gender: formData.gender,
      birthDate: formData.birthDate || '1995-05-12',
      occupation: formData.occupation.trim() || 'Profesionista',
      address: formData.address.trim() || 'CDMX, México',
      height: parsedHeight,
      initialWeight: parsedInitialWeight,
      currentWeight: parsedCurrentWeight,
      targetWeight: parsedTargetWeight,
      goal: formData.goal.trim() || 'Pérdida de Grasa y Recomposición Corporal',
      status: formData.status,
      riskLevel: formData.riskLevel,
      adherenceRate: Number(formData.adherenceRate) || 90,
      notes: formData.notes.trim() || (isEditing ? patientToEdit?.notes : 'Expediente clínico registrado.'),
      photoUrl: formData.photoUrl,
      portalAccessEnabled: formData.portalAccessEnabled,
      portalUsername: formData.portalUsername.trim() || formData.email.trim() || `${cleanFirstName.toLowerCase()}.${cleanLastName.toLowerCase()}`.replace(/\s+/g, ''),
      portalPassword: formData.portalPassword.trim() || 'Nutri2026!',
      selectedPresetId: selectedPresetId || undefined,
      presetId: selectedPresetId || undefined,
      metabolicFormula: selectedFormulaKey,
      createdAt: patientToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save Patient
    await storageService.savePatient(savedPatient);

    // 2. Save Anthropometry Record
    const initialAnthro: AnthropometricRecord = {
      id: `anthro-${Date.now()}`,
      patientId: savedPatient.id,
      date: new Date().toISOString().slice(0, 10),
      weight: parsedCurrentWeight,
      height: parsedHeight,
      bmi: liveBmi,
      bodyFatPercentage: formData.bodyFatPct !== '' ? Number(formData.bodyFatPct) : undefined,
      muscleMassKg: formData.muscleMassKg !== '' ? Number(formData.muscleMassKg) : undefined,
      visceralFatLevel: formData.visceralFatLevel !== '' ? Number(formData.visceralFatLevel) : undefined,
      measurementDevice: 'Báscula y Estadiómetro Clínico / Bioimpedancia',
      notes: 'Evaluación somatométrica basal de ingreso.',
    };
    await storageService.saveAnthropometricRecord(initialAnthro);

    // 3. Save Clinical Record with Expedientes & Anamnesis
    const clinicalRecordData: ClinicalRecord = {
      id: `clin-${Date.now()}`,
      patientId: savedPatient.id,
      specialistId: savedPatient.specialistId || 'user-dra-valeria',
      familyHistory: {
        diabetes: anamnesisData.familyDiabetes,
        hypertension: anamnesisData.familyHypertension,
        cancer: anamnesisData.familyCancer,
        cardiovascular: anamnesisData.familyCardiovascular,
        thyroid: anamnesisData.familyThyroid,
        notes: anamnesisData.familyNotes,
      },
      pathologicalHistory: {
        diagnosedDiseases: pathologiesArr,
        surgeries: anamnesisData.surgeries ? anamnesisData.surgeries.split(',').map((s) => s.trim()).filter(Boolean) : [],
      },
      allergies: allergiesArr,
      medications: anamnesisData.medications
        ? anamnesisData.medications.split(',').map((m) => ({ name: m.trim(), dose: 'Prescrita', frequency: 'Diaria' }))
        : [],
      lifestyleHabits: {
        sleepHours: Number(anamnesisData.sleepHours) || 7,
        sleepQuality: 'Buena',
        smoking: anamnesisData.smoking,
        alcohol: anamnesisData.alcoholFrequency,
        stressLevel: anamnesisData.stressLevel,
        waterDailyLiters: Number(anamnesisData.waterLiters) || 2.5,
      },
      physicalActivity: {
        activityLevel: activityFactor >= 1.725 ? 'VERY_ACTIVE' : activityFactor >= 1.55 ? 'MODERATE' : activityFactor >= 1.375 ? 'LIGHT' : 'SEDENTARY',
        exerciseType: 'Acondicionamiento físico',
        frequencyDaysPerWeek: activityFactor >= 1.725 ? 6 : activityFactor >= 1.55 ? 4 : activityFactor >= 1.375 ? 3 : 1,
        durationMinutes: 45,
      },
      dietaryHabits: {
        mealsPerDay: Object.values(mealDistribution).filter((v) => v > 0).length || 4,
        preferredFoods: [],
        dislikedFoods: [],
        eatingOutFrequency: '1-2 veces por semana',
        bingeEating: false,
        preferredDiet: presets.find((p) => p.id === selectedPresetId)?.dietStyle || 'Omnívora Flexible',
      },
      clinicalGoals: savedPatient.goal,
      clinicalObservations: savedPatient.notes,
      selectedPresetId: selectedPresetId || undefined,
      presetId: selectedPresetId || undefined,
      isCustomized: true,
      updatedAt: new Date().toISOString(),
    };
    storageService.saveClinicalRecord(clinicalRecordData);

    // 4. Save Laboratory / Clinical Studies Record
    const glucoseVal = Number(studies.find((s) => s.code === 'glucose')?.value) || undefined;
    const ureaVal = Number(studies.find((s) => s.code === 'urea')?.value) || undefined;
    const uricAcidVal = Number(studies.find((s) => s.code === 'uric_acid')?.value) || undefined;
    const creatinineVal = Number(studies.find((s) => s.code === 'creatinine')?.value) || undefined;
    const triglyceridesVal = Number(studies.find((s) => s.code === 'triglycerides')?.value) || undefined;
    const cholesterolVal = Number(studies.find((s) => s.code === 'cholesterol')?.value) || undefined;

    const customStudies = studies
      .filter((s) => !s.code)
      .map((s) => ({
        name: s.name,
        value: String(s.value),
        unit: s.unit,
        refRange: s.refRange,
      }));

    if (glucoseVal || ureaVal || uricAcidVal || creatinineVal || triglyceridesVal || cholesterolVal || labFile || customStudies.length > 0) {
      const labRecord: LaboratoryResult = {
        id: `lab-${Date.now()}`,
        patientId: savedPatient.id,
        testDate: new Date().toISOString().slice(0, 10),
        laboratoryName: 'Panel Clínico de Ingreso Nutriluz',
        glucoseMgDl: glucoseVal,
        ureaMgDl: ureaVal,
        uricAcidMgDl: uricAcidVal,
        creatinineMgDl: creatinineVal,
        triglyceridesMgDl: triglyceridesVal,
        totalCholesterolMgDl: cholesterolVal,
        documentUrl: labFile?.dataUrl,
        fileName: labFile?.name,
        customParameters: customStudies,
        specialistInterpretation: `Evaluación basal: Glucosa ${glucoseVal || '-'}, Urea ${ureaVal || '-'}, Ác. Úrico ${uricAcidVal || '-'}, Creatinina ${creatinineVal || '-'}, Triglicéridos ${triglyceridesVal || '-'}, Colesterol ${cholesterolVal || '-'}.`,
      };
      storageService.saveLabRecord(labRecord);
    }

    // 5. Create or Update Baseline Nutrition Plan with SMAE & Macros
    const initialPlan: NutritionPlan = {
      id: `plan-${Date.now()}`,
      organizationId: savedPatient.organizationId,
      patientId: savedPatient.id,
      specialistId: savedPatient.specialistId || 'user-dra-valeria',
      title: `Plan Nutricional: ${savedPatient.goal}`,
      goal: savedPatient.goal,
      status: 'ACTIVE',
      targetCaloriesKcal: targetKcal,
      targetProteinG: proteinGrams,
      targetCarbsG: carbsGrams,
      targetFatG: fatGrams,
      targetWaterLiters: anamnesisData.waterLiters || 2.5,
      startDate: new Date().toISOString().slice(0, 10),
      approvedBySpecialist: true,
      generalInstructions: `Distribución de macronutrientes: ${carbsPct}% Carbohidratos (${carbsGrams}g), ${proteinPct}% Proteínas (${proteinGrams}g, ${proteinGPerKg} g/kg), ${fatPct}% Grasas (${fatGrams}g).`,
      selectedPresetId: selectedPresetId || undefined,
      presetId: selectedPresetId || undefined,
      metabolicFormula: selectedFormulaKey,
      days: [
        {
          id: `day-1`,
          dayOfWeek: 1,
          dayName: 'Plan Diario SMAE',
          meals: [
            { id: 'm-desayuno', name: 'Desayuno', mealOrder: 1, suggestedTime: '08:00', items: [], notes: `${mealDistribution.desayuno}% de energía diaria` },
            { id: 'm-colacion1', name: 'Colación Matutina', mealOrder: 2, suggestedTime: '11:00', items: [], notes: `${mealDistribution.colacion1}% de energía diaria` },
            { id: 'm-comida', name: 'Comida', mealOrder: 3, suggestedTime: '14:30', items: [], notes: `${mealDistribution.comida}% de energía diaria` },
            { id: 'm-colacion2', name: 'Colación Vespertina', mealOrder: 4, suggestedTime: '17:30', items: [], notes: `${mealDistribution.colacion2}% de energía diaria` },
            { id: 'm-cena', name: 'Cena', mealOrder: 5, suggestedTime: '20:30', items: [], notes: `${mealDistribution.cena}% de energía diaria` },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storageService.savePlan(initialPlan);
    storageService.setActiveClinicalPatientId(savedPatient.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutriluz:active_patient_changed', { detail: { patientId: savedPatient.id } }));
      window.dispatchEvent(new CustomEvent('nutriluz:db_updated', { detail: { type: 'patient', patientId: savedPatient.id } }));
    }

    showToast(
      isEditing ? 'Paciente actualizado con éxito' : 'Paciente registrado con éxito',
      `El expediente completo, estudios clínicos, cálculo SMAE y macros de ${savedPatient.firstName} ${savedPatient.lastName} se guardaron correctamente.`,
      'success'
    );

    if (onSuccess) {
      onSuccess(savedPatient);
    }
    onClose();
  };

  return (
    <>
      <Modal
        id="patient-form-modal"
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? `Editar Paciente: ${patientToEdit?.firstName} ${patientToEdit?.lastName}` : 'Registrar Nuevo Paciente'}
        subtitle={
          isEditing
            ? 'Actualiza el expediente, anamnesis, estudios de laboratorio y prescripción SMAE'
            : 'Ficha completa de identificación, historia clínica, estudios, SMAE y macronutrientes'
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Sub Navigation Tabs inside Modal with horizontal scroll */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`modal-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="inline sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handlePhotoSelected(e.target.files[0]);
              }
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handlePhotoSelected(e.target.files[0]);
              }
            }}
          />
          <input
            ref={labFileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleLabFileSelected(e.target.files[0]);
              }
            }}
          />

          {/* TAB 1: DATOS PERSONALES */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre(s) *
                  </label>
                  <input
                    id="patient-form-firstname"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ej. Ana Sofía"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Apellidos
                  </label>
                  <input
                    id="patient-form-lastname"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ej. González Ruiz"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sexo Biológico *
                  </label>
                  <select
                    id="patient-form-gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="Otro">Otro / No binario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    id="patient-form-birthdate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Edad Calculada
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                    {ageYears} años
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    id="patient-form-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="paciente@correo.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    id="patient-form-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ocupación / Profesión
                  </label>
                  <input
                    id="patient-form-occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Ej. Ingeniero en Sistemas / Estudiante"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad / Domicilio
                  </label>
                  <input
                    id="patient-form-address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ej. CDMX, México"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOMATOMETRÍA & METAS */}
          {activeTab === 'antropometria' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estatura (cm) *
                  </label>
                  <input
                    id="patient-form-height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso Inicial (kg)
                  </label>
                  <input
                    id="patient-form-init-weight"
                    type="number"
                    step="0.1"
                    value={formData.initialWeight}
                    onChange={(e) => setFormData({ ...formData, initialWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso Actual (kg) *
                  </label>
                  <input
                    id="patient-form-curr-weight"
                    type="number"
                    step="0.1"
                    value={formData.currentWeight}
                    onChange={(e) => setFormData({ ...formData, currentWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso Meta (kg)
                  </label>
                  <input
                    id="patient-form-target-weight"
                    type="number"
                    step="0.1"
                    value={formData.targetWeight}
                    onChange={(e) => setFormData({ ...formData, targetWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Bioimpedancia Basal & Composición Corporal */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold text-[11px] text-slate-900 dark:text-white">Composición Corporal & Bioimpedancia (Basal)</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Sincronizada con NutriCopilot AI)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      % Grasa Corporal
                    </label>
                    <input
                      id="patient-form-fat-pct"
                      type="number"
                      step="0.1"
                      placeholder="Ej. 22.5"
                      value={formData.bodyFatPct}
                      onChange={(e) => setFormData({ ...formData, bodyFatPct: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Masa Muscular (kg)
                    </label>
                    <input
                      id="patient-form-muscle-mass"
                      type="number"
                      step="0.1"
                      placeholder="Ej. 48.0"
                      value={formData.muscleMassKg}
                      onChange={(e) => setFormData({ ...formData, muscleMassKg: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nivel de Grasa Visceral
                    </label>
                    <input
                      id="patient-form-visceral-fat"
                      type="number"
                      step="1"
                      placeholder="Ej. 5 (1-12)"
                      value={formData.visceralFatLevel}
                      onChange={(e) => setFormData({ ...formData, visceralFatLevel: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* BMI Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Índice de Masa Corporal (IMC Basal)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Calculado a partir de {formData.currentWeight} kg y {formData.height} cm
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {liveBmi} <span className="text-[11px] font-normal text-slate-400">kg/m²</span>
                  </div>
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Objetivo Principal del Paciente *
                </label>
                <input
                  id="patient-form-goal"
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="Ej. Pérdida de Grasa y Recomposición Corporal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_GOALS.map((qg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, goal: qg })}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                    >
                      + {qg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado Clínico
                  </label>
                  <select
                    id="patient-form-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Activo">🟢 Activo</option>
                    <option value="En pausa">🟡 En pausa</option>
                    <option value="Inactivo">⚪ Inactivo</option>
                    <option value="Alta">✨ Alta Médica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nivel de Riesgo
                  </label>
                  <select
                    id="patient-form-risk"
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="NORMAL">🟢 Normal / Bajo Riesgo</option>
                    <option value="MEDIUM_RISK">🟡 Riesgo Medio (Comorbilidad)</option>
                    <option value="HIGH_RISK">🔴 Alto Riesgo Metabólico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Adherencia Estimada (%)
                  </label>
                  <input
                    id="patient-form-adherence"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.adherenceRate}
                    onChange={(e) => setFormData({ ...formData, adherenceRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORIAL & ALERGIAS (CON "EXPEDIENTES & ANAMNESIS") */}
          {activeTab === 'clinico' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* SUB-SECCIÓN DESTACADA: EXPEDIENTES & ANAMNESIS */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/70 to-emerald-50/70 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800/50 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Expedientes & Anamnesis Clínica
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Antecedentes heredofamiliares, patológicos y estilo de vida
                    </p>
                  </div>
                </div>

                {/* Heredofamiliares Checkbox Chips */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Antecedentes Heredofamiliares Relevantes:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'familyDiabetes', label: 'Diabetes Mellitus' },
                      { key: 'familyHypertension', label: 'Hipertensión' },
                      { key: 'familyCardiovascular', label: 'Cardiopatías' },
                      { key: 'familyCancer', label: 'Cáncer' },
                      { key: 'familyThyroid', label: 'Tiroides' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                          (anamnesisData as any)[item.key]
                            ? 'bg-teal-100/70 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(anamnesisData as any)[item.key]}
                          onChange={(e) => setAnamnesisData({ ...anamnesisData, [item.key]: e.target.checked })}
                          className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estilo de vida en anamnesis */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Horas de Sueño / Noche
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="14"
                      value={anamnesisData.sleepHours}
                      onChange={(e) => setAnamnesisData({ ...anamnesisData, sleepHours: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Consumo de Agua (L/día)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="8"
                      value={anamnesisData.waterLiters}
                      onChange={(e) => setAnamnesisData({ ...anamnesisData, waterLiters: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nivel de Estrés
                    </label>
                    <select
                      value={anamnesisData.stressLevel}
                      onChange={(e) => setAnamnesisData({ ...anamnesisData, stressLevel: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Bajo">🟢 Bajo</option>
                      <option value="Medio">🟡 Medio</option>
                      <option value="Alto">🔴 Alto / Crónico</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Alergias & Intolerancias */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alergias o Intolerancias Alimentarias
                </label>
                <input
                  id="patient-form-allergies"
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Ej. Lactosa, Mariscos, Frutos secos, Gluten..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Comunes:</span>
                  {ALLERGIES_PRESETS.map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => {
                        const current = formData.allergies ? formData.allergies.split(',').map((s) => s.trim()) : [];
                        if (!current.includes(al)) {
                          setFormData({ ...formData, allergies: [...current, al].join(', ') });
                        }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 cursor-pointer border border-slate-200/60 dark:border-slate-700"
                    >
                      + {al}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patologías & Diagnósticos */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patologías / Diagnósticos Previos
                </label>
                <input
                  id="patient-form-pathologies"
                  type="text"
                  value={formData.pathologies}
                  onChange={(e) => setFormData({ ...formData, pathologies: e.target.value })}
                  placeholder="Ej. Resistencia a la Insulina, Hipotiroidismo, Hipertensión..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Sugeridas:</span>
                  {PATHOLOGY_PRESETS.slice(0, 5).map((pat) => (
                    <button
                      key={pat}
                      type="button"
                      onClick={() => {
                        const current = formData.pathologies ? formData.pathologies.split(',').map((s) => s.trim()) : [];
                        if (!current.includes(pat)) {
                          setFormData({ ...formData, pathologies: [...current, pat].join(', ') });
                        }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer border border-slate-200/60 dark:border-slate-700"
                    >
                      + {pat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observaciones Generales */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones Clínicas / Motivo de Consulta
                </label>
                <textarea
                  id="patient-form-notes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones de estilo de vida, antecedentes relevantes o metas específicas acordadas..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: ESTUDIOS CLÍNICOS */}
          {activeTab === 'estudios' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    <span>Panel de Estudios Clínicos de Laboratorio</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Registra o ajusta los analitos basales requeridos y sube tus archivos
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddStudyModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Estudio</span>
                </button>
              </div>

              {/* File Upload Zone */}
              <div
                onClick={() => labFileInputRef.current?.click()}
                className="p-3.5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-xl shrink-0">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      {labFile ? `Archivo Cargado: ${labFile.name}` : 'Subir Resultados de Laboratorio (PDF o Imagen)'}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {labFile
                        ? `${labFile.sizeKb} KB • Guardado en el expediente`
                        : 'Arrastra tu archivo aquí o haz clic para seleccionarlo de tu dispositivo'}
                    </p>
                  </div>
                </div>

                {labFile ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-1 rounded-lg">
                      🟢 Listo
                    </span>
                    <button
                      type="button"
                      onClick={() => setLabFile(null)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                      title="Eliminar archivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-semibold text-[11px] shrink-0"
                  >
                    Examinar archivo
                  </button>
                )}
              </div>

              {/* Studies List (Editable, Deletable, Addable) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                  <span>Analito / Estudio</span>
                  <span>Resultado & Rango de Referencia</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {studies.map((study) => {
                    const numVal = Number(study.value);
                    const isOutOfRange =
                      study.maxNormal && numVal > study.maxNormal
                        ? 'high'
                        : study.minNormal && numVal < study.minNormal
                        ? 'low'
                        : 'normal';

                    return (
                      <div
                        key={study.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {study.name}
                            </span>
                            {isOutOfRange === 'high' && (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1 rounded">
                                Alto
                              </span>
                            )}
                            {isOutOfRange === 'low' && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1 rounded">
                                Bajo
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            Ref: {study.refRange}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            step="0.1"
                            value={study.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudies((prev) =>
                                prev.map((s) => (s.id === study.id ? { ...s, value: val } : s))
                              );
                            }}
                            className="w-20 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600 text-right font-bold text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-[10px] text-slate-500 font-mono w-9">{study.unit}</span>

                          <button
                            type="button"
                            onClick={() => {
                              setStudies((prev) => prev.filter((s) => s.id !== study.id));
                              showToast('Estudio eliminado', `Se quitó ${study.name} del formulario.`, 'info');
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                            title="Eliminar analito"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MACROS Y COMIDAS & PLANTILLAS DE PRESCRIPCIÓN */}
          {activeTab === 'macros' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Prescripciones Rápidas & Selector de Plantillas */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/60 to-slate-50 dark:from-emerald-950/30 dark:via-slate-800/60 dark:to-slate-800 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookmarkPlus className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Plantillas de Prescripción Rápida
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewTemplateModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] hover:bg-emerald-50 cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Guardar como Nueva Plantilla</span>
                  </button>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {(presets.filter((p) => p.isVisibleInQuickBar !== false).length > 0
                    ? presets.filter((p) => p.isVisibleInQuickBar !== false)
                    : presets
                  ).map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        <span>{preset.name}</span>
                        <span className={`text-[10px] ml-0.5 ${isSelected ? 'text-emerald-100 font-semibold' : 'opacity-80 text-slate-400'}`}>
                          ({preset.carbsPct}C / {Math.max(0, 100 - preset.carbsPct - preset.fatPct)}P / {preset.fatPct}G)
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Preset Sync Banner */}
                {selectedPresetId && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Plantilla seleccionada: <strong className="font-extrabold text-emerald-950 dark:text-emerald-100">{presets.find((p) => p.id === selectedPresetId)?.name || 'Personalizada'}</strong>. Sincronizada automáticamente con NutriCopilot AI.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPresetId(null)}
                      className="text-[10px] text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 underline font-bold cursor-pointer shrink-0 ml-2"
                    >
                      Deseleccionar
                    </button>
                  </div>
                )}
              </div>

              {/* Fórmulas de Gasto Energético & Meta Calórica */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        Fórmula de Gasto Basal (GEB)
                      </label>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        ACTIVA
                      </span>
                    </div>
                    <select
                      value={selectedFormulaKey}
                      onChange={(e) => handleFormulaChange(e.target.value as PredictiveFormulaKey)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="mifflin">Mifflin-St. Jeor (Clínica / Recomendada)</option>
                      <option value="harris">Harris-Benedict (Clásica / Roza & Shizgal)</option>
                      <option value="cunningham">Cunningham (Basada en Masa Magra - LBM)</option>
                      <option value="katch">Katch-McArdle (Atletas y % Grasa)</option>
                      <option value="fao_oms">FAO / OMS / UNU (Por Rangos de Edad)</option>
                      <option value="schofield">Schofield (Ecuación Ponderada OMS)</option>
                      <option value="hosp">Fórmula Rápida Hospitalaria (30 kcal/kg)</option>
                      <option value="amb">Fórmula Rápida Ambulatoria (24/23 kcal/kg)</option>
                    </select>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{computedGeb} kcal</span>
                        <span className="text-[10px] text-slate-400">GEB base</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        GET: {computedGet} kcal
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {currentFormulaInfo.subtitle}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-slate-500 font-bold">Factor de Actividad (FA)</label>
                      <span className="text-[9px] font-mono font-bold text-slate-500">FA = {activityFactor}</span>
                    </div>
                    <select
                      value={activityFactor}
                      onChange={(e) => {
                        const newFa = Number(e.target.value);
                        setActivityFactor(newFa);
                        const est = computeClinicalEngine({
                          nombre: `${formData.firstName} ${formData.lastName}`.trim() || 'Paciente',
                          sexo: formData.gender === 'M' ? 'Masculino' : 'Femenino',
                          edad: ageYears,
                          peso: currentWeightNum,
                          talla_cm: Number(formData.height) || 165,
                          factor_actividad: newFa,
                          porcentaje_grasa: formData.bodyFatPct !== '' ? Number(formData.bodyFatPct) : undefined,
                          masa_muscular_kg: formData.muscleMassKg !== '' ? Number(formData.muscleMassKg) : undefined,
                        }).estimaciones_gasto_energetico;

                        let newGet = Math.round(est.mifflin_st_jeor.formula_aplicable_al_sexo.get);
                        if (selectedFormulaKey === 'harris') newGet = Math.round(est.harris_benedict.formula_aplicable_al_sexo.get);
                        else if (selectedFormulaKey === 'cunningham') newGet = Math.round(est.cunningham.get);
                        else if (selectedFormulaKey === 'katch') newGet = Math.round(est.katch_mcardle.get);
                        else if (selectedFormulaKey === 'fao_oms') newGet = Math.round(est.fao_oms.formula_aplicable_al_sexo.get);
                        else if (selectedFormulaKey === 'schofield') newGet = Math.round(est.schofield.get);
                        else if (selectedFormulaKey === 'hosp') newGet = Math.round(est.formula_rapida_hospitalaria.geb_hombre);
                        else if (selectedFormulaKey === 'amb') newGet = Math.round(est.formula_rapida_ambulatoria.geb_aplicable_al_sexo);

                        setTargetKcal(newGet);
                      }}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      <option value={1.2}>Sedentario (x1.2)</option>
                      <option value={1.375}>Ligera (x1.375)</option>
                      <option value={1.55}>Moderada (x1.55)</option>
                      <option value={1.725}>Intensa (x1.725)</option>
                      <option value={1.9}>Muy Intensa (x1.9)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Meta Calórica Diaria *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="25"
                        value={targetKcal}
                        onChange={(e) => setTargetKcal(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm text-right pr-12 shadow-xs"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                        kcal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Comparativa de 8 Fórmulas Predictivas de Gasto Energético
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFormulaComparison(!showFormulaComparison)}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer text-[11px]"
                  >
                    {showFormulaComparison ? 'Ocultar Ecuaciones ▲' : 'Ver Ecuaciones y Comparativa (8) ▼'}
                  </button>
                </div>
              </div>

              {/* COMPARATIVA DE LAS 5 FÓRMULAS & ANTROPOMETRÍA CLÍNICA */}
              {showFormulaComparison && (
                <div className="space-y-3 animate-fade-in">
                  {/* A. Antropometría e Indicadores Clínicos Deterministas */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-extrabold text-[11px] text-slate-800 dark:text-white">
                          A. Antropometría e Indicadores Clínicos Deterministas
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Ecuaciones OMS y Broca/Metropolitana</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-semibold">Conversión Estatura:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">{clinicalEngineData.paciente.talla_m} m</span>
                        <span className="text-[10px] text-slate-400 block">({clinicalEngineData.paciente.talla_cm} cm)</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-semibold">Índice de Masa Corporal (IMC):</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">{clinicalEngineData.paciente.imc} kg/m²</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold ${
                            clinicalEngineData.paciente.imc < 18.5 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            clinicalEngineData.paciente.imc < 25 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            clinicalEngineData.paciente.imc < 30 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            {clinicalEngineData.paciente.clasificacion_imc}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-semibold">Peso Teórico ({clinicalEngineData.paciente.sexo}):</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{clinicalEngineData.paciente.peso_teorico_kg} kg</span>
                        <span className="text-[10px] text-slate-400 block">Fórmula: (talla_m²) × {formData.gender === 'M' ? '23.0' : '21.5'}</span>
                      </div>

                      {(() => {
                        const diff = Number((currentWeightNum - clinicalEngineData.paciente.peso_teorico_kg).toFixed(2));
                        return (
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 block font-semibold">Variación vs Peso Teórico:</span>
                            <span className={`font-extrabold text-sm ${diff > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`}>
                              {diff > 0 ? `+${diff}` : diff} kg
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {diff > 0 ? 'Por encima de peso ideal' : 'Por debajo de peso ideal'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* B. Ecuaciones Predictivas de GEB y Gasto Energético Total (GET) */}
                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-2">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-500" />
                          <span>B. Ecuaciones Predictivas de GEB y Gasto Energético Total (GET)</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          GET = GEB × factor_actividad ({activityFactor}). Haz clic en &ldquo;⚡ Aplicar al Plan&rdquo; para sincronizar la meta calórica.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        Factor FA = {activityFactor}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {/* 1. Mifflin-St. Jeor (Gold Standard) */}
                      {(() => {
                        const mif = clinicalEngineData.estimaciones_gasto_energetico.mifflin_st_jeor;
                        const isSelected = selectedFormulaKey === 'mifflin';
                        const mifGetRounded = Math.round(mif.formula_aplicable_al_sexo.get);
                        return (
                          <div
                            onClick={() => handleSelectFormula(mifGetRounded, 'Mifflin-St. Jeor', 'mifflin')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">1. Mifflin-St. Jeor</h5>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Recomendada (Gold Standard)</span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                    ACTIVA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>GEB ({formData.gender === 'M' ? 'Hombre' : 'Mujer'}):</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{mif.formula_aplicable_al_sexo.geb} kcal</strong>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                                  <span>GET ({activityFactor} FA):</span>
                                  <strong className="font-mono text-sm">{mif.formula_aplicable_al_sexo.get} kcal</strong>
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                  <span>H: {mif.get_hombre} | M: {mif.get_mujer} kcal</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFormula(mifGetRounded, 'Mifflin-St. Jeor', 'mifflin');
                              }}
                              className={`mt-2.5 w-full py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>⚡ Aplicar ({mifGetRounded} kcal)</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 2. Harris-Benedict */}
                      {(() => {
                        const hb = clinicalEngineData.estimaciones_gasto_energetico.harris_benedict;
                        const isSelected = selectedFormulaKey === 'harris';
                        const hbGetRounded = Math.round(hb.formula_aplicable_al_sexo.get);
                        return (
                          <div
                            onClick={() => handleSelectFormula(hbGetRounded, 'Harris-Benedict', 'harris')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">2. Harris-Benedict</h5>
                                  <span className="text-[10px] text-slate-400">Revisión Roza & Shizgal</span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                    ACTIVA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>GEB ({formData.gender === 'M' ? 'Hombre' : 'Mujer'}):</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{hb.formula_aplicable_al_sexo.geb} kcal</strong>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                                  <span>GET ({activityFactor} FA):</span>
                                  <strong className="font-mono text-sm">{hb.formula_aplicable_al_sexo.get} kcal</strong>
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                  <span>H: {hb.get_hombre} | M: {hb.get_mujer} kcal</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFormula(hbGetRounded, 'Harris-Benedict', 'harris');
                              }}
                              className={`mt-2.5 w-full py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>⚡ Aplicar ({hbGetRounded} kcal)</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 3. Cunningham (Masa Magra / LBM) */}
                      {(() => {
                        const cun = clinicalEngineData.estimaciones_gasto_energetico.cunningham;
                        const isSelected = selectedFormulaKey === 'cunningham';
                        const cunGetRounded = Math.round(cun.get);
                        return (
                          <div
                            onClick={() => handleSelectFormula(cunGetRounded, 'Cunningham', 'cunningham')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">3. Cunningham</h5>
                                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Basada en Masa Magra (LBM)</span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                    ACTIVA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>LBM estimado:</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{cun.lbm_kg} kg</strong>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>GEB (500 + 22×LBM):</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{cun.geb} kcal</strong>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                                  <span>GET ({activityFactor} FA):</span>
                                  <strong className="font-mono text-sm">{cun.get} kcal</strong>
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                  <span>Ideal recomposición corporal</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFormula(cunGetRounded, 'Cunningham', 'cunningham');
                              }}
                              className={`mt-2.5 w-full py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>⚡ Aplicar ({cunGetRounded} kcal)</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 4. Katch-McArdle (Atletas & % Grasa) */}
                      {(() => {
                        const kat = clinicalEngineData.estimaciones_gasto_energetico.katch_mcardle;
                        const isSelected = selectedFormulaKey === 'katch';
                        const katGetRounded = Math.round(kat.get);
                        return (
                          <div
                            onClick={() => handleSelectFormula(katGetRounded, 'Katch-McArdle', 'katch')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">4. Katch-McArdle</h5>
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Atletas y Composición Corporal</span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                    ACTIVA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>Masa Magra (LBM):</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{kat.lbm_kg} kg</strong>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>GEB (370 + 21.6×LBM):</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{kat.geb} kcal</strong>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                                  <span>GET ({activityFactor} FA):</span>
                                  <strong className="font-mono text-sm">{kat.get} kcal</strong>
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                  <span>{formData.bodyFatPct ? `% Grasa: ${formData.bodyFatPct}%` : 'Estimación somatométrica'}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFormula(katGetRounded, 'Katch-McArdle', 'katch');
                              }}
                              className={`mt-2.5 w-full py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>⚡ Aplicar ({katGetRounded} kcal)</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 5. FAO / OMS / UNU */}
                      {(() => {
                        const fao = clinicalEngineData.estimaciones_gasto_energetico.fao_oms;
                        const isSelected = selectedFormulaKey === 'fao_oms';
                        const faoGetRounded = Math.round(fao.formula_aplicable_al_sexo.get);
                        return (
                          <div
                            onClick={() => handleSelectFormula(faoGetRounded, 'FAO / OMS / UNU', 'fao_oms')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">5. FAO / OMS / UNU</h5>
                                  <span className="text-[10px] text-slate-400">Ponderada por grupo etario</span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                    ACTIVA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>GEB ({formData.gender === 'M' ? 'Hombre' : 'Mujer'}):</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{fao.formula_aplicable_al_sexo.geb} kcal</strong>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                                  <span>GET ({activityFactor} FA):</span>
                                  <strong className="font-mono text-sm">{fao.formula_aplicable_al_sexo.get} kcal</strong>
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                  <span>H: {fao.get_hombre} | M: {fao.get_mujer} kcal</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFormula(faoGetRounded, 'FAO / OMS / UNU', 'fao_oms');
                              }}
                              className={`mt-2.5 w-full py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>⚡ Aplicar ({faoGetRounded} kcal)</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 6. Schofield */}
                      {(() => {
                        const sch = clinicalEngineData.estimaciones_gasto_energetico.schofield;
                        const isSelected = selectedFormulaKey === 'schofield';
                        const schGetRounded = Math.round(sch.get);
                        return (
                          <div
                            onClick={() => handleSelectFormula(schGetRounded, 'Schofield', 'schofield')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">6. Schofield</h5>
                                  <span className="text-[10px] text-slate-400">8.4×peso + 4.5×talla + 200</span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                    ACTIVA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>GEB Base:</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{sch.geb} kcal</strong>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                                  <span>GET ({activityFactor} FA):</span>
                                  <strong className="font-mono text-sm">{sch.get} kcal</strong>
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                  <span>Ecuación ponderada OMS</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFormula(schGetRounded, 'Schofield', 'schofield');
                              }}
                              className={`mt-2.5 w-full py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>⚡ Aplicar ({schGetRounded} kcal)</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 7. Fórmula Rápida Hospitalaria */}
                      {(() => {
                        const hosp = clinicalEngineData.estimaciones_gasto_energetico.formula_rapida_hospitalaria;
                        const isSelected = selectedFormulaKey === 'hosp';
                        const hospRounded = Math.round(hosp.geb_hombre);
                        return (
                          <div
                            onClick={() => handleSelectFormula(hospRounded, 'Fórmula Rápida Hospitalaria', 'hosp')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">7. Rápida Hospitalaria</h5>
                                  <span className="text-[10px] text-slate-400">GEB = peso × 30.0 kcal/kg</span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                    ACTIVA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span>Cálculo Directo:</span>
                                  <strong className="font-mono text-slate-900 dark:text-white">{hosp.geb_hombre} kcal</strong>
                                </div>
                                <div className="flex justify-between items-center text-teal-700 dark:text-teal-400 font-bold">
                                  <span>Meta Estimada:</span>
                                  <strong className="font-mono text-sm">{hosp.geb_hombre} kcal</strong>
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                  <span>Guía rápida en estancia clínica</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFormula(hospRounded, 'Fórmula Rápida Hospitalaria', 'hosp');
                              }}
                              className={`mt-2.5 w-full py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>⚡ Aplicar ({hospRounded} kcal)</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 8. Fórmula Rápida Ambulatoria */}
                      {(() => {
                        const amb = clinicalEngineData.estimaciones_gasto_energetico.formula_rapida_ambulatoria;
                        const isSelected = selectedFormulaKey === 'amb';
                        const ambRounded = Math.round(amb.geb_aplicable_al_sexo);
                        return (
                          <div
                            onClick={() => handleSelectFormula(ambRounded, 'Fórmula Rápida Ambulatoria', 'amb')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">8. Rápida Ambulatoria</h5>
                                  <span className="text-[10px] text-slate-400">H: 24 kcal/kg • M: 23 kcal/kg</span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                    ACTIVA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 text-[11px]">
                                  <span>H (24×kg): <strong className="font-mono">{amb.geb_hombre}</strong></span>
                                  <span>M (23×kg): <strong className="font-mono">{amb.geb_mujer}</strong></span>
                                </div>
                                <div className="flex justify-between items-center text-teal-700 dark:text-teal-400 font-bold">
                                  <span>Aplicable ({formData.gender === 'M' ? 'Hombre' : 'Mujer'}):</span>
                                  <strong className="font-mono text-sm">{amb.geb_aplicable_al_sexo} kcal</strong>
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                  <span>Consulta ambulatoria 1er nivel</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFormula(ambRounded, 'Fórmula Rápida Ambulatoria', 'amb');
                              }}
                              className={`mt-2.5 w-full py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>⚡ Aplicar ({ambRounded} kcal)</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN ESTRICTA: DISTRIBUCIÓN SUGERIDA DE MACRONUTRIENTES (EXACTAMENTE 100%) */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      <span>Distribución Sugerida de Macronutrientes</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Entre proteínas, grasas saludables y carbohidratos complejos deben sumar exactamente 100%
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoBalanceMacros}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] hover:bg-emerald-100 cursor-pointer border border-emerald-200 dark:border-emerald-800"
                  >
                    Equilibrar al 100%
                  </button>
                </div>

                {/* Progress bar segmented */}
                <div className="space-y-1">
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${carbsPct}%` }}
                      className="bg-blue-500 h-full transition-all"
                      title={`Carbohidratos: ${carbsPct}%`}
                    />
                    <div
                      style={{ width: `${proteinPct}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Proteínas: ${proteinPct}%`}
                    />
                    <div
                      style={{ width: `${fatPct}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`Grasas: ${fatPct}%`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-blue-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Carbs: {carbsPct}% ({carbsGrams}g)
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Proteína: {proteinPct}% ({proteinGrams}g, {proteinGPerKg} g/kg)
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Grasas: {fatPct}% ({fatGrams}g)
                      </span>
                    </div>

                    <span
                      className={`font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                        isMacrosValid
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                      }`}
                    >
                      Total: {totalMacrosPct}% {isMacrosValid ? '✓ Correcto' : `(Falta/Excede ${100 - totalMacrosPct}%)`}
                    </span>
                  </div>
                </div>

                {/* Macro Sliders & Number Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Carbohidratos Complejos */}
                  <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                        Carbohidratos Complejos
                      </label>
                      <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 font-mono">
                        {carbsPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={carbsPct}
                      onChange={(e) => handleCarbsChange(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-blue-600/80 mt-1">
                      <span>{carbsGrams} gramos</span>
                      <span>{Math.round(carbsGrams * 4)} kcal</span>
                    </div>
                  </div>

                  {/* Proteínas */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                        Proteínas
                      </label>
                      <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                        {proteinPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={proteinPct}
                      onChange={(e) => handleProteinChange(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-emerald-600/80 mt-1">
                      <span>{proteinGrams}g ({proteinGPerKg} g/kg)</span>
                      <span>{Math.round(proteinGrams * 4)} kcal</span>
                    </div>
                  </div>

                  {/* Grasas Saludables */}
                  <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                        Grasas Saludables
                      </label>
                      <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                        {fatPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fatPct}
                      onChange={(e) => handleFatChange(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-amber-600/80 mt-1">
                      <span>{fatGrams} gramos</span>
                      <span>{Math.round(fatGrams * 9)} kcal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribución de Comidas */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Distribución Sugerida por Tiempos de Comida (% de energía diaria):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Desayuno', key: 'desayuno', val: mealDistribution.desayuno },
                    { label: 'Colación 1', key: 'colacion1', val: mealDistribution.colacion1 },
                    { label: 'Comida', key: 'comida', val: mealDistribution.comida },
                    { label: 'Colación 2', key: 'colacion2', val: mealDistribution.colacion2 },
                    { label: 'Cena', key: 'cena', val: mealDistribution.cena },
                  ].map((meal) => (
                    <div key={meal.key} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-semibold block">{meal.label}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">{meal.val}%</span>
                      <span className="text-[9px] text-slate-400 block">{Math.round(targetKcal * (meal.val / 100))} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EVALUADOR SMAE */}
          {activeTab === 'smae' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-emerald-600" />
                    <span>Evaluador Sistema Mexicano de Alimentos Equivalentes (SMAE)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cálculo matemático de porciones por grupo de alimentos y adecuación calórica
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Deterministic SMAE portion distribution reaching EXACT 100% adequacy
                    const baseKcal = targetKcal || 1800;
                    const factor = baseKcal / 1800;
                    const portions: Record<string, number> = {
                      'Verduras': Math.max(2, Math.round(4 * factor)),
                      'Frutas': Math.max(2, Math.round(3 * factor)),
                      'Cereales s/g': Math.max(3, Math.round(5 * factor)),
                      'Cereales c/g': Math.max(0, Math.round(1 * factor)),
                      'Leguminosas': 1.5,
                      'AOA Muy bajo aporte': Math.max(1, Math.round(2 * factor)),
                      'AOA Bajo aporte': Math.max(2, Math.round(3 * factor)),
                      'AOA Moderado aporte': Math.max(0, Math.round(1 * factor)),
                      'AOA Alto aporte': 0,
                      'Leche descremada': 1,
                      'Leche semidescremada': 0,
                      'Leche entera': 0,
                      'Leche c/azúcar': 0,
                      'Grasas s/proteína': Math.max(2, Math.round(3 * factor)),
                      'Grasas c/proteína': 1,
                      'Azúcares s/grasa': 0,
                    };

                    const calcCurrentKcal = () => {
                      let k = 0;
                      SMAE_CONSTANTS.forEach((c) => {
                        k += (portions[c.grupo] || 0) * c.energia_kcal;
                      });
                      return k;
                    };

                    // 1. Adjust whole Cereales s/g (70 kcal)
                    while (baseKcal - calcCurrentKcal() >= 70) portions['Cereales s/g']++;
                    while (baseKcal - calcCurrentKcal() <= -70 && portions['Cereales s/g'] > 2) portions['Cereales s/g']--;

                    // 2. Adjust Grasas s/p (45 kcal)
                    while (baseKcal - calcCurrentKcal() >= 45) portions['Grasas s/proteína']++;
                    while (baseKcal - calcCurrentKcal() <= -45 && portions['Grasas s/proteína'] > 1) portions['Grasas s/proteína']--;

                    // 3. Adjust Verduras (25 kcal)
                    while (baseKcal - calcCurrentKcal() >= 25) portions['Verduras']++;
                    while (baseKcal - calcCurrentKcal() <= -25 && portions['Verduras'] > 2) portions['Verduras']--;

                    // 4. Fine-tune with exact Verduras adjustment to ensure Math.round(kcal) === baseKcal (100% adequacy)
                    const diff = baseKcal - calcCurrentKcal();
                    if (Math.abs(diff) > 0.01) {
                      const vStep = Number((diff / 25).toFixed(2));
                      portions['Verduras'] = Number((portions['Verduras'] + vStep).toFixed(2));
                    }

                    setSmaePortions(portions);
                    showToast('Adecuación SMAE al 100%', `Porciones auto-distribuidas exitosamente para alcanzar exactamente el 100% de adecuación calórica (${baseKcal} kcal).`, 'success');
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-700 text-[11px] font-bold rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auto-distribuir</span>
                </button>
              </div>

              {/* Real-time SMAE Totals Summary Banner */}
              <div className="p-3 rounded-2xl bg-slate-900 text-white grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[10px] text-slate-400 block">Kcal SMAE</span>
                  <span className="text-base font-extrabold text-emerald-400">{smaeTotals.kcal}</span>
                  <span className="text-[10px] text-slate-400 block">Meta: {targetKcal} kcal</span>
                </div>
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[10px] text-slate-400 block">Proteínas</span>
                  <span className="text-base font-extrabold text-teal-400">{smaeTotals.prot}g</span>
                  <span className="text-[10px] text-slate-400 block">Meta: {proteinGrams}g</span>
                </div>
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[10px] text-slate-400 block">Lípidos</span>
                  <span className="text-base font-extrabold text-amber-400">{smaeTotals.lip}g</span>
                  <span className="text-[10px] text-slate-400 block">Meta: {fatGrams}g</span>
                </div>
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[10px] text-slate-400 block">Carbohidratos</span>
                  <span className="text-base font-extrabold text-blue-400">{smaeTotals.hc}g</span>
                  <span className="text-[10px] text-slate-400 block">Meta: {carbsGrams}g</span>
                </div>
                <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 block">% Adecuación</span>
                  <span className={`text-base font-extrabold ${
                    smaeTotals.adequacyPct >= 95 && smaeTotals.adequacyPct <= 105
                      ? 'text-emerald-400'
                      : smaeTotals.adequacyPct < 95
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {smaeTotals.adequacyPct}%
                  </span>
                </div>
              </div>

              {/* 16 Official SMAE Groups Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {SMAE_CONSTANTS.map((c) => {
                  const val = smaePortions[c.grupo] || 0;
                  return (
                    <div
                      key={c.grupo}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-[11px]">
                          {c.grupo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.energia_kcal} kcal • P:{c.prot_g} L:{c.lip_g} C:{c.hc_g}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = smaePortions[c.grupo] || 0;
                            setSmaePortions({ ...smaePortions, [c.grupo]: Math.max(0, Number((cur - 0.5).toFixed(1))) });
                          }}
                          className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold flex items-center justify-center cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={val}
                          onChange={(e) => {
                            const num = Math.max(0, Number(e.target.value) || 0);
                            setSmaePortions({ ...smaePortions, [c.grupo]: num });
                          }}
                          className="w-12 px-1 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-600 text-center font-bold text-slate-900 dark:text-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = smaePortions[c.grupo] || 0;
                            setSmaePortions({ ...smaePortions, [c.grupo]: Number((cur + 0.5).toFixed(1)) });
                          }}
                          className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold flex items-center justify-center cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: CREDENCIALES & ACCESO PORTAL */}
          {activeTab === 'credenciales' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Habilitar Acceso al Portal del Paciente
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Permite al paciente iniciar sesión en su teléfono móvil para ver su plan y SMAE
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.portalAccessEnabled}
                    onChange={(e) => setFormData({ ...formData, portalAccessEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {formData.portalAccessEnabled && (
                <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Usuario de Inicio de Sesión
                      </label>
                      <input
                        type="text"
                        value={formData.portalUsername}
                        onChange={(e) => setFormData({ ...formData, portalUsername: e.target.value })}
                        placeholder={formData.email || 'usuario o correo'}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Contraseña Asignada *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const randomNum = Math.floor(100 + Math.random() * 900);
                            const newPass = `Nutri${randomNum}!`;
                            setFormData({ ...formData, portalPassword: newPass });
                            showToast('Contraseña Generada', `Asignada: ${newPass}`, 'info');
                          }}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>🎲 Generar</span>
                        </button>
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type={formData.showPassword ? 'text' : 'password'}
                          value={formData.portalPassword}
                          onChange={(e) => setFormData({ ...formData, portalPassword: e.target.value })}
                          className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {formData.showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Credenciales listas: Usuario: <strong className="font-mono text-emerald-700 dark:text-emerald-300">{formData.portalUsername || formData.email || 'correo'}</strong> | Clave: <strong className="font-mono text-emerald-700 dark:text-emerald-300">{formData.portalPassword || 'Nutri2026!'}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: FOTO / AVATAR & FINALIZAR (ÚLTIMO APARTADO - AQUÍ Y SOLO AQUÍ SE VE EL BOTÓN DE REGISTRAR) */}
          {activeTab === 'foto' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-800/80 dark:via-slate-800 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-700">
                <div className="relative group shrink-0">
                  <img
                    src={formData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt="Foto del paciente"
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-md"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin mb-1 text-emerald-400" />
                      <span className="text-[9px] font-bold">Optimizando</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {formData.firstName || formData.lastName
                      ? `${formData.firstName} ${formData.lastName}`.trim()
                      : 'Fotografía Oficial del Paciente'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md">
                    Se utilizará en el expediente clínico, portal del paciente y en los reportes PDF.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Imagen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer transition-all active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cámara</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatares Preconfigurados */}
              <div>
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                  O selecciona un avatar clínico sugerido:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_PRESETS.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, photoUrl: avatar.url })}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        formData.photoUrl === avatar.url
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105'
                          : 'border-transparent hover:opacity-80'
                      }`}
                    >
                      <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen Final de Registro */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Paciente:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formData.firstName} {formData.lastName} ({formData.gender === 'M' ? 'Hombre' : 'Mujer'}, {ageYears} años)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Métricas:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.currentWeight} kg • {formData.height} cm (IMC: {liveBmi})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prescripción Calórica:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {targetKcal} kcal ({carbsPct}% C / {proteinPct}% P / {fatPct}% G = 100%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estudios de Laboratorio:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {studies.length} analitos registrados {labFile ? '• Archivo adjunto ✓' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER CONTROLS: "REGISTRAR UN PACIENTE" SOLO SE VE EN EL ÚLTIMO APARTADO ('foto') */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">
              Paso {currentStepIndex + 1} de {TABS.length}: <span className="font-semibold text-slate-600 dark:text-slate-300">{TABS[currentStepIndex].label}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="patient-form-cancel-btn"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {activeTab !== 'general' && (
                <button
                  type="button"
                  id="patient-form-prev-btn"
                  onClick={handlePrevTab}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
              )}

              {/* Botón Siguiente si no estamos en el último paso */}
              {activeTab !== 'foto' ? (
                <button
                  type="button"
                  id="patient-form-next-btn"
                  onClick={handleNextTab}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/15 cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>Siguiente Paso</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                /* BOTÓN DE REGISTRAR PACIENTE: SOLO VISIBLE EN EL ÚLTIMO APARTADO */
                <button
                  type="submit"
                  id="patient-form-submit-btn"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Registrar un Paciente'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        id="confirm-patient-save-modal"
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={isEditing ? 'Confirmar Actualización de Expediente' : 'Confirmar Registro de Paciente'}
        subtitle="Verifica los datos principales antes de guardar en el sistema"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {isEditing ? '¿Deseas guardar los cambios del paciente?' : '¿Deseas registrar este nuevo paciente?'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Se sincronizará el perfil del paciente, expediente clínico con anamnesis, estudios de laboratorio, matriz SMAE y prescripción de macronutrientes.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Nombre completo:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formData.firstName} {formData.lastName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Objetivo:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {formData.goal}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Somatometría:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formData.currentWeight} kg • {formData.height} cm (IMC: {liveBmi})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Prescripción:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {targetKcal} kcal ({carbsPct}% C / {proteinPct}% P / {fatPct}% G = 100%)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Portal del Paciente:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formData.portalAccessEnabled ? `🟢 Activo (${formData.portalUsername || formData.email})` : '🔴 Inactivo'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              Revisar datos
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Sí, Guardar Cambios' : 'Sí, Registrar Paciente'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para Agregar Nuevo Estudio Clínico Personalizado */}
      <Modal
        id="add-custom-study-modal"
        isOpen={showAddStudyModal}
        onClose={() => setShowAddStudyModal(false)}
        title="Agregar Estudio Clínico"
        subtitle="Registra un nuevo analito o parámetro de laboratorio"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Estudio o Analito *
            </label>
            <input
              type="text"
              value={newStudyForm.name}
              onChange={(e) => setNewStudyForm({ ...newStudyForm, name: e.target.value })}
              placeholder="Ej. HbA1c, Insulina Basal, TSH..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valor Resultado
              </label>
              <input
                type="text"
                value={newStudyForm.value}
                onChange={(e) => setNewStudyForm({ ...newStudyForm, value: e.target.value })}
                placeholder="Ej. 5.6"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unidad
              </label>
              <input
                type="text"
                value={newStudyForm.unit}
                onChange={(e) => setNewStudyForm({ ...newStudyForm, unit: e.target.value })}
                placeholder="Ej. %, mg/dL, uUI/mL"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Rango de Referencia
            </label>
            <input
              type="text"
              value={newStudyForm.refRange}
              onChange={(e) => setNewStudyForm({ ...newStudyForm, refRange: e.target.value })}
              placeholder="Ej. 4.0 - 5.6 %"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddStudyModal(false)}
              className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newStudyForm.name.trim()) {
                  showToast('Nombre Requerido', 'Ingresa el nombre del analito.', 'error');
                  return;
                }
                const newStudy: ClinicalStudyItem = {
                  id: `study-custom-${Date.now()}`,
                  name: newStudyForm.name.trim(),
                  value: newStudyForm.value || '0',
                  unit: newStudyForm.unit || 'mg/dL',
                  refRange: newStudyForm.refRange || 'Normal',
                };
                setStudies((prev) => [...prev, newStudy]);
                setShowAddStudyModal(false);
                setNewStudyForm({ name: '', value: '', unit: 'mg/dL', refRange: '' });
                showToast('Estudio Agregado', `${newStudy.name} añadido a los estudios del paciente.`, 'success');
              }}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Agregar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para Guardar Configuración como Nueva Plantilla */}
      <Modal
        id="save-new-template-modal"
        isOpen={showNewTemplateModal}
        onClose={() => setShowNewTemplateModal(false)}
        title="Crear Nueva Plantilla de Prescripción"
        subtitle="Guarda la distribución actual de macros y calorías para usarla con otros pacientes"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Plantilla *
            </label>
            <input
              type="text"
              value={newTemplateForm.name}
              onChange={(e) => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
              placeholder="Ej. Mi Plan Reducción Grasa SMAE"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoría / Distintivo
            </label>
            <select
              value={newTemplateForm.badge}
              onChange={(e) => setNewTemplateForm({ ...newTemplateForm, badge: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
            >
              <option value="Personalizado">Personalizado</option>
              <option value="Metabólico">Metabólico</option>
              <option value="Rendimiento">Rendimiento</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Basado en Plantas">Basado en Plantas</option>
              <option value="Digestivo">Digestivo</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descripción o Recomendaciones
            </label>
            <textarea
              rows={2}
              value={newTemplateForm.description}
              onChange={(e) => setNewTemplateForm({ ...newTemplateForm, description: e.target.value })}
              placeholder="Instrucciones clínicas clave, tiempos de comida o grupo objetivo..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 resize-none"
            />
          </div>

          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-[11px] text-slate-600 dark:text-slate-300">
            Macros a guardar: {carbsPct}% Carbohidratos • {proteinPct}% Proteína • {fatPct}% Grasas = 100%
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowNewTemplateModal(false)}
              className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAsNewTemplate}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Plantilla</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
