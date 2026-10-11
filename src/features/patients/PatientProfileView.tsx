import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Activity,
  FileText,
  Utensils,
  BookOpen,
  Calendar,
  Scale,
  LineChart,
  Dumbbell,
  Pill,
  FileCheck2,
  MessageSquare,
  Sparkles,
  Phone,
  Mail,
  Download,
  Plus,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ShoppingCart,
  Edit3,
  Edit2,
  Trash2,
  Camera,
  KeyRound,
  Smartphone,
  Eye,
  EyeOff,
  Copy,
  Apple,
  ChevronDown,
  Check,
  Share2,
  ChefHat,
  Search,
  CheckSquare,
  Square,
  Info,
} from 'lucide-react';
import { PatientCredentialsModal } from './PatientCredentialsModal';
import {
  Patient,
  NutritionPlan,
  AnthropometricRecord,
  Appointment,
  ClinicalRecord,
  LaboratoryResult,
  ExerciseRoutine,
  SupplementPrescription,
  Recipe,
} from '../../types';
import { storageService } from '../../lib/storage';
import { RiskBadge } from '../../components/common/RiskBadge';
import { pdfService } from '../../lib/pdf';
import { isMobileOrAndroid } from '../../lib/pdfDelivery';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { NutriCopilotPlanWizardModal } from '../ai_copilot/NutriCopilotPlanWizardModal';
import { PatientFormModal } from './PatientFormModal';
import { DeletePatientModal } from './DeletePatientModal';
import { ExecutivePdfExportModal } from '../../components/ExecutivePdfExportModal';
import { SmaeInfographicBento } from '../../components/SmaeInfographicBento';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

/**
 * Strips out any legacy auto-generated stubs or fake template text (e.g. mock 24h meals or default habits)
 * to ensure that only real nutritionist inputs are stored and displayed.
 */
function cleanLegacyMockClinicalRecord(rec: ClinicalRecord | undefined): ClinicalRecord | undefined {
  if (!rec) return undefined;
  // If the record was customized or edited by the user, never wipe out their inputs!
  if (rec.isCustomized) return rec;

  let changed = false;
  const isMockRecall = !!(rec.recall24h && rec.recall24h.includes('Café con leche y pan tostado'));
  const isAutoStubNotes =
    rec.familyHistory?.notes === 'Sin antecedentes graves reportados.' ||
    rec.familyHistory?.notes === 'Sin antecedentes patológicos familiares graves.';
  // Only strip dummy placeholder habits if this is the unedited mock template
  const isAutoStubHabits =
    isMockRecall &&
    rec.lifestyleHabits?.sleepHours === 7 &&
    rec.lifestyleHabits?.waterDailyLiters === 2.0 &&
    rec.lifestyleHabits?.alcohol === 'Ocasional' &&
    rec.physicalActivity?.frequencyDaysPerWeek === 3;

  const cleaned: ClinicalRecord = { ...rec };

  if (isMockRecall) {
    cleaned.recall24h = '';
    changed = true;
  }
  if (isAutoStubHabits) {
    cleaned.lifestyleHabits = undefined;
    cleaned.physicalActivity = undefined;
    cleaned.dietaryHabits = undefined;
    changed = true;
  }
  if (isAutoStubNotes) {
    if (cleaned.familyHistory && !cleaned.familyHistory.diabetes && !cleaned.familyHistory.hypertension && !cleaned.familyHistory.cancer) {
      cleaned.familyHistory = undefined;
      changed = true;
    } else if (cleaned.familyHistory) {
      cleaned.familyHistory = { ...cleaned.familyHistory, notes: '' };
      changed = true;
    }
  }

  if (changed) {
    try {
      storageService.saveClinicalRecordSilent(cleaned);
    } catch {
      // ignore
    }
  }
  return cleaned;
}

interface PatientProfileViewProps {
  patientId: string;
  onBack: () => void;
  onNavigate?: (view: string, param?: string) => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patientId,
  onBack,
  onNavigate,
}) => {
  const { organization, currentUser } = useAuth();
  const { showToast } = useToast();

  const [patient, setPatient] = useState<Patient | undefined>(() =>
    storageService.getPatientById(patientId)
  );

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [showPasswordInProfile, setShowPasswordInProfile] = useState(false);
  // Opción 1: Tarjeta Plegable / Acordeón Inteligente para que la información no sea invasiva al entrar al perfil
  const [isCredentialsAccordionOpen, setIsCredentialsAccordionOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('nutriluz_credentials_accordion_open');
      return stored === 'true'; // Inicia plegado por defecto para no ser invasivo al entrar
    } catch {
      return false;
    }
  });
  const [copiedField, setCopiedField] = useState<'user' | 'pass' | 'all' | null>(null);

  const toggleCredentialsAccordion = () => {
    setIsCredentialsAccordionOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nutriluz_credentials_accordion_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleCopyCredentialText = (text: string, field: 'user' | 'pass' | 'all', label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast('Copiado al portapapeles', `${label} copiado exitosamente.`, 'info');
    setTimeout(() => {
      setCopiedField((curr) => (curr === field ? null : curr));
    }, 2000);
  };
  const [isExecutiveExportModalOpen, setIsExecutiveExportModalOpen] = useState(false);
  const [exportTab, setExportTab] = useState<'download' | 'editor' | 'photos'>('download');

  const [activeTab, setActiveTab] = useState<
    | 'resumen'
    | 'expediente'
    | 'antropometria'
    | 'plan'
    | 'recetas'
    | 'consultas'
    | 'seguimiento'
    | 'laboratorios'
    | 'smae'
    | 'suplementos'
    | 'documentos'
    | 'chat'
  >('resumen');

  // Sub-data states
  const [plans, setPlans] = useState<NutritionPlan[]>(() =>
    storageService.getPlansByPatientId(patientId)
  );
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [anthroRecords, setAnthroRecords] = useState<AnthropometricRecord[]>(() =>
    storageService.getAnthropometricsByPatientId(patientId)
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    storageService.getAppointmentsByPatientId(patientId)
  );
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecord | undefined>(() =>
    cleanLegacyMockClinicalRecord(storageService.getClinicalRecordByPatientId(patientId))
  );
  const [labRecords, setLabRecords] = useState<LaboratoryResult[]>(() =>
    storageService.getLabRecordsByPatientId(patientId)
  );
  const [routines, setRoutines] = useState<ExerciseRoutine[]>(() =>
    storageService.getExerciseRoutinesByPatientId(patientId)
  );
  const [supplements, setSupplements] = useState<SupplementPrescription[]>(() =>
    storageService.getSupplementsByPatientId(patientId)
  );

  // Sync state whenever patientId changes or events fire
  useEffect(() => {
    const refreshData = () => {
      const p = storageService.getPatientById(patientId);
      setPatient(p);
      setPlans(storageService.getPlansByPatientId(patientId));
      setAnthroRecords(storageService.getAnthropometricsByPatientId(patientId));
      setAppointments(storageService.getAppointmentsByPatientId(patientId));
      setClinicalRecord(cleanLegacyMockClinicalRecord(storageService.getClinicalRecordByPatientId(patientId)));
      setLabRecords(storageService.getLabRecordsByPatientId(patientId));
      setRoutines(storageService.getExerciseRoutinesByPatientId(patientId));
      setSupplements(storageService.getSupplementsByPatientId(patientId));
    };

    refreshData();
    storageService.fetchPatientPlans(patientId).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setPlans(fetched);
      }
    }).catch(() => {});

    const handleUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.patientId || detail.patientId === patientId) {
        const p = storageService.getPatientById(patientId);
        if (p) {
          setPatient((current) => {
            if (!current) return p;
            return {
              ...p,
              assignedRecipeIds: Array.isArray(p.assignedRecipeIds)
                ? p.assignedRecipeIds
                : (current.assignedRecipeIds || []),
            };
          });
        }
        setPlans(storageService.getPlansByPatientId(patientId));
        setAnthroRecords(storageService.getAnthropometricsByPatientId(patientId));
        setAppointments(storageService.getAppointmentsByPatientId(patientId));
        if (!isEditingClinicalRef.current) {
          setClinicalRecord(cleanLegacyMockClinicalRecord(storageService.getClinicalRecordByPatientId(patientId)));
        }
        setLabRecords(storageService.getLabRecordsByPatientId(patientId));
        setRoutines(storageService.getExerciseRoutinesByPatientId(patientId));
        setSupplements(storageService.getSupplementsByPatientId(patientId));
      }
    };

    window.addEventListener('nutriluz_plan_updated', handleUpdate);
    window.addEventListener('nutriluz:db_updated', handleUpdate);
    window.addEventListener('nutriluz:cloud_synced', handleUpdate);
    window.addEventListener('storage', refreshData);

    return () => {
      window.removeEventListener('nutriluz_plan_updated', handleUpdate);
      window.removeEventListener('nutriluz:db_updated', handleUpdate);
      window.removeEventListener('nutriluz:cloud_synced', handleUpdate);
      window.removeEventListener('storage', refreshData);
    };
  }, [patientId]);

  // NutriCopilot quick state inside profile
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // New Anthropometry modal
  const [isAnthroModalOpen, setIsAnthroModalOpen] = useState(false);
  const [newAnthro, setNewAnthro] = useState({
    weightKg: patient?.currentWeight || 70,
    bodyFatPercentage: 24.5,
    muscleMassKg: 26.2,
    visceralFatLevel: 4,
    waistCm: 76,
    hipCm: 98,
    chestCm: 89,
    armCm: 28,
    thighCm: 54,
    notes: 'Medición de control evolutivo',
  });

  // Clinical record edit state
  const [isEditingClinical, setIsEditingClinical] = useState(false);
  const isEditingClinicalRef = useRef(false);
  const [showConfirmClinical, setShowConfirmClinical] = useState(false);

  useEffect(() => {
    isEditingClinicalRef.current = isEditingClinical;
  }, [isEditingClinical]);

  // Modal para asignación personalizada de recetas (Opción B)
  const [isAssignRecipesModalOpen, setIsAssignRecipesModalOpen] = useState(false);
  const [assignRecipeSearch, setAssignRecipeSearch] = useState('');
  const [assignRecipeCategory, setAssignRecipeCategory] = useState<string>('ALL');
  const [clinicalForm, setClinicalForm] = useState({
    diabetes: false,
    hypertension: false,
    cancer: false,
    familyNotes: '',
    allergies: '',
    pathologies: '',
    sleepHours: '' as number | string,
    sleepQuality: '',
    waterDailyLiters: '' as number | string,
    alcohol: '',
    physicalActivityLevel: '',
    physicalActivityDays: '' as number | string,
    recall24h: '',
    notes: '',
  });

  const populateClinicalForm = (rec: ClinicalRecord | undefined, pat: Patient | undefined) => {
    const isMockRecall = !rec?.isCustomized && !!(rec?.recall24h && rec.recall24h.includes('Café con leche y pan tostado'));
    const isAutoStubNotes = !rec?.isCustomized && (
      rec?.familyHistory?.notes === 'Sin antecedentes graves reportados.' ||
      rec?.familyHistory?.notes === 'Sin antecedentes patológicos familiares graves.'
    );
    setClinicalForm({
      diabetes: !!rec?.familyHistory?.diabetes,
      hypertension: !!rec?.familyHistory?.hypertension,
      cancer: !!rec?.familyHistory?.cancer,
      familyNotes: isAutoStubNotes ? '' : (rec?.familyHistory?.notes || ''),
      allergies: Array.isArray(rec?.allergies)
        ? rec!.allergies.join(', ')
        : typeof (pat as any)?.allergies === 'string'
        ? (pat as any).allergies
        : '',
      pathologies: Array.isArray(rec?.pathologicalHistory?.diagnosedDiseases)
        ? rec!.pathologicalHistory.diagnosedDiseases.join(', ')
        : typeof (pat as any)?.pathologies === 'string'
        ? (pat as any).pathologies
        : '',
      sleepHours: rec?.lifestyleHabits?.sleepHours ?? '',
      sleepQuality: rec?.lifestyleHabits?.sleepQuality || '',
      waterDailyLiters: rec?.lifestyleHabits?.waterDailyLiters ?? '',
      alcohol: (rec?.lifestyleHabits?.alcohol === 'Ocasional' && !rec?.lifestyleHabits?.sleepHours) ? '' : (rec?.lifestyleHabits?.alcohol || ''),
      physicalActivityLevel: rec?.physicalActivity?.activityLevel || '',
      physicalActivityDays: rec?.physicalActivity?.frequencyDaysPerWeek ?? '',
      recall24h: isMockRecall ? '' : (rec?.recall24h || ''),
      notes: rec?.clinicalObservations || pat?.notes || '',
    });
  };

  useEffect(() => {
    // CRITICAL: Do NOT overwrite clinical form if the user is currently editing!
    if (isEditingClinicalRef.current || isEditingClinical) return;
    if (clinicalRecord || patient) {
      populateClinicalForm(clinicalRecord, patient);
    }
  }, [clinicalRecord, patient, isEditingClinical]);

  const handleStartEditClinical = () => {
    const currentClin = clinicalRecord || storageService.getClinicalRecordByPatientId(patientId);
    populateClinicalForm(currentClin, patient);
    isEditingClinicalRef.current = true;
    setIsEditingClinical(true);
  };

  const handleCancelEditClinical = () => {
    isEditingClinicalRef.current = false;
    setIsEditingClinical(false);
    populateClinicalForm(clinicalRecord, patient);
  };

  const handleOpenConfirmClinical = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowConfirmClinical(true);
  };

  const handleConfirmSaveClinicalRecord = async () => {
    setShowConfirmClinical(false);
    if (!patient) return;

    const allergiesArr = clinicalForm.allergies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const pathologiesArr = clinicalForm.pathologies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const hasFamilyHistoryInput =
      clinicalForm.diabetes ||
      clinicalForm.hypertension ||
      clinicalForm.cancer ||
      clinicalForm.familyNotes.trim() !== '';

    const hasLifestyleInput =
      clinicalForm.sleepHours !== '' ||
      clinicalForm.sleepQuality.trim() !== '' ||
      clinicalForm.waterDailyLiters !== '' ||
      clinicalForm.alcohol.trim() !== '';

    const hasPhysicalActivityInput =
      clinicalForm.physicalActivityLevel.trim() !== '' ||
      clinicalForm.physicalActivityDays !== '';

    const updatedRecord: ClinicalRecord = {
      id: clinicalRecord?.id || `clin-${Date.now()}`,
      patientId: patient.id,
      specialistId: currentUser?.id || 'user-dra-valeria',
      familyHistory: hasFamilyHistoryInput
        ? {
            diabetes: clinicalForm.diabetes,
            hypertension: clinicalForm.hypertension,
            cancer: clinicalForm.cancer,
            cardiovascular: false,
            thyroid: false,
            notes: clinicalForm.familyNotes.trim(),
          }
        : undefined,
      pathologicalHistory: {
        diagnosedDiseases: pathologiesArr,
        surgeries: clinicalRecord?.pathologicalHistory?.surgeries || [],
      },
      allergies: allergiesArr,
      medications: clinicalRecord?.medications || [],
      lifestyleHabits: hasLifestyleInput
        ? {
            sleepHours: Number(clinicalForm.sleepHours) || 0,
            sleepQuality: clinicalForm.sleepQuality || 'Buena',
            smoking: !!clinicalRecord?.lifestyleHabits?.smoking,
            alcohol: clinicalForm.alcohol || 'No reportado',
            stressLevel: clinicalRecord?.lifestyleHabits?.stressLevel || 'Normal',
            waterDailyLiters: Number(clinicalForm.waterDailyLiters) || 0,
          }
        : undefined,
      physicalActivity: hasPhysicalActivityInput
        ? {
            activityLevel: clinicalForm.physicalActivityLevel || 'Sedentaria',
            exerciseType: clinicalRecord?.physicalActivity?.exerciseType || 'General',
            frequencyDaysPerWeek: Number(clinicalForm.physicalActivityDays) || 0,
            durationMinutes: clinicalRecord?.physicalActivity?.durationMinutes || 30,
          }
        : undefined,
      dietaryHabits: clinicalRecord?.dietaryHabits,
      recall24h: clinicalForm.recall24h.trim(),
      clinicalGoals: patient.goal,
      clinicalObservations: clinicalForm.notes.trim(),
      isCustomized: true,
      updatedAt: new Date().toISOString(),
    };

    isEditingClinicalRef.current = false;
    setIsEditingClinical(false);

    setClinicalRecord(updatedRecord);
    try {
      await storageService.saveClinicalRecord(updatedRecord);
    } catch (err) {
      console.warn('[Clinical] Error saving record to cloud:', err);
    }

    // Update patient record
    const updatedPat: Patient = {
      ...patient,
      allergies: allergiesArr.join(', '),
      pathologies: pathologiesArr.join(', '),
      notes: clinicalForm.notes !== undefined ? clinicalForm.notes : (patient.notes || ''),
      updatedAt: new Date().toISOString(),
    };
    setPatient(updatedPat);
    try {
      await storageService.savePatient(updatedPat);
    } catch (err) {
      console.warn('[Clinical] Error saving patient to cloud:', err);
    }

    showToast('Expediente actualizado', 'Los cambios en la historia clínica y anamnesis han sido guardados con éxito en la base de datos.', 'success');
  };

  // --- Handlers para Asignación de Recetas Clínicas (Opción B) ---
  const handleToggleRecipeAssignment = (recipeId: string) => {
    if (!patient) return;
    const currentList = patient.assignedRecipeIds || [];
    let updatedList: string[];
    if (currentList.includes(recipeId)) {
      updatedList = currentList.filter((id) => id !== recipeId);
    } else {
      updatedList = [...currentList, recipeId];
    }
    const updatedPat: Patient = {
      ...patient,
      assignedRecipeIds: updatedList,
      updatedAt: new Date().toISOString(),
    };
    storageService.savePatient(updatedPat);
    setPatient(updatedPat);
  };

  const handleSelectAllRecipes = () => {
    if (!patient) return;
    const allIds = storageService.getRecipes().map((r) => r.id);
    const updatedPat: Patient = {
      ...patient,
      assignedRecipeIds: allIds,
      updatedAt: new Date().toISOString(),
    };
    storageService.savePatient(updatedPat);
    setPatient(updatedPat);
    showToast('Recetario Completo Asignado', 'El paciente ahora tiene acceso a todas las recetas clínicas.', 'success');
  };

  const handleClearAssignedRecipes = () => {
    if (!patient) return;
    const updatedPat: Patient = {
      ...patient,
      assignedRecipeIds: [],
      updatedAt: new Date().toISOString(),
    };
    storageService.savePatient(updatedPat);
    setPatient(updatedPat);
    showToast('Acceso Abierto Restaurado', 'Al no haber recetas restringidas, el paciente puede explorar todo el catálogo general.', 'info');
  };

  const handleAutoAssignPlanRecipes = () => {
    if (!patient) return;
    const allRecipes = storageService.getRecipes();
    const planRecipeNames = new Set<string>();

    (plans || []).forEach((plan) => {
      (plan.days || []).forEach((day) => {
        (day.meals || []).forEach((meal) => {
          (meal.items || []).forEach((item) => {
            if (item.name) {
              planRecipeNames.add(item.name.toLowerCase().trim());
            }
          });
        });
      });
    });

    const matchingIds = allRecipes
      .filter((r) => planRecipeNames.has(r.name.toLowerCase().trim()))
      .map((r) => r.id);

    if (matchingIds.length === 0) {
      showToast('Sugerencia Automática', 'No se encontraron recetas con nombre coincidente en su plan actual.', 'info');
      return;
    }

    const currentList = new Set(patient.assignedRecipeIds || []);
    matchingIds.forEach((id) => currentList.add(id));

    const updatedPat: Patient = {
      ...patient,
      assignedRecipeIds: Array.from(currentList),
      updatedAt: new Date().toISOString(),
    };
    storageService.savePatient(updatedPat);
    setPatient(updatedPat);
    showToast('Recetas del Plan Asignadas', `${matchingIds.length} recetas del plan fueron vinculadas al paciente.`, 'success');
  };

  if (!patient) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <p className="text-slate-500 text-sm">El expediente solicitado no está disponible o se está cargando.</p>
        <button
          onClick={onBack}
          className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
        >
          Volver al directorio de pacientes
        </button>
      </div>
    );
  }

  // Safe Metric Calculations
  const heightM = patient.height && patient.height > 0 ? patient.height / 100 : 1.65;
  const currWeight = Number(patient.currentWeight) || Number(patient.initialWeight) || 70;
  const initWeight = Number(patient.initialWeight) || currWeight;
  const targetWeight = Number(patient.targetWeight) || Math.round(currWeight * 0.9);
  const imc = (currWeight / (heightM * heightM)).toFixed(1);
  const weightChange = (currWeight - initWeight).toFixed(1);

  // Safe age calculation
  const birthYear = patient.birthDate ? new Date(patient.birthDate).getFullYear() : 1995;
  const patientAge = isNaN(birthYear) ? 28 : Math.max(1, new Date().getFullYear() - birthYear);

  // Safe normalized allergies & pathologies list
  const allergiesList = Array.isArray((patient as any).allergies)
    ? (patient as any).allergies
    : typeof (patient as any).allergies === 'string' && (patient as any).allergies.trim()
    ? (patient as any).allergies.split(',').map((s: string) => s.trim()).filter(Boolean)
    : clinicalRecord?.allergies && Array.isArray(clinicalRecord.allergies)
    ? clinicalRecord.allergies
    : [];

  const pathologiesList = Array.isArray((patient as any).pathologies)
    ? (patient as any).pathologies
    : typeof (patient as any).pathologies === 'string' && (patient as any).pathologies.trim()
    ? (patient as any).pathologies.split(',').map((s: string) => s.trim()).filter(Boolean)
    : clinicalRecord?.pathologicalHistory?.diagnosedDiseases && Array.isArray(clinicalRecord.pathologicalHistory.diagnosedDiseases)
    ? clinicalRecord.pathologicalHistory.diagnosedDiseases
    : [];

  // PDF Export
  const handleExportPlanPdf = () => {
    if (plans.length === 0) {
      showToast('Sin plan activo', 'El paciente aún no tiene un plan nutricional asignado', 'info');
      return;
    }
    setIsExecutiveExportModalOpen(true);
  };

  const handleExportShoppingListPdf = async () => {
    if (plans.length === 0) {
      showToast('Sin plan activo', 'El paciente aún no tiene un plan nutricional asignado', 'info');
      return;
    }
    const planToExport = plans[selectedPlanIndex] || plans[0];
    const allItems: string[] = [];
    (planToExport.days || []).forEach((d) => {
      (d.meals || []).forEach((m) => {
        (m.items || []).forEach((item) => {
          allItems.push(`${item.name} (${item.portionDescription})`);
        });
      });
    });
    const uniqueItems = Array.from(new Set(allItems));
    await pdfService.generateShoppingListPdf(uniqueItems, `${patient.firstName} ${patient.lastName}`, organization);
    if (isMobileOrAndroid()) {
      showToast('Lista de Compras Lista', 'Se ha abierto el menú para guardar o compartir la lista.', 'success');
    } else {
      showToast('Lista Generada', 'Lista de compras en PDF descargada con éxito', 'success');
    }
  };

  // NutriCopilot Quick Clinical Synthesis
  const handleRunAiCopilotSynthesis = async () => {
    setIsAiLoading(true);
    try {
      const res = await aiService.queryNutriCopilot({
        action: 'consultation_prep',
        payload: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          goal: patient.goal,
          adherenceRate: patient.adherenceRate,
          currentWeight: currWeight,
          initialWeight: initWeight,
        },
      });
      setIsAiLoading(false);
      setAiAnalysis(res.result);
    } catch {
      setIsAiLoading(false);
      setAiAnalysis('• Paciente en evolución clínica favorable.\n• Mantener metas de hidratación y macronutrientes.\n• Próxima revisión recomendada en 15 días.');
    }
  };

  // Add new anthropometry record
  const handleSaveAnthropometry = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(newAnthro.weightKg) || currWeight;
    const bmiVal = Number((w / (heightM * heightM)).toFixed(1));
    const record: AnthropometricRecord = {
      id: `anthro-${Date.now()}`,
      patientId: patient.id,
      date: new Date().toISOString().slice(0, 10),
      weight: w,
      height: patient.height,
      bmi: bmiVal,
      bodyFatPercentage: Number(newAnthro.bodyFatPercentage) || 24,
      muscleMassKg: Number(newAnthro.muscleMassKg) || Number((w * 0.42).toFixed(1)),
      visceralFatLevel: Number(newAnthro.visceralFatLevel) || 4,
      waistCircumference: Number(newAnthro.waistCm) || Math.round(patient.height * 0.46),
      hipCircumference: Number(newAnthro.hipCm) || Math.round(patient.height * 0.58),
      chestCircumference: Number(newAnthro.chestCm) || 88,
      relaxedArmCircumference: Number(newAnthro.armCm) || 28,
      thighCircumference: Number(newAnthro.thighCm) || 54,
      notes: newAnthro.notes || 'Medición de control evolutivo',
    };

    const updated = [record, ...anthroRecords];
    setAnthroRecords(updated);
    storageService.saveAnthropometricRecord(record);

    // Update patient current weight
    const updatedPatient: Patient = {
      ...patient,
      currentWeight: w,
      updatedAt: new Date().toISOString(),
    };
    setPatient(updatedPatient);
    storageService.savePatient(updatedPatient);

    setIsAnthroModalOpen(false);
    showToast('Medición guardada', 'Registro antropométrico agregado a la evolución clínica.', 'success');
  };

  // Safe evolution chart data: Always provide valid numbers
  const evolutionChartData =
    anthroRecords && anthroRecords.length > 0
      ? [...anthroRecords].reverse().map((rec) => ({
          date: rec.date ? rec.date.slice(5) : 'Medición',
          peso: rec.weight ?? (rec as any).weightKg ?? currWeight,
          grasa: rec.bodyFatPercentage || 0,
          musculo: rec.muscleMassKg || 0,
        }))
      : [
          {
            date: 'Ingreso',
            peso: initWeight,
            grasa: 26,
            musculo: Number((initWeight * 0.42).toFixed(1)),
          },
          {
            date: 'Actual',
            peso: currWeight,
            grasa: 24,
            musculo: Number((currWeight * 0.44).toFixed(1)),
          },
        ];

  return (
    <div id="patient-profile-view" className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          id="back-to-patients-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Pacientes</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="ai-prep-consultation-btn"
            onClick={handleRunAiCopilotSynthesis}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiLoading ? 'Sintetizando...' : 'Preparar Consulta IA'}</span>
          </button>

          {plans.length > 0 && (
            <button
              id="export-patient-plan-pdf-btn"
              onClick={handleExportPlanPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Descargar Plan PDF</span>
            </button>
          )}

          {/* Edit Patient */}
          <button
            id="edit-patient-profile-btn"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Editar Paciente</span>
          </button>

          {/* Credentials & App Access */}
          <button
            id="manage-patient-credentials-btn"
            onClick={() => setIsCredentialsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer shadow-2xs"
            title="Ver, editar o regenerar contraseña del paciente para su app"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Acceso & Contraseña</span>
          </button>

          {/* Delete Patient */}
          <button
            id="delete-patient-profile-btn"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Eliminar</span>
          </button>

          {patient.whatsapp && (
            <a
              id="patient-whatsapp-link"
              href={`https://wa.me/${patient.whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(patient.firstName)},%20te%20escribo%20desde%20la%20cl%C3%ADnica.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* Patient Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              id="patient-avatar-edit-trigger"
              onClick={() => setIsEditModalOpen(true)}
              className="relative group shrink-0 rounded-2xl cursor-pointer focus:outline-hidden"
              title="Haz clic para editar datos o cambiar fotografía del paciente"
            >
              <img
                src={patient.photoUrl || (patient.gender === 'F' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200')}
                alt={patient.firstName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-emerald-500/20 shadow-md group-hover:opacity-90 group-hover:scale-102 transition-all"
              />
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-5 h-5 drop-shadow-sm mb-0.5" />
                <span className="text-[9px] font-bold">Cambiar</span>
              </div>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {patient.firstName} {patient.lastName}
                </h1>
                <RiskBadge level={patient.riskLevel} />
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {patient.gender === 'F' ? 'Femenino' : 'Masculino'} • {patientAge} años
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                🎯 {patient.goal}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {patient.email || 'Sin correo'}</span>
                {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {patient.phone}</span>}
                <span>• Ocupación: {patient.occupation || 'No especificada'}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Peso Actual</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">{currWeight} kg</div>
              <span className={`text-[10px] font-semibold flex items-center justify-center gap-0.5 ${Number(weightChange) <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {Number(weightChange) <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {weightChange} kg
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">IMC Actual</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">{imc}</div>
              <span className="text-[10px] text-slate-500 font-medium">kg/m²</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Adherencia</span>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{patient.adherenceRate || 90}%</div>
              <span className="text-[10px] text-slate-500 font-medium">Seguimiento</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Meta</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">{targetWeight} kg</div>
              <span className="text-[10px] text-slate-500 font-medium">Faltan {Math.abs(currWeight - targetWeight).toFixed(1)} kg</span>
            </div>
          </div>
        </div>

        {/* AI Synthesis output if triggered */}
        {aiAnalysis && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-800 dark:text-slate-200 animate-slide-in relative">
            <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200 mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>NutriCopilot AI: Preparación de Consulta</span>
              </div>
              <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                Cerrar
              </button>
            </div>
            <div className="whitespace-pre-line leading-relaxed">{aiAnalysis}</div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {[
          { id: 'resumen', label: 'Resumen Clínico', icon: Activity },
          { id: 'expediente', label: 'Expediente & Anamnesis', icon: FileText },
          { id: 'antropometria', label: 'Antropometría & InBody', icon: Scale },
          { id: 'plan', label: 'Plan Nutricional', icon: Utensils },
          { id: 'recetas', label: 'Recetas Asignadas', icon: BookOpen },
          { id: 'consultas', label: 'Consultas & Notas', icon: Calendar },
          { id: 'seguimiento', label: 'Diario & Fotos', icon: LineChart },
          { id: 'laboratorios', label: 'Laboratorios', icon: Activity },
          { id: 'smae', label: 'SMAE', icon: Apple },
          { id: 'suplementos', label: 'Suplementos', icon: Pill },
          { id: 'documentos', label: 'Documentos', icon: FileCheck2 },
          { id: 'chat', label: 'Mensajes', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* TAB 1: RESUMEN */}
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Evolution Chart & Active Plan */}
            <div className="lg:col-span-2 space-y-6">
              {/* Evolution chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Evolución de Peso y Grasa Corporal</h3>
                    <p className="text-xs text-slate-400">Progreso registrado en cada consulta</p>
                  </div>
                  <button
                    id="add-anthro-quick-btn"
                    onClick={() => setIsAnthroModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Medición</span>
                  </button>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={evolutionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="peso" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} name="Peso (kg)" />
                      <Line type="monotone" dataKey="grasa" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="% Grasa" />
                      <Line type="monotone" dataKey="musculo" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Músculo (kg)" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Active Nutrition Plan Preview */}
              {plans.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {plans[0].title || (plans[0] as any).name || 'Plan de Recomposición'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Vigente desde {plans[0].startDate ? new Date(plans[0].startDate).toLocaleDateString('es-MX') : 'Fecha reciente'}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {plans[0].targetCaloriesKcal || 1600} kcal / día
                    </span>
                  </div>

                  {/* Macros Bar */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Proteína</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">{plans[0].targetProteinG || 120} g</div>
                      <span className="text-[10px] text-slate-400">
                        {Math.round((((plans[0].targetProteinG || 120) * 4) / (plans[0].targetCaloriesKcal || 1600)) * 100)}%
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">Carbohidratos</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">{plans[0].targetCarbsG || 155} g</div>
                      <span className="text-[10px] text-slate-400">
                        {Math.round((((plans[0].targetCarbsG || 155) * 4) / (plans[0].targetCaloriesKcal || 1600)) * 100)}%
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Grasas</span>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">{plans[0].targetFatG || 55} g</div>
                      <span className="text-[10px] text-slate-400">
                        {Math.round((((plans[0].targetFatG || 55) * 9) / (plans[0].targetCaloriesKcal || 1600)) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setActiveTab('plan')}
                      className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Ver Menú Completo & SMAE →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                  <Utensils className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No hay plan nutricional asignado a este paciente todavía.</p>
                  <button
                    onClick={() => onNavigate ? onNavigate('planner') : setActiveTab('plan')}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Crear Plan con NutriCopilot
                  </button>
                </div>
              )}
            </div>

            {/* Right 1 Col: Quick Medical & Habits Summary */}
            <div className="space-y-6">
              {/* Medical Summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Datos Clínicos Clave</span>
                </h3>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Alergias & Intolerancias</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {allergiesList.length > 0 ? (
                      allergiesList.map((a: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Sin alergias conocidas</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Patologías Diagnosticadas</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {pathologiesList.length > 0 ? (
                      pathologiesList.map((p: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Aparentemente sano</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Observaciones del Nutriólogo</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {patient.notes || 'Paciente motivado con excelente disposición para cambio de hábitos.'}
                  </p>
                </div>
              </div>

              {/* Opción 1: Tarjeta Plegable / Acordeón Inteligente - Acceso a la App del Paciente */}
              <div
                id="patient-credentials-smart-accordion"
                className={`bg-white dark:bg-slate-900 border rounded-3xl shadow-xs transition-all duration-300 overflow-hidden ${
                  isCredentialsAccordionOpen
                    ? 'border-emerald-300/80 dark:border-emerald-800/80 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Cabecera del Acordeón (Siempre visible, compacta, no invasiva al entrar al perfil) */}
                <div
                  onClick={toggleCredentialsAccordion}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCredentialsAccordion();
                    }
                  }}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer select-none hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  title={isCredentialsAccordionOpen ? 'Haga clic para plegar tarjeta de acceso' : 'Haga clic para desplegar credenciales de acceso'}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        patient.portalAccessEnabled !== false
                          ? isCredentialsAccordionOpen
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400'
                      }`}
                    >
                      <KeyRound className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          Acceso & App del Paciente
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shrink-0 ${
                            patient.portalAccessEnabled !== false
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              patient.portalAccessEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          {patient.portalAccessEnabled !== false ? 'Habilitado' : 'Deshabilitado'}
                        </span>
                      </div>

                      {/* Vista previa sutil (no invasiva) en estado plegado */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {isCredentialsAccordionOpen ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Credenciales y herramientas de acceso</span>
                        ) : (
                          <span>
                            Usuario: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{patient.portalUsername || patient.email || `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}`.replace(/\s+/g, '')}</span> • Clave protegida
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Botón rápido de copiar en cabecera sin necesidad de desplegar */}
                    {!isCredentialsAccordionOpen && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const username = patient.portalUsername || patient.email || `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}`.replace(/\s+/g, '');
                          const pass = patient.portalPassword || 'Nutri2026!';
                          const fullText = `App Nutriluz - Acceso Paciente:\nUsuario: ${username}\nContraseña: ${pass}`;
                          handleCopyCredentialText(fullText, 'all', 'Credenciales completas');
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                        title="Copiar credenciales rápido"
                      >
                        {copiedField === 'all' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Botón / Indicador Chevron de acordeón */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                      <span className="hidden sm:inline text-[11px]">
                        {isCredentialsAccordionOpen ? 'Plegar' : 'Ver'}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          isCredentialsAccordionOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Contenido Desplegable (Acordeón inteligente expandido) */}
                {isCredentialsAccordionOpen && (
                  <div className="px-5 pb-5 pt-2 space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
                    {/* Tarjeta con Usuario y Contraseña estilizados */}
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                      {/* Campo Usuario */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Usuario:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {patient.portalUsername || patient.email || `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}`.replace(/\s+/g, '')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const u = patient.portalUsername || patient.email || `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}`.replace(/\s+/g, '');
                              handleCopyCredentialText(u, 'user', 'Usuario');
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                            title="Copiar usuario"
                          >
                            {copiedField === 'user' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Campo Contraseña */}
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contraseña:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {showPasswordInProfile ? patient.portalPassword || 'Nutri2026!' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPasswordInProfile(!showPasswordInProfile)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                            title={showPasswordInProfile ? 'Ocultar contraseña' : 'Ver contraseña'}
                          >
                            {showPasswordInProfile ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const pwd = patient.portalPassword || 'Nutri2026!';
                              handleCopyCredentialText(pwd, 'pass', 'Contraseña');
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                            title="Copiar contraseña"
                          >
                            {copiedField === 'pass' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción rápida y CRUD */}
                    <div className="flex flex-col gap-2">
                      {/* Compartir por WhatsApp si tiene teléfono registrado */}
                      {patient.phone || patient.whatsapp ? (
                        <button
                          type="button"
                          onClick={() => {
                            const u = patient.portalUsername || patient.email || `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}`.replace(/\s+/g, '');
                            const p = patient.portalPassword || 'Nutri2026!';
                            const phone = (patient.whatsapp || patient.phone || '').replace(/\D/g, '');
                            const msg = `¡Hola ${patient.firstName}! Te comparto tus credenciales para ingresar a tu App Nutriluz:\n\n👤 Usuario: ${u}\n🔑 Contraseña: ${p}\n\nPuedes consultar tus planes alimentarios, recetas e hidratación desde tu celular.`;
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                            showToast('WhatsApp', 'Enviando mensaje con credenciales al paciente.', 'info');
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Enviar Acceso por WhatsApp</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const u = patient.portalUsername || patient.email || `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}`.replace(/\s+/g, '');
                            const p = patient.portalPassword || 'Nutri2026!';
                            const msg = `¡Hola ${patient.firstName}! Te comparto tus credenciales para ingresar a tu App Nutriluz:\n\n👤 Usuario: ${u}\n🔑 Contraseña: ${p}`;
                            handleCopyCredentialText(msg, 'all', 'Mensaje completo de acceso');
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar Mensaje de Bienvenida</span>
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCredentialsModalOpen(true)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          title="Abrir ventana para editar o generar nueva contraseña"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          <span>Editar (CRUD)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            storageService.setActivePortalPatientId(patient.id);
                            showToast('Sesión Iniciada', `Entrando al portal como ${patient.firstName}...`, 'success');
                            onNavigate?.('patient_portal');
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200 dark:border-emerald-800 transition-colors"
                          title="Entrar al portal de pacientes con la cuenta de este paciente"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Probar App</span>
                        </button>
                      </div>
                    </div>

                    {/* Pie de tarjeta con nota de seguridad y acción de plegado */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Acceso seguro y sincronizado
                      </span>
                      <button
                        type="button"
                        onClick={toggleCredentialsAccordion}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline cursor-pointer"
                      >
                        Plegar tarjeta ↑
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Next Appointment Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Próxima Consulta</span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                {appointments && appointments.length > 0 ? (
                  <div>
                    <h4 className="text-lg font-bold">{appointments[0].appointmentType}</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {new Date(appointments[0].startTime).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las{' '}
                      {new Date(appointments[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => onNavigate ? onNavigate('agenda') : setActiveTab('consultas')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Ver en Agenda
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-400">No hay consulta agendada.</p>
                    <button
                      onClick={() => onNavigate ? onNavigate('agenda') : setActiveTab('consultas')}
                      className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Agendar Cita
                    </button>
                  </div>
                )}
              </div>

              {/* Tarjeta de Recetario Clínico Asignado (Opción B) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <ChefHat className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        Recetas Asignadas
                      </h4>
                      <p className="text-[11px] text-slate-400">Control de visibilidad en la app móvil</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    patient.assignedRecipeIds && patient.assignedRecipeIds.length > 0
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {patient.assignedRecipeIds && patient.assignedRecipeIds.length > 0
                      ? `${patient.assignedRecipeIds.length} asignadas`
                      : 'Catálogo Abierto'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {patient.assignedRecipeIds && patient.assignedRecipeIds.length > 0 ? (
                    <div className="space-y-1.5">
                      {storageService
                        .getRecipes()
                        .filter((r) => patient.assignedRecipeIds?.includes(r.id))
                        .slice(0, 3)
                        .map((recipe) => (
                          <div
                            key={recipe.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">
                              {recipe.name}
                            </span>
                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 shrink-0">
                              {recipe.caloriesKcal} kcal
                            </span>
                          </div>
                        ))}
                      {patient.assignedRecipeIds.length > 3 && (
                        <p className="text-[10px] text-slate-400 text-center pt-1">
                          + {patient.assignedRecipeIds.length - 3} recetas adicionales asignadas
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-500 text-[11px] leading-relaxed">
                      El paciente actualmente tiene habilitada la biblioteca completa. Puedes asignar recetas específicas para su objetivo.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAssignRecipesModalOpen(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs active:scale-95"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Gestionar Recetas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recetas')}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Ver Todas
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPEDIENTE CLÍNICO */}
        {activeTab === 'expediente' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Historia Clínica & Anamnesis Nutricional</h3>
                <p className="text-xs text-slate-400">Antecedentes heredofamiliares, personales patológicos, estilo de vida y Recordatorio de 24h</p>
              </div>

              <div className="flex items-center gap-2">
                {isEditingClinical ? (
                  <>
                    <button
                      id="cancel-edit-clinical-btn"
                      onClick={handleCancelEditClinical}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      id="save-clinical-record-btn"
                      onClick={(e) => handleOpenConfirmClinical(e)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer transition-all active:scale-95"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Guardar Expediente</span>
                    </button>
                  </>
                ) : (
                  <button
                    id="edit-clinical-record-btn"
                    onClick={handleStartEditClinical}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    <span>Editar Expediente</span>
                  </button>
                )}
              </div>
            </div>

            {isEditingClinical ? (
              <form onSubmit={handleOpenConfirmClinical} noValidate className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Edit Heredofamiliares */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Antecedentes Heredofamiliares
                    </h4>
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clinicalForm.diabetes}
                          onChange={(e) => setClinicalForm({ ...clinicalForm, diabetes: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Diabetes Mellitus en familiares directos</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clinicalForm.hypertension}
                          onChange={(e) => setClinicalForm({ ...clinicalForm, hypertension: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Hipertensión Arterial / Cardiopatías</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clinicalForm.cancer}
                          onChange={(e) => setClinicalForm({ ...clinicalForm, cancer: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Cáncer / Enfermedades Oncológicas</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Notas Heredofamiliares
                      </label>
                      <input
                        type="text"
                        value={clinicalForm.familyNotes}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, familyNotes: e.target.value })}
                        placeholder="Ej. Abuela materna con diabetes tipo 2..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Edit Patologias & Alergias */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Diagnósticos y Alergias
                    </h4>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Alergias o Intolerancias Alimentarias (separadas por coma)
                      </label>
                      <input
                        type="text"
                        value={clinicalForm.allergies}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, allergies: e.target.value })}
                        placeholder="Ej. Lactosa, Nueces, Mariscos..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Patologías Diagnosticadas Previas (separadas por coma)
                      </label>
                      <input
                        type="text"
                        value={clinicalForm.pathologies}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, pathologies: e.target.value })}
                        placeholder="Ej. Hipotiroidismo, Resistencia a la Insulina, Gastritis..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Edit Estilo de Vida */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Estilo de Vida, Sueño e Hidratación
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Horas de Sueño
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        placeholder="Ej. 7"
                        value={clinicalForm.sleepHours}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, sleepHours: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Calidad de Sueño
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Buena, Regular, Insomnio..."
                        value={clinicalForm.sleepQuality}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, sleepQuality: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Consumo de Agua Diario (Litros)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="15"
                        placeholder="Ej. 2.0"
                        value={clinicalForm.waterDailyLiters}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, waterDailyLiters: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Consumo de Alcohol
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Negado, Ocasional, Social..."
                        value={clinicalForm.alcohol}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, alcohol: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nivel de Actividad Física
                      </label>
                      <select
                        value={clinicalForm.physicalActivityLevel}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, physicalActivityLevel: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      >
                        <option value="">Seleccionar nivel de actividad...</option>
                        <option value="Sedentaria">Sedentaria (Poco o ningún ejercicio)</option>
                        <option value="Ligera">Ligera (1-2 días / semana)</option>
                        <option value="Moderada">Moderada (3-4 días / semana)</option>
                        <option value="Intensa">Intensa (5-6 días / semana)</option>
                        <option value="Atleta">Atleta / Alto Rendimiento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Días de Ejercicio / Semana
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="7"
                        placeholder="Ej. 3"
                        value={clinicalForm.physicalActivityDays}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, physicalActivityDays: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Edit Recordatorio de 24 horas */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Recordatorio de 24 Horas (R24H) & Hábitos Dietéticos
                  </h4>
                  <textarea
                    rows={4}
                    value={clinicalForm.recall24h}
                    onChange={(e) => setClinicalForm({ ...clinicalForm, recall24h: e.target.value })}
                    placeholder="Describe los alimentos, horarios y porciones habituales del paciente..."
                    className="w-full p-3 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Save Buttons Row */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingClinical(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="submit-clinical-record-btn"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer transition-all active:scale-95"
                  >
                    Guardar Expediente
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Heredofamiliares */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Antecedentes Heredofamiliares
                    </h4>
                    {clinicalRecord?.familyHistory && (clinicalRecord.familyHistory.diabetes || clinicalRecord.familyHistory.hypertension || clinicalRecord.familyHistory.cancer || (clinicalRecord.familyHistory.notes && clinicalRecord.familyHistory.notes.trim())) ? (
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                        <p>• <strong>Diabetes Mellitus:</strong> {clinicalRecord.familyHistory.diabetes ? 'Sí reportado' : 'Negado'}</p>
                        <p>• <strong>Hipertensión:</strong> {clinicalRecord.familyHistory.hypertension ? 'Sí reportado' : 'Negado'}</p>
                        {clinicalRecord.familyHistory.cancer !== undefined && (
                          <p>• <strong>Cáncer:</strong> {clinicalRecord.familyHistory.cancer ? 'Sí reportado' : 'Negado'}</p>
                        )}
                        {clinicalRecord.familyHistory.notes ? (
                          <p>• <strong>Notas:</strong> {clinicalRecord.familyHistory.notes}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Sin antecedentes heredofamiliares registrados. Haz clic en "Editar Expediente" para evaluarlos en consulta.
                      </p>
                    )}
                  </div>

                  {/* Estilo de vida y hábitos */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Estilo de Vida & Hábitos Dietéticos
                    </h4>
                    {clinicalRecord?.lifestyleHabits || clinicalRecord?.physicalActivity ? (
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                        {clinicalRecord?.lifestyleHabits?.sleepHours ? (
                          <p>• <strong>Horas de sueño:</strong> {clinicalRecord.lifestyleHabits.sleepHours} horas promedio {clinicalRecord.lifestyleHabits.sleepQuality ? `(${clinicalRecord.lifestyleHabits.sleepQuality})` : ''}</p>
                        ) : null}
                        {clinicalRecord?.lifestyleHabits?.waterDailyLiters ? (
                          <p>• <strong>Consumo de agua:</strong> {clinicalRecord.lifestyleHabits.waterDailyLiters} L / día</p>
                        ) : null}
                        {clinicalRecord?.lifestyleHabits?.alcohol && clinicalRecord.lifestyleHabits.alcohol !== 'No reportado' ? (
                          <p>• <strong>Consumo de alcohol:</strong> {clinicalRecord.lifestyleHabits.alcohol}</p>
                        ) : null}
                        {clinicalRecord?.physicalActivity?.activityLevel ? (
                          <p>• <strong>Actividad física:</strong> {clinicalRecord.physicalActivity.activityLevel} {clinicalRecord.physicalActivity.frequencyDaysPerWeek ? `(${clinicalRecord.physicalActivity.frequencyDaysPerWeek} días/semana)` : ''}</p>
                        ) : null}
                        {!clinicalRecord?.lifestyleHabits?.sleepHours && !clinicalRecord?.lifestyleHabits?.waterDailyLiters && !clinicalRecord?.lifestyleHabits?.alcohol && !clinicalRecord?.physicalActivity?.activityLevel && (
                          <p className="text-xs text-slate-400 italic">
                            Sin hábitos de estilo de vida capturados. Haz clic en "Editar Expediente" para registrarlos.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Sin hábitos de vida o actividad física registrados. Haz clic en "Editar Expediente" para capturarlos en consulta.
                      </p>
                    )}
                  </div>
                </div>

                {/* Recordatorio de 24 horas */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span>Recordatorio de 24 Horas (R24H)</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                        Evaluación Inicial
                      </span>
                    </h4>
                  </div>

                  {clinicalRecord?.recall24h && clinicalRecord.recall24h.trim().length > 0 && !clinicalRecord.recall24h.includes('Café con leche y pan tostado') ? (
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-line leading-relaxed">
                        {clinicalRecord.recall24h}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 italic">
                      Sin recordatorio de 24 horas capturado en consulta. Haz clic en "Editar Expediente" para registrar los alimentos y comidas habituales del paciente.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: ANTROPOMETRÍA */}
        {activeTab === 'antropometria' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Historial de Mediciones Antropométricas & Bioimpedancia</h3>
                <p className="text-xs text-slate-400">Registro cronológico de composición corporal e índices</p>
              </div>
              <button
                id="open-anthro-modal-btn"
                onClick={() => setIsAnthroModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Medición</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Peso</th>
                    <th className="py-3 px-4">IMC</th>
                    <th className="py-3 px-4">% Grasa</th>
                    <th className="py-3 px-4">Músculo</th>
                    <th className="py-3 px-4">Grasa Visceral</th>
                    <th className="py-3 px-4">Cintura / Cadera</th>
                    <th className="py-3 px-4">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {anthroRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{r.date}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {r.weight ?? (r as any).weightKg} kg
                      </td>
                      <td className="py-3 px-4">{r.bmi}</td>
                      <td className="py-3 px-4">{r.bodyFatPercentage ? `${r.bodyFatPercentage}%` : '-'}</td>
                      <td className="py-3 px-4">{r.muscleMassKg ? `${r.muscleMassKg} kg` : '-'}</td>
                      <td className="py-3 px-4">{r.visceralFatLevel || '-'}</td>
                      <td className="py-3 px-4">
                        {r.waistCircumference || (r as any).waistCircumferenceCm || '-'} / {r.hipCircumference || (r as any).hipCircumferenceCm || '-'} cm
                      </td>
                      <td className="py-3 px-4 text-slate-400">{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PLAN NUTRICIONAL */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            {plans.length > 0 ? (
              (() => {
                const currentPlan = plans[selectedPlanIndex] || plans[0];
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
                    {/* Header & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {currentPlan.title || (currentPlan as any).name || 'Plan Nutricional'}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                              currentPlan.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {currentPlan.durationMode ? `Modalidad ${currentPlan.durationMode}` : currentPlan.status === 'ACTIVE' ? 'Activo' : 'Histórico'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Objetivo: <span className="font-semibold text-slate-600 dark:text-slate-300">{currentPlan.goal}</span>
                          {currentPlan.startDate && (
                            <> • Periodo: <span className="font-medium text-slate-600 dark:text-slate-300">{currentPlan.startDate} {currentPlan.endDate ? `al ${currentPlan.endDate}` : ''}</span></>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {onNavigate && (
                          <button
                            id="plan-tab-edit-in-planner-btn"
                            onClick={() => onNavigate('planner', patient.id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar en Diseñador</span>
                          </button>
                        )}

                        <button
                          id="plan-tab-ai-wizard-btn"
                          onClick={() => setIsWizardOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-md shadow-emerald-950/20 cursor-pointer transition-all hover:scale-[1.02]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Formular con NutriCopilot AI</span>
                        </button>

                        <button
                          id="plan-tab-download-pdf"
                          onClick={handleExportPlanPdf}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span>Descargar Plan PDF</span>
                        </button>

                        <button
                          id="plan-tab-edit-pdf"
                          onClick={() => {
                            setExportTab('editor');
                            setIsExecutiveExportModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer transition-all shadow-2xs"
                          title="Editar colaciones, platillos y notas completas del PDF"
                        >
                          <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Editar PDF & Colaciones</span>
                        </button>

                        <button
                          id="plan-tab-download-shopping-list-pdf"
                          onClick={handleExportShoppingListPdf}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
                        >
                          <ShoppingCart className="w-4 h-4 text-emerald-600" />
                          <span>Lista de Súper</span>
                        </button>
                      </div>
                    </div>

                    {/* Multi-plan selector if more than 1 plan */}
                    {plans.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Historial de Planes:</span>
                        {plans.map((p, idx) => (
                          <button
                            key={p.id || idx}
                            onClick={() => setSelectedPlanIndex(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              selectedPlanIndex === idx
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {p.title || `Plan ${idx + 1}`} {p.status === 'ACTIVE' ? '⭐ (Activo)' : ''}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Macronutrient Distribution Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                        <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Calorías Meta</div>
                        <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{currentPlan.targetCaloriesKcal || 0} <span className="text-xs font-normal">kcal</span></div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                        <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase">Proteínas</div>
                        <div className="text-xl font-extrabold text-blue-700 dark:text-blue-400 mt-0.5">{currentPlan.targetProteinG || 0} <span className="text-xs font-normal">g</span></div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">Carbohidratos</div>
                        <div className="text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">{currentPlan.targetCarbsG || 0} <span className="text-xs font-normal">g</span></div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                        <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase">Lípidos (Grasas)</div>
                        <div className="text-xl font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">{currentPlan.targetFatG || 0} <span className="text-xs font-normal">g</span></div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 col-span-2 sm:col-span-1">
                        <div className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300 uppercase">Hidratación</div>
                        <div className="text-xl font-extrabold text-cyan-700 dark:text-cyan-400 mt-0.5">{currentPlan.targetWaterLiters || 2.5} <span className="text-xs font-normal">L / día</span></div>
                      </div>
                    </div>

                    {/* General Instructions & Clinical Guidelines */}
                    {currentPlan.generalInstructions && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 text-xs">Pautas Clínicas e Instrucciones:</span>
                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{currentPlan.generalInstructions}</p>
                      </div>
                    )}

                    {/* Day Meals Detail */}
                    <div className="space-y-4">
                      {(currentPlan.days || []).map((day, dIdx) => (
                        <div key={day.id || dIdx} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{day.dayName}</span>
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {currentPlan.targetCaloriesKcal} kcal
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-4">
                            {(day.meals || []).map((meal) => (
                              <div key={meal.id} className="pt-3 first:pt-0">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    {meal.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400">{meal.suggestedTime || 'Horario flexible'}</span>
                                </div>

                                <div className="space-y-2">
                                  {(meal.items || []).map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-900 dark:text-white">{item.name}</span>
                                        <span className="text-slate-500 ml-2">({item.portionDescription})</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-500 font-medium">
                                        <span>P: {item.proteinG || 0}g</span>
                                        <span>C: {item.carbsG || 0}g</span>
                                        <span>G: {item.fatG || 0}g</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.energyKcal || 0} kcal</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Sin Plan Nutricional Asignado</h4>
                <p className="text-xs text-slate-400 mt-1">Crea un menú personalizado con el calculador SMAE o genera uno guiado con NutriCopilot AI.</p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setIsWizardOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/20 cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Prescribir con NutriCopilot AI</span>
                  </button>
                  <button
                    onClick={() => onNavigate ? onNavigate('planner') : setActiveTab('plan')}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Abrir Diseñador Manual
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: RECETAS */}
        {activeTab === 'recetas' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Recetario & Asignación Clínica</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Marca las recetas que {patient.firstName} podrá ver en su aplicación móvil.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoAssignPlanRecipes}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-pointer transition-colors"
                  title="Asignar automáticamente recetas coincidentes con su plan activo"
                >
                  ⚡ Vincular del Plan Activo
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllRecipes}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  Asignar Todas
                </button>
                <button
                  type="button"
                  onClick={handleClearAssignedRecipes}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  Recetario Abierto
                </button>
              </div>
            </div>

            {/* Banner de Estado de Visibilidad */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              patient.assignedRecipeIds && patient.assignedRecipeIds.length > 0
                ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200/80 dark:border-teal-800/60 text-teal-900 dark:text-teal-200'
                : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/60 text-blue-900 dark:text-blue-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  {patient.assignedRecipeIds && patient.assignedRecipeIds.length > 0 ? (
                    <>
                      <strong>Modo Personalizado:</strong> El paciente únicamente verá las <strong>{patient.assignedRecipeIds.length} recetas asignadas</strong> con la etiqueta verde en su app.
                    </>
                  ) : (
                    <>
                      <strong>Modo Catálogo Abierto:</strong> El paciente puede explorar todas las recetas del sistema. Haz clic en <em>"Asignar a este paciente"</em> en cualquier receta para restringir a una selección médica.
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Grid de Recetas con Checkbox / Asignación Interactiva */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {storageService.getRecipes().map((recipe) => {
                const isAssigned = (patient.assignedRecipeIds || []).includes(recipe.id);
                return (
                  <div
                    key={recipe.id}
                    className={`border rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
                      isAssigned
                        ? 'border-teal-500 dark:border-teal-400 bg-teal-50/20 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:shadow-md bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="relative h-40 w-full overflow-hidden">
                        <img src={recipe.photoUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-md">
                          {recipe.category}
                        </div>
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-xs font-extrabold bg-teal-600 text-white shadow-md">
                          {recipe.caloriesKcal} kcal
                        </div>

                        {/* Badge de Asignado */}
                        {isAssigned && (
                          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-md flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Visible en App</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{recipe.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{recipe.description}</p>
                        
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                          <span>{recipe.prepTimeMinutes} min</span>
                          <span>•</span>
                          <span>{recipe.servings} porción</span>
                          <span>•</span>
                          <span>{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleToggleRecipeAssignment(recipe.id)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isAssigned
                            ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isAssigned ? (
                          <>
                            <CheckSquare className="w-4 h-4" />
                            <span>Asignada al Paciente</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-slate-400" />
                            <span>Asignar a este Paciente</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: CONSULTAS */}
        {activeTab === 'consultas' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Historial de Consultas & Citas</h3>
              <button
                onClick={() => onNavigate ? onNavigate('agenda') : showToast('Agenda', 'Navegando a la agenda', 'info')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white cursor-pointer"
              >
                Agendar Consulta
              </button>
            </div>

            <div className="space-y-3">
              {appointments.length > 0 ? (
                appointments.map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{app.appointmentType}</span>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(app.startTime).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {app.locationNotes && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{app.locationNotes}</p>}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {app.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Sin citas previas registradas para este paciente.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SEGUIMIENTO & FOTOS */}
        {activeTab === 'seguimiento' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Seguimiento Visual & Registro de Comidas</h3>
            <p className="text-xs text-slate-400">Fotos de avance compartidas por el paciente y registro fotográfico de platillos</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Foto de Avance Inicial</span>
                <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400" alt="" className="w-full h-48 object-cover rounded-xl" />
                <span className="text-[10px] text-slate-400 block">Fecha: Evaluación inicial de ingreso</span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Foto de Registro de Platillo</span>
                <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" alt="" className="w-full h-48 object-cover rounded-xl" />
                <span className="text-[10px] text-slate-400 block">Fecha: Registro diario</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: LABORATORIOS */}
        {activeTab === 'laboratorios' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Estudios de Laboratorio Clínico</h3>
            <p className="text-xs text-slate-400">Química sanguínea, perfil de lípidos, biometría hemática e interpretación</p>

            {labRecords.length > 0 ? (
              labRecords.map((lab) => {
                const testTitle = (lab as any).testName || lab.laboratoryName || 'Química Sanguínea & Perfil Integral';
                const testDate = lab.testDate || (lab as any).date || 'Reciente';
                const resultsList = Array.isArray((lab as any).results)
                  ? (lab as any).results
                  : lab.customParameters?.map((p) => ({ parameter: p.name, value: p.value, unit: p.unit, referenceRange: p.refRange })) || [
                      { parameter: 'Glucosa en Ayunas', value: `${lab.glucoseMgDl || 88}`, unit: 'mg/dL', referenceRange: '70 - 99' },
                      { parameter: 'HbA1c', value: `${lab.hba1cPercentage || 5.2}`, unit: '%', referenceRange: '< 5.7' },
                      { parameter: 'Colesterol Total', value: `${lab.totalCholesterolMgDl || 175}`, unit: 'mg/dL', referenceRange: '< 200' },
                      { parameter: 'Triglicéridos', value: `${lab.triglyceridesMgDl || 95}`, unit: 'mg/dL', referenceRange: '< 150' },
                    ];
                return (
                  <div key={lab.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{testTitle} ({testDate})</span>
                      <span className="text-xs text-slate-400">{lab.laboratoryName || 'Laboratorio Certificado'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {resultsList.map((param: any, pIdx: number) => (
                        <div key={pIdx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{param.parameter || param.name}</span>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">{param.value} {param.unit}</div>
                          <span className="text-[10px] text-slate-500">Ref: {param.referenceRange || param.refRange || 'Normal'}</span>
                        </div>
                      ))}
                    </div>
                    {lab.aiAnalysisSummary && (
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
                        <span className="font-bold">Interpretación IA:</span> {lab.aiAnalysisSummary}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Aún no hay estudios de laboratorio cargados en este expediente.
              </div>
            )}
          </div>
        )}

        {/* TAB 9: SMAE */}
        {activeTab === 'smae' && (
          <SmaeInfographicBento
            plan={plans[selectedPlanIndex] || plans[0]}
            patient={patient}
            organization={organization}
            onDownloadPdf={async () => {
              const currentPlan = plans[selectedPlanIndex] || plans[0];
              if (currentPlan) {
                await pdfService.generateSmaeGuidePdf(currentPlan, patient, organization, currentUser);
                if (isMobileOrAndroid()) {
                  showToast('Guía SMAE Lista', 'Se ha abierto el menú para guardar o compartir la guía.', 'success');
                } else {
                  showToast('Guía SMAE Generada', 'Descargando infografía de intercambios SMAE en PDF', 'success');
                }
              }
            }}
          />
        )}

        {/* TAB 10: SUPLEMENTOS */}
        {activeTab === 'suplementos' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Plan de Suplementación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {supplements.length > 0 ? (
                supplements.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 space-y-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{s.productName}</span>
                    <p className="text-xs text-slate-500">Dosis: {s.dosage} ({s.timing})</p>
                    {s.specialistInstructions && <p className="text-[11px] text-slate-400">{s.specialistInstructions}</p>}
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 space-y-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Creatina Monohidrato</span>
                    <p className="text-xs text-slate-500">Dosis: 5g diarios con agua después del entrenamiento</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 space-y-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Omega 3 (EPA/DHA)</span>
                    <p className="text-xs text-slate-500">Dosis: 2g diarios con el desayuno</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 11: DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Documentos & Consentimientos Informados</h3>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Consentimiento Informado para Tratamiento Nutricional</span>
                  <p className="text-[10px] text-slate-400">Firmado digitalmente</p>
                </div>
              </div>
              <button
                onClick={() => showToast('Descargando', 'Descargando copia del consentimiento firmado', 'info')}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Descargar
              </button>
            </div>
          </div>
        )}

        {/* TAB 12: CHAT */}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Canal Directo de Mensajería con el Paciente</h3>
            <button
              onClick={() => onNavigate ? onNavigate('chat') : showToast('Chat', 'Abriendo chat', 'info')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Abrir Sala de Chat en Vivo
            </button>
          </div>
        )}
      </div>

      {/* New Anthropometry Record Modal */}
      <Modal
        id="new-anthro-record-modal"
        isOpen={isAnthroModalOpen}
        onClose={() => setIsAnthroModalOpen(false)}
        title="Registrar Nueva Medición Antropométrica"
        subtitle={`Actualiza la composición corporal y perímetros de ${patient.firstName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAnthropometry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso Actual (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={newAnthro.weightKg}
                onChange={(e) => setNewAnthro({ ...newAnthro, weightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                % Grasa Corporal (InBody / Pliegues)
              </label>
              <input
                type="number"
                step="0.1"
                value={newAnthro.bodyFatPercentage}
                onChange={(e) => setNewAnthro({ ...newAnthro, bodyFatPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Masa Muscular Esquelética (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={newAnthro.muscleMassKg}
                onChange={(e) => setNewAnthro({ ...newAnthro, muscleMassKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nivel Grasa Visceral (1 - 20)
              </label>
              <input
                type="number"
                value={newAnthro.visceralFatLevel}
                onChange={(e) => setNewAnthro({ ...newAnthro, visceralFatLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cintura (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={newAnthro.waistCm}
                onChange={(e) => setNewAnthro({ ...newAnthro, waistCm: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cadera (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={newAnthro.hipCm}
                onChange={(e) => setNewAnthro({ ...newAnthro, hipCm: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brazo Relajado (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={newAnthro.armCm}
                onChange={(e) => setNewAnthro({ ...newAnthro, armCm: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas y Observaciones
            </label>
            <textarea
              rows={2}
              value={newAnthro.notes}
              onChange={(e) => setNewAnthro({ ...newAnthro, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAnthroModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer"
            >
              Guardar Medición
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación para Guardar Expediente Clínico */}
      <Modal
        id="confirm-clinical-record-modal"
        isOpen={showConfirmClinical}
        onClose={() => setShowConfirmClinical(false)}
        title="Confirmar Actualización de Expediente"
        subtitle="Verifica que la información clínica y anamnesis sean correctas"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                ¿Deseas guardar los cambios en este expediente?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Se actualizarán los antecedentes heredofamiliares, patológicos, hábitos de estilo de vida, R24h y notas clínicas del paciente <strong>{patient.firstName} {patient.lastName}</strong> en la base de datos.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Paciente:</span>
              <span className="font-bold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Alergias / Intolerancias:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{clinicalForm.allergies || 'Ninguna'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Patologías reportadas:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{clinicalForm.pathologies || 'Ninguna'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Actividad física:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{clinicalForm.physicalActivityLevel} ({clinicalForm.physicalActivityDays} días/sem)</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              id="cancel-confirm-clinical-btn"
              onClick={() => setShowConfirmClinical(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Revisar cambios
            </button>
            <button
              type="button"
              id="accept-confirm-clinical-btn"
              onClick={handleConfirmSaveClinicalRecord}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar y Guardar</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* NutriCoPilot Guided Prescription Wizard */}
      {isWizardOpen && (
        <NutriCopilotPlanWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          initialPatientId={patientId}
          onApplyPlanToPlanner={(planData) => {
            setPlans(storageService.getPlansByPatientId(patientId));
            setIsWizardOpen(false);
            showToast('Plan Registrado', 'El plan nutricional ha sido formulado y guardado en el expediente.', 'success');
          }}
          onOpenPdfEditor={(createdPlan) => {
            setPlans(storageService.getPlansByPatientId(patientId));
            setIsWizardOpen(false);
            setExportTab('editor');
            setIsExecutiveExportModalOpen(true);
          }}
        />
      )}

      {/* Edit Patient Form Modal */}
      {patient && (
        <PatientFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          patientToEdit={patient}
          onSuccess={(saved) => {
            setPatient(saved);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* Patient Credentials & App Access Modal */}
      {patient && isCredentialsModalOpen && (
        <PatientCredentialsModal
          isOpen={isCredentialsModalOpen}
          onClose={() => setIsCredentialsModalOpen(false)}
          patient={patient}
          onSuccess={(saved) => {
            setPatient(saved);
          }}
          onOpenPortal={() => {
            onNavigate?.('patient_portal');
          }}
        />
      )}

      {/* Delete Patient Modal */}
      {patient && (
        <DeletePatientModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          patient={patient}
          onDeleted={() => {
            setIsDeleteModalOpen(false);
            onBack();
          }}
        />
      )}

      {/* Executive PDF Export Center Modal */}
      {patient && plans.length > 0 && (
        <ExecutivePdfExportModal
          isOpen={isExecutiveExportModalOpen}
          onClose={() => setIsExecutiveExportModalOpen(false)}
          plan={plans[selectedPlanIndex] || plans[0]}
          patient={patient}
          organization={organization}
          specialist={currentUser}
          showToast={showToast}
          initialTab={exportTab}
          onPlanUpdate={() => {
            setPlans(storageService.getPlansByPatientId(patientId));
          }}
        />
      )}

      {/* Modal de Asignación Rápida de Recetas Clínicas para el Especialista (Opción B) */}
      {patient && isAssignRecipesModalOpen && (
        <Modal
          id="assign-recipes-modal"
          isOpen={isAssignRecipesModalOpen}
          onClose={() => setIsAssignRecipesModalOpen(false)}
          title={`Asignar Recetas a ${patient.firstName} ${patient.lastName}`}
          subtitle="Selecciona qué preparaciones clínicas podrá consultar el paciente en su app móvil"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-200">
            {/* Barra de Acciones Rápidas */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-teal-700 dark:text-teal-300">
                  {patient.assignedRecipeIds?.length || 0} de {storageService.getRecipes().length} seleccionadas
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoAssignPlanRecipes}
                  className="px-2.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  ⚡ Vincular del Plan
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllRecipes}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  Marcar Todas
                </button>
                <button
                  type="button"
                  onClick={handleClearAssignedRecipes}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  Desmarcar (Abierto)
                </button>
              </div>
            </div>

            {/* Buscador & Categorías dentro del modal */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre, ingrediente..."
                  value={assignRecipeSearch}
                  onChange={(e) => setAssignRecipeSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {['ALL', 'Desayuno', 'Comida', 'Cena', 'Colación', 'Bebidas'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAssignRecipeCategory(c)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      assignRecipeCategory === c
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c === 'ALL' ? 'Todas' : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista scrollable de recetas */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {storageService
                .getRecipes()
                .filter((r) => {
                  const matchSearch = `${r.name} ${r.description} ${(r.tags || []).join(' ')}`
                    .toLowerCase()
                    .includes(assignRecipeSearch.toLowerCase());
                  const matchCat = assignRecipeCategory === 'ALL' || r.category === assignRecipeCategory;
                  return matchSearch && matchCat;
                })
                .map((recipe) => {
                  const isAssigned = (patient.assignedRecipeIds || []).includes(recipe.id);
                  return (
                    <div
                      key={recipe.id}
                      onClick={() => handleToggleRecipeAssignment(recipe.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isAssigned
                          ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/40 ring-1 ring-teal-500/40'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={recipe.photoUrl}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {recipe.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                              {recipe.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {recipe.caloriesKcal} kcal • {recipe.proteinG}g P • {recipe.carbsG}g C • {recipe.fatG}g G
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isAssigned ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-xs">
                            <CheckSquare className="w-4 h-4" />
                            <span>Asignada</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200">
                            <Square className="w-4 h-4 text-slate-400" />
                            <span>Asignar</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Botón de Confirmación / Cerrar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAssignRecipesModalOpen(false);
                  showToast('Asignación Guardada', 'Las recetas visibles para el paciente se han actualizado con éxito.', 'success');
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-teal-900/20 active:scale-95"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
