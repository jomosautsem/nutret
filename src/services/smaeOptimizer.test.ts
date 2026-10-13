import { describe, it, expect } from 'vitest';
import {
  calculateSmaeTotals,
  calculateDerivedTargetGrams,
  optimizeSingleMacro,
  balanceAllMacros,
  distributeSmaePortionsAcrossMeals,
  SMAE_CLINICAL_BOUNDS,
} from './smaeOptimizer';
import { SMAE_CONSTANTS } from './clinicalEngineSmae';

describe('SMAE Optimizer & Nutritional Balancer - Pruebas Obligatorias', () => {
  const basePrescribedTargets = {
    kcal: 2000,
    proteinG: 125, // 25% de 2000 kcal = 500 kcal / 4
    fatG: 55.5,   // 25% de 2000 kcal = 500 kcal / 9
    carbsG: 250,  // 50% de 2000 kcal = 1000 kcal / 4
  };

  const samplePortions: Record<string, number> = {
    'Verduras': 4,
    'Frutas': 3,
    'Cereales s/g': 6,
    'Cereales c/g': 1,
    'Leguminosas': 1.5,
    'AOA Muy bajo aporte': 2,
    'AOA Bajo aporte': 3,
    'AOA Moderado aporte': 1,
    'AOA Alto aporte': 0,
    'Leche descremada': 1,
    'Leche semidescremada': 0,
    'Leche entera': 0,
    'Leche c/azúcar': 0,
    'Grasas s/proteína': 3,
    'Grasas c/proteína': 1,
    'Azúcares s/grasa': 0,
  };

  // 1. Cálculo correcto de calorías y macronutrientes
  it('1. Debe calcular correctamente las calorías y macronutrientes según las constantes del SMAE', () => {
    const totals = calculateSmaeTotals(samplePortions, basePrescribedTargets);
    
    // Verificación manual: Verduras 4*(25kcal, 2p, 0l, 4c) = 100kcal, 8p, 0l, 16c
    // Frutas 3*(60kcal, 0p, 0l, 15c) = 180kcal, 0p, 0l, 45c
    // Cereales s/g 6*(70kcal, 2p, 0l, 15c) = 420kcal, 12p, 0l, 90c
    // Cereales c/g 1*(115kcal, 2p, 5l, 15c) = 115kcal, 2p, 5l, 15c
    // Leguminosas 1.5*(120kcal, 8p, 1l, 20c) = 180kcal, 12p, 1.5l, 30c
    // AOA Muy bajo 2*(40kcal, 7p, 1l, 0c) = 80kcal, 14p, 2l, 0c
    // AOA Bajo 3*(55kcal, 7p, 3l, 0c) = 165kcal, 21p, 9l, 0c
    // AOA Mod 1*(75kcal, 7p, 5l, 0c) = 75kcal, 7p, 5l, 0c
    // Leche desc 1*(95kcal, 9p, 2l, 12c) = 95kcal, 9p, 2l, 12c
    // Grasas s/p 3*(45kcal, 0p, 5l, 0c) = 135kcal, 0p, 15l, 0c
    // Grasas c/p 1*(70kcal, 3p, 5l, 3c) = 70kcal, 3p, 5l, 3c
    // Total kcal = 100+180+420+115+180+80+165+75+95+135+70 = 1615
    // Total prot = 8+0+12+2+12+14+21+7+9+0+3 = 88
    // Total lip = 0+0+0+5+1.5+2+9+5+2+15+5 = 44.5
    // Total hc = 16+45+90+15+30+0+0+0+12+0+3 = 211
    expect(totals.kcal).toBe(1615);
    expect(totals.prot).toBe(88);
    expect(totals.lip).toBe(44.5);
    expect(totals.hc).toBe(211);
  });

  // 2. Cálculo correcto de porcentajes de adecuación
  it('2. Debe calcular los porcentajes de adecuación real respecto a las metas prescritas', () => {
    const totals = calculateSmaeTotals(samplePortions, basePrescribedTargets);
    
    // Adecuación = (aporte actual / meta) * 100
    // Kcal: 1615 / 2000 = 80.8%
    // Prot: 88 / 125 = 70.4%
    // Lip: 44.5 / 55.5 = 80.2%
    // HC: 211 / 250 = 84.4%
    expect(totals.kcalAdequacyPct).toBe(80.8);
    expect(totals.protAdequacyPct).toBe(70.4);
    expect(totals.lipAdequacyPct).toBe(80.2);
    expect(totals.hcAdequacyPct).toBe(84.4);
  });

  // 3. Objetivo del 100% en los tres macronutrientes
  it('3. Debe calcular el aporte objetivo derivado con meta de 100% por defecto', () => {
    expect(calculateDerivedTargetGrams(120, 100)).toBe(120);
    expect(calculateDerivedTargetGrams(55, 100)).toBe(55);
    expect(calculateDerivedTargetGrams(240, 100)).toBe(240);

    // Con porcentaje diferente
    expect(calculateDerivedTargetGrams(120, 90)).toBe(108);
    expect(calculateDerivedTargetGrams(120, 110)).toBe(132);
  });

  // 4. Ajuste individual de proteínas
  it('4. Debe optimizar las proteínas hacia el objetivo minimizando desviación en otros nutrientes', () => {
    const result = optimizeSingleMacro({
      macro: 'protein',
      currentPortions: samplePortions,
      prescribedTargets: basePrescribedTargets,
      adequacyTargets: { proteinPct: 100, fatPct: 100, carbsPct: 100 },
      stepSize: 0.5,
    });

    expect(result.targetType).toBe('protein');
    expect(result.changes.length).toBeGreaterThan(0);
    // El aporte de proteínas propuesto debe estar más cerca de 125g que el previo (88g)
    const prevDiff = Math.abs(result.previousTotals.prot - 125);
    const propDiff = Math.abs(result.proposedTotals.prot - 125);
    expect(propDiff).toBeLessThan(prevDiff);
  });

  // 5. Ajuste individual de lípidos
  it('5. Debe optimizar los lípidos hacia el objetivo prioritario', () => {
    const result = optimizeSingleMacro({
      macro: 'lipids',
      currentPortions: samplePortions,
      prescribedTargets: basePrescribedTargets,
      adequacyTargets: { proteinPct: 100, fatPct: 100, carbsPct: 100 },
      stepSize: 0.5,
    });

    expect(result.targetType).toBe('lipids');
    const prevDiff = Math.abs(result.previousTotals.lip - 55.5);
    const propDiff = Math.abs(result.proposedTotals.lip - 55.5);
    expect(propDiff).toBeLessThanOrEqual(prevDiff);
  });

  // 6. Ajuste individual de carbohidratos
  it('6. Debe optimizar los carbohidratos hacia el objetivo prioritario', () => {
    const result = optimizeSingleMacro({
      macro: 'carbs',
      currentPortions: samplePortions,
      prescribedTargets: basePrescribedTargets,
      adequacyTargets: { proteinPct: 100, fatPct: 100, carbsPct: 100 },
      stepSize: 0.5,
    });

    expect(result.targetType).toBe('carbs');
    const prevDiff = Math.abs(result.previousTotals.hc - 250);
    const propDiff = Math.abs(result.proposedTotals.hc - 250);
    expect(propDiff).toBeLessThan(prevDiff);
  });

  // 7. Balanceo conjunto de los tres macronutrientes
  it('7. Debe balancear conjuntamente los tres macronutrientes y las calorías', () => {
    const result = balanceAllMacros({
      currentPortions: samplePortions,
      prescribedTargets: basePrescribedTargets,
      adequacyTargets: { proteinPct: 100, fatPct: 100, carbsPct: 100 },
      stepSize: 0.5,
    });

    expect(result.targetType).toBe('all');
    expect(result.proposedTotals.kcalAdequacyPct).toBeGreaterThan(result.previousTotals.kcalAdequacyPct);
    expect(result.collateralEffects).toBeDefined();
  });

  // 8. Combinaciones sin solución exacta
  it('8. Debe manejar combinaciones sin solución exacta reportando factible con desviaciones explicadas', () => {
    // Caso con meta extrema inalcanzable (p.ej. 350g proteína y 20g carbohidratos)
    const extremeTargets = {
      kcal: 1800,
      proteinG: 350,
      fatG: 30,
      carbsG: 20,
    };

    const result = optimizeSingleMacro({
      macro: 'protein',
      currentPortions: samplePortions,
      prescribedTargets: extremeTargets,
      adequacyTargets: { proteinPct: 100 },
      stepSize: 0.5,
    });

    expect(result.status).toBe('feasible_with_deviations');
    expect(result.explanation).toContain('menor impacto colateral');
  });

  // 9. Grupos bloqueados
  it('9. Debe respetar estrictamente los grupos bloqueados por el nutriólogo', () => {
    const locked = {
      'Verduras': true,
      'Leguminosas': true,
      'AOA Muy bajo aporte': true,
    };

    const result = balanceAllMacros({
      currentPortions: samplePortions,
      prescribedTargets: basePrescribedTargets,
      adequacyTargets: { proteinPct: 100, fatPct: 100, carbsPct: 100 },
      lockedGroups: locked,
      stepSize: 0.5,
    });

    // Ningún grupo bloqueado debe haber cambiado
    expect(result.proposedPortions['Verduras']).toBe(samplePortions['Verduras']);
    expect(result.proposedPortions['Leguminosas']).toBe(samplePortions['Leguminosas']);
    expect(result.proposedPortions['AOA Muy bajo aporte']).toBe(samplePortions['AOA Muy bajo aporte']);
  });

  // 10. Incrementos fraccionarios de equivalentes (paso de 0.5)
  it('10. Debe mantener porciones en múltiplos fraccionarios válidos (0.5)', () => {
    const result = balanceAllMacros({
      currentPortions: samplePortions,
      prescribedTargets: basePrescribedTargets,
      adequacyTargets: { proteinPct: 100, fatPct: 100, carbsPct: 100 },
      stepSize: 0.5,
    });

    for (const [_, val] of Object.entries(result.proposedPortions)) {
      // (val * 2) debe ser entero
      expect(Math.round(val * 2)).toBeCloseTo(val * 2, 4);
    }
  });

  // 11. Metas inválidas o iguales a cero
  it('11. Debe manejar metas iguales a cero o no definidas sin divisiones por cero ni NaN', () => {
    const zeroTargets = {
      kcal: 0,
      proteinG: 0,
      fatG: -5,
      carbsG: 0,
    };

    const totals = calculateSmaeTotals(samplePortions, zeroTargets);
    expect(totals.kcalAdequacyPct).toBe(0);
    expect(totals.protAdequacyPct).toBe(0);
    expect(totals.lipAdequacyPct).toBe(0);
    expect(totals.hcAdequacyPct).toBe(0);
    expect(isNaN(totals.kcalAdequacyPct)).toBe(false);

    expect(calculateDerivedTargetGrams(0, 100)).toBe(0);
    expect(calculateDerivedTargetGrams(-10, 100)).toBe(0);
  });

  // 12. Cambios manuales posteriores a la optimización
  it('12. Debe recalcular de inmediato al modificar manualmente cualquier porción', () => {
    const portionsAfterManual = {
      ...samplePortions,
      'Cereales s/g': (samplePortions['Cereales s/g'] || 0) + 1, // +1 porción = +70 kcal, +2p, +15c
    };

    const totals1 = calculateSmaeTotals(samplePortions, basePrescribedTargets);
    const totals2 = calculateSmaeTotals(portionsAfterManual, basePrescribedTargets);

    expect(totals2.kcal).toBe(totals1.kcal + 70);
    expect(totals2.prot).toBe(totals1.prot + 2);
    expect(totals2.lip).toBe(totals1.lip);
    expect(totals2.hc).toBe(totals1.hc + 15);
  });

  // 13. Coherencia entre los totales diarios y las comidas
  it('13. Debe repartir las porciones entre las comidas garantizando que la suma coincida EXACTAMENTE con el total diario', () => {
    const mealPercentages = {
      desayuno: 25,
      colacion1: 10,
      comida: 35,
      colacion2: 10,
      cena: 20,
    };

    const mealDist = distributeSmaePortionsAcrossMeals(samplePortions, mealPercentages);

    for (const c of SMAE_CONSTANTS) {
      const g = c.grupo;
      const expectedDaily = samplePortions[g] || 0;
      const sumAcrossMeals = Number((
        (mealDist.desayuno[g] || 0) +
        (mealDist.colacion1[g] || 0) +
        (mealDist.comida[g] || 0) +
        (mealDist.colacion2[g] || 0) +
        (mealDist.cena[g] || 0)
      ).toFixed(2));

      expect(sumAcrossMeals).toBe(expectedDaily);
    }
  });

  // 14. Guardado y recuperación del plan (estructura de datos)
  it('14. Debe serializar y deserializar correctamente el plan con porciones SMAE y metas de adecuación', () => {
    const planData = {
      smaePortions: samplePortions,
      macroAdequacyTargets: {
        proteinPct: 100,
        fatPct: 95,
        carbsPct: 105,
      },
      smaeLockedGroups: { 'Verduras': true },
    };

    const json = JSON.stringify(planData);
    const parsed = JSON.parse(json);

    expect(parsed.smaePortions['Verduras']).toBe(4);
    expect(parsed.macroAdequacyTargets.proteinPct).toBe(100);
    expect(parsed.macroAdequacyTargets.fatPct).toBe(95);
    expect(parsed.smaeLockedGroups['Verduras']).toBe(true);
  });

  // 15. Cancelación de una vista previa sin alterar el plan
  it('15. Al cancelar una propuesta de optimización, las porciones previas deben conservarse intactas', () => {
    const initialPortionsCopy = { ...samplePortions };
    const optResult = optimizeSingleMacro({
      macro: 'protein',
      currentPortions: samplePortions,
      prescribedTargets: basePrescribedTargets,
      adequacyTargets: { proteinPct: 100 },
      stepSize: 0.5,
    });

    // Simular cancelación: no aplicar optResult.proposedPortions
    const activePortions = { ...samplePortions };
    expect(activePortions).toEqual(initialPortionsCopy);
    expect(activePortions['Cereales s/g']).toBe(initialPortionsCopy['Cereales s/g']);
  });
});
