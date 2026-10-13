import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Phone,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Edit3,
  Building2,
} from 'lucide-react';
import { Appointment, AppointmentType, Branch } from '../../types';
import { storageService } from '../../lib/storage';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

export const AgendaView: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => storageService.getAppointments());
  const patients = storageService.getPatients();
  const branches = storageService.getBranches();
  const { showToast } = useToast();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setAppointments(storageService.getAppointments());
    };
    window.addEventListener('nutriluz_appointment_updated', handleSync);
    window.addEventListener('nutriluz:db_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('nutriluz_appointment_updated', handleSync);
      window.removeEventListener('nutriluz:db_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const activeClinicalId = storageService.getActiveClinicalPatientId();
  const initialPatientId = (activeClinicalId && patients.some((p) => p.id === activeClinicalId))
    ? activeClinicalId
    : (patients[0]?.id || '');

  const defaultBranchId = branches[0]?.id || 'branch-cdmx-sur';

  // Appointment Form
  const [formData, setFormData] = useState({
    patientId: initialPatientId,
    appointmentType: 'SEGUIMIENTO' as AppointmentType,
    branchId: defaultBranchId,
    customLocation: '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    durationMinutes: 45,
    price: 650,
    clinicalNotes: 'Evaluación de adherencia al plan y revisión antropométrica',
  });

  const handleOpenNewModal = () => {
    setEditingAppointmentId(null);
    setFormData({
      patientId: initialPatientId,
      appointmentType: 'SEGUIMIENTO',
      branchId: defaultBranchId,
      customLocation: '',
      date: new Date().toISOString().slice(0, 10),
      time: '10:00',
      durationMinutes: 45,
      price: 650,
      clinicalNotes: 'Evaluación de adherencia al plan y revisión antropométrica',
    });
    setIsNewModalOpen(true);
  };

  const handleOpenEditModal = (app: Appointment) => {
    setEditingAppointmentId(app.id);
    const datePart = app.startTime ? app.startTime.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const timePart = app.startTime && app.startTime.length >= 16 ? app.startTime.slice(11, 16) : '10:00';
    let duration = 45;
    if (app.startTime && app.endTime) {
      const diffMs = new Date(app.endTime).getTime() - new Date(app.startTime).getTime();
      if (diffMs > 0) duration = Math.round(diffMs / 60000);
    }

    setFormData({
      patientId: app.patientId || initialPatientId,
      appointmentType: app.appointmentType || 'SEGUIMIENTO',
      branchId: app.branchId || defaultBranchId,
      customLocation: app.locationNotes || '',
      date: datePart,
      time: timePart,
      durationMinutes: duration,
      price: app.price || 650,
      clinicalNotes: app.consultationSummary || '',
    });
    setIsNewModalOpen(true);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === formData.patientId) || patients[0];
    const startTime = `${formData.date}T${formData.time}:00`;
    const startObj = new Date(startTime);
    const endObj = new Date(startObj.getTime() + formData.durationMinutes * 60000);

    const org = storageService.getOrganization();
    const currUser = storageService.getCurrentUser();

    // Determine location name based on branch or online
    const selectedBranch = branches.find((b) => b.id === formData.branchId);
    let resolvedLocation = selectedBranch ? selectedBranch.name : 'Sucursal Polanco (Consultorio 302)';
    if (formData.appointmentType === 'ONLINE') {
      resolvedLocation = 'Videoconsulta Online (Google Meet / Zoom)';
    } else if (formData.customLocation && formData.customLocation.trim()) {
      resolvedLocation = formData.customLocation.trim();
    }

    if (editingAppointmentId) {
      // Editing existing appointment
      const existing = appointments.find((a) => a.id === editingAppointmentId);
      const updatedApp: Appointment = {
        ...(existing || {}),
        id: editingAppointmentId,
        organizationId: org?.id || existing?.organizationId || 'org-nutriluz-mexico',
        branchId: formData.branchId,
        patientId: patient?.id || existing?.patientId || 'pat-demo',
        patientName: patient ? `${patient.firstName} ${patient.lastName}`.trim() : (existing?.patientName || 'Paciente General'),
        specialistId: currUser?.id || existing?.specialistId || 'user-lic-luz-elena',
        appointmentType: formData.appointmentType,
        startTime: startTime,
        endTime: endObj.toISOString(),
        status: existing?.status || 'CONFIRMADA',
        price: formData.price,
        currency: 'MXN',
        locationNotes: resolvedLocation,
        consultationSummary: formData.clinicalNotes,
      };

      const updated = appointments.map((a) => (a.id === editingAppointmentId ? updatedApp : a));
      setAppointments(updated);
      storageService.saveAppointment(updatedApp);
      setIsNewModalOpen(false);
      setEditingAppointmentId(null);
      showToast('Consulta Actualizada', `Cita y sucursal para ${updatedApp.patientName} modificadas con éxito.`, 'success');
      return;
    }

    // Creating new appointment
    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      organizationId: org?.id || 'org-nutriluz-mexico',
      branchId: formData.branchId,
      patientId: patient?.id || 'pat-demo',
      patientName: patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'Paciente General',
      specialistId: currUser?.id || 'user-lic-luz-elena',
      appointmentType: formData.appointmentType,
      startTime: startTime,
      endTime: endObj.toISOString(),
      status: 'CONFIRMADA',
      price: formData.price,
      currency: 'MXN',
      locationNotes: resolvedLocation,
      consultationSummary: formData.clinicalNotes,
    };

    const updated = [newApp, ...appointments];
    setAppointments(updated);
    storageService.saveAppointment(newApp);
    setIsNewModalOpen(false);
    showToast('Consulta Agendada', `Cita para ${newApp.patientName} registrada con éxito.`, 'success');
  };

  const updateStatus = (id: string, newStatus: any) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setAppointments(updated);
    storageService.saveAppointment(updated.find((a) => a.id === id)!);
    showToast('Estado Actualizado', `La consulta ha sido marcada como ${newStatus}`, 'info');
  };

  return (
    <div id="agenda-view" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Agenda & Citas Clínicas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Programación de consultas presenciales y online, recordatorios automáticos por WhatsApp y sincronización
          </p>
        </div>

        <button
          id="new-appointment-btn"
          onClick={handleOpenNewModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Consulta</span>
        </button>
      </div>

      {/* Appointment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((app) => {
          const branchObj = branches.find((b) => b.id === app.branchId);
          const locationDisplay =
            app.locationNotes ||
            (branchObj ? branchObj.name : 'Sucursal Polanco (Consultorio 302)');

          return (
            <div
              key={app.id}
              id={`agenda-card-${app.id}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {app.appointmentType}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(app)}
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar cita o sucursal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ${app.price} {app.currency}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{app.patientName}</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(app.startTime).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
                        • {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">{locationDisplay}</span>
                    </div>
                  </div>

                  {(app.consultationSummary || (app as any).clinicalNotes) && (
                    <p className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                      {app.consultationSummary || (app as any).clinicalNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ● {app.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(app)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Editar
                  </button>
                  {app.status === 'CONFIRMADA' && (
                    <button
                      onClick={() => updateStatus(app.id, 'COMPLETADA')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      Completar
                    </button>
                  )}
                  {app.status === 'CONFIRMADA' && (
                    <button
                      onClick={() => updateStatus(app.id, 'CANCELADA')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointment Modal (Create or Edit with Branch) */}
      <Modal
        id="new-appointment-modal"
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingAppointmentId(null);
        }}
        title={editingAppointmentId ? 'Editar Consulta / Sucursal' : 'Agendar Nueva Consulta'}
        subtitle={
          editingAppointmentId
            ? 'Modifica la fecha, horario o sucursal asignada a la consulta'
            : 'Programa una sesión presencial o virtual con selección de sucursal'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAppointment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paciente *
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Consulta
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => {
                  const newType = e.target.value as any;
                  const newBranch = newType === 'ONLINE' ? 'online' : formData.branchId;
                  setFormData({
                    ...formData,
                    appointmentType: newType,
                    branchId: newBranch,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value="PRIMERA_VEZ">Primera Vez (Evaluación Completa)</option>
                <option value="SEGUIMIENTO">Seguimiento / Control</option>
                <option value="REVISION_LABS">Revisión de Laboratorios</option>
                <option value="ONLINE">Consulta Online / Videollamada</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sucursal / Sede *</span>
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => {
                  const bId = e.target.value;
                  const b = branches.find((br) => br.id === bId);
                  setFormData({
                    ...formData,
                    branchId: bId,
                    customLocation: b ? b.name : (bId === 'online' ? 'Videoconsulta Online (Google Meet / Zoom)' : formData.customLocation),
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
                <option value="online">🌐 Videoconsulta Online (Google Meet / Zoom)</option>
                <option value="custom">📍 Otra Sede o Consultorio Personalizado...</option>
              </select>
            </div>
          </div>

          {formData.branchId === 'custom' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre / Dirección de la Sucursal Personalizada
              </label>
              <input
                type="text"
                placeholder="ej. Consultorio Ángeles Lomas, Sala 402"
                value={formData.customLocation}
                onChange={(e) => setFormData({ ...formData, customLocation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora Inicio
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duración (min)
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Precio (MXN)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo o Notas Clínicas
            </label>
            <textarea
              rows={2}
              value={formData.clinicalNotes}
              onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsNewModalOpen(false);
                setEditingAppointmentId(null);
              }}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
            >
              {editingAppointmentId ? 'Guardar Cambios' : 'Confirmar Cita'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
