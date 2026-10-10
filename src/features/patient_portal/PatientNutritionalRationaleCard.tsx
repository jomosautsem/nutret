import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  Activity,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Info,
  Apple,
  Dumbbell,
} from 'lucide-react';
import { Patient, NutritionPlan, Appointment } from '../../types';

interface PatientNutritionalRationaleCardProps {
  patient: Patient;
  plan: NutritionPlan | null;
  appointments?: Appointment[];
  organizationName?: string;
  defaultExpanded?: boolean;
}

export const PatientNutritionalRationaleCard: React.FC<PatientNutritionalRationaleCardProps> = ({
  patient,
  plan,
  appointments = [],
  organizationName = 'Nutri Elena',
  defaultExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  // Fallback defaults if plan not yet assigned
  const targetKcal = plan?.targetCaloriesKcal || 2202;
  const proteinG = plan?.targetProteinG || 110;
  const carbsG = plan?.targetCarbsG || 319;
  const fatG = plan?.targetFatG || 54;
  const weightKg = patient.currentWeight || 70;
  const heightCm = patient.height || 165;
  const protPerKg = weightKg > 0 ? (proteinG / weightKg).toFixed(1) : '1.8';

  // Mifflin-St Jeor / Clinical Calculation identical to PDF generator
  const birthYear = patient.birthDate ? new Date(patient.birthDate).getFullYear() : 1995;
  const age = Math.max(15, new Date().getFullYear() - birthYear);
  const isFemale = patient.gender === 'F';
  const bmrEstimate = isFemale
    ? Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161)
    : Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);

  let getKcal = Math.round(bmrEstimate * 1.55);
  if (targetKcal >= 2800) {
    getKcal = Math.max(getKcal, targetKcal + 600);
  } else if (targetKcal >= 2000) {
    getKcal = Math.max(getKcal, targetKcal + 500);
  } else if (targetKcal <= getKcal - 300) {
    // Normal deficit range
  } else {
    getKcal = targetKcal + 400;
  }

  const diffKcal = targetKcal - getKcal;
  const isDeficit = diffKcal < 0;
  const patientFullName = `${patient.firstName} ${patient.lastName || ''}`.trim();
  const rawGoal = (plan?.goal || patient.goal || 'pérdida de grasa y recomposición corporal').trim();

  // Next appointment date lookup
  const upcomingAppointment = appointments.find(
    (a) => new Date(a.startTime).getTime() > Date.now() && a.status !== 'CANCELADA'
  );
  const nextDateFormatted = upcomingAppointment
    ? new Date(upcomingAppointment.startTime).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : patient.nextConsultationDate
    ? new Date(patient.nextConsultationDate).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date(Date.now() + 28 * 86400000).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  return (
    <div
      id="patient-nutritional-rationale-accordion"
      className="bg-gradient-to-r from-amber-50/90 via-orange-50/75 to-amber-100/60 dark:from-slate-900 dark:via-amber-950/25 dark:to-orange-950/20 border-2 border-amber-300/85 dark:border-amber-700/60 rounded-3xl shadow-sm hover:shadow-md hover:border-amber-400/90 transition-all duration-300 overflow-hidden"
    >
      {/* HEADER / VISTA PLEGADA NO INVASIVA CON DEGRADADO ÁMBAR/NARANJA */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:px-6 sm:py-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-left hover:bg-amber-100/30 dark:hover:bg-amber-950/30 transition-colors cursor-pointer group"
        aria-expanded={isOpen}
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 w-full sm:w-auto flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0 group-hover:scale-105 transition-transform mt-0.5 sm:mt-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-snug">
                ¿Por qué {targetKcal.toLocaleString('es-MX')} calorías? Entendiendo tu Plan
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/90 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60 shrink-0">
                Guía Clínica Personalizada
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">Gasto Total (GET):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{getKcal.toLocaleString('es-MX')} kcal</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden xs:inline">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">Meta:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{targetKcal.toLocaleString('es-MX')} kcal</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden xs:inline">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">Ajuste:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{diffKcal > 0 ? '+' : ''}{diffKcal.toLocaleString('es-MX')} kcal</span>
              </span>
            </div>
          </div>
        </div>

        {/* BOTÓN INTERACTIVO DESTACADO: EN MÓVIL AMPLIO Y CÓMODO, EN DESKTOP A LA DERECHA */}
        <div className="w-full sm:w-auto flex items-center justify-end shrink-0 pt-0.5 sm:pt-0">
          <div
            className={`w-full sm:w-auto flex items-center justify-between sm:justify-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all duration-300 ${
              isOpen
                ? 'bg-amber-200/90 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 hover:bg-amber-300/80'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-amber-500/40 ring-2 ring-amber-300/60 dark:ring-amber-500/50 group-hover:scale-[1.02] sm:group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-amber-500/45'
            }`}
          >
            <span className="tracking-wide">{isOpen ? 'Ocultar guía' : 'Ver explicación'}</span>
            <div className="relative flex items-center justify-center shrink-0">
              {!isOpen ? (
                <>
                  {/* Efecto de atención/pulso detrás de la flecha */}
                  <span className="absolute -inset-0.5 rounded-full bg-white/50 animate-ping opacity-70 pointer-events-none" />
                  <div className="relative w-8 h-8 rounded-full bg-white text-orange-600 shadow-md flex items-center justify-center animate-bounce ring-2 ring-orange-200 dark:ring-amber-300">
                    <ChevronDown className="w-5 h-5 stroke-[3] text-orange-600" />
                  </div>
                </>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-300/90 dark:bg-amber-800 text-amber-950 dark:text-amber-100 flex items-center justify-center shadow-xs">
                  <ChevronUp className="w-5 h-5 stroke-[3]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* CONTENIDO DESPLEGADO / RÉPLICA EXACTA DE LA GUÍA CLÍNICA DE LA IMAGEN */}
      {isOpen && (
        <div className="px-5 sm:px-7 pb-7 pt-2 border-t border-amber-200/80 dark:border-amber-900/60 space-y-6 animate-fade-in bg-white/90 dark:bg-slate-900/95 backdrop-blur-xs">
          
          {/* Top Banner Bar with Clinic Accent */}
          <div className="pt-2">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500 rounded-full mb-3" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ¿Por qué {targetKcal.toLocaleString('es-MX')} calorías? Entendiendo tu Plan Nutricional
            </h2>
            <p className="text-xs text-sky-700 dark:text-sky-400 font-medium mt-0.5">
              Guía explicativa sobre tu gasto energético, el déficit saludable y la composición de tus macronutrientes.
            </p>
            <div className="h-0.5 w-full bg-sky-500 dark:bg-sky-600 mt-2 rounded-full" />
          </div>

          {/* Callout Box: Un mensaje importante para ti */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border-l-4 border-l-sky-500 border border-sky-200/80 dark:border-sky-800/60 shadow-xs">
            <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs uppercase tracking-wide mb-1.5">
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>* Un mensaje importante para ti</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              <strong className="text-slate-900 dark:text-white font-semibold">{patientFullName}</strong>, sabemos que {targetKcal.toLocaleString('es-MX')} calorías puede sonar a una cantidad específica de comida. Este valor está meticulosamente calculado según tus requerimientos metabólicos, actividad física y tu meta de <span className="text-sky-700 dark:text-sky-300 font-medium">{rawGoal}</span>.
            </p>
          </div>

          {/* Grid de 2 Columnas: Izquierda (GET, Déficit) y Derecha (Macros, Conclusión, Próxima Cita) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMNA IZQUIERDA */}
            <div className="space-y-5">
              
              {/* Sección 1: Tu Gasto Energético Total (GET) */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4.5 bg-sky-600 rounded-full" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    1. Tu Gasto Energético Total (GET): Punto de partida
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tu organismo quema energía constante en metabolismo basal, efecto térmico de los alimentos y el ejercicio que realizas día a día.
                </p>

                {/* 3 Tarjetas de Métricas Calóricas (Exactas a la imagen) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                  
                  {/* Tarjeta 1: GET */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center flex flex-col justify-center shadow-xs">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                      {getKcal.toLocaleString('es-MX')} kcal
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-0.5">
                      GASTO GET TOTAL
                    </span>
                  </div>

                  {/* Tarjeta 2: Consumo (Déficit / Meta) */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center flex flex-col justify-center shadow-xs">
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                      {targetKcal.toLocaleString('es-MX')} kcal
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-tight mt-0.5">
                      {isDeficit ? 'CONSUMO (DÉFICIT)' : 'CONSUMO (META)'}
                    </span>
                  </div>

                  {/* Tarjeta 3: Déficit Diario */}
                  <div className={`p-3 sm:p-3.5 rounded-2xl text-center flex flex-col justify-center shadow-xs border ${
                    isDeficit
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                  }`}>
                    <span className={`text-sm sm:text-base font-extrabold ${
                      isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {diffKcal > 0 ? '+' : ''}{diffKcal.toLocaleString('es-MX')} kcal
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-tight mt-0.5 ${
                      isDeficit ? 'text-rose-700 dark:text-rose-300' : 'text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {isDeficit ? 'DÉFICIT DIARIO' : 'SUPERÁVIT DIARIO'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Sección 2: Por qué X kcal genera pérdida de grasa o cambio */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4.5 bg-sky-600 rounded-full" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    2. Por qué {targetKcal.toLocaleString('es-MX')} kcal genera {isDeficit ? 'pérdida de grasa' : 'desarrollo físico'}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isDeficit ? (
                    <>
                      Al fijar <strong>{targetKcal.toLocaleString('es-MX')} kcal diarias</strong>, generamos un déficit estratégico de {Math.abs(diffKcal).toLocaleString('es-MX')} kcal frente a tu gasto de {getKcal.toLocaleString('es-MX')} kcal. Esto fuerza a tu cuerpo a metabolizar tejido adiposo como energía sin desnutrición, conservando tu masa muscular magra y tus defensas al 100%.
                    </>
                  ) : (
                    <>
                      Al fijar <strong>{targetKcal.toLocaleString('es-MX')} kcal diarias</strong> con un gasto de {getKcal.toLocaleString('es-MX')} kcal, brindamos el sustrato perfecto para la síntesis de nuevas fibras musculares y fuerza sin acumulación innecesaria de tejido graso.
                    </>
                  )}
                </p>
              </div>

            </div>

            {/* COLUMNA DERECHA */}
            <div className="space-y-5">
              
              {/* Sección 3: El Papel de Cada Macronutriente */}
              <div className="space-y-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    El Papel de Cada Macronutriente en tus {targetKcal.toLocaleString('es-MX')} kcal
                  </h4>
                  <p className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
                    Distribución clínica que previene fatiga, protege músculo y regula hormonas:
                  </p>
                </div>

                {/* Tabla Clínica de Macronutrientes (Estilo de la imagen con scroll suave en pantallas pequeñas) */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto shadow-xs">
                  <table className="w-full min-w-[340px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-sky-600 text-white">
                        <th className="py-2.5 px-3 font-bold text-[11px]">Macronutriente</th>
                        <th className="py-2.5 px-3 font-bold text-[11px]">Función Clínica</th>
                        <th className="py-2.5 px-3 font-bold text-[11px]">Objetivo Personalizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-800/60">
                          Proteínas
                        </td>
                        <td className="py-2.5 px-3">
                          Construcción y protección tisular.
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          <strong>{proteinG}g ({protPerKg}g/kg):</strong> Conserva tu masa muscular magra activa.
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-800/60">
                          Carbohidratos
                        </td>
                        <td className="py-2.5 px-3">
                          Combustible cerebral y muscular.
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          <strong>{carbsG}g:</strong> Energía continua sin picos glucémicos ni fatiga.
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-800/60">
                          Grasas Buenas
                        </td>
                        <td className="py-2.5 px-3">
                          Regulación hormonal y saciedad.
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          <strong>{fatG}g:</strong> Síntesis de hormonas esteroideas y protección celular.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conclusión: Confía en el proceso */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-sky-600 rounded-full" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    Conclusión: Confía en el proceso
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Comer bien no significa pasar hambre. Este plan garantiza que entrenes con energía, mantengas un metabolismo acelerado y logres un cambio físico y de salud definitivo.
                </p>
              </div>

              {/* Callout: Próxima revisión de seguimiento */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-l-4 border-l-slate-800 dark:border-l-slate-400 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  <span>Próxima revisión de seguimiento</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Cita de control agendada para el <strong className="text-slate-800 dark:text-slate-200">{nextDateFormatted}</strong> para evaluar somatometría y evolución.
                </p>
              </div>

            </div>

          </div>

          {/* Watermark / Firma de la clínica y Botón de Repliegue */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-[11px] uppercase text-emerald-600 dark:text-emerald-400">
                {organizationName}
              </span>
              <span>•</span>
              <span className="italic text-[11px]">NUTRICIÓN CON PROPÓSITO</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Plegar Guía Nutricional</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
