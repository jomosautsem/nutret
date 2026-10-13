import React from 'react';
import {
  Check,
  X,
  AlertTriangle,
  Scale,
  Sparkles,
  Lock,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import { OptimizationResult, calculateDerivedTargetGrams } from '../../services/smaeOptimizer';

interface SmaeOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (proposedPortions: Record<string, number>) => void;
  result: OptimizationResult | null;
  prescribedTargets: {
    kcal: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
  };
  adequacyTargets?: {
    proteinPct?: number;
    fatPct?: number;
    carbsPct?: number;
  };
}

export const SmaeOptimizationModal: React.FC<SmaeOptimizationModalProps> = ({
  isOpen,
  onClose,
  onApply,
  result,
  prescribedTargets,
  adequacyTargets,
}) => {
  if (!isOpen || !result) return null;

  const targetTitles: Record<string, string> = {
    protein: 'Ajuste Optimizado de Proteínas',
    lipids: 'Ajuste Optimizado de Lípidos',
    carbs: 'Ajuste Optimizado de Carbohidratos',
    all: 'Balanceo Conjunto de Macronutrientes (100% Adecuación)',
  };

  const title = targetTitles[result.targetType] || 'Propuesta de Optimización SMAE';

  const { previousTotals, proposedTotals, changes } = result;

  const getAdequacyColor = (pct: number) => {
    if (pct >= 95 && pct <= 105) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
    if (pct < 95) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
  };

  const protTargetPct = adequacyTargets?.proteinPct ?? 100;
  const lipTargetPct = adequacyTargets?.fatPct ?? 100;
  const hcTargetPct = adequacyTargets?.carbsPct ?? 100;

  const derivedProt = calculateDerivedTargetGrams(prescribedTargets.proteinG, protTargetPct);
  const derivedLip = calculateDerivedTargetGrams(prescribedTargets.fatG, lipTargetPct);
  const derivedHc = calculateDerivedTargetGrams(prescribedTargets.carbsG, hcTargetPct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Revisión clínica de porciones propuestas antes de aplicar al plan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Explanation Banner */}
          <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {result.explanation}
              </p>
              {result.lockedGroupsCount > 0 && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Se respetaron <strong>{result.lockedGroupsCount}</strong> grupos bloqueados por el nutriólogo.</span>
                </p>
              )}
            </div>
          </div>

          {/* Collateral Consequences Banner */}
          {result.collateralEffects && result.collateralEffects.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 space-y-1">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Consecuencias colaterales sobre otros nutrientes (Relaciones intrínsecas SMAE)</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700 dark:text-slate-300 pl-1">
                {result.collateralEffects.map((eff, i) => (
                  <li key={i}>{eff}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Nutritional Summary Before vs After */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              Resumen Nutricional: Actual vs Propuesto
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Kcal */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Calorías (Kcal)</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-500 line-through">{previousTotals.kcal}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{proposedTotals.kcal}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Meta: {prescribedTargets.kcal}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${getAdequacyColor(proposedTotals.kcalAdequacyPct)}`}>
                    {proposedTotals.kcalAdequacyPct}%
                  </span>
                </div>
              </div>

              {/* Proteína */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Proteínas (g)</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-500 line-through">{previousTotals.prot}g</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{proposedTotals.prot}g</span>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Meta: {prescribedTargets.proteinG}g ({protTargetPct}% obj: {derivedProt}g)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[9px]">Adecuación propuesta:</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${getAdequacyColor(proposedTotals.protAdequacyPct)}`}>
                      {proposedTotals.protAdequacyPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Lípidos */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Lípidos (g)</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-500 line-through">{previousTotals.lip}g</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{proposedTotals.lip}g</span>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Meta: {prescribedTargets.fatG}g ({lipTargetPct}% obj: {derivedLip}g)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[9px]">Adecuación propuesta:</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${getAdequacyColor(proposedTotals.lipAdequacyPct)}`}>
                      {proposedTotals.lipAdequacyPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Carbohidratos */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Carbohidratos (g)</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-500 line-through">{previousTotals.hc}g</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{proposedTotals.hc}g</span>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Meta: {prescribedTargets.carbsG}g ({hcTargetPct}% obj: {derivedHc}g)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[9px]">Adecuación propuesta:</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${getAdequacyColor(proposedTotals.hcAdequacyPct)}`}>
                      {proposedTotals.hcAdequacyPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Changes Table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Ajuste Propuesto por Grupo SMAE ({changes.length} grupos modificados)
              </h4>
              <span className="text-[10px] text-slate-400">Paso de ajuste: 0.5 equivalentes</span>
            </div>

            {changes.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-slate-500">
                La distribución actual ya se encuentra en el punto óptimo posible.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Grupo SMAE</th>
                      <th className="py-2 px-3 text-center">Actual</th>
                      <th className="py-2 px-3 text-center">Propuesto</th>
                      <th className="py-2 px-3 text-right">Variación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {changes.map((ch) => (
                      <tr key={ch.grupo} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {ch.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                          <span>{ch.grupo}</span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500">{ch.previous}</td>
                        <td className="py-2 px-3 text-center font-extrabold text-slate-900 dark:text-white">{ch.proposed}</td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              ch.diff > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {ch.diff > 0 ? `+${ch.diff}` : ch.diff}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reached and Deviations Lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {result.reachedTargets.length > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1 text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Objetivos Clínicos Alcanzados</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                  {result.reachedTargets.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.deviations.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1 text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Desviaciones o Limitaciones Factibles</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                  {result.deviations.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancelar (Mantener distribución actual)
          </button>
          <button
            type="button"
            onClick={() => onApply(result.proposedPortions)}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
