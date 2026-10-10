import React from 'react';
import {
  NutritionPlan,
  Patient,
  Organization,
} from '../types';
import {
  Apple,
  Salad,
  Wheat,
  Fish,
  Utensils,
  Sparkles,
  Droplet,
  Download,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export interface SmaeInfographicBentoProps {
  plan?: NutritionPlan;
  patient: Patient;
  organization?: Organization;
  onDownloadPdf?: () => void;
  isDownloadingPdf?: boolean;
}

export const SmaeInfographicBento: React.FC<SmaeInfographicBentoProps> = ({
  plan,
  patient,
  organization,
  onDownloadPdf,
  isDownloadingPdf = false,
}) => {
  const targetKcal = plan?.targetCaloriesKcal || 1800;
  const targetProt = plan?.targetProteinG || 120;
  const targetCarbs = plan?.targetCarbsG || 180;
  const targetFat = plan?.targetFatG || 55;
  const targetWater = plan?.targetWaterLiters || 2.5;

  const handleShareWhatsApp = () => {
    let cleanPhone = (patient.phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `52${cleanPhone}`;
    const text = `🥗 *GUÍA DE EQUIVALENCIAS SMAE - ${organization?.name || 'NutriLuz'}*\n\nHola ${patient.firstName}, aquí tienes tu guía de intercambios inteligentes basada en tu plan de *${targetKcal} kcal*:\n• *Proteína:* ${targetProt}g\n• *Carbohidratos:* ${targetCarbs}g\n• *Grasas:* ${targetFat}g\n• *Agua recomendada:* ${targetWater}L al día.\n\n_Puedes sustituir libremente cualquier alimento dentro de su mismo grupo de equivalentes SMAE respetando tus porciones asignadas._`;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Patient Plan Customized Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prescripción Nutricional SMAE Personalizada</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              GUÍA MAESTRA DE INTERCAMBIOS INTELIGENTES (EQUIVALENCIAS SMAE)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Tarjetas Bento estilo infografía médica: Sustituye libremente cualquier porción dentro del mismo grupo de alimentos respetando las cantidades de tu plan para <strong>{patient.firstName} {patient.lastName}</strong>.
            </p>
          </div>

          {/* Quick PDF & WhatsApp Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={isDownloadingPdf}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloadingPdf ? 'Generando...' : 'Descargar Guía SMAE (PDF)'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Enviar por WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Patient Specific Plan Metrics Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
          <div className="bg-white/5 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Meta Calórica</span>
            <span className="text-sm font-black text-emerald-400">{targetKcal} kcal</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Proteína</span>
            <span className="text-sm font-black text-purple-400">{targetProt}g</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Carbohidratos</span>
            <span className="text-sm font-black text-amber-400">{targetCarbs}g</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Lípidos (Grasas)</span>
            <span className="text-sm font-black text-teal-400">{targetFat}g</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Hidratación</span>
            <span className="text-sm font-black text-sky-400">{targetWater} Litros</span>
          </div>
        </div>
      </div>

      {/* Grid of 8 Bento Cards (Identical to reference image) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: VERDURAS LIBRES (Green) */}
        <div className="rounded-3xl border-2 border-emerald-500 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 shrink-0">
                <Salad className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  Verduras Libres
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  Consumo libre | 1 Eq = ~25 kcal, 4g HCO
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Espinacas crudas (2 tz / 120g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Lechuga y apio (libre)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Nopales cocidos (1 tz / 150g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Calabacita o chayote (1 pza)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Jitomate bola fresco (1 pza)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Brócoli o espárragos (1 tz)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Pepino con cáscara (libre)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Aderezo: limón, vinagre y orégano</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: FRUTAS FRESCAS (Red / Rose) */}
        <div className="rounded-3xl border-2 border-rose-500 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 flex items-center justify-center text-rose-600 shrink-0">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  Frutas Frescas
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100/90 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300">
                  1 Eq = ~60 kcal | 15g Carbohidratos
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>1 manzana chica (100g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>1 taza papaya picada (140g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>1 taza fresas frescas (150g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>1/2 plátano mediano (60g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>2 mandarinas chicas (120g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>1 pera chica fresca (100g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>1 taza melón picado (160g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>3 ciruelas pasas chicas (35g)</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: CEREALES SIN GRASA (Amber / Gold) */}
        <div className="rounded-3xl border-2 border-amber-500 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 shrink-0">
                <Wheat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  Cereales sin Grasa
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300">
                  1 Eq = ~70 kcal | 15g Carbos, 2g Prot
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>1 tortilla de maíz (30g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>1/3 taza arroz cocido (80g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>1/3 taza avena cruda (30g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>1 rebanada pan integral (30g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>2 tostadas horneadas (24g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>1/3 taza quinoa cocida (75g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>1/2 papa chica hervida (70g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>2.5 tazas palomitas naturales</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: PROTEINAS MAGRAS (AOA) (Purple / Violet) */}
        <div className="rounded-3xl border-2 border-purple-500 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-700 flex items-center justify-center text-purple-600 shrink-0">
                <Fish className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  Proteínas Magras (AOA)
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100/90 dark:bg-purple-950/70 text-purple-900 dark:text-purple-300">
                  1 Eq = ~55 kcal | 7g Proteína, 3g Grasa
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                <span>30g pechuga pollo cocida</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                <span>30g atún en agua (escurrido)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                <span>1 huevo entero o 2 claras</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                <span>40g queso panela bajo en grasa</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                <span>35g bistec de res magro</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                <span>40g filete de pescado blanco</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                <span>35g salmón fresco a la plancha</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                <span>30g pechuga de pavo baja en sodio</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 5: LEGUMINOSAS (Rust / Orange-Brown) */}
        <div className="rounded-3xl border-2 border-amber-700 dark:border-amber-600 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100/90 dark:bg-amber-950/80 border border-amber-400 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  Leguminosas
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300">
                  1 Eq = ~120 kcal | 8g Prot, 20g Carbos
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                <span>1/2 taza frijoles de la olla (90g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                <span>1/2 taza lentejas cocidas (100g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                <span>1/2 taza garbanzos cocidos (100g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                <span>1/3 taza habas cocidas (80g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                <span>1/3 taza soya cocida (70g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                <span>1/2 taza alubias cocidas (90g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                <span>1/3 taza edamames pelados (60g)</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                <span>Tip: Remojar 12h previo a cocción</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 6: GRASAS SALUDABLES (Teal / Avocado) */}
        <div className="rounded-3xl border-2 border-teal-500 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-700 flex items-center justify-center text-teal-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  Grasas Saludables
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100/90 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300">
                  1 Eq = ~45-70 kcal | 5g Grasas buenas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>1/3 aguacate Hass chico (35g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>1 cdta aceite oliva virgen (5ml)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>10 almendras naturales (12g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>3 mitades de nuez entera (12g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>1 cdta crema cacahuate s/azúcar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>1 cda chía o linaza molida (10g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>10 aceitunas verdes (35g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>2 cdtas semillas de girasol</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 7: LÁCTEOS Y BEBIDAS (Blue) */}
        <div className="rounded-3xl border-2 border-blue-600 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 flex items-center justify-center text-blue-600 shrink-0">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  Lácteos y Bebidas
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/90 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300">
                  1 Eq = ~95 kcal | 9g Prot, 12g Carbos
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>1 taza leche descremada (240ml)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>3/4 taza yogur griego 0% (150g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>1 taza bebida soya s/azúcar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>1 taza leche deslactosada light</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>1/3 taza requesón magro (70g)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>1 taza kéfir natural s/azúcar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>1 taza leche almendras s/azúcar</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>Tip: Preferir siempre sin azúcar</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 8: LIBRES Y CONDIMENTOS (Mint / Light Teal) */}
        <div className="rounded-3xl border-2 border-emerald-400 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  Libres y Condimentos
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  Aporte calórico prácticamente nulo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Agua natural (2.0 a 2.5 L al día)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Café negro o espresso (s/azúcar)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Té verde, manzanilla o menta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Limón, ajo, orégano, romero</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Pimienta negra, cúrcuma y canela</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Vinagre de manzana para aliños</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Agua mineral con gas y limón</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Sal marina (consumo moderado)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner: PAUTAS CLINICAS, REGLAS DE ORO DEL PLAN E HIGIENE METABOLICA */}
      <div className="rounded-3xl border-2 border-sky-600 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-sky-700 to-cyan-800 text-white px-5 py-3 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-200" />
            <span>Pautas Clínicas, Reglas de Oro del Plan e Higiene Metabólica</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
            Prescrito por Nutriólogo
          </span>
        </div>

        <div className="p-5 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Seguir horarios regulares y respetar las porciones de equivalentes SMAE.</span>
          </p>

          {plan?.generalInstructions && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Instrucciones Específicas de tu Plan Nutricional:
              </span>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {plan.generalInstructions}
              </p>
            </div>
          )}

          {plan?.hydrationInstructions && (
            <p className="text-sky-700 dark:text-sky-300 font-semibold flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-500 shrink-0" />
              <span>{plan.hydrationInstructions}</span>
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <span>
              Paciente: <strong>{patient.firstName} {patient.lastName}</strong> • Meta: <strong>{patient.goal || 'Salud Integral'}</strong>
            </span>
            <span>
              Clínica: <strong>{organization?.name || 'NutriLuz Red Integral'}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
