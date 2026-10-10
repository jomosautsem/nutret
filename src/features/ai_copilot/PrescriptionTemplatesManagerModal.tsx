import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Search,
  Sliders,
  Star,
  Eye,
  EyeOff,
  Edit2,
  Copy,
  Trash2,
  RotateCcw,
  Sparkles,
  Zap,
  Check,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { ClinicalPreset, PRESET_BADGES } from './prescriptionPresetsData';

interface PrescriptionTemplatesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: ClinicalPreset[];
  onSavePresets: (updated: ClinicalPreset[]) => void;
  onOpenCreateNew: () => void;
  onOpenEdit: (preset: ClinicalPreset) => void;
  onResetDefaults: () => void;
}

export const PrescriptionTemplatesManagerModal: React.FC<PrescriptionTemplatesManagerModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSavePresets,
  onOpenCreateNew,
  onOpenEdit,
  onResetDefaults,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    presets.forEach((p) => {
      if (p.badge) set.add(p.badge);
    });
    return Array.from(set);
  }, [presets]);

  // Filtered presets
  const filteredPresets = useMemo(() => {
    return presets
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.badge.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (selectedCategory === 'favorites') return Boolean(p.isFavorite);
        if (selectedCategory === 'visible') return p.isVisibleInQuickBar !== false;
        if (selectedCategory === 'hidden') return p.isVisibleInQuickBar === false;
        if (selectedCategory !== 'all') return p.badge === selectedCategory;

        return true;
      })
      .sort((a, b) => {
        // Favorites first
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [presets, searchTerm, selectedCategory]);

  // If modal is closed, return null AFTER all hooks are called to comply with Rules of Hooks
  if (!isOpen) return null;

  // Toggle favorite star
  const handleToggleFavorite = (presetId: string) => {
    const updated = presets.map((p) =>
      p.id === presetId ? { ...p, isFavorite: !p.isFavorite } : p
    );
    onSavePresets(updated);
  };

  // Toggle 1-Click quick bar visibility
  const handleToggleVisibility = (presetId: string) => {
    const updated = presets.map((p) =>
      p.id === presetId ? { ...p, isVisibleInQuickBar: p.isVisibleInQuickBar === false ? true : false } : p
    );
    onSavePresets(updated);
  };

  // Duplicate / Clone a preset
  const handleDuplicate = (preset: ClinicalPreset) => {
    const clone: ClinicalPreset = {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: `${preset.name} (Copia)`,
      isCustom: true,
      isVisibleInQuickBar: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSavePresets([clone, ...presets]);
  };

  // Delete a preset
  const handleDelete = (presetId: string) => {
    const updated = presets.filter((p) => p.id !== presetId);
    onSavePresets(updated);
    setDeleteConfirmId(null);
  };

  const visibleCount = presets.filter((p) => p.isVisibleInQuickBar !== false).length;
  const favoritesCount = presets.filter((p) => p.isFavorite).length;

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Administrador de Plantillas de Prescripción Rápida</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {visibleCount} visibles en 1-Clic
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Personaliza, crea, activa o desactiva los protocolos clínicos que aparecen en tu barra de 1-Clic.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCreateNew}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Plantilla</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por protocolo, categoría, condición o macro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories / Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todas ({presets.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('favorites')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'favorites'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-slate-200'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Favoritas ({favoritesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('visible')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'visible'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Visibles ({visibleCount})</span>
            </button>
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Cards List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredPresets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Zap className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">No se encontraron plantillas con los filtros seleccionados.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPresets.map((preset) => {
                const isVisible = preset.isVisibleInQuickBar !== false;
                const isFav = Boolean(preset.isFavorite);

                return (
                  <div
                    key={preset.id}
                    className={`p-4 rounded-2xl border transition-all relative group flex flex-col justify-between ${
                      isVisible
                        ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Top bar of card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px]">
                            {preset.badge}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              preset.caloricAdjustmentType === 'deficit_kcal' || preset.caloricAdjustmentType === 'deficit_pct'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : preset.caloricAdjustmentType === 'surplus_kcal' || preset.caloricAdjustmentType === 'surplus_pct'
                                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {preset.caloricAdjustmentType === 'maintenance'
                              ? 'Mantenimiento (0 kcal)'
                              : `${preset.adjustmentValue > 0 ? `+${preset.adjustmentValue}` : preset.adjustmentValue} ${
                                  preset.caloricAdjustmentType.includes('pct') ? '%' : 'kcal'
                                }`}
                          </span>
                          {preset.isCustom && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                              Personalizada
                            </span>
                          )}
                        </div>

                        {/* Quick Favorite & Visibility toggles */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(preset.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isFav
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                                : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                            title={isFav ? 'Quitar de favoritas' : 'Marcar como favorita'}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(preset.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isVisible
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
                                : 'text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800'
                            }`}
                            title={isVisible ? 'Visible en 1-Clic (Clic para ocultar)' : 'Oculto (Clic para mostrar en 1-Clic)'}
                          >
                            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Title & Goal */}
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug mb-1">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
                        {preset.goal}
                      </p>

                      {preset.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                          {preset.description}
                        </p>
                      )}

                      {/* Macros pills */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono font-bold bg-slate-50 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {preset.proteinPct ? `${preset.proteinPct}% VET (${preset.proteinGKg}g/kg)` : `${preset.proteinGKg}g/kg P`}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-600 dark:text-amber-400">
                          {preset.fatPct}% Grasas
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-teal-600 dark:text-teal-400">
                          {preset.carbsPct}% Carbs
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{preset.mealsCount} tomas</span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(preset)}
                          className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-bold cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(preset)}
                          className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-bold cursor-pointer transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Duplicar</span>
                        </button>
                      </div>

                      {deleteConfirmId === preset.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-rose-500 font-bold">¿Borrar?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(preset.id)}
                            className="px-2 py-1 bg-rose-600 text-white font-bold rounded-lg text-[10px] hover:bg-rose-700 cursor-pointer"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(preset.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Factory Reset */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            {showResetConfirm ? (
              <div className="flex items-center gap-2 p-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl">
                <span className="text-rose-700 dark:text-rose-300 font-bold text-[11px]">
                  ¿Restablecer todas las plantillas predeterminadas de fábrica?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onResetDefaults();
                    setShowResetConfirm(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  Confirmar Restauración
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-700 text-[10px] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Restablecer plantillas predeterminadas de fábrica</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
