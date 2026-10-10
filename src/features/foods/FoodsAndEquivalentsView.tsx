import React, { useState, useEffect } from 'react';
import {
  Apple,
  Search,
  Plus,
  Filter,
  Layers,
  Sparkles,
  Info,
  Scale,
  CheckCircle2,
  ChevronRight,
  Flame,
  Wheat,
  Beef,
  Droplet,
  Milk,
  Carrot,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { FoodItem, SmaeGroup } from '../../types';
import { storageService } from '../../lib/storage';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

export const FoodsAndEquivalentsView: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>(() => storageService.getFoods());
  const [smaeGroups, setSmaeGroups] = useState<SmaeGroup[]>(() => storageService.getSmaeGroups());

  useEffect(() => {
    const handleSync = () => {
      setFoods(storageService.getFoods());
      setSmaeGroups(storageService.getSmaeGroups());
    };
    window.addEventListener('nutriluz:db_updated', handleSync);
    return () => window.removeEventListener('nutriluz:db_updated', handleSync);
  }, []);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [isNewFoodModalOpen, setIsNewFoodModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const { showToast } = useToast();

  // Edit Food State
  const [isEditFoodModalOpen, setIsEditFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    equivalentGroupCode: 'VERDURAS',
    servingSize: '1 taza',
    servingWeightG: 100,
    energyKcal: 25,
    proteinG: 2,
    fatG: 0,
    carbsG: 4,
    fiberG: 2,
    glycemicIndex: 'Bajo' as 'Bajo' | 'Medio' | 'Alto',
  });

  // Delete Food State
  const [foodToDelete, setFoodToDelete] = useState<FoodItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Exchange Calculator State
  const [calcSourceFood, setCalcSourceFood] = useState<FoodItem | null>(null);
  const [calcTargetFood, setCalcTargetFood] = useState<FoodItem | null>(null);

  // New Food Form State
  const [newFood, setNewFood] = useState({
    name: '',
    equivalentGroupCode: 'VERDURAS',
    servingSize: '1 taza',
    servingWeightG: 100,
    energyKcal: 25,
    proteinG: 2,
    fatG: 0,
    carbsG: 4,
    fiberG: 2,
    glycemicIndex: 'Bajo' as 'Bajo' | 'Medio' | 'Alto',
  });

  const filteredFoods = foods.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const groupCode = f.equivalentGroupCode || 'OTROS';
    const matchGroup = selectedGroup === 'ALL' || groupCode === selectedGroup;
    return matchSearch && matchGroup;
  });

  const handleCreateFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFood.name) return;

    const item: FoodItem = {
      id: `food-${Date.now()}`,
      organizationId: 'org-demo-1',
      name: newFood.name,
      equivalentGroupCode: newFood.equivalentGroupCode,
      servingSize: newFood.servingSize,
      servingWeightG: Number(newFood.servingWeightG),
      energyKcal: Number(newFood.energyKcal),
      proteinG: Number(newFood.proteinG),
      fatG: Number(newFood.fatG),
      carbsG: Number(newFood.carbsG),
      fiberG: Number(newFood.fiberG),
      glycemicIndex: newFood.glycemicIndex,
      isCustom: true,
    };

    const updated = [item, ...foods];
    setFoods(updated);
    storageService.saveFood(item);
    setIsNewFoodModalOpen(false);
    setNewFood({
      name: '',
      equivalentGroupCode: 'VERDURAS',
      servingSize: '1 taza',
      servingWeightG: 100,
      energyKcal: 25,
      proteinG: 2,
      fatG: 0,
      carbsG: 4,
      fiberG: 2,
      glycemicIndex: 'Bajo',
    });
    showToast('Alimento Creado', `Se ha agregado "${item.name}" a la base de datos de la clínica`, 'success');
  };

  const handleOpenEditModal = (food: FoodItem) => {
    setEditingFood(food);
    setEditFormData({
      name: food.name,
      equivalentGroupCode: food.equivalentGroupCode || 'VERDURAS',
      servingSize: food.servingSize || '1 porción',
      servingWeightG: food.servingWeightG || 100,
      energyKcal: food.energyKcal || 0,
      proteinG: food.proteinG || 0,
      fatG: food.fatG || 0,
      carbsG: food.carbsG || 0,
      fiberG: food.fiberG || 0,
      glycemicIndex: (food.glycemicIndex as any) || 'Bajo',
    });
    setIsEditFoodModalOpen(true);
  };

  const handleUpdateFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood || !editFormData.name) return;

    const updatedItem: FoodItem = {
      ...editingFood,
      name: editFormData.name,
      equivalentGroupCode: editFormData.equivalentGroupCode,
      servingSize: editFormData.servingSize,
      servingWeightG: Number(editFormData.servingWeightG),
      energyKcal: Number(editFormData.energyKcal),
      proteinG: Number(editFormData.proteinG),
      fatG: Number(editFormData.fatG),
      carbsG: Number(editFormData.carbsG),
      fiberG: Number(editFormData.fiberG),
      glycemicIndex: editFormData.glycemicIndex,
    };

    const updatedList = foods.map((f) => (f.id === editingFood.id ? updatedItem : f));
    setFoods(updatedList);
    storageService.saveFood(updatedItem);
    setIsEditFoodModalOpen(false);
    setEditingFood(null);
    showToast('Alimento Actualizado', `Se guardaron los cambios para "${updatedItem.name}"`, 'success');
  };

  const handleOpenDeleteConfirm = (food: FoodItem) => {
    setFoodToDelete(food);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!foodToDelete) return;

    const updatedList = foods.filter((f) => f.id !== foodToDelete.id);
    setFoods(updatedList);
    storageService.deleteFood(foodToDelete.id);
    setIsDeleteModalOpen(false);
    showToast('Alimento Eliminado', `Se ha eliminado "${foodToDelete.name}" de la base de datos`, 'info');
    setFoodToDelete(null);
  };

  const getGroupBadgeColor = (groupCode: string) => {
    switch (groupCode) {
      case 'VERDURAS':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';
      case 'FRUTAS':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200';
      case 'CEREALES_SIN_GRASA':
      case 'CEREALES_CON_GRASA':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200';
      case 'LEGUMINOSAS':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200';
      case 'AOA_MUY_BAJO_GRASA':
      case 'AOA_BAJO_GRASA':
      case 'AOA_MODERADO_GRASA':
      case 'AOA_ALTO_GRASA':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200';
      case 'LECHE_DESCREMADA':
      case 'LECHE_ENTERA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200';
      case 'ACEITES_SIN_PROTEINA':
      case 'ACEITES_CON_PROTEINA':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <div id="foods-smae-view" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Apple className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Base de Alimentos & Sistema de Equivalentes (SMAE)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistema Mexicano de Alimentos Equivalentes oficial, composiciones de macronutrientes e intercambios clínicos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-smae-calc-btn"
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-colors"
          >
            <Scale className="w-4 h-4" />
            <span>Calculadora de Intercambios</span>
          </button>

          <button
            id="new-food-btn"
            onClick={() => setIsNewFoodModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Alimento Personalizado</span>
          </button>
        </div>
      </div>

      {/* SMAE Equivalent Groups Reference Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {smaeGroups.slice(0, 6).map((grp) => (
          <div
            key={grp.id}
            onClick={() => setSelectedGroup(selectedGroup === grp.code ? 'ALL' : grp.code)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedGroup === grp.code
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
            }`}
          >
            <span className="text-[10px] uppercase font-extrabold tracking-wider block opacity-90">
              {grp.name}
            </span>
            <div className="mt-1 text-sm font-extrabold">{grp.avgEnergyKcal ?? (grp as any).averageCalories ?? 0} kcal</div>
            <div className="mt-1 flex items-center justify-between text-[10px] opacity-80 font-medium">
              <span>P: {grp.avgProteinG ?? (grp as any).averageProtein ?? 0}g</span>
              <span>C: {grp.avgCarbsG ?? (grp as any).averageCarbs ?? 0}g</span>
              <span>G: {grp.avgFatG ?? (grp as any).averageLipids ?? 0}g</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="food-search-input"
            type="text"
            placeholder="Buscar por nombre de alimento (ej. Avena, Pechuga de pollo, Manzana, Frijol, Aguacate)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <select
          id="food-group-select"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium w-full sm:w-auto"
        >
          <option value="ALL">Todos los grupos SMAE</option>
          {smaeGroups.map((g) => (
            <option key={g.id} value={g.code}>
              {g.name} ({g.avgEnergyKcal ?? (g as any).averageCalories ?? 0} kcal)
            </option>
          ))}
        </select>
      </div>

      {/* Foods Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Alimento</th>
                <th className="py-3.5 px-4">Grupo SMAE</th>
                <th className="py-3.5 px-4">Porción Sugerida (1 Eq.)</th>
                <th className="py-3.5 px-4">Peso Neto (g)</th>
                <th className="py-3.5 px-4 text-center">Energía</th>
                <th className="py-3.5 px-4 text-center">Proteína</th>
                <th className="py-3.5 px-4 text-center">Carbohidratos</th>
                <th className="py-3.5 px-4 text-center">Lípidos</th>
                <th className="py-3.5 px-4 text-center">Fibra</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFoods.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Apple className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">No se encontraron alimentos</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Prueba con otro término de búsqueda o añade uno nuevo.</p>
                  </td>
                </tr>
              ) : (
                filteredFoods.map((f) => (
                  <tr key={f.id} id={`food-row-${f.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{f.name}</span>
                        {f.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold">
                            CUSTOM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${getGroupBadgeColor(f.equivalentGroupCode || 'VERDURAS')}`}>
                        {(f.equivalentGroupCode || 'VERDURAS').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {f.servingSize}
                    </td>
                    <td className="py-3.5 px-4">{f.servingWeightG || 100} g</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {f.energyKcal} kcal
                    </td>
                    <td className="py-3.5 px-4 text-center">{f.proteinG} g</td>
                    <td className="py-3.5 px-4 text-center">{f.carbsG} g</td>
                    <td className="py-3.5 px-4 text-center">{f.fatG} g</td>
                    <td className="py-3.5 px-4 text-center">{f.fiberG || 0} g</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          id={`edit-food-${f.id}`}
                          onClick={() => handleOpenEditModal(f)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                          title={`Editar "${f.name}"`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`delete-food-${f.id}`}
                          onClick={() => handleOpenDeleteConfirm(f)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title={`Eliminar "${f.name}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exchange Calculator Modal */}
      <Modal
        id="smae-calc-modal"
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        title="Calculadora de Intercambios SMAE"
        subtitle="Calcula la equivalencia exacta de un alimento por otro dentro del mismo grupo"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Selecciona un alimento base y un alimento sustituto para que el algoritmo determine la porción exacta equivalente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alimento a sustituir
              </label>
              <select
                onChange={(e) => {
                  const item = foods.find((f) => f.id === e.target.value);
                  setCalcSourceFood(item || null);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value="">Selecciona alimento...</option>
                {foods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.servingSize})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alimento sustituto sugerido
              </label>
              <select
                onChange={(e) => {
                  const item = foods.find((f) => f.id === e.target.value);
                  setCalcTargetFood(item || null);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value="">Selecciona alimento...</option>
                {foods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.servingSize})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {calcSourceFood && calcTargetFood && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Resultado de Equivalencia SMAE</span>
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                <strong>1 porción de {calcSourceFood.name}</strong> ({calcSourceFood.servingSize}, {calcSourceFood.energyKcal} kcal) equivale nutricionalmente a:
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                👉 {((calcSourceFood.energyKcal / (calcTargetFood.energyKcal || 1))).toFixed(1)}x porción ({calcTargetFood.servingSize}) de {calcTargetFood.name}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* New Food Modal */}
      <Modal
        id="new-food-modal"
        isOpen={isNewFoodModalOpen}
        onClose={() => setIsNewFoodModalOpen(false)}
        title="Crear Alimento Personalizado"
        subtitle="Añade un alimento o producto comercial a la base clínica"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateFood} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Alimento / Marca *
            </label>
            <input
              type="text"
              required
              value={newFood.name}
              onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
              placeholder="Ej. Tostadas de Maíz Horneadas Sanissimo"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grupo SMAE
              </label>
              <select
                value={newFood.equivalentGroupCode}
                onChange={(e) => setNewFood({ ...newFood, equivalentGroupCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              >
                {smaeGroups.map((g) => (
                  <option key={g.id} value={g.code}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Porción (Ej. 2 piezas, 1 taza)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFood.servingSize}
                  onChange={(e) => setNewFood({ ...newFood, servingSize: e.target.value })}
                  placeholder="1 taza / 2 piezas"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                />
                <input
                  type="number"
                  value={newFood.servingWeightG}
                  onChange={(e) => setNewFood({ ...newFood, servingWeightG: Number(e.target.value) })}
                  placeholder="g"
                  title="Peso neto en gramos"
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Calorías (kcal)
              </label>
              <input
                type="number"
                value={newFood.energyKcal}
                onChange={(e) => setNewFood({ ...newFood, energyKcal: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proteína (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={newFood.proteinG}
                onChange={(e) => setNewFood({ ...newFood, proteinG: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Carbos (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={newFood.carbsG}
                onChange={(e) => setNewFood({ ...newFood, carbsG: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grasas (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={newFood.fatG}
                onChange={(e) => setNewFood({ ...newFood, fatG: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewFoodModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer"
            >
              Guardar Alimento
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Food Modal */}
      <Modal
        id="edit-food-modal"
        isOpen={isEditFoodModalOpen}
        onClose={() => {
          setIsEditFoodModalOpen(false);
          setEditingFood(null);
        }}
        title={`Editar Alimento: ${editingFood?.name || ''}`}
        subtitle="Modifica porciones, pesos o aporte de macronutrientes"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateFood} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Alimento / Producto *
            </label>
            <input
              id="edit-food-name"
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="Ej. Pechuga de pollo asada"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grupo SMAE
              </label>
              <select
                id="edit-food-group"
                value={editFormData.equivalentGroupCode}
                onChange={(e) => setEditFormData({ ...editFormData, equivalentGroupCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
              >
                {smaeGroups.map((g) => (
                  <option key={g.id} value={g.code}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Porción & Peso Neto (g)
              </label>
              <div className="flex gap-2">
                <input
                  id="edit-food-serving-size"
                  type="text"
                  value={editFormData.servingSize}
                  onChange={(e) => setEditFormData({ ...editFormData, servingSize: e.target.value })}
                  placeholder="1 taza / 2 piezas"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
                />
                <input
                  id="edit-food-serving-weight"
                  type="number"
                  value={editFormData.servingWeightG}
                  onChange={(e) => setEditFormData({ ...editFormData, servingWeightG: Number(e.target.value) })}
                  placeholder="g"
                  title="Peso neto en gramos"
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Energía (kcal)
              </label>
              <input
                id="edit-food-energy"
                type="number"
                value={editFormData.energyKcal}
                onChange={(e) => setEditFormData({ ...editFormData, energyKcal: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proteína (g)
              </label>
              <input
                id="edit-food-protein"
                type="number"
                step="0.1"
                value={editFormData.proteinG}
                onChange={(e) => setEditFormData({ ...editFormData, proteinG: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Carbos (g)
              </label>
              <input
                id="edit-food-carbs"
                type="number"
                step="0.1"
                value={editFormData.carbsG}
                onChange={(e) => setEditFormData({ ...editFormData, carbsG: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lípidos (g)
              </label>
              <input
                id="edit-food-fat"
                type="number"
                step="0.1"
                value={editFormData.fatG}
                onChange={(e) => setEditFormData({ ...editFormData, fatG: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fibra Dietética (g)
              </label>
              <input
                id="edit-food-fiber"
                type="number"
                step="0.1"
                value={editFormData.fiberG}
                onChange={(e) => setEditFormData({ ...editFormData, fiberG: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Índice Glucémico
              </label>
              <select
                id="edit-food-gi"
                value={editFormData.glycemicIndex}
                onChange={(e) => setEditFormData({ ...editFormData, glycemicIndex: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
              >
                <option value="Bajo">Bajo (≤ 55)</option>
                <option value="Medio">Medio (56 - 69)</option>
                <option value="Alto">Alto (≥ 70)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsEditFoodModalOpen(false);
                setEditingFood(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 cursor-pointer transition-all"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        id="delete-food-modal"
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setFoodToDelete(null);
        }}
        title="Eliminar Alimento"
        subtitle="Confirma si deseas eliminar este alimento de la base clínica"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900 dark:text-rose-200">
                ¿Estás seguro de que deseas eliminar este alimento?
              </p>
              <p className="text-rose-700 dark:text-rose-300/80">
                Se eliminará <strong>"{foodToDelete?.name}"</strong> de la base de datos de alimentos. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {foodToDelete && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">{foodToDelete.name}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{foodToDelete.energyKcal} kcal</span>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Porción: {foodToDelete.servingSize} ({foodToDelete.servingWeightG || 100}g)</span>
                <span>P: {foodToDelete.proteinG}g | C: {foodToDelete.carbsG}g | G: {foodToDelete.fatG}g</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setFoodToDelete(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="confirm-delete-food-btn"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-900/20 cursor-pointer transition-all"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
