/**
 * Motor Clínico Algorítmico y Evaluador Antropométrico SMAE
 * Sistema Mexicano de Alimentos Equivalentes (SMAE)
 * 
 * Procesamiento determinista con precisión matemática estricta:
 * - Antropometría e Indicadores Clínicos (IMC, Peso Teórico OMS)
 * - Estimación de Requerimiento Proteico (0.8 a 2.0 g/kg)
 * - 5 Ecuaciones Predictivas de GEB y GET (Harris-Benedict, Mifflin, Schofield, Fórmulas Rápidas)
 * - Cuadro Dietosintético Determinista
 * - Matriz de Constantes SMAE
 * - Generador de JSON Schema Estricto
 */

export interface ClinicalEngineInput {
  nombre: string;
  sexo: 'Masculino' | 'Femenino';
  edad: number;
  peso: number; // kg
  talla_cm: number; // cm
  factor_actividad?: number; // default: 1.0
  meta_kcal?: number; // Opcional
  distribucion_macros?: {
    hc_pct: number;
    prot_pct: number;
    lip_pct: number;
  };
}

export interface ProteicRequirementItem {
  factor_g_kg: number;
  gramos: number;
}

export interface ClinicalEngineOutput {
  paciente: {
    nombre: string;
    sexo: 'Masculino' | 'Femenino';
    edad: number;
    peso_kg: number;
    talla_cm: number;
    talla_m: number;
    imc: number;
    clasificacion_imc: string;
    peso_teorico_kg: number;
  };
  requerimiento_proteico_g: ProteicRequirementItem[];
  estimaciones_gasto_energetico: {
    factor_actividad_utilizado: number;
    harris_benedict: {
      geb_hombre: number;
      get_hombre: number;
      geb_mujer: number;
      get_mujer: number;
      formula_aplicable_al_sexo: {
        geb: number;
        get: number;
      };
    };
    mifflin_st_jeor: {
      geb_hombre: number;
      get_hombre: number;
      geb_mujer: number;
      get_mujer: number;
      formula_aplicable_al_sexo: {
        geb: number;
        get: number;
      };
    };
    schofield: {
      geb: number;
      get: number;
    };
    formula_rapida_hospitalaria: {
      geb_hombre: number;
    };
    formula_rapida_ambulatoria: {
      geb_hombre: number;
      geb_mujer: number;
      geb_aplicable_al_sexo: number;
    };
  };
  cuadro_dietosintetico: {
    meta_kcal: number;
    macronutrientes: {
      hidratos_de_carbono: {
        porcentaje: number;
        kcal: number;
        gramos: number;
      };
      proteinas: {
        porcentaje: number;
        kcal: number;
        gramos: number;
      };
      lipidos: {
        porcentaje: number;
        kcal: number;
        gramos: number;
      };
    };
  };
}

export interface SmaeConstant {
  grupo: string;
  hc_g: number;
  prot_g: number;
  lip_g: number;
  energia_kcal: number;
}

/**
 * Matriz de Constantes SMAE por Equivalente (Sistema Mexicano de Alimentos Equivalentes)
 */
export const SMAE_CONSTANTS: SmaeConstant[] = [
  { grupo: 'Cereales s/g', hc_g: 15, prot_g: 2, lip_g: 0, energia_kcal: 70 },
  { grupo: 'Cereales c/g', hc_g: 15, prot_g: 2, lip_g: 5, energia_kcal: 115 },
  { grupo: 'Leche descremada', hc_g: 12, prot_g: 9, lip_g: 2, energia_kcal: 95 },
  { grupo: 'Leche semidescremada', hc_g: 12, prot_g: 9, lip_g: 4, energia_kcal: 110 },
  { grupo: 'Leche entera', hc_g: 12, prot_g: 9, lip_g: 8, energia_kcal: 150 },
  { grupo: 'Leche c/azúcar', hc_g: 30, prot_g: 8, lip_g: 5, energia_kcal: 200 },
  { grupo: 'Leguminosas', hc_g: 20, prot_g: 8, lip_g: 1, energia_kcal: 120 },
  { grupo: 'Verduras', hc_g: 4, prot_g: 2, lip_g: 0, energia_kcal: 25 },
  { grupo: 'Grasas c/proteína', hc_g: 3, prot_g: 3, lip_g: 5, energia_kcal: 70 },
  { grupo: 'AOA Muy bajo aporte', hc_g: 0, prot_g: 7, lip_g: 1, energia_kcal: 40 },
  { grupo: 'AOA Bajo aporte', hc_g: 0, prot_g: 7, lip_g: 3, energia_kcal: 55 },
  { grupo: 'AOA Moderado aporte', hc_g: 0, prot_g: 7, lip_g: 5, energia_kcal: 75 },
  { grupo: 'AOA Alto aporte', hc_g: 0, prot_g: 7, lip_g: 8, energia_kcal: 100 },
  { grupo: 'Grasas s/proteína', hc_g: 0, prot_g: 0, lip_g: 5, energia_kcal: 45 },
  { grupo: 'Frutas', hc_g: 15, prot_g: 0, lip_g: 0, energia_kcal: 60 },
  { grupo: 'Azúcares s/grasa', hc_g: 10, prot_g: 0, lip_g: 0, energia_kcal: 40 },
];

/**
 * Clasificación del IMC según criterios de la Organización Mundial de la Salud (OMS)
 */
export function getOmsBmiClassification(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25.0) return 'Normopeso';
  if (bmi < 30.0) return 'Sobrepeso';
  if (bmi < 35.0) return 'Obesidad Grado I';
  if (bmi < 40.0) return 'Obesidad Grado II';
  return 'Obesidad Grado III';
}

/**
 * Calcula con precisión matemática estricta todos los indicadores clínicos
 */
export function computeClinicalEngine(input: ClinicalEngineInput): ClinicalEngineOutput {
  const nombre = input.nombre || 'Paciente';
  const sexo = input.sexo === 'Masculino' ? 'Masculino' : 'Femenino';
  const edad = Number(input.edad) || 30;
  const peso = Number(input.peso) || 70;
  const talla_cm = Number(input.talla_cm) || 165;
  const factor_actividad = Number(input.factor_actividad) > 0 ? Number(input.factor_actividad) : 1.0;

  // A. Antropometría
  // 1. Talla en metros
  const talla_m = Number((talla_cm / 100).toFixed(2));
  // 2. IMC (kg / m²)
  const imc = Number((peso / Math.pow(talla_m, 2)).toFixed(2));
  const clasificacion_imc = getOmsBmiClassification(imc);

  // 3. Peso Teórico (Ideal)
  // Hombre: (talla_m ^ 2) * 23.0
  // Mujer: (talla_m ^ 2) * 21.5
  const peso_teorico_hombre = Number((Math.pow(talla_m, 2) * 23.0).toFixed(2));
  const peso_teorico_mujer = Number((Math.pow(talla_m, 2) * 21.5).toFixed(2));
  const peso_teorico_kg = sexo === 'Masculino' ? peso_teorico_hombre : peso_teorico_mujer;

  // B. Estimación de Gramos de Proteína según Factor (0.8 a 2.0 g/kg)
  const proteinFactors = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0];
  const requerimiento_proteico_g: ProteicRequirementItem[] = proteinFactors.map((f) => ({
    factor_g_kg: f,
    gramos: Number((peso * f).toFixed(2)),
  }));

  // C. Ecuaciones de GEB y GET (GET = GEB * factor_actividad)
  // 1. Harris-Benedict
  // Hombre: 66.5 + (13.75 * peso) + (5.0 * talla_cm) - (6.79 * edad)
  // Mujer: 655.0 + (9.56 * peso) + (1.85 * talla_cm) - (4.68 * edad)
  const hb_geb_hombre = Number((66.5 + 13.75 * peso + 5.0 * talla_cm - 6.79 * edad).toFixed(2));
  const hb_get_hombre = Number((hb_geb_hombre * factor_actividad).toFixed(2));

  const hb_geb_mujer = Number((655.0 + 9.56 * peso + 1.85 * talla_cm - 4.68 * edad).toFixed(2));
  const hb_get_mujer = Number((hb_geb_mujer * factor_actividad).toFixed(2));

  // 2. Mifflin-St. Jeor
  // Hombre: (10.0 * peso) + (6.25 * talla_cm) - (5.0 * edad) + 5.0
  // Mujer: (10.0 * peso) + (6.25 * talla_cm) - (5.0 * edad) - 161.0
  const mif_geb_hombre = Number((10.0 * peso + 6.25 * talla_cm - 5.0 * edad + 5.0).toFixed(2));
  const mif_get_hombre = Number((mif_geb_hombre * factor_actividad).toFixed(2));

  const mif_geb_mujer = Number((10.0 * peso + 6.25 * talla_cm - 5.0 * edad - 161.0).toFixed(2));
  const mif_get_mujer = Number((mif_geb_mujer * factor_actividad).toFixed(2));

  // 3. Schofield
  // GEB = (8.4 * peso) + (4.5 * talla_cm) + 200.0
  const schofield_geb = Number((8.4 * peso + 4.5 * talla_cm + 200.0).toFixed(2));
  const schofield_get = Number((schofield_geb * factor_actividad).toFixed(2));

  // 4. Fórmula Rápida Hospitalaria
  // Hombre: GEB = peso * 30.0
  const hosp_geb_hombre = Number((peso * 30.0).toFixed(2));

  // 5. Fórmula Rápida Ambulatoria
  // Hombre: GEB = peso * 24.0
  // Mujer: GEB = peso * 23.0
  const amb_geb_hombre = Number((peso * 24.0).toFixed(2));
  const amb_geb_mujer = Number((peso * 23.0).toFixed(2));
  const amb_geb_aplicable = sexo === 'Masculino' ? amb_geb_hombre : amb_geb_mujer;

  // D. Cuadro Dietosintético
  // Si no se provee meta_kcal, usar Mifflin-St. Jeor GET aplicable al sexo
  const defaultMetaKcal = Math.round(sexo === 'Masculino' ? mif_get_hombre : mif_get_mujer);
  const meta_kcal = input.meta_kcal !== undefined && input.meta_kcal > 0 ? Math.round(input.meta_kcal) : defaultMetaKcal;

  // Distribución macros (default: 50% HC, 20% Prot, 30% Lip si no se indica)
  const dist = input.distribucion_macros || { hc_pct: 0.5, prot_pct: 0.2, lip_pct: 0.3 };
  const hc_pct = Number(dist.hc_pct.toFixed(2));
  const prot_pct = Number(dist.prot_pct.toFixed(2));
  const lip_pct = Number(dist.lip_pct.toFixed(2));

  // Ecuaciones Cuadro Dietosintético:
  // HC: kcal = ROUND(meta_kcal * hc_pct, 0), gramos = ROUND(kcal / 4.0, 2)
  const hc_kcal = Math.round(meta_kcal * hc_pct);
  const hc_gramos = Number((hc_kcal / 4.0).toFixed(2));

  // Proteína: kcal = ROUND(meta_kcal * prot_pct, 0), gramos = ROUND(kcal / 4.0, 2)
  const prot_kcal = Math.round(meta_kcal * prot_pct);
  const prot_gramos = Number((prot_kcal / 4.0).toFixed(2));

  // Lípidos: kcal = ROUND(meta_kcal * lip_pct, 0), gramos = ROUND(kcal / 9.0, 2)
  const lip_kcal = Math.round(meta_kcal * lip_pct);
  const lip_gramos = Number((lip_kcal / 9.0).toFixed(2));

  return {
    paciente: {
      nombre,
      sexo,
      edad,
      peso_kg: peso,
      talla_cm,
      talla_m,
      imc,
      clasificacion_imc,
      peso_teorico_kg,
    },
    requerimiento_proteico_g,
    estimaciones_gasto_energetico: {
      factor_actividad_utilizado: factor_actividad,
      harris_benedict: {
        geb_hombre: hb_geb_hombre,
        get_hombre: hb_get_hombre,
        geb_mujer: hb_geb_mujer,
        get_mujer: hb_get_mujer,
        formula_aplicable_al_sexo: {
          geb: sexo === 'Masculino' ? hb_geb_hombre : hb_geb_mujer,
          get: sexo === 'Masculino' ? hb_get_hombre : hb_get_mujer,
        },
      },
      mifflin_st_jeor: {
        geb_hombre: mif_geb_hombre,
        get_hombre: mif_get_hombre,
        geb_mujer: mif_geb_mujer,
        get_mujer: mif_get_mujer,
        formula_aplicable_al_sexo: {
          geb: sexo === 'Masculino' ? mif_geb_hombre : mif_geb_mujer,
          get: sexo === 'Masculino' ? mif_get_hombre : mif_get_mujer,
        },
      },
      schofield: {
        geb: schofield_geb,
        get: schofield_get,
      },
      formula_rapida_hospitalaria: {
        geb_hombre: hosp_geb_hombre,
      },
      formula_rapida_ambulatoria: {
        geb_hombre: amb_geb_hombre,
        geb_mujer: amb_geb_mujer,
        geb_aplicable_al_sexo: amb_geb_aplicable,
      },
    },
    cuadro_dietosintetico: {
      meta_kcal,
      macronutrientes: {
        hidratos_de_carbono: {
          porcentaje: hc_pct,
          kcal: hc_kcal,
          gramos: hc_gramos,
        },
        proteinas: {
          porcentaje: prot_pct,
          kcal: prot_kcal,
          gramos: prot_gramos,
        },
        lipidos: {
          porcentaje: lip_pct,
          kcal: lip_kcal,
          gramos: lip_gramos,
        },
      },
    },
  };
}

/**
 * Serializa la salida al JSON estricto formateado sin textos anexos
 */
export function formatClinicalJsonOutput(output: ClinicalEngineOutput): string {
  return JSON.stringify(output, null, 2);
}
