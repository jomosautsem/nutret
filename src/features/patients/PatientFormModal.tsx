import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Patient, RiskLevel, PatientStatus, AnthropometricRecord, ClinicalRecord } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { storageService } from '../../lib/storage';
import { optimizeImage, uploadPatientPhotoToSupabase } from '../../lib/imageOptimizer';

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

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'antropometria' | 'clinico' | 'credenciales' | 'foto'>('general');

  // Photo Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [compressionStats, setCompressionStats] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // File Upload & Compression Handler
  const handleFileSelected = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|svg)$/i)) {
      showToast('Formato no válido', 'Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP o HEIC).', 'error');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Optimizando y recortando imagen...');

    try {
      // 1. Client-side bicubic optimization (<100KB, max 600x600, crisp quality)
      const optResult = await optimizeImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.88,
        format: 'image/webp',
      });

      const origKb = (optResult.originalSize / 1024).toFixed(0);
      const compKb = (optResult.compressedSize / 1024).toFixed(0);
      setCompressionStats(`${compKb} KB (Ahorro del ${optResult.savingsPct}%)`);

      setUploadMessage('Guardando imagen en el expediente...');

      // 2. Try Supabase Storage if configured, or use high-efficiency DataURL
      const patientIdentifier = patientToEdit?.id || `patient_${Date.now()}`;
      const uploadRes = await uploadPatientPhotoToSupabase(
        optResult.blob,
        patientIdentifier,
        optResult.fileName
      );

      if (uploadRes.success && uploadRes.publicUrl) {
        setFormData((prev) => ({ ...prev, photoUrl: uploadRes.publicUrl }));
        showToast('Foto cargada', 'La imagen se subió a la nube y se vinculó al paciente.', 'success');
      } else {
        // Safe offline / local storage fallback using compressed WebP DataURL
        setFormData((prev) => ({ ...prev, photoUrl: optResult.dataUrl }));
        showToast('Foto optimizada', 'Fotografía procesada y guardada con éxito en el expediente.', 'success');
      }
    } catch (err: any) {
      console.error('Error optimizando imagen del paciente:', err);
      showToast('Error al procesar imagen', err?.message || 'No se pudo procesar la fotografía seleccionada.', 'error');
    } finally {
      setIsUploading(false);
      setUploadMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemovePhoto = () => {
    const defaultUrl =
      formData.gender === 'F'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';
    setFormData((prev) => ({ ...prev, photoUrl: defaultUrl }));
    setCompressionStats(null);
    showToast('Foto restaurada', 'Se ha restablecido el avatar clínico predeterminado.', 'info');
  };

  // Populate when editing
  useEffect(() => {
    if (patientToEdit) {
      // Find allergies & pathologies from patient or clinical record
      const clinRec = storageService.getClinicalRecordByPatientId(patientToEdit.id);
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
    } else {
      // Defaults for new patient
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
    }
  }, [patientToEdit, isOpen]);

  // Live BMI calculation
  const heightM = (Number(formData.height) || 165) / 100;
  const currentWeightNum = Number(formData.currentWeight) || 70;
  const liveBmi = Number((currentWeightNum / (heightM * heightM)).toFixed(1));

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Bajo Peso', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' };
    if (val < 25) return { label: 'Normopeso', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' };
    if (val < 30) return { label: 'Sobrepeso', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50' };
    if (val < 35) return { label: 'Obesidad Grado I', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' };
    return { label: 'Obesidad Grado II/III', color: 'text-red-700 bg-red-50 dark:bg-red-950/50' };
  };

  const bmiCat = getBmiCategory(liveBmi);

  // Age calculation
  const birthYear = formData.birthDate ? new Date(formData.birthDate).getFullYear() : 1995;
  const ageYears = isNaN(birthYear) ? 29 : Math.max(1, new Date().getFullYear() - birthYear);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      showToast('Campo requerido', 'Ingresa el nombre del paciente.', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

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
      createdAt: patientToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save or update Patient in storage & wait for parent patient record
    await storageService.savePatient(savedPatient);

    // If new patient, also create baseline anthropometric & clinical records
    if (!isEditing) {
      // Baseline anthropometric record: strictly real values provided in the form
      const initialAnthro: AnthropometricRecord = {
        id: `anthro-${Date.now()}`,
        patientId: savedPatient.id,
        date: new Date().toISOString().slice(0, 10),
        weight: parsedCurrentWeight,
        height: parsedHeight,
        bmi: liveBmi,
        measurementDevice: 'Báscula y Estadiómetro Clínico',
        notes: 'Evaluación somatométrica basal de ingreso.',
      };
      await storageService.saveAnthropometricRecord(initialAnthro);

      // Only create clinical record if the specialist entered allergies, pathologies or observations.
      // NEVER invent lifestyle habits, sleep hours, water, alcohol, physical activity or meal logs.
      if (allergiesArr.length > 0 || pathologiesArr.length > 0 || savedPatient.notes) {
        const initialClinical: ClinicalRecord = {
          id: `clin-${Date.now()}`,
          patientId: savedPatient.id,
          specialistId: savedPatient.specialistId || 'user-dra-valeria',
          pathologicalHistory: {
            diagnosedDiseases: pathologiesArr,
            surgeries: [],
          },
          allergies: allergiesArr,
          medications: [],
          clinicalGoals: savedPatient.goal,
          clinicalObservations: savedPatient.notes,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveClinicalRecord(initialClinical);
      }
    } else {
      // If editing existing patient, update clinical allergies/pathologies if changed
      const existingClinical = storageService.getClinicalRecordByPatientId(savedPatient.id);
      if (existingClinical) {
        const updatedClinical: ClinicalRecord = {
          ...existingClinical,
          allergies: allergiesArr,
          pathologicalHistory: {
            ...existingClinical.pathologicalHistory,
            diagnosedDiseases: pathologiesArr,
          },
          clinicalGoals: savedPatient.goal,
          clinicalObservations: savedPatient.notes || existingClinical.clinicalObservations,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveClinicalRecord(updatedClinical);
      }
    }

    showToast(
      isEditing ? 'Paciente actualizado con éxito' : 'Paciente registrado con éxito',
      `El expediente de ${savedPatient.firstName} ${savedPatient.lastName} ha sido sincronizado en el sistema.`,
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
        subtitle={isEditing ? 'Actualiza los datos personales, métricas somatométricas y objetivos' : 'Completa la ficha de identificación y metas clínicas iniciales'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Sub Navigation Tabs inside Modal */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl">
            <button
              type="button"
              id="modal-tab-general"
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'general'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Datos Personales</span>
            </button>

            <button
              type="button"
              id="modal-tab-antropometria"
              onClick={() => setActiveTab('antropometria')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'antropometria'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Somatometría & Metas</span>
            </button>

            <button
              type="button"
              id="modal-tab-clinico"
              onClick={() => setActiveTab('clinico')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'clinico'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Historial & Alergias</span>
            </button>

            <button
              type="button"
              id="modal-tab-credenciales"
              onClick={() => setActiveTab('credenciales')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'credenciales'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Acceso & Contraseña</span>
              {formData.portalAccessEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              type="button"
              id="modal-tab-foto"
              onClick={() => setActiveTab('foto')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'foto'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Foto / Avatar</span>
              {formData.photoUrl && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>

          {/* Hidden File Inputs for Local Upload & Camera */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelected(e.target.files[0]);
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
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          {/* TAB 1: DATOS PERSONALES & CONTACTO */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fade-in">
              {/* Quick Photo Header Bar inside Tab 1 */}
              <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 dark:from-emerald-950/20 dark:via-slate-800/40 dark:to-slate-800/60 border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={formData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                      alt="Foto del paciente"
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-xs"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {formData.firstName || formData.lastName
                          ? `${formData.firstName} ${formData.lastName}`.trim()
                          : 'Fotografía del Paciente'}
                      </h4>
                      {compressionStats && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          {compressionStats}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Sube una fotografía de tu paciente o tómala directamente con la cámara.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Subir Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('foto')}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Ver opciones avanzadas de foto y avatar"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre(s) *
                  </label>
                  <input
                    id="patient-form-firstname"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ej. Ana Lucía"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    id="patient-form-lastname"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ej. Morales Sánchez"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sexo Biológico
                  </label>
                  <select
                    id="patient-form-gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-medium"
                  >
                    <option value="F">Femenino (F)</option>
                    <option value="M">Masculino (M)</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Fecha Nacimiento</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{ageYears} años</span>
                  </label>
                  <input
                    id="patient-form-birthdate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ocupación
                  </label>
                  <input
                    id="patient-form-occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Ej. Abogado, Ingeniero..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>Correo Electrónico</span>
                  </label>
                  <input
                    id="patient-form-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="paciente@correo.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Teléfono Móvil</span>
                  </label>
                  <input
                    id="patient-form-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Directo
                  </label>
                  <input
                    id="patient-form-whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ciudad / Domicilio
                </label>
                <input
                  id="patient-form-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej. Benito Juárez, Ciudad de México"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              {/* ASIGNACIÓN DE CONTRASEÑA Y ACCESO A LA APP DEL PACIENTE */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-slate-50 dark:from-emerald-950/30 dark:via-slate-800/60 dark:to-slate-800/80 border border-emerald-200/90 dark:border-emerald-800/60 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Asignar Contraseña & Acceso a la App</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Portal de Pacientes
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Credenciales con las que tu paciente iniciará sesión en su app móvil o portal web.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.portalAccessEnabled}
                      onChange={(e) => setFormData({ ...formData, portalAccessEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {formData.portalAccessEnabled ? (
                  <div className="space-y-3 pt-1 border-t border-emerald-100/80 dark:border-emerald-900/30">
                    {/* Usuario y Contraseña en 2 columnas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Usuario */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Usuario de Inicio de Sesión
                          </label>
                          <div className="flex items-center gap-1.5">
                            {formData.email && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, portalUsername: formData.email })}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                              >
                                Usar correo
                              </button>
                            )}
                            {formData.phone && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, portalUsername: formData.phone.replace(/\D/g, '') })}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                              >
                                Usar teléfono
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={formData.portalUsername}
                          onChange={(e) => setFormData({ ...formData, portalUsername: e.target.value })}
                          placeholder={formData.email || 'ej. usuario o correo'}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Si queda vacío, se usa su correo o teléfono automáticamente.
                        </span>
                      </div>

                      {/* Contraseña */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Contraseña del Paciente *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const randomNum = Math.floor(100 + Math.random() * 900);
                              const preset = PORTAL_PASSWORD_PRESETS[Math.floor(Math.random() * PORTAL_PASSWORD_PRESETS.length)];
                              const newPass = `${preset.slice(0, -1)}${randomNum}!`;
                              setFormData({ ...formData, portalPassword: newPass });
                              showToast('Contraseña Generada', `Asignada: ${newPass}`, 'info');
                            }}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>🎲 Generar Automática</span>
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type={formData.showPassword ? 'text' : 'password'}
                            value={formData.portalPassword}
                            onChange={(e) => setFormData({ ...formData, portalPassword: e.target.value })}
                            placeholder="Contraseña del paciente"
                            className="w-full px-3 py-2 pr-9 bg-white dark:bg-slate-900 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title={formData.showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          >
                            {formData.showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {/* Preset Chips */}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">Sugeridas:</span>
                          {PORTAL_PASSWORD_PRESETS.slice(0, 3).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setFormData({ ...formData, portalPassword: p })}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                                formData.portalPassword === p
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Resumen de Credenciales */}
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Credenciales: Usuario: <strong className="font-mono text-emerald-700 dark:text-emerald-300">{formData.portalUsername || formData.email || 'correo del paciente'}</strong> | Pass: <strong className="font-mono text-emerald-700 dark:text-emerald-300">{formData.portalPassword || 'Nutri2026!'}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Podrás compartirlas por WhatsApp al terminar
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Acceso a la app desactivado. El paciente no podrá iniciar sesión en el portal a menos que lo actives.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SOMATOMETRÍA & METAS */}
          {activeTab === 'antropometria' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estatura (cm) *
                  </label>
                  <input
                    id="patient-form-height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso Inicial (kg)
                  </label>
                  <input
                    id="patient-form-init-weight"
                    type="number"
                    step="0.1"
                    value={formData.initialWeight}
                    onChange={(e) => setFormData({ ...formData, initialWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso Actual (kg) *
                  </label>
                  <input
                    id="patient-form-curr-weight"
                    type="number"
                    step="0.1"
                    value={formData.currentWeight}
                    onChange={(e) => setFormData({ ...formData, currentWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso Meta (kg)
                  </label>
                  <input
                    id="patient-form-target-weight"
                    type="number"
                    step="0.1"
                    value={formData.targetWeight}
                    onChange={(e) => setFormData({ ...formData, targetWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* BMI Card Indicator */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Índice de Masa Corporal (IMC Basal)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Calculado automáticamente a partir de {formData.currentWeight} kg y {formData.height} cm
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {liveBmi} <span className="text-[11px] font-normal text-slate-400">kg/m²</span>
                  </div>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${bmiCat.color}`}>
                    {bmiCat.label}
                  </span>
                </div>
              </div>

              {/* Objective Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Objetivo Principal del Paciente *
                </label>
                <input
                  id="patient-form-goal"
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="Ej. Pérdida de Grasa y Recomposición Corporal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-medium"
                />
                {/* Quick Goal Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_GOALS.map((qg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, goal: qg })}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                    >
                      + {qg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status and Risk */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado en el Consultorio
                  </label>
                  <select
                    id="patient-form-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Activo">🟢 Activo</option>
                    <option value="En pausa">🟡 En pausa</option>
                    <option value="Inactivo">⚪ Inactivo</option>
                    <option value="Alta">✨ Alta Médica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nivel de Riesgo Clínico
                  </label>
                  <select
                    id="patient-form-risk"
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-medium"
                  >
                    <option value="NORMAL">🟢 Normal / Bajo Riesgo</option>
                    <option value="MEDIUM_RISK">🟡 Riesgo Medio (Comorbilidad)</option>
                    <option value="HIGH_RISK">🔴 Alto Riesgo Metabólico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Adherencia Estimada (%)
                  </label>
                  <input
                    id="patient-form-adherence"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.adherenceRate}
                    onChange={(e) => setFormData({ ...formData, adherenceRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORIAL CLÍNICO & ALERGIAS */}
          {activeTab === 'clinico' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alergias o Intolerancias Alimentarias (separadas por coma)
                </label>
                <input
                  id="patient-form-allergies"
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Ej. Lactosa, Mariscos, Frutos secos, Gluten..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Estas restricciones se tendrán en cuenta automáticamente en el NutriCopilot AI y recetario.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patologías / Diagnósticos Previos (separadas por coma)
                </label>
                <input
                  id="patient-form-pathologies"
                  type="text"
                  value={formData.pathologies}
                  onChange={(e) => setFormData({ ...formData, pathologies: e.target.value })}
                  placeholder="Ej. Resistencia a la Insulina, Hipotiroidismo, Hipertensión..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas Clínicas / Observaciones Iniciales
                </label>
                <textarea
                  id="patient-form-notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones de estilo de vida, antecedentes relevantes o metas específicas acordadas..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: CREDENCIALES & ACCESO APP */}
          {activeTab === 'credenciales' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Access toggle banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Habilitar Acceso a la App del Paciente
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Permite al paciente ingresar a su portal móvil para revisar su plan, fotos de platillos y registrar hábitos.
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

              {formData.portalAccessEnabled ? (
                <div className="space-y-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  {/* Username / Email field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Usuario o Correo de Acceso:
                      </label>
                      <div className="flex items-center gap-2">
                        {formData.email && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, portalUsername: formData.email })}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                          >
                            Usar su Correo
                          </button>
                        )}
                        {formData.phone && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, portalUsername: formData.phone.replace(/\D/g, '') })}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                          >
                            Usar su Teléfono
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={formData.portalUsername}
                        onChange={(e) => setFormData({ ...formData, portalUsername: e.target.value })}
                        placeholder={formData.email || 'ej. ana.garcia@gmail.com o usuario123'}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Si lo dejas en blanco, se utilizará su correo electrónico registrado.
                    </span>
                  </div>

                  {/* Password field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Contraseña de Acceso:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const randomNum = Math.floor(100 + Math.random() * 900);
                          setFormData({ ...formData, portalPassword: `Nutri${randomNum}!` });
                          showToast('Contraseña Generada', 'Se asignó una contraseña segura.', 'info');
                        }}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>🎲 Generar Automática</span>
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={formData.showPassword ? 'text' : 'password'}
                        value={formData.portalPassword}
                        onChange={(e) => setFormData({ ...formData, portalPassword: e.target.value })}
                        placeholder="Contraseña del paciente"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold tracking-wide focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                        className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title={formData.showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {formData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Esta contraseña es la que el paciente tecleará para entrar en su celular o tableta.
                    </span>
                  </div>

                  {/* Share helper preview */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Credenciales listas para entregar</span>
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                      Usuario: <strong>{formData.portalUsername || formData.email || 'correo del paciente'}</strong> | Contraseña: <strong>{formData.portalPassword || 'Nutri2026!'}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-xs">
                  El acceso a la app está deshabilitado para este paciente. Puedes activarlo con el interruptor superior para asignarle usuario y contraseña.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FOTO & AVATAR */}
          {activeTab === 'foto' && (
            <div className="space-y-5 animate-fade-in">
              {/* Photo Preview & Live Status */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/30 to-teal-50/20 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-700">
                <div className="relative group shrink-0">
                  <img
                    src={formData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt="Foto del paciente"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-emerald-500/20 shadow-md transition-all group-hover:scale-105"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center text-white p-2">
                      <Loader2 className="w-6 h-6 animate-spin mb-1 text-emerald-400" />
                      <span className="text-[10px] font-bold text-center">Procesando</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {formData.firstName || formData.lastName
                        ? `${formData.firstName} ${formData.lastName}`.trim()
                        : 'Fotografía Oficial'}
                    </h4>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                      Alta Resolución
                    </span>
                    {compressionStats && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300">
                        {compressionStats}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                    Esta imagen se mostrará en el expediente médico, panel de control, consultas en vivo y en los reportes clínicos PDF exportables.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-900/10 cursor-pointer transition-all active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir desde Dispositivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 cursor-pointer transition-all active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cámara</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                      title="Restablecer avatar por defecto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Restablecer</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-400 dark:hover:border-emerald-600'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {isUploading
                      ? uploadMessage || 'Procesando y optimizando imagen...'
                      : 'Arrastra una fotografía aquí o haz clic para examinar'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Admite JPG, PNG, WebP, HEIC y SVG (Compresión automática ultrarrápida a WebP)
                  </p>
                </div>
              </div>

              {/* Avatar Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>O selecciona un avatar clínico preestablecido:</span>
                  <span className="text-[10px] text-slate-400 font-normal">8 opciones de muestra</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {AVATAR_PRESETS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, photoUrl: av.url, gender: av.gender as any });
                        setCompressionStats(null);
                        showToast('Avatar seleccionado', `Se asignó el perfil preestablecido (${av.label}).`, 'info');
                      }}
                      className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        formData.photoUrl === av.url
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      {formData.photoUrl === av.url && (
                        <div className="absolute inset-0 bg-emerald-600/40 backdrop-blur-[1px] flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent py-0.5 text-[9px] font-bold text-white text-center">
                        {av.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual URL fallback */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enlace Web de Fotografía Externa (Opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    id="patient-form-photo-url"
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, photoUrl: e.target.value });
                      setCompressionStats(null);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(formData.photoUrl, '_blank');
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Probar enlace"
                    >
                      Ver
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">
              * Campos obligatorios para el expediente clínico
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="patient-form-cancel-btn"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="patient-form-submit-btn"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Paciente'}</span>
              </button>
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
        subtitle="Verifica los datos principales antes de sincronizar"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {isEditing ? '¿Deseas guardar los cambios del paciente?' : '¿Deseas registrar este nuevo paciente?'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {isEditing
                  ? 'Se actualizará el perfil del paciente y su historial clínico en la base de datos.'
                  : 'Se creará el expediente clínico, la primera evaluación somatométrica y el perfil en el sistema.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
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
              <span className="text-slate-500">Estado / Riesgo:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formData.status} • {formData.riskLevel}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Acceso a App:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formData.portalAccessEnabled ? '🟢 Habilitado' : '🔴 Deshabilitado'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Usuario de acceso:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formData.portalUsername || formData.email || formData.phone || 'Correo del paciente'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Contraseña asignada:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formData.portalPassword || 'Nutri2026!'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              id="confirm-patient-cancel-btn"
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Revisar datos
            </button>
            <button
              type="button"
              id="confirm-patient-accept-btn"
              onClick={handleConfirmSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Sí, Guardar Cambios' : 'Sí, Registrar Paciente'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
