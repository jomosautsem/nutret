import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  Sun,
  Moon,
  Building2,
  MapPin,
  ChevronDown,
  UserCheck,
  Smartphone,
  Stethoscope,
  Menu,
  User,
  Settings,
  Globe,
  Edit3,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserRole } from '../../types';
import { NetworkStatusBadge } from '../common/NetworkStatusBadge';
import { EditProfileModal } from '../common/EditProfileModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onNavigate?: (view: string) => void;
  onOpenCopilot?: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenNotifications,
  onNavigate,
  onOpenCopilot,
  unreadCount = 2,
}) => {
  const { currentUser, organization, branches, currentBranch, setCurrentBranch, activeRole, switchRole, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const handleToggleMobile = onToggleSidebar || onOpenMobileMenu || (() => {});
  const handleNav = onNavigate || ((view: string) => {});
  const handleCopilot = onOpenCopilot || (() => handleNav('copilot'));

  return (
    <header id="main-header" className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Left side: Hamburger on mobile + Organization & Branch Selector */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-sidebar-toggle"
          onClick={handleToggleMobile}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Organization / Branch Switcher */}
        <div className="relative">
          <button
            id="org-branch-selector-button"
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            {organization.logoUrl ? (
              <div className="w-6 h-6 rounded-lg bg-white p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img src={organization.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {organization.name.charAt(0)}
              </div>
            )}
            <div className="hidden sm:block text-xs">
              <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                {organization.name}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {currentBranch ? currentBranch.name.split('(')[0].trim() : 'Principal'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showOrgDropdown && (
            <div
              id="org-branch-dropdown"
              className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-slide-in"
            >
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sucursales ({branches.length})
              </div>
              {branches.map((b) => (
                <button
                  key={b.id}
                  id={`select-branch-${b.id}`}
                  onClick={() => {
                    setCurrentBranch(b);
                    setShowOrgDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    currentBranch?.id === b.id
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{b.name}</span>
                  </div>
                  {currentBranch?.id === b.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar Trigger (Ctrl+K) */}
      <div className="hidden lg:flex flex-1 max-w-md mx-6">
        <button
          id="global-search-bar-trigger"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Buscar paciente, alimento SMAE, receta, consulta...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right side: Quick AI Copilot, View Switcher (Nutriólogo / Paciente), Network Status, Notifications, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Non-invasive Online / Offline Network Status Badge */}
        <NetworkStatusBadge />

        {/* NutriCopilot Quick Button */}
        <button
          id="header-nutricopilot-button"
          onClick={handleCopilot}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xs hover:shadow-emerald-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>NutriCopilot AI</span>
        </button>

        {/* View Switcher (Nutriólogo view vs App Paciente view) */}
        <div className="relative">
          <button
            id="role-view-switcher-button"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {activeRole === 'PACIENTE' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline font-bold">App Paciente</span>
              </>
            ) : (
              <>
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline font-bold">Nutriólogo</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div
              id="role-view-dropdown"
              className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-slide-in"
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Alternar Vista de Rol
              </div>
              <button
                id="role-switch-nutriologo"
                onClick={() => {
                  switchRole('NUTRIOLOGO');
                  setShowRoleDropdown(false);
                  handleNav('dashboard');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                  activeRole === 'NUTRIOLOGO'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Panel del Nutriólogo</span>
              </button>

              <button
                id="role-switch-paciente"
                onClick={() => {
                  switchRole('PACIENTE');
                  setShowRoleDropdown(false);
                  handleNav('patient_portal');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 mt-1 ${
                  activeRole === 'PACIENTE'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-500" />
                <span>App / Portal del Paciente</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <button
          id="header-notification-button"
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          id="theme-toggle-button"
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Alternar modo claro / oscuro"
        >
          {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile Avatar / Dropdown Trigger */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            id="user-profile-menu-button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
              {currentUser.avatarUrl && currentUser.avatarUrl.startsWith('http') ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.firstName || 'Perfil'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300 uppercase">
                  {(currentUser.firstName?.[0] || 'N')}{(currentUser.lastName?.[0] || '')}
                </span>
              )}
            </div>
            <div className="hidden xl:block text-left text-xs">
              <div className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[140px]">
                {currentUser.firstName} {currentUser.lastName ? currentUser.lastName.split(' ')[0] : ''}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[140px]">
                {currentUser.professionalTitle || currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 hidden sm:block" />
          </button>

          {showUserDropdown && (
            <div
              id="user-profile-dropdown-menu"
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 animate-slide-in"
            >
              {/* Profile Card Header */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-emerald-500/30 bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                  {currentUser.avatarUrl && currentUser.avatarUrl.startsWith('http') ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.firstName || 'Perfil'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300 uppercase">
                      {(currentUser.firstName?.[0] || 'N')}{(currentUser.lastName?.[0] || '')}
                    </span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {currentUser.professionalTitle || 'Nutriólogo'} {currentUser.firstName} {currentUser.lastName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {currentUser.licenseNumber ? `Céd. ${currentUser.licenseNumber}` : currentUser.email}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  id="header-edit-profile-action"
                  onClick={() => {
                    setShowUserDropdown(false);
                    setIsEditProfileOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-emerald-600" />
                  <span>Cambiar Nombre y Datos</span>
                </button>

                <button
                  id="header-goto-settings-action"
                  onClick={() => {
                    setShowUserDropdown(false);
                    handleNav('settings');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Configuración Completa</span>
                </button>

                <button
                  id="header-goto-public-profile-action"
                  onClick={() => {
                    setShowUserDropdown(false);
                    handleNav('public_profile');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Ver Perfil Público Web</span>
                </button>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    id="header-logout-action"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </header>
  );
};
