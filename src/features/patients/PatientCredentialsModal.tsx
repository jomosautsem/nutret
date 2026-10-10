import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Phone,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Patient } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { storageService } from '../../lib/storage';

interface PatientCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSuccess?: (updatedPatient: Patient) => void;
  onOpenPortal?: (patientId: string) => void;
}

const PASSWORD_PRESETS = [
  'Nutri2026!',
  'Saludable26!',
  'Meta2026#',
  'Bienestar26$',
  'FitVida2026!',
  'Energia26!',
];

export const PatientCredentialsModal: React.FC<PatientCredentialsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
  onOpenPortal,
}) => {
  const { showToast } = useToast();

  const [portalAccessEnabled, setPortalAccessEnabled] = useState(
    patient.portalAccessEnabled !== false
  );
  const [portalUsername, setPortalUsername] = useState(
    patient.portalUsername || patient.email || `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}`.replace(/\s+/g, '')
  );
  const [portalPassword, setPortalPassword] = useState(
    patient.portalPassword || 'Nutri2026!'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (patient) {
      setPortalAccessEnabled(patient.portalAccessEnabled !== false);
      setPortalUsername(
        patient.portalUsername ||
          patient.email ||
          `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}`.replace(/\s+/g, '')
      );
      setPortalPassword(patient.portalPassword || 'Nutri2026!');
      setShowPassword(false);
    }
  }, [patient, isOpen]);

  const handleGeneratePassword = () => {
    const randomPreset = PASSWORD_PRESETS[Math.floor(Math.random() * PASSWORD_PRESETS.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newPass = `${randomPreset.slice(0, -1)}${randomNum}!`;
    setPortalPassword(newPass);
    showToast('Nueva Contraseña Generada', 'Puedes guardarla y compartirla con el paciente.', 'info');
  };

  const handleSave = () => {
    if (portalAccessEnabled && (!portalUsername.trim() || !portalPassword.trim())) {
      showToast('Campos Incompletos', 'Ingresa usuario y contraseña para habilitar el acceso.', 'error');
      return;
    }

    const updated = storageService.updatePatientCredentials(patient.id, {
      portalAccessEnabled,
      portalUsername: portalUsername.trim(),
      portalPassword: portalPassword.trim(),
    });

    if (updated) {
      onSuccess?.(updated);
      showToast('Credenciales Guardadas', `Acceso actualizado para ${patient.firstName}.`, 'success');
      onClose();
    }
  };

  const shareText = `¡Hola ${patient.firstName}! Te comparto tus credenciales para ingresar a tu App y Portal de Pacientes Nutriluz:

👤 Usuario: ${portalUsername.trim()}
🔑 Contraseña: ${portalPassword.trim()}

Desde tu celular podrás consultar tu plan alimentario, recetas, registrar tus vasos de agua y comidas del día.`;

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    showToast('Credenciales Copiadas', 'Mensaje listo para pegar en WhatsApp o correo.', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const phone = patient.whatsapp || patient.phone;
    if (!phone) {
      handleCopyCredentials();
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    showToast('Abriendo WhatsApp', 'Enviando mensaje con credenciales al paciente.', 'info');
  };

  const handleLaunchPortal = () => {
    storageService.setActivePortalPatientId(patient.id);
    showToast('Sesión de Paciente Activada', `Ingresando al portal como ${patient.firstName}...`, 'success');
    onClose();
    if (onOpenPortal) {
      onOpenPortal(patient.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Credenciales & Acceso a la App del Paciente"
      maxWidth="lg"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-200 text-xs">
        {/* Patient Header Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={
                patient.photoUrl ||
                (patient.gender === 'F'
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200')
              }
              alt={patient.firstName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-400/30 shrink-0"
            />
            <div>
              <h4 className="font-bold text-sm text-white">
                {patient.firstName} {patient.lastName}
              </h4>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">
                {patient.email || patient.phone || 'Paciente registrado'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                portalAccessEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              }`}
            >
              {portalAccessEnabled ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Acceso Activo</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>Deshabilitado</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Access Toggle */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                Permitir que el paciente inicie sesión en su App
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Al desactivar, el paciente no podrá acceder a su portal con estas credenciales.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={portalAccessEnabled}
              onChange={(e) => setPortalAccessEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Credentials Form */}
        {portalAccessEnabled && (
          <div className="space-y-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Username / Login Email */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Usuario / Correo de Inicio de Sesión:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={portalUsername}
                  onChange={(e) => setPortalUsername(e.target.value)}
                  placeholder="ej. ana.garcia@gmail.com o anita123"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                {patient.email && portalUsername !== patient.email && (
                  <button
                    type="button"
                    onClick={() => setPortalUsername(patient.email || '')}
                    className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                    title="Usar correo del expediente"
                  >
                    Usar Correo
                  </button>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Contraseña Asignada:
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>🎲 Generar Automática</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="Contraseña del paciente"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold tracking-wide focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Presets & Quick Set */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">Sugerencias rápidas:</span>
                {PASSWORD_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setPortalPassword(preset);
                      showToast('Contraseña Seleccionada', `Se asignó ${preset}`, 'info');
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                      portalPassword === preset
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setPortalPassword('Nutri2026!');
                    showToast('Restablecida', 'Contraseña por defecto Nutri2026! establecida.', 'info');
                  }}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Restablecer Base
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-1">
                Puedes ver, modificar o generar una nueva contraseña en cualquier momento si el paciente la olvida o requiere un cambio de acceso.
              </p>
            </div>

            {/* How patient logs in info box */}
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>¿Cómo inicia sesión el paciente en su App?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                El paciente abre la app o portal e introduce su <strong>Usuario ({portalUsername || patient.email || 'correo'})</strong>, o directamente su <strong>correo electrónico</strong> o su <strong>teléfono</strong> registrado, junto con la contraseña asignada aquí (<strong>{portalPassword}</strong>).
              </p>
            </div>

            {/* Share & Quick Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{isCopied ? '¡Copiado!' : 'Copiar Acceso'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-emerald-300 dark:border-emerald-800 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleLaunchPortal}
                className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-teal-300 dark:border-teal-800 transition-colors"
                title="Abrir el portal del paciente como si fueras él para probar su experiencia"
              >
                <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                <span>Probar Portal de este Paciente</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/20 cursor-pointer transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </Modal>
  );
};
