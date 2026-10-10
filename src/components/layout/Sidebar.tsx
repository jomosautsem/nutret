import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Utensils,
  BookOpen,
  Apple,
  Scale,
  LineChart,
  Dumbbell,
  Pill,
  Activity,
  FileCheck2,
  MessageSquare,
  CreditCard,
  BarChart3,
  Bot,
  Smartphone,
  Settings,
  Globe,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NutriluzEmblem } from '../common/NutriluzLogo';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: 'rose' | 'emerald';
  isSpecial?: boolean;
}

interface MenuSection {
  group: string;
  items: MenuItem[];
}

interface SidebarProps {
  activeView?: string;
  currentTab?: string;
  onNavigate?: (view: string) => void;
  onSelectTab?: (view: string) => void;
  isOpenMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  riskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  currentTab,
  onNavigate,
  onSelectTab,
  isOpenMobile,
  isMobileOpen,
  onCloseMobile,
  riskCount = 2,
}) => {
  const { organization, activeRole, logout } = useAuth();
  const currentActive = currentTab || activeView || 'dashboard';
  const navigateFn = onSelectTab || onNavigate || (() => {});
  const mobileOpen = isMobileOpen ?? isOpenMobile ?? false;

  const clinicalSections: MenuSection[] = [
    {
      group: 'CLÍNICA PRINCIPAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'patients', label: 'Pacientes', icon: Users, badge: riskCount > 0 ? `${riskCount} riesgo` : undefined, badgeColor: 'rose' },
        { id: 'agenda', label: 'Consultas & Agenda', icon: Calendar },
        { id: 'copilot', label: 'NutriCopilot AI', icon: Bot, isSpecial: true },
      ],
    },
    {
      group: 'NUTRICIÓN & PLANES',
      items: [
        { id: 'planner', label: 'Planes Nutricionales', icon: Utensils },
        { id: 'recipes', label: 'Biblioteca de Recetas', icon: BookOpen },
        { id: 'foods', label: 'Alimentos & SMAE', icon: Apple },
      ],
    },
    {
      group: 'GESTIÓN & EXPERIENCIA',
      items: [
        { id: 'chat', label: 'Mensajes & Chat', icon: MessageSquare },
        { id: 'payments', label: 'Pagos & Finanzas', icon: CreditCard },
        { id: 'reports', label: 'Reportes & Analítica', icon: BarChart3 },
        { id: 'patient_portal', label: 'App del Paciente (PWA)', icon: Smartphone },
        { id: 'public_profile', label: 'Página Pública Web', icon: Globe },
        { id: 'settings', label: 'Configuración', icon: Settings },
      ],
    },
  ];

  const patientSections: MenuSection[] = [
    {
      group: 'MI TRATAMIENTO',
      items: [
        { id: 'patient_portal', label: 'Mi Portal & Plan', icon: Smartphone },
        { id: 'recipes', label: 'Recetas Recomendadas', icon: BookOpen },
        { id: 'foods', label: 'Buscador SMAE & Equivalencias', icon: Apple },
        { id: 'chat', label: 'Chat con mi Nutrióloga', icon: MessageSquare },
        { id: 'agenda', label: 'Mis Citas & Consultas', icon: Calendar },
      ],
    },
    {
      group: 'MÁS OPCIONES',
      items: [
        { id: 'dashboard', label: 'Vista de Especialista', icon: LayoutDashboard },
        { id: 'settings', label: 'Ajustes', icon: Settings },
      ],
    },
  ];

  const menuSections = activeRole === 'PACIENTE' ? patientSections : clinicalSections;

  const handleItemClick = (id: string) => {
    navigateFn(id);
    if (mobileOpen) onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-2xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Logo & Name */}
        <div className="h-18 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {organization.logoUrl ? (
              <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center overflow-hidden border border-white/20 shadow-md shrink-0">
                <img
                  src={organization.logoUrl}
                  alt={organization.name || 'Nutri Luz Elena'}
                  className="max-h-full max-w-full object-contain filter drop-shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                <NutriluzEmblem sizePx={40} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{organization.name || 'Nutri Luz Elena'}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Nutrición Clínica & SMAE
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {section.group}
              </div>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentActive === item.id || (currentActive === 'patients' && item.id === 'patients');

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs shadow-emerald-900/40'
                          : item.isSpecial
                          ? 'text-emerald-300 hover:bg-emerald-950/50 hover:text-emerald-200'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                            isActive
                              ? 'text-white'
                              : item.isSpecial
                              ? 'text-emerald-400 animate-pulse'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            item.badgeColor === 'rose'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {item.isSpecial && !isActive && (
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info: Mexican SMAE compliance + Security */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40 space-y-2">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-bold text-slate-200">SMAE Integrado</div>
                <div className="text-[10px] text-slate-400">Nutrición clínica</div>
              </div>
            </div>
          </div>

          <button
            id="sidebar-logout-button"
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer group"
            title="Cerrar sesión de la nutrióloga"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
