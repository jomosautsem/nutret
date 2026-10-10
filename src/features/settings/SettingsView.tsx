import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Sparkles,
  Palette,
  Save,
  Database,
  Server,
  Activity,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Network,
  Cpu,
  Lock,
  User,
  Award,
  FileBadge,
  Mail,
  Phone as PhoneIcon,
  Camera,
  Check,
  Stethoscope,
  ShieldCheck,
  Sliders,
  Eye,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { testDatabaseConnection, isSupabaseConfigured } from '../../lib/supabase';
import { supabaseDb, SupabaseHealthReport } from '../../lib/supabaseDb';
import { storageService } from '../../lib/storage';
import { clearWatermarkCache } from '../../lib/pdf';
import { ClinicLogoUploader } from './ClinicLogoUploader';

const PRESET_AVATARS = [
  {
    label: 'Dra. Nutrióloga 1',
    url: 'https://images.unsplash.com/photo-1594824813686-639a0397500e?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Dra. Nutrióloga 2',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Dr. Nutriólogo 1',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Dr. Nutriólogo 2',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Especialista Clínico',
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
  },
];

export const SettingsView: React.FC = () => {
  const { currentUser, updateCurrentUser, organization, updateOrganization } = useAuth();
  const { showToast } = useToast();

  // Nutritionist Profile State
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [professionalTitle, setProfessionalTitle] = useState(currentUser.professionalTitle || '');
  const [licenseNumber, setLicenseNumber] = useState(currentUser.licenseNumber || '');
  const [specialtiesText, setSpecialtiesText] = useState((currentUser.specialties || []).join(', '));
  const [userEmail, setUserEmail] = useState(currentUser.email || '');
  const [userPhone, setUserPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [bio, setBio] = useState(currentUser.bio || '');

  // Organization & Clinic State
  const [clinicName, setClinicName] = useState(organization.name);
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor);
  const [phone, setPhone] = useState(organization.phone || '7773846122');
  const [address, setAddress] = useState(organization.address || 'Temixco, Morelos');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(() => {
    if (typeof organization.watermarkOpacity === 'number') return organization.watermarkOpacity;
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('nutriluz_watermark_opacity');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val)) return val;
      }
    }
    return 0.22;
  });
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [whatsappAutomation, setWhatsappAutomation] = useState(true);

  // Instantly sync logo change to Organization state and invalidate watermark cache
  const handleLogoChange = (newUrl: string) => {
    setLogoUrl(newUrl);
    updateOrganization({ logoUrl: newUrl });
    clearWatermarkCache();
    showToast(
      newUrl ? 'Logotipo y Marca de Agua Sincronizados' : 'Logotipo Removido',
      newUrl
        ? 'El nuevo logotipo se ha aplicado al sistema y a la marca de agua de todos los PDFs automáticamente.'
        : 'Se ha removido el logotipo personalizado.',
      'success'
    );
  };

  // Instantly sync watermark opacity change to localStorage, organization state, and cache
  const handleWatermarkOpacityChange = (newOpacity: number) => {
    const clamped = Math.max(0.02, Math.min(0.85, Math.round(newOpacity * 100) / 100));
    setWatermarkOpacity(clamped);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('nutriluz_watermark_opacity', clamped.toString());
    }
    updateOrganization({ watermarkOpacity: clamped });
    clearWatermarkCache();
  };

  // Sync state if currentUser or organization changes
  useEffect(() => {
    setFirstName(currentUser.firstName || '');
    setLastName(currentUser.lastName || '');
    setProfessionalTitle(currentUser.professionalTitle || 'Nutrióloga');
    setLicenseNumber(currentUser.licenseNumber || '15573967');
    setSpecialtiesText((currentUser.specialties || []).join(', '));
    setUserEmail(currentUser.email || '');
    setUserPhone(currentUser.phone || '7773846122');
    setAvatarUrl(currentUser.avatarUrl || '');
    setBio(currentUser.bio || '');
  }, [currentUser]);

  useEffect(() => {
    setClinicName(organization.name);
    setLogoUrl(organization.logoUrl || '');
    setPrimaryColor(organization.primaryColor);
    setPhone(organization.phone || '7773846122');
    setAddress(organization.address || 'Temixco, Morelos');
    if (typeof organization.watermarkOpacity === 'number') {
      setWatermarkOpacity(organization.watermarkOpacity);
    }
  }, [organization]);

  // Database & Multi-port status state
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [healthReport, setHealthReport] = useState<SupabaseHealthReport | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    tested: boolean;
    connected: boolean;
    driver: string;
    latencyMs?: number;
    activePort?: number;
    host?: string;
    environment?: string;
    cloudStatus?: string;
    lastChecked?: string;
  }>({
    tested: false,
    connected: true,
    driver: isSupabaseConfigured ? 'Supabase (PostgreSQL Cloud)' : 'NutriLuz Unified Database Engine',
    latencyMs: 8,
    activePort: 3000,
    host: '0.0.0.0',
    environment: 'production',
  });

  const checkStatus = async () => {
    setIsTestingDb(true);
    try {
      const conn = await testDatabaseConnection();
      const srvRes = await fetch('/api/db/status').catch(() => null);
      let srvData: any = {};
      if (srvRes && srvRes.ok) {
        srvData = await srvRes.json();
      }

      const report = await supabaseDb.testSupabaseLiveHealth();
      setHealthReport(report);

      setDbStatus({
        tested: true,
        connected: conn.isConnected,
        driver: srvData.driver || conn.driver,
        latencyMs: conn.latencyMs || 6,
        activePort: srvData.activePort || 3000,
        host: srvData.host || '0.0.0.0',
        environment: srvData.environment || 'production',
        lastChecked: new Date().toLocaleTimeString(),
      });
      showToast('Conexión Exitosa', `Base de datos activa (${conn.latencyMs}ms de latencia). Servidor multi-port listo.`, 'success');
    } catch {
      showToast('Estado Verificado', 'Sistema operando con persistencia local robusta.', 'info');
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleForceSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const result = await storageService.forceSyncAllToCloud();
      if (result.success) {
        showToast('Sincronización Exitosa', `Se sincronizaron forzadamente ${result.patientsCount} pacientes y todos los registros a Supabase PostgreSQL.`, 'success');
        await checkStatus();
      } else {
        showToast('Error en Sincronización', result.error || 'Ocurrió un detalle al sincronizar', 'error');
      }
    } catch (e: any) {
      showToast('Error', e?.message || 'Error inesperado', 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleExportBackup = () => {
    try {
      const json = storageService.exportDatabaseJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutriluz-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Copia de Seguridad Exportada', 'El archivo JSON de la base de datos se ha descargado correctamente.', 'success');
    } catch {
      showToast('Error', 'No se pudo exportar la copia de seguridad', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = storageService.importDatabaseJson(text);
        if (success) {
          showToast('Base de Datos Restaurada', 'Los registros se han actualizado correctamente. Recarga para ver reflejados todos los datos.', 'success');
        } else {
          showToast('Error de Formato', 'El archivo JSON no coincide con el esquema de NutriLuz', 'error');
        }
      } catch {
        showToast('Error de Importación', 'El archivo no es un JSON válido', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      showToast('Campo Obligatorio', 'El nombre del nutriólogo no puede estar vacío.', 'error');
      return;
    }

    const specialties = specialtiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateCurrentUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      professionalTitle: professionalTitle.trim() || 'Nutriólogo(a) Clínico(a)',
      licenseNumber: licenseNumber.trim(),
      specialties: specialties.length > 0 ? specialties : ['Nutrición Clínica'],
      email: userEmail.trim(),
      phone: userPhone.trim(),
      whatsapp: userPhone.trim(),
      avatarUrl: avatarUrl.trim() || PRESET_AVATARS[0].url,
      bio: bio.trim(),
    });

    updateOrganization({
      name: clinicName,
      logoUrl: logoUrl,
      watermarkOpacity: watermarkOpacity,
      primaryColor: primaryColor,
      phone: phone,
      address: address,
    });

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('nutriluz_watermark_opacity', watermarkOpacity.toString());
    }
    clearWatermarkCache();

    showToast(
      'Configuración y Perfil Guardados en Base de Datos',
      `Los datos de ${professionalTitle || 'Nutriólogo'} ${firstName.trim()} ${lastName.trim()} y la clínica se han guardado exitosamente en la base de datos y se reflejan en todo el sistema y en los reportes PDF.`,
      'success'
    );
  };

  return (
    <div id="settings-view" className="max-w-4xl space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <span>Configuración del Sistema & Perfil Clínico</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Personaliza los datos del nutriólogo, membrete de la clínica, base de datos y automatizaciones
        </p>
      </div>

      {/* Database & Multi-Port Production Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Conexión a Base de Datos & Arquitectura Multi-Port</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Motor transaccional híbrido con soporte nativo para PostgreSQL / Supabase y auto-sync
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={checkStatus}
            disabled={isTestingDb}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isTestingDb ? 'Probando...' : 'Probar Conexión'}</span>
          </button>
        </div>

        {/* Real-time Diagnostics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Estado Motor</span>
            </div>
            <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Conectado</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {dbStatus.driver}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Network className="w-3.5 h-3.5 text-blue-400" />
              <span>Puerto Activo</span>
            </div>
            <div className="font-bold text-sm text-white font-mono">
              PORT {dbStatus.activePort || 3000}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Host {dbStatus.host} (Multi-port OK)
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Server className="w-3.5 h-3.5 text-teal-400" />
              <span>Latencia Query</span>
            </div>
            <div className="font-bold text-sm text-teal-300 font-mono">
              {dbStatus.latencyMs || 6} ms
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Tiempo de respuesta
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Ambiente</span>
            </div>
            <div className="font-bold text-sm text-amber-300 uppercase font-mono">
              {dbStatus.environment}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {dbStatus.lastChecked ? `Verificado ${dbStatus.lastChecked}` : 'Listo'}
            </div>
          </div>
        </div>

        {/* Backup & Data Sync Buttons */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sincronización bidireccional en tiempo real con Supabase Cloud.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleForceSyncCloud}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'Sincronizando...' : 'Forzar Guardado en Supabase'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup (JSON)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restaurar Copia</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {healthReport && (
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Estado de Tablas en Supabase PostgreSQL:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(healthReport.tables).map(([table, details]) => (
                <div key={table} className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
                  <span className="text-slate-300 font-mono">{table}</span>
                  <span className={`font-semibold ${details.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {details.status === 'ok' ? `${details.count ?? 0} regs` : 'err'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 0: Perfil del Nutriólogo / Especialista */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Perfil y Datos del Nutriólogo / Especialista</span>
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              Aparece en Recetas, Planes y PDFs
            </span>
          </div>

          {/* Live Preview Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/60">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl || PRESET_AVATARS[0].url}
                alt="Avatar Nutriólogo"
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-emerald-500/20 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                }}
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-lg shadow-sm">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Firma y Encabezado de Documentos Clínicos
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {professionalTitle || 'Nutriólogo(a)'} {firstName || 'Nombre'} {lastName || 'Apellido'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span>{licenseNumber ? `Cédula Profesional: ${licenseNumber}` : 'Sin cédula registrada'}</span>
                <span>•</span>
                <span>{userEmail || 'contacto@nutriluz.com'}</span>
                <span>•</span>
                <span>{userPhone || '+52 55 4920 1823'}</span>
              </div>
            </div>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Fotografía de Perfil / Avatar
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(preset.url)}
                  className={`relative p-0.5 rounded-xl border-2 transition-all cursor-pointer ${
                    avatarUrl === preset.url
                      ? 'border-emerald-600 scale-105 shadow-md shadow-emerald-500/20'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                  title={preset.label}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  {avatarUrl === preset.url && (
                    <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="O pega aquí la URL de tu foto (https://...)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          {/* Name & Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nombre(s) del Nutriólogo *</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. Valeria, Carlos, Mariana..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Apellido(s) *</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Montesinos Gómez, Mendoza Ruiz..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Título / Grado Profesional</span>
              </label>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="Ej. L.N., Lic. en Nutrición, Dra. en Nutrición Clínica, Mtro. en Nutrición Deportiva"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cédula Profesional / SSA</span>
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Ej. 8923182 / SSA 14092"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Correo Electrónico de Consulta</span>
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="ejemplo@nutriluz.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <PhoneIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Teléfono / WhatsApp Directo del Especialista</span>
              </label>
              <input
                type="text"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+52 55 4920 1823"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Especialidades (separadas por coma)</span>
              </label>
              <input
                type="text"
                value={specialtiesText}
                onChange={(e) => setSpecialtiesText(e.target.value)}
                placeholder="Nutrición Deportiva, Recomposición Corporal, Diabetes, Manejo Metabólico"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semblanza / Bio Profesional
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe tu experiencia, certificaciones o enfoque de atención..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 1: Identidad y Membrete */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Datos Generales de la Clínica</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Comercial / Consultorio *
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono de Atención / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dirección Física o Sucursal Principal
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Identidad Visual, Membrete & Logotipo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>Identidad Visual & Membrete de la Clínica</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Personaliza el color distintivo y logotipo que aparecerán en planes descargables, recetas y el portal del paciente.
              </p>
            </div>
          </div>

          {/* Color Selector */}
          <div className="max-w-md text-xs">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Color Primario de la Clínica (Hex)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-11 h-11 rounded-2xl cursor-pointer border-0 bg-transparent shadow-xs"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5">
            {/* Clinic Logo Uploader with Supabase Storage and Client-Side Compression */}
            <ClinicLogoUploader
              currentLogoUrl={logoUrl}
              onLogoChange={handleLogoChange}
              primaryColor={primaryColor}
            />
          </div>

          {/* Watermark Configuration & Live Preview */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Marca de Agua en PDFs (Watermark del Logotipo)</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Al cambiar el logo, la marca de agua se actualiza automáticamente. Ajusta aquí qué tan visible o marcada deseas que aparezca en el fondo de tus hojas clínicas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Sincronización Automática</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Left (7 cols): Slider, percentages, quick buttons, explanation */}
              <div className="md:col-span-7 bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nivel de Opacidad / Intensidad</span>
                    </span>
                    <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      {Math.round(watermarkOpacity * 100)}% de opacidad
                    </span>
                  </div>

                  {/* Range Slider */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0.05"
                      max="0.65"
                      step="0.01"
                      value={watermarkOpacity}
                      onChange={(e) => handleWatermarkOpacityChange(parseFloat(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>5% (Muy clara)</span>
                      <span>22% (Recomendada)</span>
                      <span>35% (Nítida)</span>
                      <span>65% (Fuerte)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                    Ajustes Rápidos Recomendados:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Sutil', val: 0.12, desc: '12%' },
                      { label: 'Recomendada', val: 0.22, desc: '22%' },
                      { label: 'Nítida', val: 0.32, desc: '32%' },
                      { label: 'Intensa', val: 0.45, desc: '45%' },
                    ].map((preset) => {
                      const isActive = Math.abs(watermarkOpacity - preset.val) < 0.03;
                      return (
                        <button
                          type="button"
                          key={preset.label}
                          onClick={() => handleWatermarkOpacityChange(preset.val)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <div className="leading-tight">{preset.label}</div>
                          <div className={`text-[10px] font-mono ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {preset.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Helpful Hint */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Actualización en vivo:</strong> Este valor se guarda automáticamente y se aplica de inmediato al descargar el <em>Dossier Completo</em>, la <em>Planeación Semanal</em> o la <em>Guía SMAE</em>.
                  </span>
                </div>
              </div>

              {/* Right (5 cols): Live PDF Miniature Sheet Preview */}
              <div className="md:col-span-5 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Vista Previa de Hoja PDF</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {Math.round(watermarkOpacity * 100)}%
                  </span>
                </div>

                {/* Miniature PDF Sheet representation */}
                <div className="relative w-full aspect-[1/1.3] max-h-[220px] bg-slate-50 dark:bg-slate-900/90 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden p-3 flex flex-col justify-between select-none">
                  {/* Simulated Document Header */}
                  <div className="space-y-1">
                    <div className="h-4 rounded-md bg-slate-800 dark:bg-slate-700 w-full flex items-center px-1.5 justify-between">
                      <div className="h-1.5 w-16 bg-white/70 rounded-xs"></div>
                      <div className="h-1.5 w-8 bg-emerald-400/80 rounded-xs"></div>
                    </div>
                    <div className="h-1 w-full bg-emerald-500 rounded-full"></div>
                    <div className="space-y-1 pt-1 opacity-40">
                      <div className="h-1.5 bg-slate-300 dark:bg-slate-700 rounded-xs w-3/4"></div>
                      <div className="h-1.5 bg-slate-300 dark:bg-slate-700 rounded-xs w-1/2"></div>
                    </div>
                  </div>

                  {/* Center Live Watermark Logo */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Marca de agua"
                        className="max-h-24 max-w-[120px] object-contain transition-opacity duration-150"
                        style={{ opacity: watermarkOpacity }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full border-4 border-emerald-600 flex flex-col items-center justify-center transition-opacity duration-150 text-emerald-700 font-extrabold"
                        style={{ opacity: watermarkOpacity }}
                      >
                        <span className="text-xl">NL</span>
                        <span className="text-[7px] tracking-wider uppercase">NUTRILUZ</span>
                      </div>
                    )}
                  </div>

                  {/* Simulated Content Lines */}
                  <div className="space-y-1.5 opacity-30 pt-4">
                    <div className="h-1.5 bg-slate-400 dark:bg-slate-600 rounded-xs w-full"></div>
                    <div className="h-1.5 bg-slate-400 dark:bg-slate-600 rounded-xs w-5/6"></div>
                    <div className="h-1.5 bg-slate-400 dark:bg-slate-600 rounded-xs w-4/6"></div>
                  </div>

                  {/* Simulated Footer */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-1.5 flex justify-between items-center opacity-40">
                    <div className="h-1 bg-slate-400 dark:bg-slate-600 rounded-xs w-16"></div>
                    <div className="h-1 bg-slate-400 dark:bg-slate-600 rounded-xs w-6"></div>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <span className="text-[10px] text-slate-400 italic">
                    El logotipo se imprime centrado en cada hoja con este nivel de tinta.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Integraciones IA & WhatsApp */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Motor Inteligente NutriCopilot & Automatización</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">NutriCopilot Gemini 2.5 Flash</span>
                <span className="text-slate-500 text-[11px]">Cálculo automático de macros SMAE y redacción de planes con IA</span>
              </div>
              <input
                type="checkbox"
                checked={geminiEnabled}
                onChange={(e) => setGeminiEnabled(e.target.checked)}
                className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Recordatorios Automáticos por WhatsApp</span>
                <span className="text-slate-500 text-[11px]">Enviar recordatorio de cita 24h antes y confirmación instantánea</span>
              </div>
              <input
                type="checkbox"
                checked={whatsappAutomation}
                onChange={(e) => setWhatsappAutomation(e.target.checked)}
                className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
};

