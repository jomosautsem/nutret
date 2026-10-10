import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  ShieldCheck,
  Star,
  CheckCircle2,
  Phone,
  Sparkles,
  ArrowRight,
  Heart,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { EditProfileModal } from '../../components/common/EditProfileModal';

export const PublicProfileView: React.FC = () => {
  const { currentUser, organization, isNutriologo } = useAuth();
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('PRIMERA_VEZ');
  const [selectedDate, setSelectedDate] = useState('2026-08-18');
  const [selectedTime, setSelectedTime] = useState('10:00');

  // Booking Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [booked, setBooked] = useState(false);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBooked(true);
    showToast('¡Cita Solicitada con Éxito!', 'Te enviaremos los detalles y confirmación por WhatsApp.', 'success');
  };

  const specialistName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : 'Dra. Valeria Montesinos';

  return (
    <div id="public-profile-view" className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Top Specialist Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
        {isNutriologo && (
          <button
            id="public-profile-edit-trigger"
            onClick={() => setIsEditModalOpen(true)}
            className="sm:absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Datos de Nutriólogo</span>
          </button>
        )}

        <img
          src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1594824813683-023a85b9e075?w=400&auto=format&fit=crop&q=80'}
          alt={specialistName}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-emerald-500/20 shadow-md"
        />

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {currentUser?.professionalTitle || 'Nutrióloga Clínica Certificada'}
              {currentUser?.licenseNumber ? ` • Céd. Prof. ${currentUser.licenseNumber}` : ''}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {specialistName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            {currentUser?.bio ||
              'Especialista en Nutrición Deportiva, Recomposición Corporal y Manejo Metabólico. Enfoque 100% personalizado basado en ciencia y cálculo de porciones SMAE, sin dietas restrictivas ni rebotes.'}
          </p>

          {currentUser?.specialties && currentUser.specialties.length > 0 && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              {currentUser.specialties.map((spec, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              4.9 (128 reseñas de pacientes)
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-slate-400" />
              {organization?.address || 'Polanco & Modalidad Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Form Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reserva tu Consulta Nutricional</h2>
          <p className="text-xs text-slate-500">Selecciona el tipo de consulta, fecha y horario de tu preferencia.</p>
        </div>

        {booked ? (
          <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-200">¡Cita Registrada!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Muchas gracias, <strong>{name}</strong>. Hemos enviado un mensaje de confirmación a tu WhatsApp <strong>{phone}</strong> con la liga de acceso y formulario previo de salud.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBook} className="space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                1. Selecciona el Tipo de Sesión
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'PRIMERA_VEZ', title: 'Consulta Primera Vez', price: '$850 MXN', desc: 'Evaluación integral + Antropometría + Plan SMAE' },
                  { id: 'SEGUIMIENTO', title: 'Consulta de Seguimiento', price: '$650 MXN', desc: 'Revisión de avances, ajustes de macros y menú' },
                  { id: 'ONLINE', title: 'Consulta Online / Videollamada', price: '$750 MXN', desc: 'Atención a distancia desde cualquier país' },
                ].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedService === s.id
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{s.title}</span>
                    </div>
                    <div className="font-extrabold text-sm text-emerald-600 mt-1">{s.price}</div>
                    <p className="text-[11px] text-slate-500 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  2. Fecha
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  3. Horario Disponible
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  <option value="09:00">09:00 hrs</option>
                  <option value="10:00">10:00 hrs</option>
                  <option value="11:30">11:30 hrs</option>
                  <option value="16:00">16:00 hrs</option>
                  <option value="17:30">17:30 hrs</option>
                </select>
              </div>
            </div>

            {/* Patient Info */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                4. Tus Datos de Contacto
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Tu Nombre Completo *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="email"
                  required
                  placeholder="Correo Electrónico *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp con Lada *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <textarea
                rows={2}
                placeholder="¿Tienes algún objetivo específico o diagnóstico médico previo?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirmar y Agendar Consulta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
