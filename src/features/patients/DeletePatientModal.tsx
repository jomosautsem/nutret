import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Patient } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { storageService } from '../../lib/storage';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null | undefined;
  onDeleted?: (patientId: string) => void;
}

export const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onDeleted,
}) => {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!patient) return null;

  const associatedPlans = storageService.getPlansByPatientId(patient.id);
  const associatedAnthro = storageService.getAnthropometricsByPatientId(patient.id);
  const associatedAppts = storageService.getAppointmentsByPatientId(patient.id);

  const handleDelete = () => {
    setIsDeleting(true);
    try {
      const success = storageService.deletePatient(patient.id);
      if (success) {
        showToast(
          'Expediente eliminado',
          `El expediente y registros clínicos de ${patient.firstName} ${patient.lastName} han sido eliminados del sistema.`,
          'info'
        );
        if (onDeleted) {
          onDeleted(patient.id);
        }
        onClose();
      } else {
        showToast('Error', 'No se pudo eliminar el expediente del paciente.', 'error');
      }
    } catch (e) {
      showToast('Error al eliminar', 'Ocurrió un error inesperado al eliminar el paciente.', 'error');
    } finally {
      setIsDeleting(false);
      setConfirmText('');
    }
  };

  return (
    <Modal
      id="delete-patient-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Expediente de Paciente"
      subtitle={`Esta acción eliminará permanentemente a ${patient.firstName} ${patient.lastName}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
              ¿Estás seguro de eliminar este paciente?
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              Esta acción no se puede deshacer. Se eliminarán los datos personales, historial clínico y todos los registros asociados:
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-rose-800 dark:text-rose-300 font-medium">
              <li>• <strong>{associatedPlans.length}</strong> Planes nutricionales asignados</li>
              <li>• <strong>{associatedAnthro.length}</strong> Registros antropométricos & InBody</li>
              <li>• <strong>{associatedAppts.length}</strong> Citas y consultas agendadas</li>
            </ul>
          </div>
        </div>

        {/* Patient card preview */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <img
            src={patient.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt=""
            className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-300 dark:ring-rose-800 shrink-0"
          />
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-white">
              {patient.firstName} {patient.lastName}
            </div>
            <div className="text-[11px] text-slate-500">
              {patient.email} • {patient.goal}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            id="cancel-delete-patient-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="confirm-delete-patient-btn"
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-900/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar Paciente'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
