import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Phone,
  Mail,
  ChevronRight,
  UserPlus,
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  FileSpreadsheet,
  ShieldCheck,
  FileCheck,
  TrendingUp,
  Activity,
  ArrowUpDown,
  MoreVertical,
  KeyRound,
} from 'lucide-react';
import { Patient, RiskLevel, PatientStatus } from '../../types';
import { storageService } from '../../lib/storage';
import { RiskBadge } from '../../components/common/RiskBadge';
import { useToast } from '../../components/common/Toast';
import { PatientFormModal } from './PatientFormModal';
import { DeletePatientModal } from './DeletePatientModal';
import { PatientCredentialsModal } from './PatientCredentialsModal';

interface PatientsListViewProps {
  onSelectPatient: (patientId: string) => void;
  onNavigate?: (tab: string) => void;
}

export const PatientsListView: React.FC<PatientsListViewProps> = ({ onSelectPatient, onNavigate }) => {
  const [patients, setPatients] = useState<Patient[]>(() => storageService.getPatients());
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'adherence' | 'weight'>('recent');

  // Modal states for CRUD
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [patientForCredentials, setPatientForCredentials] = useState<Patient | null>(null);

  const { showToast } = useToast();

  const handleOpenCredentialsModal = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setPatientForCredentials(patient);
    setIsCredentialsModalOpen(true);
  };

  // Keep patients list synchronized with localStorage / DB events
  const refreshPatients = () => {
    setPatients(storageService.getPatients());
  };

  useEffect(() => {
    refreshPatients();

    const handleUpdate = () => {
      refreshPatients();
    };

    window.addEventListener('nutriluz:db_updated', handleUpdate);
    window.addEventListener('nutriluz:patient_deleted', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Cross-tab and multi-window live sync channel
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('nutriluz_sync_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'patient_deleted' || event.data?.type === 'db_updated') {
            refreshPatients();
          }
        };
      } catch {}
    }

    return () => {
      window.removeEventListener('nutriluz:db_updated', handleUpdate);
      window.removeEventListener('nutriluz:patient_deleted', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (bc) bc.close();
    };
  }, []);

  // Filter and Sort Logic
  const filtered = patients
    .filter((p) => {
      const matchSearch =
        `${p.firstName} ${p.lastName} ${p.email || ''} ${p.goal} ${p.phone || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchRisk = filterRisk === 'ALL' || p.riskLevel === filterRisk;
      const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
      return matchSearch && matchRisk && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.firstName.localeCompare(b.firstName);
      }
      if (sortBy === 'adherence') {
        return (b.adherenceRate || 0) - (a.adherenceRate || 0);
      }
      if (sortBy === 'weight') {
        return (b.currentWeight || 0) - (a.currentWeight || 0);
      }
      // 'recent' by default
      return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
    });

  // Calculate Quick Stats
  const totalCount = patients.length;
  const activeCount = patients.filter((p) => p.status === 'Activo').length;
  const avgAdherence = totalCount > 0
    ? Math.round(patients.reduce((acc, p) => acc + (p.adherenceRate || 85), 0) / totalCount)
    : 0;
  const highRiskCount = patients.filter((p) => p.riskLevel === 'HIGH_RISK').length;

  const handleOpenCreateModal = () => {
    setPatientToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (p: Patient, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPatientToEdit(p);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (p: Patient, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPatientToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = 'ID,Nombre,Apellidos,Email,Telefono,WhatsApp,Sexo,Objetivo,PesoActual,Estatura,Adherencia,Estado,Riesgo\n';
    const rows = patients
      .map(
        (p) =>
          `"${p.id}","${p.firstName}","${p.lastName}","${p.email || ''}","${p.phone || ''}","${p.whatsapp || ''}","${p.gender}","${p.goal}",${p.currentWeight},${p.height},${p.adherenceRate},"${p.status}","${p.riskLevel}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pacientes_NutriLuz_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exportación completada', 'Lista de pacientes descargada en formato CSV', 'success');
  };

  return (
    <div id="patients-view" className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Directorio de Pacientes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión integral de expedientes clínicos, creación, edición, métricas antropométricas y seguimiento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-patients-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            id="new-patient-main-btn"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Expedientes</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalCount}</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Pacientes en sistema</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Activos en Consulta</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">En plan nutricional</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Adherencia Promedio</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{avgAdherence}%</div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Cumplimiento dietético</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Atención Prioritaria</span>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{highRiskCount}</div>
          <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">Alto riesgo clínico</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="patient-search-input"
            type="text"
            placeholder="Buscar por nombre, email, teléfono u objetivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Risk Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="filter-risk-select"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium"
            >
              <option value="ALL">Todos los riesgos</option>
              <option value="NORMAL">🟢 Normal</option>
              <option value="MEDIUM_RISK">🟡 Riesgo Medio</option>
              <option value="HIGH_RISK">🔴 Alto Riesgo</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            id="filter-status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium"
          >
            <option value="ALL">Todos los estados</option>
            <option value="Activo">🟢 Activos</option>
            <option value="En pausa">🟡 En pausa</option>
            <option value="Inactivo">⚪ Inactivos</option>
            <option value="Alta">✨ Alta médica</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="sort-patients-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium"
            >
              <option value="recent">Más recientes</option>
              <option value="name">Nombre (A-Z)</option>
              <option value="adherence">Mayor adherencia</option>
              <option value="weight">Mayor peso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Paciente</th>
                <th className="py-3.5 px-4">Objetivo Clínico</th>
                <th className="py-3.5 px-4">Somatometría & IMC</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Adherencia</th>
                <th className="py-3.5 px-4 text-center">Nivel de Riesgo</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No se encontraron pacientes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const hM = p.height && p.height > 0 ? p.height / 100 : 1.65;
                  const imc = (p.currentWeight / (hM * hM)).toFixed(1);

                  return (
                    <tr
                      key={p.id}
                      id={`patient-row-${p.id}`}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectPatient(p.id)}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.photoUrl ||
                              (p.gender === 'F'
                                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100')
                            }
                            alt=""
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0 shadow-xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {p.firstName} {p.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{p.email || 'Sin correo'}</span>
                              {p.phone && <span>• {p.phone}</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <button
                                type="button"
                                id={`credentials-badge-${p.id}`}
                                onClick={(e) => handleOpenCredentialsModal(p, e)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                                  p.portalAccessEnabled !== false
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40'
                                }`}
                                title="Ver y modificar credenciales para el inicio de sesión del paciente"
                              >
                                <KeyRound className="w-2.5 h-2.5" />
                                <span>Pass: <strong className="font-mono">{p.portalPassword || 'Nutri2026!'}</strong></span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        <div className="truncate max-w-[220px]" title={p.goal}>
                          {p.goal}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {p.currentWeight} kg
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.height} cm • IMC: <strong>{imc}</strong>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            p.status === 'Activo'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : p.status === 'En pausa'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : p.status === 'Alta'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {p.status || 'Activo'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-14 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${p.adherenceRate || 90}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {p.adherenceRate || 90}%
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <RiskBadge level={p.riskLevel} />
                      </td>

                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Credenciales y Contraseña (CRUD) */}
                          <button
                            id={`credentials-patient-btn-${p.id}`}
                            onClick={(e) => handleOpenCredentialsModal(p, e)}
                            className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Gestionar Credenciales y Contraseña del Portal (CRUD)"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Editar Paciente */}
                          <button
                            id={`edit-patient-btn-${p.id}`}
                            onClick={(e) => handleOpenEditModal(p, e)}
                            className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar datos del paciente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Eliminar Paciente */}
                          <button
                            id={`delete-patient-btn-${p.id}`}
                            onClick={(e) => handleOpenDeleteModal(p, e)}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar paciente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Ver Expediente */}
                          <button
                            id={`view-patient-detail-btn-${p.id}`}
                            onClick={() => onSelectPatient(p.id)}
                            className="p-2 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                            title="Abrir expediente completo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Form Modal (Create / Edit) */}
      <PatientFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        patientToEdit={patientToEdit}
        onSuccess={(saved) => {
          refreshPatients();
          if (!patientToEdit) {
            onSelectPatient(saved.id);
          }
        }}
      />

      {/* Patient Delete Confirmation Modal */}
      <DeletePatientModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        patient={patientToDelete}
        onDeleted={() => {
          refreshPatients();
        }}
      />

      {/* Patient Credentials Modal (View & Modify CRUD) */}
      {patientForCredentials && (
        <PatientCredentialsModal
          isOpen={isCredentialsModalOpen}
          onClose={() => {
            setIsCredentialsModalOpen(false);
            setPatientForCredentials(null);
          }}
          patient={patientForCredentials}
          onSuccess={(updated) => {
            refreshPatients();
          }}
          onOpenPortal={(patientId) => {
            onNavigate?.('patient_portal');
          }}
        />
      )}
    </div>
  );
};
