import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  Flame,
  Tag,
  ChefHat,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Recipe } from '../../types';
import { storageService } from '../../lib/storage';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

export const RecipesView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(() => storageService.getRecipes());

  useEffect(() => {
    const handleSync = () => {
      setRecipes(storageService.getRecipes());
    };
    window.addEventListener('nutriluz:db_updated', handleSync);
    window.addEventListener('nutriluz:recipes_updated', handleSync);
    return () => {
      window.removeEventListener('nutriluz:db_updated', handleSync);
      window.removeEventListener('nutriluz:recipes_updated', handleSync);
    };
  }, []);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const { showToast } = useToast();

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    description: '',
    category: 'Desayuno',
    prepTimeMinutes: 15,
    servings: 1,
    caloriesKcal: 380,
    proteinG: 28,
    carbsG: 34,
    fatG: 12,
    fiberG: 6,
    tags: 'rápido, alto en proteína',
    ingredients: '2 huevos enteros\n2 tortillas de maíz\n1 taza espinacas\n1/3 aguacate',
    instructions: '1. Batir los huevos con las espinacas.\n2. Cocinar a fuego medio con spray.\n3. Servir en tortillas calientes con aguacate.',
    photoUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500',
  });

  const filtered = recipes.filter((r) => {
    const matchSearch =
      `${r.name} ${r.description} ${r.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipe.name) return;

    const ingList = newRecipe.ingredients
      .split('\n')
      .filter((s) => s.trim().length > 0)
      .map((line, idx) => ({
        id: `ing-${idx}`,
        foodName: line.trim(),
        amount: 1,
        unit: 'porción',
      }));

    const stepList = newRecipe.instructions
      .split('\n')
      .filter((s) => s.trim().length > 0)
      .map((line, idx) => ({
        stepNumber: idx + 1,
        instruction: line.replace(/^\d+\.\s*/, '').trim(),
      }));

    const recipe: Recipe = {
      id: `rec-${Date.now()}`,
      organizationId: 'org-demo-1',
      name: newRecipe.name,
      description: newRecipe.description,
      category: newRecipe.category as any,
      prepTimeMinutes: Number(newRecipe.prepTimeMinutes),
      cookTimeMinutes: 10,
      difficulty: 'Fácil',
      servings: Number(newRecipe.servings),
      caloriesKcal: Number(newRecipe.caloriesKcal),
      proteinG: Number(newRecipe.proteinG),
      carbsG: Number(newRecipe.carbsG),
      fatG: Number(newRecipe.fatG),
      fiberG: Number(newRecipe.fiberG),
      tags: newRecipe.tags.split(',').map((t) => t.trim()),
      ingredients: ingList,
      steps: stepList,
      photoUrl: newRecipe.photoUrl,
    };

    const updated = [recipe, ...recipes];
    setRecipes(updated);
    storageService.saveRecipe(recipe);
    setIsNewModalOpen(false);
    showToast('Receta agregada', `Se añadió "${recipe.name}" a la biblioteca`, 'success');
  };

  return (
    <div id="recipes-view" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Biblioteca de Recetas Clínicas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Recetas calculadas por porción con equivalentes SMAE, macros desglosados e instrucciones paso a paso
          </p>
        </div>

        <button
          id="new-recipe-main-btn"
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Receta</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="recipe-search-input"
            type="text"
            placeholder="Buscar recetas por nombre, ingrediente o etiqueta (ej. Bowl, Salmón, Avena, Desayuno)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium w-full sm:w-auto"
        >
          <option value="ALL">Todas las categorías</option>
          <option value="Desayuno">Desayuno</option>
          <option value="Comida">Comida</option>
          <option value="Cena">Cena</option>
          <option value="Snack">Snack / Colación</option>
        </select>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((recipe) => (
          <div
            key={recipe.id}
            id={`recipe-card-${recipe.id}`}
            onClick={() => setSelectedRecipe(recipe)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={recipe.photoUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-md">
                  {recipe.category}
                </div>
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-md">
                  {recipe.caloriesKcal} kcal
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {recipe.prepTimeMinutes} min
                  </span>
                  <span>• {recipe.servings} porción</span>
                </div>

                {/* Macro summary pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold">
                    P: {recipe.proteinG}g
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold">
                    C: {recipe.carbsG}g
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold">
                    G: {recipe.fatG}g
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {recipe.tags.slice(0, 2).map((t, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    #{t}
                  </span>
                ))}
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Ver detalle <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <Modal
          id="recipe-detail-modal"
          isOpen={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          title={selectedRecipe.name}
          subtitle={`${selectedRecipe.category} • ${selectedRecipe.caloriesKcal} kcal • Tiempo: ${selectedRecipe.prepTimeMinutes} min`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-slate-700 dark:text-slate-200">
            <img src={selectedRecipe.photoUrl} alt="" className="w-full h-56 object-cover rounded-2xl" />

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedRecipe.description}
            </p>

            {/* Macros Bar */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Proteína</span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedRecipe.proteinG} g</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Carbohidratos</span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedRecipe.carbsG} g</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Grasas</span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedRecipe.fatG} g</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Fibra</span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedRecipe.fiberG || 4} g</div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Ingredientes & Porciones
              </h4>
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedRecipe.ingredients.map((ing) => (
                  <div key={ing.id} className="flex items-center justify-between">
                    <span>• {ing.foodName} ({ing.amount} {ing.unit})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Instrucciones de Preparación
              </h4>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedRecipe.steps.map((step, idx) => (
                  <p key={idx} className="leading-relaxed">
                    <strong>Paso {step.stepNumber}:</strong> {step.instruction}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Recipe Modal */}
      <Modal
        id="new-recipe-modal"
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Crear Nueva Receta Clínica"
        subtitle="Registra ingredientes, pasos y macros calculados"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateRecipe} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Receta *
              </label>
              <input
                type="text"
                required
                value={newRecipe.name}
                onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                placeholder="Ej. Bowl de Avena con Frutos Rojos"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={newRecipe.category}
                onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              >
                <option value="Desayuno">Desayuno</option>
                <option value="Comida">Comida</option>
                <option value="Cena">Cena</option>
                <option value="Snack">Snack / Colación</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción Breve
            </label>
            <input
              type="text"
              value={newRecipe.description}
              onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
              placeholder="Descripción apetecible y beneficios nutricionales"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Calorías (kcal)
              </label>
              <input
                type="number"
                value={newRecipe.caloriesKcal}
                onChange={(e) => setNewRecipe({ ...newRecipe, caloriesKcal: Number(e.target.value) })}
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
                value={newRecipe.proteinG}
                onChange={(e) => setNewRecipe({ ...newRecipe, proteinG: Number(e.target.value) })}
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
                value={newRecipe.carbsG}
                onChange={(e) => setNewRecipe({ ...newRecipe, carbsG: Number(e.target.value) })}
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
                value={newRecipe.fatG}
                onChange={(e) => setNewRecipe({ ...newRecipe, fatG: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ingredientes (1 por línea)
              </label>
              <textarea
                rows={4}
                value={newRecipe.ingredients}
                onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instrucciones (1 por línea)
              </label>
              <textarea
                rows={4}
                value={newRecipe.instructions}
                onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20"
            >
              Guardar Receta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
