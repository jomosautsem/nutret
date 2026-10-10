import React, { useState } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Phone,
  FileText,
  UserPlus,
  Scale,
  Utensils,
  Bot,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { RiskBadge } from '../../components/common/RiskBadge';
import { storageService } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { currentUser, organization } = useAuth();
  const patients = storageService.getPatients();
  const appointments = storageService.getAppointments();
  const payments = storageService.getPayments();

  // Metrics
  const activePatients = patients.filter((p) => p.status === 'Activo').length;
  const highRiskPatients = patients.filter((p) => p.riskLevel === 'HIGH_RISK');
  const mediumRiskPatients = patients.filter((p) => p.riskLevel === 'MEDIUM_RISK');
  const todayAppointments = appointments.filter((a) => a.status === 'CONFIRMADA' || a.status === 'PENDIENTE');
  
  const totalMonthlyRevenue = payments
    .filter((p) => p.status === 'PAGADO')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments
    .filter((p) => p.status === 'PENDIENTE')
    .reduce((sum, p) => sum + p.amount, 0);

  const avgAdherence = Math.round(
    patients.reduce((sum, p) => sum + p.adherenceRate, 0) / (patients.length || 1)
  );

  // Chart data
  const patientEvolutionData = [
    { month: 'Mar', pacientes: 6, consultas: 14, ingresos: 11200 },
    { month: 'Abr', pacientes: 8, consultas: 19, ingresos: 15200 },
    { month: 'May', pacientes: 10, consultas: 24, ingresos: 19500 },
    { month: 'Jun', pacientes: 12, consultas: 29, ingresos: 23800 },
    { month: 'Jul', pacientes: 14, consultas: 33, ingresos: 27200 },
    { month: 'Ago', pacientes: 18, consultas: 38, ingresos: 31400 },
  ];

  return (
    <div id="dashboard-view" className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NutriCopilot AI Activo & Sincronizado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hola, {currentUser.professionalTitle} {currentUser.firstName} 👋
          </h1>
          <p className="mt-1 text-emerald-100 text-sm max-w-xl">
            Tienes <strong className="text-white">{todayAppointments.length} consultas</strong> agendadas hoy y{' '}
            <strong className="text-white">{highRiskPatients.length + mediumRiskPatients.length} pacientes</strong> que requieren atención prioritaria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            id="dash-quick-patient-btn"
            onClick={() => onNavigate('patients')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Paciente</span>
          </button>

          <button
            id="dash-quick-copilot-btn"
            onClick={() => onNavigate('nutricopilot')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-950 text-white font-semibold text-xs border border-emerald-400/30 backdrop-blur-md transition-all"
          >
            <Bot className="w-4 h-4 text-emerald-300" />
            <span>NutriCopilot AI</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="kpi-active-patients"
          title="Pacientes Activos"
          value={activePatients}
          subtitle="Total en seguimiento clínico"
          icon={Users}
          trend={{ value: '+14% este mes', isPositive: true }}
          accentColor="emerald"
        />
        <StatCard
          id="kpi-today-consultations"
          title="Consultas de Hoy"
          value={todayAppointments.length}
          subtitle="Próxima a las 10:00 hrs"
          icon={Calendar}
          accentColor="blue"
        />
        <StatCard
          id="kpi-avg-adherence"
          title="Adherencia Promedio"
          value={`${avgAdherence}%`}
          subtitle="Basado en registros de comida/agua"
          icon={TrendingUp}
          trend={{ value: '+3.2%', isPositive: true }}
          accentColor="purple"
        />
        <StatCard
          id="kpi-monthly-revenue"
          title="Ingresos del Mes (MXN)"
          value={`$${totalMonthlyRevenue.toLocaleString('es-MX')}`}
          subtitle={`$${pendingPayments.toLocaleString('es-MX')} pendientes`}
          icon={DollarSign}
          trend={{ value: '+18%', isPositive: true }}
          accentColor="amber"
        />
      </div>

      {/* Attention Required / Pacientes en Riesgo Section */}
      {(highRiskPatients.length > 0 || mediumRiskPatients.length > 0) && (
        <div id="attention-required-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Atención Requerida (Pacientes en Riesgo)
                </h2>
                <p className="text-xs text-slate-500">
                  Algoritmo inteligente de detección de abandono o baja adherencia
                </p>
              </div>
            </div>
            <button
              id="view-all-patients-risk-btn"
              onClick={() => onNavigate('patients')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...highRiskPatients, ...mediumRiskPatients].slice(0, 4).map((p) => (
              <div
                key={p.id}
                id={`risk-card-${p.id}`}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={p.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {p.firstName} {p.lastName}
                      </h4>
                      <RiskBadge level={p.riskLevel} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{p.goal}</p>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      {p.notes || 'Baja frecuencia de registros en los últimos 7 días.'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    id={`open-patient-${p.id}`}
                    onClick={() => onNavigate('patient_detail', p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Expediente
                  </button>
                  {p.whatsapp && (
                    <a
                      href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(p.firstName)},%20te%20escribo%20de%20la%20cl%C3%ADnica%20NutriLuz%20para%20darle%20seguimiento%20a%20tu%20plan%20nutricional.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Phone className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics & Today Consultations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evolution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Evolución de Consultas e Ingresos
              </h2>
              <p className="text-xs text-slate-500">Crecimiento clínico en los últimos 6 meses (MXN)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Sucursal Activa
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patientEvolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos ($ MXN)" />
                <Area type="monotone" dataKey="consultas" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorConsultas)" name="Consultas Totales" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Today's Appointments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Agenda de Hoy</h3>
              </div>
              <button
                id="view-full-agenda-btn"
                onClick={() => onNavigate('agenda')}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Ver Agenda
              </button>
            </div>

            <div className="space-y-3">
              {todayAppointments.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  id={`today-app-${app.id}`}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{app.patientName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {app.appointmentType}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs</span>
                    <span>• {app.price} {app.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Consultation Prep AI Trigger */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 font-bold text-xs text-emerald-900 dark:text-emerald-200">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>Preparar Consulta con IA</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
              NutriCopilot analiza automáticamente peso, adherencia y laboratorios para la sesión.
            </p>
            <button
              id="dash-ai-prep-trigger-btn"
              onClick={() => onNavigate('nutricopilot')}
              className="mt-3 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar Resumen Clínico</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
