import React from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  Award,
  Target,
  Download,
  Flame,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { storageService } from '../../lib/storage';

export const ReportsView: React.FC = () => {
  const patients = storageService.getPatients();

  const clinicalEvolutionData = [
    { month: 'Ene', pesoPromedio: 76.5, adherencia: 78, consultas: 42 },
    { month: 'Feb', pesoPromedio: 75.8, adherencia: 81, consultas: 48 },
    { month: 'Mar', pesoPromedio: 75.1, adherencia: 84, consultas: 56 },
    { month: 'Abr', pesoPromedio: 74.4, adherencia: 83, consultas: 64 },
    { month: 'May', pesoPromedio: 73.8, adherencia: 87, consultas: 72 },
    { month: 'Jun', pesoPromedio: 73.2, adherencia: 89, consultas: 85 },
  ];

  const goalsDistribution = [
    { name: 'Pérdida de Grasa', value: 45, color: '#10b981' },
    { name: 'Recomposición / Hipertrofia', value: 25, color: '#3b82f6' },
    { name: 'Control Metabólico / Diabetes', value: 20, color: '#f59e0b' },
    { name: 'Nutrición Deportiva', value: 10, color: '#8b5cf6' },
  ];

  return (
    <div id="reports-view" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Reportes & Analítica Clínica</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas de adherencia de pacientes, éxito en reducción de peso/grasa y rendimiento de consulta
          </p>
        </div>

        <button
          onClick={() => alert('Exportando informe epidemiológico y financiero en formato CSV / Excel...')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Exportar Informe CSV</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Adherencia Global</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">87.4%</div>
          <span className="text-[11px] text-emerald-600 font-semibold">+4.2% vs mes anterior</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Pérdida de Grasa Promedio</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">-3.3 kg</div>
          <span className="text-[11px] text-slate-500">Por paciente en 60 días</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Tasa de Retención</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">92.8%</div>
          <span className="text-[11px] text-slate-500">Pacientes con cita activa</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Consultas Atendidas</span>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">367</div>
          <span className="text-[11px] text-purple-600 font-semibold">Semestre en curso</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adherencia y Peso Promedio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Evolución de Adherencia Clínica (%)
            </h3>
            <span className="text-xs font-semibold text-emerald-600">Tendencia Positiva</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={clinicalEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[60, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="adherencia"
                  name="Adherencia %"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Objetivos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Distribución de Motivos de Consulta
          </h3>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={goalsDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {goalsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {goalsDistribution.map((g) => (
              <div key={g.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {g.name} ({g.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
