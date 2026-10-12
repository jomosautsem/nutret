import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Users,
} from 'lucide-react';
import { Payment } from '../../types';
import { storageService } from '../../lib/storage';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>(() => storageService.getPayments());
  const patients = storageService.getPatients();
  const { showToast } = useToast();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || '',
    concept: 'Consulta de Seguimiento + Plan Nutricional',
    amount: 650,
    paymentMethod: 'TRANSFERENCIA' as 'STRIPE' | 'MERCADOPAGO' | 'TRANSFERENCIA' | 'EFECTIVO' | 'TERMINAL',
    status: 'PAGADO' as 'PAGADO' | 'PENDIENTE' | 'REEMBOLSADO',
  });

  const activePatientIds = useMemo(() => new Set(patients.map((p) => p.id)), [patients]);

  // Filter out any payments for deleted patients or orphaned records
  const validPayments = useMemo(() => {
    return payments.filter((p) => activePatientIds.has(p.patientId));
  }, [payments, activePatientIds]);

  const totalCollected = validPayments
    .filter((p) => p.status === 'PAGADO')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = validPayments
    .filter((p) => p.status === 'PENDIENTE')
    .reduce((sum, p) => sum + p.amount, 0);

  const paidCount = validPayments.filter((p) => p.status === 'PAGADO').length;
  const avgTicket = paidCount > 0 ? Math.round(totalCollected / paidCount) : 0;

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      showToast('Atención', 'Selecciona un paciente para registrar el cobro', 'info');
      return;
    }
    const patient = patients.find((p) => p.id === formData.patientId) || patients[0];
    if (!patient) return;

    const newPay: Payment = {
      id: `pay-${Date.now()}`,
      organizationId: 'org-nutriluz-mexico',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      concept: formData.concept,
      amount: Number(formData.amount),
      currency: 'MXN',
      status: formData.status,
      paymentMethod: formData.paymentMethod,
      paidAt: new Date().toISOString(),
    };

    const updated = [newPay, ...payments];
    setPayments(updated);
    storageService.savePayment(newPay);
    setIsNewModalOpen(false);
    showToast('Cobro Registrado', `Transacción de $${newPay.amount} MXN registrada para ${newPay.patientName}`, 'success');
  };

  const handleDeletePayment = (paymentId: string) => {
    const updated = payments.filter((p) => p.id !== paymentId);
    setPayments(updated);
    storageService.savePayments(updated);
    showToast('Cobro Eliminado', 'El registro de pago ha sido eliminado.', 'info');
  };

  return (
    <div id="payments-view" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Finanzas, Pagos & Facturación</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de ingresos, cobros pendientes, enlaces de pago en línea y paquetes nutricionales
          </p>
        </div>

        <button
          id="new-payment-btn"
          onClick={() => {
            if (patients.length === 0) {
              showToast('Sin Pacientes', 'Registra al menos un paciente para poder crear cobros.', 'info');
              return;
            }
            if (!formData.patientId && patients[0]) {
              setFormData((prev) => ({ ...prev, patientId: patients[0].id }));
            }
            setIsNewModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Cobro</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Ingresos Cobrados</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalCollected.toLocaleString('es-MX')} MXN
          </div>
          <span className="text-[11px] text-slate-500">Total acumulado en el periodo</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Cobros Pendientes</span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            ${totalPending.toLocaleString('es-MX')} MXN
          </div>
          <span className="text-[11px] text-slate-500">Por liquidar en próximas consultas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Ticket Promedio</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            ${avgTicket.toLocaleString('es-MX')} MXN
          </div>
          <span className="text-[11px] text-slate-500">Por consulta o paquete</span>
        </div>
      </div>

      {/* Payments List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Paciente</th>
                <th className="py-3.5 px-4">Concepto</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Monto</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {validPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Receipt className="w-10 h-10 stroke-[1.5]" />
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                        No hay cobros ni transacciones registradas aún
                      </p>
                      <p className="text-[11px] max-w-sm">
                        Los pagos de consultas, paquetes o transferencias registrados aparecerán aquí con su historial y estado.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                validPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">{p.patientName}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-200">{p.concept}</td>
                    <td className="py-3.5 px-4">{p.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(p.paidAt || (p as any).createdAt || new Date()).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'PAGADO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                      ${p.amount.toLocaleString('es-MX')} {p.currency}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(p.id)}
                        title="Eliminar cobro"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Payment Modal */}
      <Modal
        id="new-payment-modal"
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Registrar Nuevo Cobro"
        subtitle="Registra una transacción o genera un enlace de pago digital"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
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

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Concepto del Cobro
            </label>
            <input
              type="text"
              required
              value={formData.concept}
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monto ($ MXN)
              </label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Método de Pago
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value="TRANSFERENCIA">Transferencia SPEI</option>
                <option value="STRIPE">Tarjeta (Stripe)</option>
                <option value="MERCADOPAGO">Mercado Pago</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TERMINAL">Terminal Bancaria</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
            >
              Guardar Cobro
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
