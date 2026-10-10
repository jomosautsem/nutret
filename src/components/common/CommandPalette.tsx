import React, { useState, useEffect } from 'react';
import { Search, Users, Calendar, Utensils, BookOpen, Bot, FileText, X, ArrowRight } from 'lucide-react';
import { storageService } from '../../lib/storage';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, param?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [search, setSearch] = useState('');
  const patients = storageService.getPatients();
  const recipes = storageService.getRecipes();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent toggles
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.goal}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRecipes = recipes.filter((r) =>
    `${r.name} ${r.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())
  );

  const quickActions = [
    { label: 'NutriCopilot AI (Asistente)', icon: Bot, view: 'nutricopilot' },
    { label: 'Agenda y Consultas de Hoy', icon: Calendar, view: 'agenda' },
    { label: 'Planificador Nutricional', icon: Utensils, view: 'planner' },
    { label: 'Biblioteca de Recetas', icon: BookOpen, view: 'recipes' },
    { label: 'Base de Alimentos y SMAE', icon: Utensils, view: 'foods' },
    { label: 'Portal Móvil del Paciente', icon: Users, view: 'patient_portal' },
    { label: 'Reportes y Finanzas', icon: FileText, view: 'reports' },
  ];

  return (
    <div
      id="command-palette-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            id="command-palette-input"
            type="text"
            placeholder="Buscar paciente, receta, consulta, alimento o acción... (Ctrl + K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-hidden text-sm text-slate-900 dark:text-white placeholder-slate-400"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-4">
          {/* Quick Actions */}
          <div>
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navegación Rápida
            </div>
            <div className="mt-1 space-y-1">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  id={`cmd-action-${action.view}`}
                  onClick={() => {
                    onNavigate(action.view);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <action.icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                    <span>{action.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Patients Section */}
          {filteredPatients.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pacientes ({filteredPatients.length})
              </div>
              <div className="mt-1 space-y-1">
                {filteredPatients.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    id={`cmd-patient-${p.id}`}
                    onClick={() => {
                      onNavigate('patient_detail', p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={p.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span className="font-medium">{p.firstName} {p.lastName}</span>
                      <span className="text-xs text-slate-400 truncate max-w-xs">{p.goal}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                      {p.adherenceRate}% Adh.
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipes Section */}
          {filteredRecipes.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recetas ({filteredRecipes.length})
              </div>
              <div className="mt-1 space-y-1">
                {filteredRecipes.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    id={`cmd-recipe-${r.id}`}
                    onClick={() => {
                      onNavigate('recipes');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={r.photoUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
                      <span>{r.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">{r.caloriesKcal} kcal</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
