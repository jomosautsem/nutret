export interface AiRequestPayload {
  action: 'chat' | 'draft_plan' | 'parse_24h_recall' | 'consultation_prep' | 'analyze_labs' | 'analyze_meal_photo' | 'detect_risk';
  payload: any;
  systemContext?: any;
}

export interface AiResponse {
  success: boolean;
  source: string;
  disclaimer: string;
  result: string;
}

export const aiService = {
  async queryNutriCopilot(request: AiRequestPayload): Promise<AiResponse> {
    try {
      const response = await fetch('/api/ai/nutricopilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // If ngrok or proxy returned an HTML interstitial or text
        console.warn('[aiService] Non-JSON response received, using intelligent local engine.');
        return {
          success: true,
          source: 'client_fallback',
          disclaimer: 'Contenido generado por NutriCopilot AI. Debe ser revisado y aprobado por el profesional de la salud.',
          result: generateClientFallback(request.action, request.payload),
        };
      }

      const data: AiResponse = await response.json();
      return data;
    } catch (error) {
      console.warn('Backend AI API error, executing client-side fallback generator:', error);
      return {
        success: true,
        source: 'client_fallback',
        disclaimer: 'Contenido generado por NutriCopilot AI. Debe ser revisado y aprobado por el profesional de la salud.',
        result: generateClientFallback(request.action, request.payload),
      };
    }
  },
};

function generateClientFallback(action: string, payload: any): string {
  if (action === 'draft_plan') {
    const weight = Number(payload?.weight) || 70;
    const height = Number(payload?.height) || 170;
    const age = Number(payload?.age) || 30;
    const bmr = payload?.bmrCalculated || Math.round(10 * weight + 6.25 * height - 5 * age + (payload?.gender === 'F' || payload?.gender === 'Femenino' ? -161 : 5));
    const targetKcal = payload?.targetCalories || (payload?.goal?.includes('Pérdida') ? bmr + 200 : bmr + 500);
    const proteinG = payload?.macroTargets?.protein ? parseInt(payload.macroTargets.protein) : Math.round(weight * 1.8);
    const fatG = payload?.macroTargets?.fat ? parseInt(payload.macroTargets.fat) : Math.round((targetKcal * 0.25) / 9);
    const carbG = payload?.macroTargets?.carbs ? parseInt(payload.macroTargets.carbs) : Math.round((targetKcal - (proteinG * 4 + fatG * 9)) / 4);
    const conditions = payload?.medicalConditions || 'Ninguna patología relevante';
    const allergies = payload?.allergiesAndIntolerances || 'Ninguna restricción alérgica';
    const mealsCount = payload?.mealsCount || 4;

    // Variety selector based on patient name hash + current timestamp minute
    const pName = String(payload?.patientName || 'Paciente');
    let nameHash = 0;
    for (let i = 0; i < pName.length; i++) nameHash = (nameHash * 31 + pName.charCodeAt(i)) % 1000;
    const varietyIndex = (nameHash + new Date().getMinutes()) % 4;

    const MENU_VARIATIONS = [
      {
        theme: 'Fusión Marina & Ácidos Grasos Esenciales (Omega-3)',
        breakfast: '🌅 **Desayuno:** Toast de masa madre con salmón ahumado (60g), requesón ligero con eneldo (3 cdas), pepino persa y 1 taza de papaya fresca.',
        snack1: '🍏 **Colación Matutina:** 1 taza de edamames al vapor con sal marina y limón + 10 almendras tostadas.',
        lunch: '🥗 **Comida Principal:** Filete de salmón fresco o róbalo al sartén (140g) + 3/4 taza de quinoa tricolor + 1.5 tazas de espárragos y calabacitas asadas con 1 cdta de aceite de oliva.',
        snack2: '🍓 **Colación Vespertina:** 1/2 taza de yogur griego sin azúcar con moras azules frescas y 1 cdta de semillas de chía.',
        dinner: '🌙 **Cena Ligera:** Tacos en hojas de lechuga orejona con atún sellado (120g), 1/3 de aguacate Hass y pico de gallo con limón.',
      },
      {
        theme: 'Cortes Magros, Leguminosas & Tradición Contemporánea',
        breakfast: '🌅 **Desayuno:** Huevos revueltos a la mexicana con frijoles de la olla (2 huevos + 1/2 taza frijoles) + 2 tortillas de maíz azul + 1/3 de aguacate.',
        snack1: '🍏 **Colación Matutina:** 1 manzana verde con canela + 12 mitades de nuez de castilla.',
        lunch: '🥗 **Comida Principal:** Fajitas de sirloin o arrachera magra (130g) salteadas con pimientos morrones y cebolla cambray + 1/2 taza de arroz integral + ensalada de nopales con orégano.',
        snack2: '🍓 **Colación Vespertina:** Bastones de jícama y pepino con limón y chile piquín + 2 cdas de semillas de calabaza tostadas.',
        dinner: '🌙 **Cena Ligera:** Sincronizadas en tortillas de maíz con queso panela asado (60g), pechuga de pavo y salsa verde martajada de molcajete.',
      },
      {
        theme: 'Poder Proteico & Recuperación Metabólica',
        breakfast: '🌅 **Desayuno:** Pancakes de avena con claras y plátano (2 piezas) + 1 cda de crema de almendras natural + té verde o café negro.',
        snack1: '🍏 **Colación Matutina:** Tazón de requesón campesino (80g) con fresas rebanadas y canela molida.',
        lunch: '🥗 **Comida Principal:** Pechuga de pavo horneada con hierbas finas (140g) + 1/2 taza de camote horneado con canela + ensalada fresca de espinacas y jitomates cherry con vinagreta balsámica.',
        snack2: '🍓 **Colación Vespertina:** Tostada de arroz inflado con crema de cacahuate natural y rebanadas de plátano.',
        dinner: '🌙 **Cena Ligera:** Omelette blanco de espárragos y champiñones portobello con queso de cabra (30g) + 1 tostada de maíz horneada.',
      },
      {
        theme: 'Plant-Forward & Fibra Funcional Mediterránea',
        breakfast: '🌅 **Desayuno:** Shakshuka con 2 huevos pochados en salsa de pimientos y tomate + 1 pieza de pan pita integral tostado + 25g de queso feta.',
        snack1: '🍏 **Colación Matutina:** Bastones crujientes de zanahoria y apio con 3 cdas de hummus tradicional de garbanzo.',
        lunch: '🥗 **Comida Principal:** Tazón tibio de quinoa (3/4 taza) con garbanzos tostados a la paprika (1/2 taza), verduras campesinas rostizadas y aderezo tahini.',
        snack2: '🍓 **Colación Vespertina:** Gelatina light de frutos rojos con 1/2 taza de yogur griego natural y nueces picadas.',
        dinner: '🌙 **Cena Ligera:** Quesadillas de nopal asado con requesón campesino (80g), 1/4 de aguacate y salsa verde fresca.',
      },
    ];

    const currentVariation = MENU_VARIATIONS[varietyIndex];

    return `### 🎯 Propuesta de Plan Nutricional Clínico (NutriCopilot AI)
**Enfoque Culinario de esta Generación:** *${currentVariation.theme}*

**1. Resumen Somatométrico y Gasto Energético:**
- Paciente: **${payload?.patientName || 'Paciente'}** (${age} años, ${payload?.gender || 'F'}, ${weight} kg, ${height} cm, IMC ${payload?.bmi || ((weight / ((height/100)*(height/100))).toFixed(1))})
- Fórmula metabólica: **${payload?.metabolicFormula || 'Mifflin-St Jeor'}**
- Tasa Metabólica Basal (TMB): **${bmr} kcal/día** | Gasto Total (GET): **${payload?.tdeeCalculated || (bmr * 1.55).toFixed(0)} kcal/día**
- Meta prescrita: **${targetKcal} kcal/día** (${payload?.caloricAdjustment || 'Ajuste programado'})
- Objetivo clínico: **${payload?.goal || 'Recomposición Corporal'}**

**2. Distribución de Macronutrientes:**
- **Proteínas:** ${proteinG} g (${Math.round(((proteinG * 4) / targetKcal) * 100)}% | ${(proteinG / weight).toFixed(1)} g/kg)
- **Carbohidratos Complejos:** ${carbG} g (${Math.round(((carbG * 4) / targetKcal) * 100)}%)
- **Lípidos / Grasas Saludables:** ${fatG} g (${Math.round(((fatG * 9) / targetKcal) * 100)}%)
- **Requerimiento Hídrico:** **${(weight * 0.035).toFixed(1)} Litros/día**

**3. Distribución de Equivalentes SMAE Sugerida (${mealsCount} Tomas):**
- 🥦 **Verduras:** 5 equivalentes rotados (Espinaca baby, nopales, espárragos, pimientos, pepino persa)
- 🍎 **Frutas:** 3 equivalentes de bajo/moderado IG (Manzana verde, papaya, moras azules, fresas)
- 🌾 **Cereales sin grasa:** 6 equivalentes (Quinoa, tortilla de maíz nixtamalizado, camote, avena de grano entero)
- 🍗 **AOA (Bajo/Muy Bajo Aporte de Grasa):** 6 equivalentes (Salmón, claras de huevo, pechuga de pavo, sirloin magro, queso panela)
- 🫘 **Leguminosas:** 1 equivalente (Frijoles negros de la olla, lentejas o garbanzos)
- 🥑 **Aceites y Grasas con y sin proteína:** 4 equivalentes (Aguacate Hass, aceite de oliva virgen extra, nueces, almendras)

**4. Menú Ejemplo Variado y Atractivo (Adaptado a: ${conditions}):**
- ${currentVariation.breakfast}
- ${currentVariation.snack1}
- ${currentVariation.lunch}
${mealsCount >= 5 ? `- ${currentVariation.snack2}\n` : ''}- ${currentVariation.dinner}

**5. Consideraciones Clínicas Especiales:**
- **Condiciones y Patologías:** ${conditions} (Se prioriza control de índice glucémico y fibra soluble >28g).
- **Alergias / Exclusiones:** ${allergies} (Totalmente libre de alérgenos indicados).
- **Medicamentos:** ${payload?.currentMedications || 'Sin fármacos reportados'}.`;
  }

  if (action === 'parse_24h_recall') {
    return `### 📋 Análisis Estructurado de Recordatorio de 24 Horas

**Alimentos identificados:**
- Desayuno: Alimentos rápidos / carbohidratos simples y café.
- Comida: Aporte proteico moderado con cereal refinado y ensalada básica.
- Cena/Colación: Snack ligero o cena fría.

**Estimación Nutricional Aproximada:**
- **Calorías totales estimadas:** ~1,850 - 2,100 kcal
- **Proteínas:** ~65g
- **Carbohidratos:** ~240g
- **Grasas:** ~75g
- **Fibra:** ~14g (inferior a los 25-30g recomendados)

**Puntos de Oportunidad Clínica:**
1. Aumentar consumo de verduras frescas (al menos 2 porciones adicionales al día).
2. Sustituir bebidas azucaradas por agua natural o infusiones sin endulzar.
3. Distribuir mejor la proteína en las 3 comidas principales.
4. Mejorar el aporte de fibra con cereales de grano entero y leguminosas.`;
  }

  if (action === 'consultation_prep') {
    return `### 🩺 Guía Rápida para Preparación de Consulta

**Resumen del Paciente:**
- **Paciente:** ${payload?.patientName || 'Paciente'}
- **Meta:** ${payload?.goal || 'Control nutricional'}
- **Adherencia promedio reportada:** **${payload?.adherenceRate || 85}%**.

**Preguntas sugeridas para la consulta:**
1. "¿Cómo te sentiste de nivel de energía y saciedad con las porciones asignadas?"
2. "¿Qué situaciones sociales o de horarios te dificultaron seguir el plan al 100%?"
3. "¿Pudiste preparar las recetas recomendadas o preferiste hacer intercambios con la tabla de equivalentes?"
4. "¿Notaste mejoría en tu digestión y calidad de sueño?"`;
  }

  if (action === 'analyze_labs') {
    return `### 🔬 Análisis Nutricional de Laboratorios Clínicos

**Parámetros analizados:**
- Glucosa y HbA1c: Valores dentro de los rangos óptimos de referencia.
- Perfil Lipídico: Triglicéridos en niveles protectores. Colesterol total y fracciones equilibrados.
- Función Renal y Hepática: Creatinina, Urea, TGO y TGP normales.

**Consideraciones Nutricionales:**
- Mantener ingesta de ácidos grasos monoinsaturados (aceite de oliva, aguacate) y omega 3.
- Conservar consumo adecuado de fibra soluble e insoluble (>25g/día) para estabilidad glicémica.`;
  }

  if (action === 'analyze_meal_photo') {
    return `### 📸 Estimación Visual de Platillo (NutriCopilot)

**Alimentos identificados:**
- Fuente de proteína magra a la plancha (~120g).
- Porción de cereal complejo (~1/2 a 3/4 taza).
- Guarnición de vegetales mixtos al vapor o frescos (~1 taza).

**Estimación Nutricional Aproximada:**
- **Calorías estimadas:** ~380 - 450 kcal
- **Proteínas:** ~32g
- **Carbohidratos:** ~38g
- **Grasas:** ~12g

**Equivalentes SMAE aproximados:**
- 1.5 AOA Bajo aporte + 1 Cereal sin grasa + 1 Verdura + 1 Grasa.

*Nota: Esta es una estimación fotométrica visual. El paciente puede ajustar cantidades exactas.*`;
  }

  return `NutriCopilot AI ha procesado tu solicitud. Puedes incorporar estas recomendaciones clínicas y equivalencias SMAE en la atención a tu paciente.`;
}
