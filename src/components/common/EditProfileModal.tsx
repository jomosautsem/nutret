import React, { useState, useEffect } from 'react';
import {
  User,
  Award,
  FileBadge,
  Mail,
  Phone,
  Camera,
  Sparkles,
  Save,
  Check,
  Stethoscope,
} from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from './Toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [professionalTitle, setProfessionalTitle] = useState(currentUser.professionalTitle || '');
  const [licenseNumber, setLicenseNumber] = useState(currentUser.licenseNumber || '');
  const [specialtiesText, setSpecialtiesText] = useState((currentUser.specialties || []).join(', '));
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [bio, setBio] = useState(currentUser.bio || '');

  // Keep state in sync whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setProfessionalTitle(currentUser.professionalTitle || 'Nutrióloga Clínica');
      setLicenseNumber(currentUser.licenseNumber || '');
      setSpecialtiesText((currentUser.specialties || []).join(', '));
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setBio(currentUser.bio || '');
    }
  }, [isOpen, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      showToast('Campo Obligatorio', 'El nombre del nutriólogo no puede estar vacío.', 'error');
      return;
    }

    const specialties = specialtiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedUser = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      professionalTitle: professionalTitle.trim() || 'Nutriólogo(a) Clínico(a)',
      licenseNumber: licenseNumber.trim(),
      specialties: specialties.length > 0 ? specialties : ['Nutrición Clínica'],
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: phone.trim(),
      avatarUrl: avatarUrl.trim() || PRESET_AVATARS[0].url,
      bio: bio.trim(),
    };

    updateCurrentUser(updatedUser);

    showToast(
      'Nombre y Perfil Guardados en Base de Datos',
      `El especialista "${professionalTitle} ${firstName.trim()} ${lastName.trim()}" ha sido actualizado exitosamente en la base de datos y se refleja en todo el sistema y PDFs.`,
      'success'
    );
    onClose();
  };

  return (
    <Modal
      id="edit-nutritionist-profile-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Nombre y Datos del Nutriólogo"
      subtitle="Personaliza el nombre del especialista, grado académico, cédula y fotografía para el sistema, recetas y PDFs."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar & Quick Preview Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/60">
          <div className="relative group shrink-0">
            <img
              src={avatarUrl || PRESET_AVATARS[0].url}
              alt="Avatar Nutriólogo"
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-500/20 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-lg shadow-sm">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Previsualización en Recetas y PDFs</span>
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {professionalTitle || 'Nutriólogo(a)'} {firstName || 'Nombre'} {lastName || 'Apellido'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {licenseNumber ? `Cédula Profesional: ${licenseNumber}` : 'Sin cédula asignada'} • {email || 'contacto@clinica.com'}
            </div>
          </div>
        </div>

        {/* Preset Avatars Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Seleccionar Avatar Rápido o Personalizado
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
            placeholder="O escribe la URL de tu fotografía (https://...)"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
          />
        </div>

        {/* Form Fields: Name & Professional Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nombre(s) del Nutriólogo *</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej. María, Roberto, Andrea..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Correo Electrónico de Consulta</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@nutriluz.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Teléfono / WhatsApp Directo</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55 4920 1823"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Especialidades (separadas por coma)</span>
            </label>
            <input
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              placeholder="Nutrición Clínica, Nutrición Deportiva, Recomposición Corporal, Diabetes"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Semblanza / Bio Profesional
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe brevemente tu enfoque clínico, certificaciones y metodología de consulta..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios de Nutriólogo</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
