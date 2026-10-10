import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Sliders,
  Sparkles,
  Flame,
  Utensils,
  HeartPulse,
  AlertTriangle,
  FileText,
  Star,
  Eye,
  Check,
} from 'lucide-react';
import { ClinicalPreset, PRESET_BADGES } from './prescriptionPresetsData';

interface PrescriptionTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetToEdit?: ClinicalPreset | null;
  onSave: (preset: ClinicalPreset) => void;
}

const COMMON_CONDITIONS = [
  'Diabetes Tipo 2',
  'Resistencia a la Insulina',
  'Sobrepeso',
  'Obesidad Grado I',
  'Hipertensión Arterial',
  'Dislipidemia',
  'Hígado Graso (HGNA)',
  'Síndrome de Intestino Irritable (SII)',
  'Gastritis / Reflujo',
  'Síndrome de Ovario Poliquístico (SOP)',
  'Hipotiroidismo',
  'Hiperuricemia / Gota',
];

const COMMON_ALLERGIES = [
  'Lactosa',
  'Lácteos',
  'Gluten / Trigo',
  'Huevo',
  'Mariscos / Pescado',
  'Cacahuates / Frutos Secos',
  'Soya',
];

export const PrescriptionTemplateEditorModal: React.FC<PrescriptionTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  presetToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('Metabólico');
  const [customBadge, setCustomBadge] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [caloricAdjustmentType, setCaloricAdjustmentType] = useState<ClinicalPreset['caloricAdjustmentType']>('deficit_kcal');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(-300);
  const [proteinGKg, setProteinGKg] = useState<number>(1.8);
  const [proteinPct, setProteinPct] = useState<number>(30);
  const [proteinMode, setProteinMode] = useState<'gkg' | 'percent'>('gkg');
  const [fatPct, setFatPct] = useState<number>(25);
  const [carbsPct, setCarbsPct] = useState<number>(45);
  const [dietStyle, setDietStyle] = useState('Omnívora Flexible / Mediterránea');
  const [mealsCount, setMealsCount] = useState<number>(4);
  const [prepStyle, setPrepStyle] = useState('Práctica (<25 min) y Económica');
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState('');
  const [isVisibleInQuickBar, setIsVisibleInQuickBar] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Initialize or reset when modal opens or presetToEdit changes
  useEffect(() => {
    if (presetToEdit) {
      setName(presetToEdit.name || '');
      if (PRESET_BADGES.includes(presetToEdit.badge)) {
        setBadge(presetToEdit.badge);
        setCustomBadge('');
      } else {
        setBadge('Personalizado');
        setCustomBadge(presetToEdit.badge || '');
      }
      setDescription(presetToEdit.description || '');
      setGoal(presetToEdit.goal || '');
      setCaloricAdjustmentType(presetToEdit.caloricAdjustmentType || 'deficit_kcal');
      setAdjustmentValue(presetToEdit.adjustmentValue ?? -300);
      const initialPGKg = presetToEdit.proteinGKg ?? 1.8;
      setProteinGKg(initialPGKg);
      const initialFat = presetToEdit.fatPct ?? 25;
      const initialCarbs = presetToEdit.carbsPct ?? 45;
      setFatPct(initialFat);
      setCarbsPct(initialCarbs);
      const calculatedInitialPct = presetToEdit.proteinPct ?? Math.max(10, Math.min(50, 100 - (initialFat + initialCarbs)));
      setProteinPct(calculatedInitialPct);
      setProteinMode(presetToEdit.proteinMode || 'gkg');
      setDietStyle(presetToEdit.dietStyle || 'Omnívora Flexible / Mediterránea');
      setMealsCount(presetToEdit.mealsCount ?? 4);
      setPrepStyle(presetToEdit.prepStyle || 'Práctica (<25 min) y Económica');
      setConditions(presetToEdit.conditions || []);
      setAllergies(presetToEdit.allergies || []);
      setRecommendations(presetToEdit.recommendations || '');
      setIsVisibleInQuickBar(presetToEdit.isVisibleInQuickBar !== false);
      setIsFavorite(Boolean(presetToEdit.isFavorite));
    } else {
      // New Preset Defaults
      setName('');
      setBadge('Metabólico');
      setCustomBadge('');
      setDescription('');
      setGoal('');
      setCaloricAdjustmentType('deficit_kcal');
      setAdjustmentValue(-300);
      setProteinGKg(1.8);
      setProteinPct(30);
      setProteinMode('gkg');
      setFatPct(25);
      setCarbsPct(45);
      setDietStyle('Omnívora Flexible / Mediterránea');
      setMealsCount(4);
      setPrepStyle('Práctica (<25 min) y Económica');
      setConditions([]);
      setAllergies([]);
      setRecommendations('');
      setIsVisibleInQuickBar(true);
      setIsFavorite(false);
    }
  }, [presetToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleCondition = (cond: string) => {
    setConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const toggleAllergy = (all: string) => {
    setAllergies((prev) =>
      prev.includes(all) ? prev.filter((a) => a !== all) : [...prev, all]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalBadge = badge === 'Personalizado' && customBadge.trim() ? customBadge.trim() : badge;

    const savedPreset: ClinicalPreset = {
      id: presetToEdit ? presetToEdit.id : `preset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      badge: finalBadge,
      description: description.trim(),
      goal: goal.trim() || 'Prescripción Nutricional Personalizada',
      caloricAdjustmentType,
      adjustmentValue: Number(adjustmentValue),
      proteinGKg: Number(proteinGKg),
      proteinPct: Number(proteinPct),
      proteinMode,
      carbsPct: Number(carbsPct),
      fatPct: Number(fatPct),
      dietStyle,
      mealsCount: Number(mealsCount),
      prepStyle,
      conditions,
      allergies,
      recommendations: recommendations.trim(),
      isVisibleInQuickBar,
      isFavorite,
      isCustom: true,
      updatedAt: new Date().toISOString(),
      createdAt: presetToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(savedPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {presetToEdit ? 'Editar Plantilla de Prescripción' : 'Nueva Plantilla de Prescripción Rápida'}
              </h3>
              <p className="text-xs text-slate-500">
                Define parámetros clínicos, macros y recomendaciones para aplicar con 1-clic.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* General Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Nombre del Protocolo / Plantilla <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    isFavorite
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-600 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700'
                  }`}
                  title="Marcar como favorita para priorizar en la lista"
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                  <span>{isFavorite ? 'Favorita' : 'Destacar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVisibleInQuickBar(!isVisibleInQuickBar)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    isVisibleInQuickBar
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-400'
                  }`}
                  title="Mostrar en la barra de 1-Clic"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isVisibleInQuickBar ? 'Visible en 1-Clic' : 'Oculto en 1-Clic'}</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Déficit Agresivo Atletas, Protocolo Cetogénico Clínico, etc."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Categoría / Etiqueta Clínica:
                </label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs"
                >
                  {PRESET_BADGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {badge === 'Personalizado' && (
                  <input
                    type="text"
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    placeholder="Escribe etiqueta personalizada..."
                    className="w-full mt-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Objetivo Nutricional Asociado:
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ej. Pérdida de Grasa y Sensibilidad a la Insulina"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Descripción / Resumen del Protocolo:
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve justificación clínica o características del plan..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          {/* Energy & Caloric Adjustment */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Ajuste Calórico y Balance Energético</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Tipo de Ajuste Calórico:
                </label>
                <select
                  value={caloricAdjustmentType}
                  onChange={(e) => setCaloricAdjustmentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs"
                >
                  <option value="deficit_kcal">Déficit (kcal fijas)</option>
                  <option value="deficit_pct">Déficit (% del GET)</option>
                  <option value="surplus_kcal">Superávit (kcal fijas)</option>
                  <option value="surplus_pct">Superávit (% del GET)</option>
                  <option value="maintenance">Mantenimiento (0 kcal)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Valor del Ajuste:
                </label>
                <input
                  type="number"
                  disabled={caloricAdjustmentType === 'maintenance'}
                  value={caloricAdjustmentType === 'maintenance' ? 0 : adjustmentValue}
                  onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                  placeholder="Ej. -350 ó -15"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Macronutrients Target */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Distribución de Macronutrientes</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Define el aporte de proteína tanto en <strong>% VET</strong> como en <strong>g/kg</strong>.
                </p>
              </div>

              {/* Total VET verification badge */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  Total VET: <strong className={proteinPct + fatPct + carbsPct === 100 ? 'text-emerald-600 font-extrabold' : 'text-amber-500 font-bold'}>{proteinPct + fatPct + carbsPct}%</strong>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">
                  P: {proteinPct}% • G: {fatPct}% • C: {carbsPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Protein Column with Dual Mode (% VET and g/kg) */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Proteína</span>
                  </label>
                  {/* Selector de modo preferente */}
                  <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-md text-[9px] font-semibold border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setProteinMode('percent')}
                      className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        proteinMode === 'percent'
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title="Priorizar ajuste por porcentaje del VET"
                    >
                      % VET
                    </button>
                    <button
                      type="button"
                      onClick={() => setProteinMode('gkg')}
                      className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        proteinMode === 'gkg'
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title="Priorizar prescripción por g por kg de peso"
                    >
                      g/kg
                    </button>
                  </div>
                </div>

                {/* Dual Inputs: % VET and g/kg side by side */}
                <div className="grid grid-cols-2 gap-2 my-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">% VET:</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="50"
                        value={proteinPct}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProteinPct(val);
                          // Sincronizar proporcionalmente g/kg referencial (base 2000 kcal / 70kg)
                          const approxG = Math.round((2000 * (val / 100)) / 4);
                          setProteinGKg(Number((approxG / 70).toFixed(2)));
                        }}
                        className={`w-full text-center px-2 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border font-extrabold text-sm ${
                          proteinMode === 'percent'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 text-emerald-600/80'
                        }`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">g/kg peso:</span>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.8"
                        max="3.5"
                        value={proteinGKg}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProteinGKg(val);
                          // Sincronizar proporcionalmente % VET referencial (base 2000 kcal / 70kg)
                          const approxG = val * 70;
                          const approxPct = Math.round(((approxG * 4) / 2000) * 100);
                          setProteinPct(Math.max(10, Math.min(50, approxPct)));
                        }}
                        className={`w-full text-center px-2 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border font-extrabold text-sm ${
                          proteinMode === 'gkg'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 text-emerald-600/80'
                        }`}
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold pointer-events-none">g/kg</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <span>Modo: <strong>{proteinMode === 'percent' ? '% VET' : 'g/kg'}</strong></span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">~{Math.round(proteinGKg * 70)}g (70kg)</span>
                </div>
              </div>

              {/* Fats Column */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <label className="block text-amber-600 dark:text-amber-400 font-bold text-[11px] mb-1.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Grasas / Lípidos</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">% VET:</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={fatPct}
                      onChange={(e) => setFatPct(Number(e.target.value))}
                      className="w-full text-center px-2 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-extrabold text-sm text-amber-600 dark:text-amber-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60 mt-2">
                  <span>Valor Calórico:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">9 kcal/g</span>
                </div>
              </div>

              {/* Carbohydrates Column */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <label className="block text-teal-600 dark:text-teal-400 font-bold text-[11px] mb-1.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>Carbohidratos</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">% VET:</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      max="80"
                      value={carbsPct}
                      onChange={(e) => setCarbsPct(Number(e.target.value))}
                      className="w-full text-center px-2 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-extrabold text-sm text-teal-600 dark:text-teal-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60 mt-2">
                  <span>Valor Calórico:</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">4 kcal/g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diet Structure & Habits */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
              <span>Estilo Dietético y Tomas de Comida</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Estilo Dietético:</label>
                <select
                  value={dietStyle}
                  onChange={(e) => setDietStyle(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs"
                >
                  <option value="Omnívora Flexible / Mediterránea">Omnívora / Mediterránea</option>
                  <option value="Mediterránea / Bajo Índice Glucémico">Mediterránea / Bajo IG</option>
                  <option value="Vegetariana (Ovolactovegetariana)">Vegetariana</option>
                  <option value="Vegana Estricta / Plant-Based">Vegana Estricta</option>
                  <option value="Baja en FODMAPs / Fácil Digestión">Baja en FODMAPs</option>
                  <option value="Dieta DASH / Cardiosaludable">Dieta DASH</option>
                  <option value="Baja en Carbohidratos / Low Carb">Low Carb</option>
                  <option value="Cetogénica Terapéutica">Cetogénica</option>
                  <option value="Antiinflamatoria / Mediterránea">Antiinflamatoria</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tomas al Día:</label>
                <select
                  value={mealsCount}
                  onChange={(e) => setMealsCount(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
                >
                  <option value={3}>3 Comidas (D, C, C)</option>
                  <option value={4}>4 Comidas (3 + 1 Colación)</option>
                  <option value={5}>5 Comidas (3 + 2 Colaciones)</option>
                  <option value={6}>6 Comidas (Atletas)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Preparación:</label>
                <select
                  value={prepStyle}
                  onChange={(e) => setPrepStyle(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs"
                >
                  <option value="Práctica (<25 min) y Económica">Práctica (&lt;25 min)</option>
                  <option value="Meal Prep">Meal Prep</option>
                  <option value="Recetas Gourmet / Variadas">Gourmet / Variadas</option>
                  <option value="Oficina / Tupper Transportable">Oficina / Tupper</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clinical Conditions & Allergies Auto-Toggled */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>Patologías o Condiciones Clínicas Asociadas (Auto-activables):</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CONDITIONS.map((cond) => {
                  const isSelected = conditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`px-2.5 py-1 rounded-lg font-medium text-[11px] border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Alergias o Exclusiones de la Plantilla:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ALLERGIES.map((all) => {
                  const isSelected = allergies.includes(all);
                  return (
                    <button
                      key={all}
                      type="button"
                      onClick={() => toggleAllergy(all)}
                      className={`px-2.5 py-1 rounded-lg font-medium text-[11px] border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {all}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommendations & Guidelines */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Recomendaciones Clínicas y Guías para el Paciente (Opcional):</span>
            </label>
            <textarea
              rows={3}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Ej. Priorizar consumo de fibra soluble, evitar edulcorantes artificiales, pautas de hidratación y timing de ingestas..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{presetToEdit ? 'Guardar Cambios' : 'Crear Plantilla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
