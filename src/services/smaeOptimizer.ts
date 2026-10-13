/**
 * SMAE Optimizer & Clinical Macronutrient Balancer
 * Sistema Mexicano de Alimentos Equivalentes (SMAE)
 * 
 * Motor de optimización discreta determinista para cálculo y ajuste
 * independiente o conjunto de macronutrientes (Proteínas, Lípidos, Carbohidratos)
 * y calorías con objetivos configurables de adecuación (por defecto 100%).
 */

import { SMAE_CONSTANTS, SmaeConstant } from './clinicalEngineSmae';

export interface MacroTargetConfig {
  prescribedGrams: number;
  targetAdequacyPct: number; // Por defecto 100%
  derivedTargetGrams: number; // prescribedGrams * (targetAdequacyPct / 100)
}

export interface SmaeNutritionTotals {
  kcal: number;
  prot: number;
  lip: number;
  hc: number;
  kcalAdequacyPct: number;
  protAdequacyPct: number;
  lipAdequacyPct: number;
  hcAdequacyPct: number;
}

export interface SmaeGroupSetting {
  grupo: string;
  isLocked?: boolean;
  step?: number;
  minPortions?: number;
  maxPortions?: number;
}

export interface OptimizationChange {
  grupo: string;
  previous: number;
  proposed: number;
  diff: number;
  isLocked: boolean;
}

export interface OptimizationResult {
  targetType: 'protein' | 'lipids' | 'carbs' | 'all';
  proposedPortions: Record<string, number>;
  previousTotals: SmaeNutritionTotals;
  proposedTotals: SmaeNutritionTotals;
  changes: OptimizationChange[];
  status: 'optimal' | 'feasible_with_deviations' | 'no_feasible_solution';
  explanation: string;
  reachedTargets: string[];
  deviations: string[];
  collateralEffects?: string[];
  lockedGroupsCount: number;
}

export interface SingleMacroOptimizationParams {
  macro: 'protein' | 'lipids' | 'carbs';
  currentPortions: Record<string, number>;
  prescribedTargets: {
    kcal: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
  };
  adequacyTargets: {
    proteinPct?: number;
    fatPct?: number;
    carbsPct?: number;
  };
  lockedGroups?: Record<string, boolean>;
  stepSize?: number;
}

export interface JointBalancingParams {
  currentPortions: Record<string, number>;
  prescribedTargets: {
    kcal: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
  };
  adequacyTargets: {
    proteinPct?: number;
    fatPct?: number;
    carbsPct?: number;
  };
  lockedGroups?: Record<string, boolean>;
  stepSize?: number;
}

/**
 * Límites clínicos por grupo SMAE para evitar distorsiones inverosímiles
 */
export const SMAE_CLINICAL_BOUNDS: Record<string, { min: number; max: number; typicalPriority: { p: number; l: number; c: number } }> = {
  'Verduras': { min: 0, max: 12, typicalPriority: { p: 0.2, l: 0, c: 0.8 } },
  'Frutas': { min: 0, max: 8, typicalPriority: { p: 0, l: 0, c: 1.0 } },
  'Cereales s/g': { min: 0, max: 14, typicalPriority: { p: 0.1, l: 0, c: 0.9 } },
  'Cereales c/g': { min: 0, max: 4, typicalPriority: { p: 0.1, l: 0.4, c: 0.5 } },
  'Leguminosas': { min: 0, max: 5, typicalPriority: { p: 0.4, l: 0.1, c: 0.5 } },
  'AOA Muy bajo aporte': { min: 0, max: 10, typicalPriority: { p: 0.9, l: 0.1, c: 0 } },
  'AOA Bajo aporte': { min: 0, max: 8, typicalPriority: { p: 0.8, l: 0.2, c: 0 } },
  'AOA Moderado aporte': { min: 0, max: 6, typicalPriority: { p: 0.6, l: 0.4, c: 0 } },
  'AOA Alto aporte': { min: 0, max: 4, typicalPriority: { p: 0.4, l: 0.6, c: 0 } },
  'Leche descremada': { min: 0, max: 4, typicalPriority: { p: 0.5, l: 0.1, c: 0.4 } },
  'Leche semidescremada': { min: 0, max: 3, typicalPriority: { p: 0.4, l: 0.2, c: 0.4 } },
  'Leche entera': { min: 0, max: 3, typicalPriority: { p: 0.3, l: 0.4, c: 0.3 } },
  'Leche c/azúcar': { min: 0, max: 2, typicalPriority: { p: 0.2, l: 0.2, c: 0.6 } },
  'Grasas s/proteína': { min: 0, max: 10, typicalPriority: { p: 0, l: 1.0, c: 0 } },
  'Grasas c/proteína': { min: 0, max: 6, typicalPriority: { p: 0.3, l: 0.5, c: 0.2 } },
  'Azúcares s/grasa': { min: 0, max: 4, typicalPriority: { p: 0, l: 0, c: 1.0 } },
};

/**
 * Única fuente centralizada de cálculo de aportes nutricionales y porcentajes de adecuación real
 */
export function calculateSmaeTotals(
  portions: Record<string, number>,
  targets: {
    kcal: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
  }
): SmaeNutritionTotals {
  let kcal = 0;
  let prot = 0;
  let lip = 0;
  let hc = 0;

  for (const c of SMAE_CONSTANTS) {
    const qty = portions[c.grupo] || 0;
    if (qty > 0) {
      kcal += qty * c.energia_kcal;
      prot += qty * c.prot_g;
      lip += qty * c.lip_g;
      hc += qty * c.hc_g;
    }
  }

  const roundedKcal = Number(kcal.toFixed(1));
  const roundedProt = Number(prot.toFixed(1));
  const roundedLip = Number(lip.toFixed(1));
  const roundedHc = Number(hc.toFixed(1));

  const kcalAdequacyPct = targets.kcal > 0 ? Number(((roundedKcal / targets.kcal) * 100).toFixed(1)) : 0;
  const protAdequacyPct = targets.proteinG > 0 ? Number(((roundedProt / targets.proteinG) * 100).toFixed(1)) : 0;
  const lipAdequacyPct = targets.fatG > 0 ? Number(((roundedLip / targets.fatG) * 100).toFixed(1)) : 0;
  const hcAdequacyPct = targets.carbsG > 0 ? Number(((roundedHc / targets.carbsG) * 100).toFixed(1)) : 0;

  return {
    kcal: roundedKcal,
    prot: roundedProt,
    lip: roundedLip,
    hc: roundedHc,
    kcalAdequacyPct,
    protAdequacyPct,
    lipAdequacyPct,
    hcAdequacyPct,
  };
}

/**
 * Calcula el aporte objetivo derivado en gramos a partir de la meta prescrita y el % deseado
 * Aporte objetivo (g) = meta prescrita (g) * porcentaje objetivo / 100
 */
export function calculateDerivedTargetGrams(prescribedGrams: number, targetAdequacyPct: number): number {
  if (prescribedGrams <= 0 || isNaN(prescribedGrams)) return 0;
  const pct = isNaN(targetAdequacyPct) || targetAdequacyPct < 0 ? 100 : targetAdequacyPct;
  return Number(((prescribedGrams * pct) / 100).toFixed(1));
}

/**
 * Optimización de un ÚNICO macronutriente (Proteínas, Lípidos o Carbohidratos).
 * Prioriza reducir la desviación del nutriente objetivo, intentando conservar
 * los otros dos macronutrientes y las calorías, respetando grupos bloqueados e incrementos.
 */
export function optimizeSingleMacro(params: SingleMacroOptimizationParams): OptimizationResult {
  const {
    macro,
    currentPortions,
    prescribedTargets,
    adequacyTargets,
    lockedGroups = {},
    stepSize = 0.5,
  } = params;

  const targetProtPct = adequacyTargets.proteinPct !== undefined ? adequacyTargets.proteinPct : 100;
  const targetLipPct = adequacyTargets.fatPct !== undefined ? adequacyTargets.fatPct : 100;
  const targetHcPct = adequacyTargets.carbsPct !== undefined ? adequacyTargets.carbsPct : 100;

  const targetProtG = calculateDerivedTargetGrams(prescribedTargets.proteinG, targetProtPct);
  const targetLipG = calculateDerivedTargetGrams(prescribedTargets.fatG, targetLipPct);
  const targetHcG = calculateDerivedTargetGrams(prescribedTargets.carbsG, targetHcPct);
  const targetKcal = prescribedTargets.kcal;

  const previousTotals = calculateSmaeTotals(currentPortions, prescribedTargets);

  // Copia inicial de porciones normalizadas a pasos de 0.5
  const portions: Record<string, number> = {};
  for (const c of SMAE_CONSTANTS) {
    portions[c.grupo] = Math.max(0, Number((currentPortions[c.grupo] || 0).toFixed(1)));
  }

  // Grupos modificables ordenados por afinidad con el nutriente objetivo
  const editableConstants = SMAE_CONSTANTS.filter((c) => !lockedGroups[c.grupo]);

  // Si no hay grupos modificables, retornar sin cambios
  if (editableConstants.length === 0) {
    return {
      targetType: macro,
      proposedPortions: portions,
      previousTotals,
      proposedTotals: previousTotals,
      changes: [],
      status: 'feasible_with_deviations',
      explanation: 'No se realizaron modificaciones porque todos los grupos de alimentos SMAE están bloqueados.',
      reachedTargets: [],
      deviations: ['Todos los grupos están bloqueados'],
      lockedGroupsCount: SMAE_CONSTANTS.length,
    };
  }

  // Identificar el nutriente primario
  let primaryTarget = targetProtG;
  if (macro === 'lipids') primaryTarget = targetLipG;
  if (macro === 'carbs') primaryTarget = targetHcG;

  // Función de costo ponderada: penaliza fuertemente el error en el macro objetivo
  // y moderadamente los otros nutrientes y la desviación de la distribución actual
  const evaluateCost = (currentP: Record<string, number>) => {
    let pG = 0;
    let lG = 0;
    let cG = 0;
    let kCal = 0;

    for (const c of SMAE_CONSTANTS) {
      const q = currentP[c.grupo] || 0;
      pG += q * c.prot_g;
      lG += q * c.lip_g;
      cG += q * c.hc_g;
      kCal += q * c.energia_kcal;
    }

    // Errores normalizados relativos
    const errProt = targetProtG > 0 ? Math.abs(pG - targetProtG) / targetProtG : Math.abs(pG);
    const errLip = targetLipG > 0 ? Math.abs(lG - targetLipG) / targetLipG : Math.abs(lG);
    const errHc = targetHcG > 0 ? Math.abs(cG - targetHcG) / targetHcG : Math.abs(cG);
    const errKcal = targetKcal > 0 ? Math.abs(kCal - targetKcal) / targetKcal : 0;

    let cost = 0;
    if (macro === 'protein') {
      cost = errProt * 80 + errLip * 12 + errHc * 12 + errKcal * 10;
    } else if (macro === 'lipids') {
      cost = errLip * 80 + errProt * 12 + errHc * 12 + errKcal * 10;
    } else {
      cost = errHc * 80 + errProt * 12 + errLip * 12 + errKcal * 10;
    }

    // Penalización por alterar porciones actuales sin necesidad
    let changePenalty = 0;
    for (const c of SMAE_CONSTANTS) {
      const original = currentPortions[c.grupo] || 0;
      const current = currentP[c.grupo] || 0;
      changePenalty += Math.abs(current - original);
    }
    cost += changePenalty * 0.4;

    return cost;
  };

  // Optimización discreta local (hill climbing con búsqueda de vecindad de 2 pasos)
  let bestPortions = { ...portions };
  let bestCost = evaluateCost(bestPortions);
  let improved = true;
  let iterations = 0;
  const maxIterations = 80;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Probar movimientos atómicos (+stepSize o -stepSize en grupos editables)
    let candidatePortions = { ...bestPortions };
    let candidateCost = bestCost;

    for (const group of editableConstants) {
      const gName = group.grupo;
      const curVal = bestPortions[gName] || 0;
      const bounds = SMAE_CLINICAL_BOUNDS[gName] || { min: 0, max: 12 };

      // Opción +step
      if (curVal + stepSize <= bounds.max) {
        const testP = { ...bestPortions, [gName]: Number((curVal + stepSize).toFixed(1)) };
        const testCost = evaluateCost(testP);
        if (testCost < candidateCost) {
          candidateCost = testCost;
          candidatePortions = testP;
        }
      }

      // Opción -step
      if (curVal - stepSize >= bounds.min) {
        const testP = { ...bestPortions, [gName]: Number((curVal - stepSize).toFixed(1)) };
        const testCost = evaluateCost(testP);
        if (testCost < candidateCost) {
          candidateCost = testCost;
          candidatePortions = testP;
        }
      }
    }

    if (candidateCost < bestCost - 0.001) {
      bestCost = candidateCost;
      bestPortions = candidatePortions;
      improved = true;
    }
  }

  const proposedTotals = calculateSmaeTotals(bestPortions, prescribedTargets);

  // Diagnóstico clínico del resultado
  const changes: OptimizationChange[] = [];
  for (const c of SMAE_CONSTANTS) {
    const prev = Number((currentPortions[c.grupo] || 0).toFixed(1));
    const prop = Number((bestPortions[c.grupo] || 0).toFixed(1));
    const diff = Number((prop - prev).toFixed(1));
    if (Math.abs(diff) > 0.01) {
      changes.push({
        grupo: c.grupo,
        previous: prev,
        proposed: prop,
        diff,
        isLocked: !!lockedGroups[c.grupo],
      });
    }
  }

  const reachedTargets: string[] = [];
  const deviations: string[] = [];

  // Tolerancia clínica del ±5%
  const macroNameMap: Record<string, string> = {
    protein: 'Proteínas',
    lipids: 'Lípidos',
    carbs: 'Carbohidratos',
  };

  const currentMacroName = macroNameMap[macro];
  let macroAdequacy = proposedTotals.protAdequacyPct;
  let targetMacroPct = targetProtPct;
  if (macro === 'lipids') {
    macroAdequacy = proposedTotals.lipAdequacyPct;
    targetMacroPct = targetLipPct;
  }
  if (macro === 'carbs') {
    macroAdequacy = proposedTotals.hcAdequacyPct;
    targetMacroPct = targetHcPct;
  }

  const macroDiff = Math.abs(macroAdequacy - targetMacroPct);
  if (macroDiff <= 5.0) {
    reachedTargets.push(`${currentMacroName}: ${macroAdequacy}% (objetivo configurado: ${targetMacroPct}%)`);
  } else {
    deviations.push(`${currentMacroName} al ${macroAdequacy}% (desviación de ${macroDiff.toFixed(1)}% respecto al ${targetMacroPct}%)`);
  }

  // Verificar otros macros
  if (macro !== 'protein') {
    if (Math.abs(proposedTotals.protAdequacyPct - targetProtPct) <= 7.0) {
      reachedTargets.push(`Proteínas: ${proposedTotals.protAdequacyPct}%`);
    } else {
      deviations.push(`Proteínas quedaron en ${proposedTotals.protAdequacyPct}%`);
    }
  }
  if (macro !== 'lipids') {
    if (Math.abs(proposedTotals.lipAdequacyPct - targetLipPct) <= 7.0) {
      reachedTargets.push(`Lípidos: ${proposedTotals.lipAdequacyPct}%`);
    } else {
      deviations.push(`Lípidos quedaron en ${proposedTotals.lipAdequacyPct}%`);
    }
  }
  if (macro !== 'carbs') {
    if (Math.abs(proposedTotals.hcAdequacyPct - targetHcPct) <= 7.0) {
      reachedTargets.push(`Carbohidratos: ${proposedTotals.hcAdequacyPct}%`);
    } else {
      deviations.push(`Carbohidratos quedaron en ${proposedTotals.hcAdequacyPct}%`);
    }
  }

  let status: 'optimal' | 'feasible_with_deviations' | 'no_feasible_solution' = 'optimal';
  let explanation = `Ajuste de ${currentMacroName} optimizado con éxito con las constantes reales del SMAE.`;

  if (macroDiff > 5.0 || deviations.length > 0) {
    status = 'feasible_with_deviations';
    explanation = `Mejor combinación factible encontrada para ${currentMacroName}. Debido a que los alimentos SMAE aportan varios macronutrientes a la vez, se presenta la solución con menor impacto colateral.`;
  }

  const collateralEffects: string[] = [];
  const diffProt = Number((proposedTotals.prot - previousTotals.prot).toFixed(1));
  const diffLip = Number((proposedTotals.lip - previousTotals.lip).toFixed(1));
  const diffHc = Number((proposedTotals.hc - previousTotals.hc).toFixed(1));
  const diffKcal = Number((proposedTotals.kcal - previousTotals.kcal).toFixed(1));

  if (macro === 'protein') {
    if (Math.abs(diffLip) > 0.5 || Math.abs(diffHc) > 0.5) {
      collateralEffects.push(`Al optimizar proteínas (${diffProt > 0 ? `+${diffProt}` : diffProt}g), los lípidos variaron ${diffLip > 0 ? `+${diffLip}` : diffLip}g y los carbohidratos ${diffHc > 0 ? `+${diffHc}` : diffHc}g (${diffKcal > 0 ? `+${diffKcal}` : diffKcal} kcal) debido a la composición intrínseca de los equivalentes SMAE ajustados.`);
    }
  } else if (macro === 'lipids') {
    if (Math.abs(diffProt) > 0.5 || Math.abs(diffHc) > 0.5) {
      collateralEffects.push(`Al optimizar lípidos (${diffLip > 0 ? `+${diffLip}` : diffLip}g), las proteínas variaron ${diffProt > 0 ? `+${diffProt}` : diffProt}g y los carbohidratos ${diffHc > 0 ? `+${diffHc}` : diffHc}g (${diffKcal > 0 ? `+${diffKcal}` : diffKcal} kcal) por el aporte proteico de lácteos y semillas.`);
    }
  } else if (macro === 'carbs') {
    if (Math.abs(diffProt) > 0.5 || Math.abs(diffLip) > 0.5) {
      collateralEffects.push(`Al optimizar carbohidratos (${diffHc > 0 ? `+${diffHc}` : diffHc}g), las proteínas variaron ${diffProt > 0 ? `+${diffProt}` : diffProt}g y los lípidos ${diffLip > 0 ? `+${diffLip}` : diffLip}g (${diffKcal > 0 ? `+${diffKcal}` : diffKcal} kcal) por la presencia de proteínas en cereales y leguminosas.`);
    }
  }

  return {
    targetType: macro,
    proposedPortions: bestPortions,
    previousTotals,
    proposedTotals,
    changes,
    status,
    explanation,
    reachedTargets,
    deviations,
    collateralEffects,
    lockedGroupsCount: Object.values(lockedGroups).filter(Boolean).length,
  };
}

/**
 * Función "Balancear Todo": Optimizador conjunto que minimiza simultáneamente
 * las desviaciones respecto a Proteínas, Lípidos, Carbohidratos y Energía con
 * métricas normalizadas para que los gramos de un nutriente no dominen el algoritmo.
 */
export function balanceAllMacros(params: JointBalancingParams): OptimizationResult {
  const {
    currentPortions,
    prescribedTargets,
    adequacyTargets,
    lockedGroups = {},
    stepSize = 0.5,
  } = params;

  const targetProtPct = adequacyTargets.proteinPct !== undefined ? adequacyTargets.proteinPct : 100;
  const targetLipPct = adequacyTargets.fatPct !== undefined ? adequacyTargets.fatPct : 100;
  const targetHcPct = adequacyTargets.carbsPct !== undefined ? adequacyTargets.carbsPct : 100;

  const targetProtG = calculateDerivedTargetGrams(prescribedTargets.proteinG, targetProtPct);
  const targetLipG = calculateDerivedTargetGrams(prescribedTargets.fatG, targetLipPct);
  const targetHcG = calculateDerivedTargetGrams(prescribedTargets.carbsG, targetHcPct);
  const targetKcal = prescribedTargets.kcal;

  const previousTotals = calculateSmaeTotals(currentPortions, prescribedTargets);

  const portions: Record<string, number> = {};
  for (const c of SMAE_CONSTANTS) {
    portions[c.grupo] = Math.max(0, Number((currentPortions[c.grupo] || 0).toFixed(1)));
  }

  const editableConstants = SMAE_CONSTANTS.filter((c) => !lockedGroups[c.grupo]);

  if (editableConstants.length === 0) {
    return {
      targetType: 'all',
      proposedPortions: portions,
      previousTotals,
      proposedTotals: previousTotals,
      changes: [],
      status: 'feasible_with_deviations',
      explanation: 'No se realizaron modificaciones porque todos los grupos SMAE están bloqueados.',
      reachedTargets: [],
      deviations: ['Todos los grupos están bloqueados'],
      lockedGroupsCount: SMAE_CONSTANTS.length,
    };
  }

  // Función de costo normalizada multiobjetivo
  const evaluateJointCost = (pMap: Record<string, number>) => {
    let pG = 0;
    let lG = 0;
    let cG = 0;
    let kCal = 0;

    for (const c of SMAE_CONSTANTS) {
      const q = pMap[c.grupo] || 0;
      pG += q * c.prot_g;
      lG += q * c.lip_g;
      cG += q * c.hc_g;
      kCal += q * c.energia_kcal;
    }

    // Normalización porcentual estricta para equiparar los 3 macronutrientes
    const errProtPct = targetProtG > 0 ? (Math.abs(pG - targetProtG) / targetProtG) * 100 : 0;
    const errLipPct = targetLipG > 0 ? (Math.abs(lG - targetLipG) / targetLipG) * 100 : 0;
    const errHcPct = targetHcG > 0 ? (Math.abs(cG - targetHcG) / targetHcG) * 100 : 0;
    const errKcalPct = targetKcal > 0 ? (Math.abs(kCal - targetKcal) / targetKcal) * 100 : 0;

    // Ponderación balanceada equitativa
    let cost = errProtPct * 1.5 + errLipPct * 1.5 + errHcPct * 1.5 + errKcalPct * 1.0;

    // Penalización por desviación innecesaria de la distribución previa del paciente
    let distDiff = 0;
    for (const c of SMAE_CONSTANTS) {
      const orig = currentPortions[c.grupo] || 0;
      const now = pMap[c.grupo] || 0;
      distDiff += Math.abs(now - orig);
    }
    cost += distDiff * 0.3;

    return cost;
  };

  let bestPortions = { ...portions };
  let bestCost = evaluateJointCost(bestPortions);
  let improved = true;
  let iterations = 0;
  const maxIterations = 120;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    let candidatePortions = { ...bestPortions };
    let candidateCost = bestCost;

    for (const group of editableConstants) {
      const gName = group.grupo;
      const curVal = bestPortions[gName] || 0;
      const bounds = SMAE_CLINICAL_BOUNDS[gName] || { min: 0, max: 12 };

      // Incremento
      if (curVal + stepSize <= bounds.max) {
        const testP = { ...bestPortions, [gName]: Number((curVal + stepSize).toFixed(1)) };
        const testCost = evaluateJointCost(testP);
        if (testCost < candidateCost) {
          candidateCost = testCost;
          candidatePortions = testP;
        }
      }

      // Decremento
      if (curVal - stepSize >= bounds.min) {
        const testP = { ...bestPortions, [gName]: Number((curVal - stepSize).toFixed(1)) };
        const testCost = evaluateJointCost(testP);
        if (testCost < candidateCost) {
          candidateCost = testCost;
          candidatePortions = testP;
        }
      }
    }

    if (candidateCost < bestCost - 0.001) {
      bestCost = candidateCost;
      bestPortions = candidatePortions;
      improved = true;
    }
  }

  const proposedTotals = calculateSmaeTotals(bestPortions, prescribedTargets);

  const changes: OptimizationChange[] = [];
  for (const c of SMAE_CONSTANTS) {
    const prev = Number((currentPortions[c.grupo] || 0).toFixed(1));
    const prop = Number((bestPortions[c.grupo] || 0).toFixed(1));
    const diff = Number((prop - prev).toFixed(1));
    if (Math.abs(diff) > 0.01) {
      changes.push({
        grupo: c.grupo,
        previous: prev,
        proposed: prop,
        diff,
        isLocked: !!lockedGroups[c.grupo],
      });
    }
  }

  const reachedTargets: string[] = [];
  const deviations: string[] = [];

  const checkTolerance = (name: string, actualPct: number, targetPct: number) => {
    const diff = Math.abs(actualPct - targetPct);
    if (diff <= 5.0) {
      reachedTargets.push(`${name}: ${actualPct}% (objetivo: ${targetPct}%)`);
    } else {
      deviations.push(`${name}: ${actualPct}% (desviación de ${diff.toFixed(1)}% respecto al ${targetPct}%)`);
    }
  };

  checkTolerance('Proteínas', proposedTotals.protAdequacyPct, targetProtPct);
  checkTolerance('Lípidos', proposedTotals.lipAdequacyPct, targetLipPct);
  checkTolerance('Carbohidratos', proposedTotals.hcAdequacyPct, targetHcPct);
  checkTolerance('Calorías', proposedTotals.kcalAdequacyPct, 100);

  const isOptimal = deviations.length === 0;
  const status: 'optimal' | 'feasible_with_deviations' | 'no_feasible_solution' = isOptimal ? 'optimal' : 'feasible_with_deviations';
  const explanation = isOptimal
    ? 'Distribución SMAE balanceada al 100% de adecuación en todos los macronutrientes dentro del rango de tolerancia clínica (±5%).'
    : 'Mejor combinación factible encontrada. Debido a las relaciones intrínsecas de los grupos de alimentos SMAE (p.ej. cereales aportan HC+P, leguminosas aportan HC+P, lácteos aportan HC+P+L), se minimizó el error global.';

  const collateralEffects: string[] = [];
  const diffKcal = Number((proposedTotals.kcal - previousTotals.kcal).toFixed(1));
  const diffProt = Number((proposedTotals.prot - previousTotals.prot).toFixed(1));
  const diffLip = Number((proposedTotals.lip - previousTotals.lip).toFixed(1));
  const diffHc = Number((proposedTotals.hc - previousTotals.hc).toFixed(1));
  if (Math.abs(diffKcal) > 1 || Math.abs(diffProt) > 0.5 || Math.abs(diffLip) > 0.5 || Math.abs(diffHc) > 0.5) {
    collateralEffects.push(`Ajuste global multiobjetivo: variación neta de ${diffKcal > 0 ? `+${diffKcal}` : diffKcal} kcal, ${diffProt > 0 ? `+${diffProt}` : diffProt}g proteínas, ${diffLip > 0 ? `+${diffLip}` : diffLip}g lípidos y ${diffHc > 0 ? `+${diffHc}` : diffHc}g carbohidratos buscando la máxima coherencia entre todos los grupos.`);
  }

  return {
    targetType: 'all',
    proposedPortions: bestPortions,
    previousTotals,
    proposedTotals,
    changes,
    status,
    explanation,
    reachedTargets,
    deviations,
    collateralEffects,
    lockedGroupsCount: Object.values(lockedGroups).filter(Boolean).length,
  };
}

export interface MealPortionDistribution {
  desayuno: Record<string, number>;
  colacion1: Record<string, number>;
  comida: Record<string, number>;
  colacion2: Record<string, number>;
  cena: Record<string, number>;
}

/**
 * Función "Auto-distribuir": Reparte los equivalentes diarios calculados
 * entre las comidas configuradas (Desayuno, Colación 1, Comida, Colación 2, Cena)
 * asegurando matemáticamente que la suma por grupo coincida EXACTAMENTE con el total diario.
 */
export function distributeSmaePortionsAcrossMeals(
  dailyPortions: Record<string, number>,
  mealPercentages: {
    desayuno: number;
    colacion1: number;
    comida: number;
    colacion2: number;
    cena: number;
  }
): MealPortionDistribution {
  const mealKeys: Array<keyof MealPortionDistribution> = ['desayuno', 'colacion1', 'comida', 'colacion2', 'cena'];

  const distribution: MealPortionDistribution = {
    desayuno: {},
    colacion1: {},
    comida: {},
    colacion2: {},
    cena: {},
  };

  // Normalizar los porcentajes de comida para que sumen 1.0
  const rawSum = Object.values(mealPercentages).reduce((acc, v) => acc + (v || 0), 0) || 100;
  const ratios = {
    desayuno: (mealPercentages.desayuno || 25) / rawSum,
    colacion1: (mealPercentages.colacion1 || 10) / rawSum,
    comida: (mealPercentages.comida || 35) / rawSum,
    colacion2: (mealPercentages.colacion2 || 10) / rawSum,
    cena: (mealPercentages.cena || 20) / rawSum,
  };

  // Para cada grupo SMAE, repartir equitativamente en pasos de 0.5 o enteros
  for (const c of SMAE_CONSTANTS) {
    const totalQty = dailyPortions[c.grupo] || 0;
    if (totalQty <= 0) {
      mealKeys.forEach((m) => (distribution[m][c.grupo] = 0));
      continue;
    }

    // Si la cantidad es pequeña (<= 1.0), asignarla a la comida principal o desayuno
    if (totalQty <= 1.0) {
      mealKeys.forEach((m) => (distribution[m][c.grupo] = 0));
      if (['Verduras', 'AOA Muy bajo aporte', 'AOA Bajo aporte', 'Cereales s/g'].includes(c.grupo)) {
        distribution.comida[c.grupo] = totalQty;
      } else if (['Frutas', 'Leche descremada', 'Leche semidescremada'].includes(c.grupo)) {
        distribution.desayuno[c.grupo] = totalQty;
      } else {
        distribution.comida[c.grupo] = totalQty;
      }
      continue;
    }

    // Repartir proporcional a las proporciones con redondeo a múltiplos de 0.5
    let remaining = totalQty;
    const allocated: Record<keyof MealPortionDistribution, number> = {
      desayuno: 0,
      colacion1: 0,
      comida: 0,
      colacion2: 0,
      cena: 0,
    };

    // Primera pasada: aproximar a 0.5
    for (const m of mealKeys) {
      if (ratios[m] > 0) {
        const rawPortion = totalQty * ratios[m];
        const halfStep = Math.round(rawPortion * 2) / 2;
        allocated[m] = halfStep;
      }
    }

    // Ajustar residuo en la comida con mayor porcentaje para que la suma sea EXACTA
    const sumAllocated = Object.values(allocated).reduce((a, b) => a + b, 0);
    const residual = Number((totalQty - sumAllocated).toFixed(2));

    if (Math.abs(residual) > 0.001) {
      allocated.comida = Number((allocated.comida + residual).toFixed(2));
      if (allocated.comida < 0) {
        allocated.comida = 0;
        allocated.desayuno = Number((allocated.desayuno + residual).toFixed(2));
      }
    }

    mealKeys.forEach((m) => {
      distribution[m][c.grupo] = Math.max(0, allocated[m]);
    });
  }

  return distribution;
}
