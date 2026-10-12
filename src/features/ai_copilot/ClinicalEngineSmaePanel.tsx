import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Activity,
  Scale,
  Sparkles,
  Copy,
  Check,
  Download,
  Flame,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  FileCode,
  HeartPulse,
  Apple,
} from 'lucide-react';
import {
  computeClinicalEngine,
  formatClinicalJsonOutput,
  SMAE_CONSTANTS,
  ClinicalEngineInput,
  ClinicalEngineOutput,
} from '../../services/clinicalEngineSmae';
import { useToast } from '../../components/common/Toast';
import { aiService } from '../../services/aiService';

export interface ClinicalEngineSmaePanelProps {
  patientName: string;
  gender: 'F' | 'M';
  age: number;
  weightKg: number;
  heightCm: number;
  activityFactor?: number;
  targetKcal?: number;
  carbsPct?: number;
  proteinPct?: number;
  fatPct?: number;
  onApplyTargetKcal?: (kcal: number, sourceFormulaName: string) => void;
  onApplyProteinFactor?: (factorGKg: number, grams: number) => void;
  onApplyMacroDistribution?: (dist: { hc_pct: number; prot_pct: number; lip_pct: number }) => void;
}

export const ClinicalEngineSmaePanel: React.FC<ClinicalEngineSmaePanelProps> = ({
  patientName,
  gender,
  age,
  weightKg,
  heightCm,
  activityFactor = 1.0,
  targetKcal,
  carbsPct = 50,
  proteinPct = 20,
  fatPct = 30,
  onApplyTargetKcal,
  onApplyProteinFactor,
  onApplyMacroDistribution,
}) => {
  const { showToast } = useToast();

  // Local interactive controls for simulation & refinement
  const [localActivityFactor, setLocalActivityFactor] = useState<number>(activityFactor || 1.0);
  const [localTargetKcal, setLocalTargetKcal] = useState<number | undefined>(targetKcal);
  const [localHcPct, setLocalHcPct] = useState<number>(carbsPct);
  const [localProtPct, setLocalProtPct] = useState<number>(proteinPct);
  const [localLipPct, setLocalLipPct] = useState<number>(fatPct);

  // UI state
  const [isCopied, setIsCopied] = useState(false);
  const [showSmaeConstants, setShowSmaeConstants] = useState(false);
  const [showJsonView, setShowJsonView] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Sync with incoming props if changed
  React.useEffect(() => {
    if (activityFactor) setLocalActivityFactor(activityFactor);
  }, [activityFactor]);

  React.useEffect(() => {
    if (targetKcal) setLocalTargetKcal(targetKcal);
  }, [targetKcal]);

  React.useEffect(() => {
    setLocalHcPct(carbsPct);
    setLocalProtPct(proteinPct);
    setLocalLipPct(fatPct);
  }, [carbsPct, proteinPct, fatPct]);

  // Compute strictly with deterministic clinical engine
  const clinicalResult: ClinicalEngineOutput = useMemo(() => {
    const input: ClinicalEngineInput = {
      nombre: patientName || 'Paciente',
      sexo: gender === 'M' ? 'Masculino' : 'Femenino',
      edad: age || 30,
      peso: weightKg || 70,
      talla_cm: heightCm || 165,
      factor_actividad: localActivityFactor,
      meta_kcal: localTargetKcal,
      distribucion_macros: {
        hc_pct: Number((localHcPct / 100).toFixed(2)),
        prot_pct: Number((localProtPct / 100).toFixed(2)),
        lip_pct: Number((localLipPct / 100).toFixed(2)),
      },
    };
    return computeClinicalEngine(input);
  }, [patientName, gender, age, weightKg, heightCm, localActivityFactor, localTargetKcal, localHcPct, localProtPct, localLipPct]);

  const jsonString = useMemo(() => {
    return formatClinicalJsonOutput(clinicalResult);
  }, [clinicalResult]);

  // Copy strict JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setIsCopied(true);
    showToast('JSON Clínico Copiado', 'Se ha copiado el objeto JSON estricto al portapapeles.', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Download strict JSON as file
  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (patientName || 'paciente').toLowerCase().replace(/\s+/g, '_');
    link.href = url;
    link.download = `evaluacion_clinica_smae_${safeName}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Archivo Descargado', `Guardado como evaluacion_clinica_smae_${safeName}.json`, 'info');
  };

  // Apply a calculated formula to wizard's targetKcal
  const handleSelectFormula = (kcal: number, formulaName: string) => {
    setLocalTargetKcal(kcal);
    if (onApplyTargetKcal) {
      onApplyTargetKcal(kcal, formulaName);
    }
    showToast('Meta Calórica Actualizada', `Se asignaron ${kcal} kcal/día (${formulaName}) a la meta del plan.`, 'success');
  };

  // Apply protein factor
  const handleSelectProteinFactor = (factor: number, grams: number) => {
    if (onApplyProteinFactor) {
      onApplyProteinFactor(factor, grams);
    }
    showToast('Factor Proteico Aplicado', `Requerimiento ajustado a ${factor} g/kg (${grams} g de proteína/día).`, 'info');
  };

  // Run optional AI Interpretation using the clinical JSON
  const handleRunAiClinicalAnalysis = async () => {
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);

    const systemPrompt = `Eres el motor clínico algorítmico y evaluador antropométrico de una plataforma de nutrición basada en el Sistema Mexicano de Alimentos Equivalentes (SMAE). Tu responsabilidad es procesar los datos de entrada del paciente, evaluar con rigor clínico sus indicadores antropométricos, contrastar las ecuaciones predictivas de gasto energético y brindar una justificación clínica concisa sobre la estrategia idónea para este paciente.`;

    try {
      const response = await aiService.queryNutriCopilot({
        action: 'chat',
        payload: {
          message: `${systemPrompt}\n\nAquí tienes la evaluación matemática computada con precisión estricta para el paciente en formato JSON:\n\`\`\`json\n${jsonString}\n\`\`\`\n\nPor favor entrega un Dictamen Clínico Nutricional estructurado con:\n1. 📋 Diagnóstico Antropométrico y Clasificación OMS.\n2. ⚡ Comparativa de Ecuaciones: Cuál fórmula de GEB/GET es la más recomendada para su perfil y por qué.\n3. 🥩 Recomendación de Ingesta Proteica (g/kg y total diario) justificando según objetivo e IMC.\n4. 🍎 Cuadro Dietosintético y pauta de equivalentes SMAE recomendada.`,
        },
      });

      if (response && response.result) {
        setAiAnalysisResult(response.result);
        showToast('Dictamen Clínico Generado', 'NutriCopilot analizó la evaluación antropométrica y metabólica.', 'success');
      }
    } catch (err: any) {
      showToast('Error de Conexión', 'No se pudo generar el dictamen con IA. Puedes usar los cálculos matemáticos locales.', 'info');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // BMI classification styling helper
  const getBmiBadgeColor = (clasificacion: string) => {
    switch (clasificacion) {
      case 'Bajo peso':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300';
      case 'Normopeso':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300';
      case 'Sobrepeso':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300';
      case 'Obesidad Grado I':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300';
      case 'Obesidad Grado II':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300';
      case 'Obesidad Grado III':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  const { paciente, requerimiento_proteico_g, estimaciones_gasto_energetico, cuadro_dietosintetico } = clinicalResult;
  const applicableSex = paciente.sexo;

  return (
    <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white border border-emerald-500/30 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white">
                  Motor Clínico Algorítmico y Evaluador Antropométrico
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                  SMAE 4.ª Edición
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/25 text-teal-300 border border-teal-400/40">
                  Determinista 100%
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Cálculos matemáticos estrictos de somatometría, gasto energético (5 fórmulas predictivas) y distribución dietosintética.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Copiar el JSON clínico estricto"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? '¡Copiado!' : 'Copiar JSON'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer border border-white/20 transition-all"
              title="Descargar archivo JSON"
            >
              <Download className="w-4 h-4" />
              <span>Descargar</span>
            </button>
          </div>
        </div>

        {/* Input Parameters Summary Bar */}
        <div className="mt-4 pt-3 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-emerald-300 block">Paciente:</span>
            <span className="font-bold text-white truncate block">{paciente.nombre}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-300 block">Sexo / Edad:</span>
            <span className="font-bold text-white">{paciente.sexo} • {paciente.edad} años</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-300 block">Peso / Estatura:</span>
            <span className="font-bold text-white">{paciente.peso_kg} kg • {paciente.talla_cm} cm</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-300 block">Factor Actividad:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="2.5"
                value={localActivityFactor}
                onChange={(e) => setLocalActivityFactor(Number(e.target.value) || 1.0)}
                className="w-16 px-1.5 py-0.5 bg-slate-900/80 rounded border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs"
              />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-emerald-300 block">Meta Calórica:</span>
            <span className="font-bold text-white font-mono">{cuadro_dietosintetico.meta_kcal} kcal</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-300 block">Distribución:</span>
            <span className="font-bold text-white text-[11px]">
              {Math.round(localHcPct)}% HC | {Math.round(localProtPct)}% P | {Math.round(localLipPct)}% L
            </span>
          </div>
        </div>
      </div>

      {/* BLOCK A: Antropometría e Indicadores Clínicos (OMS) */}
      <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>A. Antropometría e Indicadores Clínicos Deterministas</span>
          </h4>
          <span className="text-[11px] text-slate-400">Ecuaciones OMS y Broca/Metropolitana</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Talla en Metros */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-semibold text-slate-400 block">Conversión Estatura:</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-800 dark:text-white font-mono">
                {paciente.talla_m.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">m</span>
            </div>
            <span className="text-[10px] text-slate-400">({paciente.talla_cm} cm)</span>
          </div>

          {/* IMC y Clasificación OMS */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-semibold text-slate-400 block">Índice de Masa Corporal (IMC):</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {paciente.imc.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">kg/m²</span>
            </div>
            <div className="mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBmiBadgeColor(paciente.clasificacion_imc)}`}>
                {paciente.clasificacion_imc}
              </span>
            </div>
          </div>

          {/* Peso Teórico (Ideal) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-semibold text-slate-400 block">
              Peso Teórico ({paciente.sexo}):
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {paciente.peso_teorico_kg.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">kg</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Fórmula: (talla_m²) × {paciente.sexo === 'Masculino' ? '23.0' : '21.5'}
            </span>
          </div>

          {/* Diferencia vs Peso Teórico */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-semibold text-slate-400 block">Variación vs Peso Teórico:</span>
            {(() => {
              const diff = Number((paciente.peso_kg - paciente.peso_teorico_kg).toFixed(2));
              const isOver = diff > 0;
              return (
                <div className="mt-1">
                  <span className={`text-lg font-black font-mono ${isOver ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`}>
                    {isOver ? `+${diff}` : `${diff}`} kg
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {isOver ? 'Por encima de peso ideal' : 'Por debajo de peso ideal'}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* BLOCK B: Ecuaciones de GEB y GET (Comparativa de las 5 Ecuaciones) */}
      <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>B. Ecuaciones Predictivas de GEB y Gasto Energético Total (GET)</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              GET = GEB × factor_actividad ({localActivityFactor}). Haz clic en &ldquo;⚡ Aplicar al Plan&rdquo; para sincronizar la meta calórica.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            Factor FA = {localActivityFactor}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Harris-Benedict */}
          {(() => {
            const hb = estimaciones_gasto_energetico.harris_benedict;
            const isMatch = Math.round(hb.formula_aplicable_al_sexo.get) === cuadro_dietosintetico.meta_kcal;
            return (
              <div className={`p-3.5 rounded-xl border transition-all ${
                isMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">1. Harris-Benedict</h5>
                    <span className="text-[10px] text-slate-400">Revisión clínica internacional</span>
                  </div>
                  {isMatch && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">
                      ACTIVA
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>GEB ({paciente.sexo}):</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{hb.formula_aplicable_al_sexo.geb} kcal</strong>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>GET ({localActivityFactor} FA):</span>
                    <strong className="font-mono text-base">{hb.formula_aplicable_al_sexo.get} kcal</strong>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                    <span>H: {hb.get_hombre} | M: {hb.get_mujer} kcal</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectFormula(Math.round(hb.formula_aplicable_al_sexo.get), 'Harris-Benedict')}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>⚡ Aplicar al Plan ({Math.round(hb.formula_aplicable_al_sexo.get)} kcal)</span>
                </button>
              </div>
            );
          })()}

          {/* 2. Mifflin-St. Jeor */}
          {(() => {
            const mif = estimaciones_gasto_energetico.mifflin_st_jeor;
            const isMatch = Math.round(mif.formula_aplicable_al_sexo.get) === cuadro_dietosintetico.meta_kcal;
            return (
              <div className={`p-3.5 rounded-xl border transition-all ${
                isMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">2. Mifflin-St. Jeor</h5>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Recomendada (Gold Standard)</span>
                  </div>
                  {isMatch && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">
                      ACTIVA
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>GEB ({paciente.sexo}):</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{mif.formula_aplicable_al_sexo.geb} kcal</strong>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>GET ({localActivityFactor} FA):</span>
                    <strong className="font-mono text-base">{mif.formula_aplicable_al_sexo.get} kcal</strong>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                    <span>H: {mif.get_hombre} | M: {mif.get_mujer} kcal</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectFormula(Math.round(mif.formula_aplicable_al_sexo.get), 'Mifflin-St. Jeor')}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>⚡ Aplicar al Plan ({Math.round(mif.formula_aplicable_al_sexo.get)} kcal)</span>
                </button>
              </div>
            );
          })()}

          {/* 3. Cunningham (Masa Magra / LBM) */}
          {(() => {
            const cun = estimaciones_gasto_energetico.cunningham;
            const isMatch = Math.round(cun.get) === cuadro_dietosintetico.meta_kcal;
            return (
              <div className={`p-3.5 rounded-xl border transition-all ${
                isMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">3. Cunningham</h5>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Basada en Masa Magra (LBM)</span>
                  </div>
                  {isMatch && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">
                      ACTIVA
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>LBM estimado:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{cun.lbm_kg} kg</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>GEB (500 + 22×LBM):</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{cun.geb} kcal</strong>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>GET ({localActivityFactor} FA):</span>
                    <strong className="font-mono text-base">{cun.get} kcal</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectFormula(Math.round(cun.get), 'Cunningham')}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>⚡ Aplicar al Plan ({Math.round(cun.get)} kcal)</span>
                </button>
              </div>
            );
          })()}

          {/* 4. Katch-McArdle (Atletas & % Grasa) */}
          {(() => {
            const kat = estimaciones_gasto_energetico.katch_mcardle;
            const isMatch = Math.round(kat.get) === cuadro_dietosintetico.meta_kcal;
            return (
              <div className={`p-3.5 rounded-xl border transition-all ${
                isMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">4. Katch-McArdle</h5>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Atletas y Composición Corporal</span>
                  </div>
                  {isMatch && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">
                      ACTIVA
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>LBM estimado:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{kat.lbm_kg} kg</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>GEB (370 + 21.6×LBM):</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{kat.geb} kcal</strong>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>GET ({localActivityFactor} FA):</span>
                    <strong className="font-mono text-base">{kat.get} kcal</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectFormula(Math.round(kat.get), 'Katch-McArdle')}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>⚡ Aplicar al Plan ({Math.round(kat.get)} kcal)</span>
                </button>
              </div>
            );
          })()}

          {/* 5. FAO / OMS / UNU */}
          {(() => {
            const fao = estimaciones_gasto_energetico.fao_oms;
            const isMatch = Math.round(fao.formula_aplicable_al_sexo.get) === cuadro_dietosintetico.meta_kcal;
            return (
              <div className={`p-3.5 rounded-xl border transition-all ${
                isMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">5. FAO / OMS / UNU</h5>
                    <span className="text-[10px] text-slate-400">Ponderada por grupo etario</span>
                  </div>
                  {isMatch && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">
                      ACTIVA
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>GEB ({paciente.sexo}):</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{fao.formula_aplicable_al_sexo.geb} kcal</strong>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>GET ({localActivityFactor} FA):</span>
                    <strong className="font-mono text-base">{fao.formula_aplicable_al_sexo.get} kcal</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectFormula(Math.round(fao.formula_aplicable_al_sexo.get), 'FAO / OMS / UNU')}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>⚡ Aplicar al Plan ({Math.round(fao.formula_aplicable_al_sexo.get)} kcal)</span>
                </button>
              </div>
            );
          })()}

          {/* 6. Schofield */}
          {(() => {
            const sch = estimaciones_gasto_energetico.schofield;
            const isMatch = Math.round(sch.get) === cuadro_dietosintetico.meta_kcal;
            return (
              <div className={`p-3.5 rounded-xl border transition-all ${
                isMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">3. Schofield</h5>
                    <span className="text-[10px] text-slate-400">8.4×peso + 4.5×talla + 200</span>
                  </div>
                  {isMatch && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">
                      ACTIVA
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>GEB Base:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{sch.geb} kcal</strong>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>GET ({localActivityFactor} FA):</span>
                    <strong className="font-mono text-base">{sch.get} kcal</strong>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                    <span>Ecuación ponderada OMS</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectFormula(Math.round(sch.get), 'Schofield')}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>⚡ Aplicar al Plan ({Math.round(sch.get)} kcal)</span>
                </button>
              </div>
            );
          })()}

          {/* 4. Fórmula Rápida Hospitalaria */}
          {(() => {
            const hosp = estimaciones_gasto_energetico.formula_rapida_hospitalaria;
            const isMatch = Math.round(hosp.geb_hombre) === cuadro_dietosintetico.meta_kcal;
            return (
              <div className={`p-3.5 rounded-xl border transition-all ${
                isMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">4. Fórmula Rápida Hospitalaria</h5>
                    <span className="text-[10px] text-slate-400">GEB = peso × 30.0 kcal/kg</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Cálculo Directo:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{hosp.geb_hombre} kcal</strong>
                  </div>
                  <div className="flex justify-between items-center text-teal-700 dark:text-teal-400 font-bold">
                    <span>Meta Estimada:</span>
                    <strong className="font-mono text-base">{hosp.geb_hombre} kcal</strong>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                    <span>Guía rápida en estancia clínica</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectFormula(Math.round(hosp.geb_hombre), 'Fórmula Rápida Hospitalaria')}
                  className="mt-3 w-full py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>⚡ Aplicar al Plan ({Math.round(hosp.geb_hombre)} kcal)</span>
                </button>
              </div>
            );
          })()}

          {/* 5. Fórmula Rápida Ambulatoria */}
          {(() => {
            const amb = estimaciones_gasto_energetico.formula_rapida_ambulatoria;
            const isMatch = Math.round(amb.geb_aplicable_al_sexo) === cuadro_dietosintetico.meta_kcal;
            return (
              <div className={`p-3.5 rounded-xl border transition-all md:col-span-2 lg:col-span-2 ${
                isMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">5. Fórmula Rápida Ambulatoria</h5>
                    <span className="text-[10px] text-slate-400">Hombre: 24 kcal/kg • Mujer: 23 kcal/kg</span>
                  </div>
                  {isMatch && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">
                      ACTIVA
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Hombre (24 × kg):</span>
                      <strong className="font-mono text-slate-900 dark:text-white">{amb.geb_hombre} kcal</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Mujer (23 × kg):</span>
                      <strong className="font-mono text-slate-900 dark:text-white">{amb.geb_mujer} kcal</strong>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>Aplicable ({paciente.sexo}):</span>
                      <strong className="font-mono text-base">{amb.geb_aplicable_al_sexo} kcal</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Ideal para consulta ambulatoria de primer nivel
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectFormula(Math.round(amb.geb_aplicable_al_sexo), 'Fórmula Rápida Ambulatoria')}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>⚡ Aplicar al Plan ({Math.round(amb.geb_aplicable_al_sexo)} kcal)</span>
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* BLOCK C: Estimación de Requerimiento Proteico por Factores (0.8 a 2.0 g/kg) */}
      <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-700 pb-2">
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>C. Estimación de Gramos de Proteína según Factor (0.8 a 2.0 g/kg)</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Calculado estrictamente como <code className="font-mono font-bold">gramos = peso × factor</code> para {paciente.peso_kg} kg de peso corporal.
            </p>
          </div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
            Haz clic en cualquier factor para aplicarlo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 gap-2">
          {requerimiento_proteico_g.map((item) => {
            const isStandardRDA = item.factor_g_kg === 0.8;
            const isStandardFitness = item.factor_g_kg === 1.6 || item.factor_g_kg === 1.8;
            return (
              <button
                key={item.factor_g_kg}
                type="button"
                onClick={() => handleSelectProteinFactor(item.factor_g_kg, item.gramos)}
                className={`p-2 rounded-xl text-center border transition-all cursor-pointer group hover:scale-105 ${
                  isStandardFitness
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 hover:border-indigo-500'
                    : isStandardRDA
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
                title={`Aplicar ${item.factor_g_kg} g/kg (${item.gramos} g) al plan`}
              >
                <span className="block font-bold text-[10px] text-slate-500 group-hover:text-indigo-600">
                  {item.factor_g_kg.toFixed(1)} g/kg
                </span>
                <span className="block text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {item.gramos}
                </span>
                <span className="block text-[9px] text-slate-400">gramos</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BLOCK D: Cuadro Dietosintético Determinista */}
      <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Apple className="w-4 h-4 text-emerald-600" />
              <span>D. Cuadro Dietosintético Determinista (Prescripción Clínica)</span>
            </h4>
            <span className="text-[10px] text-slate-400">
              Cálculo con constantes 4 kcal/g (HC, Prot) y 9 kcal/g (Lípidos) para meta de {cuadro_dietosintetico.meta_kcal} kcal
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              Meta: {cuadro_dietosintetico.meta_kcal} kcal/día
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Hidratos de Carbono */}
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-amber-900 dark:text-amber-200">Hidratos de Carbono</span>
              <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                {Math.round(cuadro_dietosintetico.macronutrientes.hidratos_de_carbono.porcentaje * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-black font-mono text-amber-900 dark:text-amber-100">
                {cuadro_dietosintetico.macronutrientes.hidratos_de_carbono.gramos} g
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold font-mono">
                {cuadro_dietosintetico.macronutrientes.hidratos_de_carbono.kcal} kcal
              </span>
            </div>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block">
              ÷ 4.0 kcal/g
            </span>
          </div>

          {/* Proteínas */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-emerald-900 dark:text-emerald-200">Proteínas</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                {Math.round(cuadro_dietosintetico.macronutrientes.proteinas.porcentaje * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-100">
                {cuadro_dietosintetico.macronutrientes.proteinas.gramos} g
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                {cuadro_dietosintetico.macronutrientes.proteinas.kcal} kcal
              </span>
            </div>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block">
              ÷ 4.0 kcal/g • {Number((cuadro_dietosintetico.macronutrientes.proteinas.gramos / paciente.peso_kg).toFixed(2))} g/kg
            </span>
          </div>

          {/* Lípidos */}
          <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/60 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-rose-900 dark:text-rose-200">Lípidos (Grasas)</span>
              <span className="font-bold text-rose-700 dark:text-rose-400 font-mono">
                {Math.round(cuadro_dietosintetico.macronutrientes.lipidos.porcentaje * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-black font-mono text-rose-900 dark:text-rose-100">
                {cuadro_dietosintetico.macronutrientes.lipidos.gramos} g
              </span>
              <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold font-mono">
                {cuadro_dietosintetico.macronutrientes.lipidos.kcal} kcal
              </span>
            </div>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block">
              ÷ 9.0 kcal/g
            </span>
          </div>
        </div>
      </div>

      {/* BLOCK E: Constantes SMAE por Equivalente (Collapsible Table) */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowSmaeConstants(!showSmaeConstants)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
              SMAE
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                3. Constantes SMAE por Equivalente (Matriz Nutricional Oficial)
              </h4>
              <p className="text-[10px] text-slate-400">
                16 Grupos y Subgrupos oficiales con aportes energéticos y de macronutrientes estándar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[11px] font-semibold">{showSmaeConstants ? 'Ocultar' : 'Ver Matriz'}</span>
            {showSmaeConstants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showSmaeConstants && (
          <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
                    <th className="py-2 font-bold">Grupo de Alimento</th>
                    <th className="py-2 text-right font-bold">HC (g)</th>
                    <th className="py-2 text-right font-bold">Proteína (g)</th>
                    <th className="py-2 text-right font-bold">Lípidos (g)</th>
                    <th className="py-2 text-right font-bold">Energía (kcal)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {SMAE_CONSTANTS.map((item) => (
                    <tr key={item.grupo} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-2 font-sans font-semibold text-slate-800 dark:text-slate-200">
                        {item.grupo}
                      </td>
                      <td className="py-2 text-right text-amber-600 dark:text-amber-400">{item.hc_g}g</td>
                      <td className="py-2 text-right text-emerald-600 dark:text-emerald-400">{item.prot_g}g</td>
                      <td className="py-2 text-right text-rose-600 dark:text-rose-400">{item.lip_g}g</td>
                      <td className="py-2 text-right font-bold text-slate-900 dark:text-white">{item.energia_kcal} kcal</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* BLOCK F: Visor de JSON Schema Estricto */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md text-white">
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <div>
              <h4 className="font-extrabold text-xs text-white">
                4. Formato de Salida Estricto (JSON Schema Generado)
              </h4>
              <p className="text-[10px] text-slate-400">
                Objeto JSON válido sin bloques de texto adicional, listo para integración o base de datos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunAiClinicalAnalysis}
              disabled={isAiAnalyzing}
              className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>{isAiAnalyzing ? 'Analizando...' : 'Interpretar con IA'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowJsonView(!showJsonView)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title={showJsonView ? 'Ocultar JSON' : 'Mostrar JSON'}
            >
              {showJsonView ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* AI Interpretation Panel if triggered */}
        {aiAnalysisResult && (
          <div className="p-4 bg-emerald-950/30 border-b border-emerald-800/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dictamen Clínico NutriCopiloto AI (Basado en este JSON):</span>
              </span>
              <button
                type="button"
                onClick={() => setAiAnalysisResult(null)}
                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/70 p-3 rounded-xl border border-emerald-500/30 max-h-60 overflow-y-auto font-sans">
              {aiAnalysisResult}
            </div>
          </div>
        )}

        {showJsonView && (
          <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto">
            <pre className="text-[11px] font-mono text-emerald-300 leading-relaxed">
              <code>{jsonString}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
