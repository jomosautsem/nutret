import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/common/CommandPalette';
import { NotificationDrawer } from './components/common/NotificationDrawer';

// Feature Views
import { DashboardView } from './features/dashboard/DashboardView';
import { PatientsListView } from './features/patients/PatientsListView';
import { PatientProfileView } from './features/patients/PatientProfileView';
import { NutritionPlannerView } from './features/planner/NutritionPlannerView';
import { FoodsAndEquivalentsView } from './features/foods/FoodsAndEquivalentsView';
import { RecipesView } from './features/recipes/RecipesView';
import { AgendaView } from './features/agenda/AgendaView';
import { PatientPortalView } from './features/patient_portal/PatientPortalView';
import { NutriCopilotView } from './features/ai_copilot/NutriCopilotView';
import { ChatView } from './features/chat/ChatView';
import { PaymentsView } from './features/payments/PaymentsView';
import { ReportsView } from './features/reports/ReportsView';
import { PublicProfileView } from './features/public_profile/PublicProfileView';
import { SettingsView } from './features/settings/SettingsView';
import { UnifiedLoginView } from './features/auth/UnifiedLoginView';

const AppContent: React.FC = () => {
  const { currentUser, organization, isLoggedIn, isPatientLoggedIn, logout } = useAuth();
  const currentRole = currentUser?.role;
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // If role changes to PACIENTE, default tab to patient_portal
  useEffect(() => {
    if (currentRole === 'PACIENTE') {
      setCurrentTab('patient_portal');
    }
  }, [currentRole]);

  // Global Command+K Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (tab: string, patientId?: string) => {
    setCurrentTab(tab);
    if (patientId) {
      setSelectedPatientId(patientId);
    } else if (tab !== 'patients') {
      setSelectedPatientId(null);
    }
    setIsMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    // If inside Patients tab and a specific patient is selected
    if (currentTab === 'patients' && selectedPatientId) {
      return (
        <PatientProfileView
          patientId={selectedPatientId}
          onBack={() => setSelectedPatientId(null)}
          onNavigate={handleNavigate}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'patients':
        return (
          <PatientsListView
            onSelectPatient={(id) => setSelectedPatientId(id)}
            onNavigate={handleNavigate}
          />
        );
      case 'planner':
        return <NutritionPlannerView />;
      case 'foods':
        return <FoodsAndEquivalentsView />;
      case 'recipes':
        return <RecipesView />;
      case 'agenda':
        return <AgendaView />;
      case 'patient_portal':
        return (
          <PatientPortalView
            onExitPortal={() => handleNavigate('dashboard')}
          />
        );
      case 'copilot':
        return <NutriCopilotView />;
      case 'chat':
        return <ChatView />;
      case 'payments':
        return <PaymentsView />;
      case 'reports':
        return <ReportsView />;
      case 'public_profile':
        return <PublicProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  // If nutritionist is not logged in
  if (!isLoggedIn) {
    // If a patient is logged in via unified login
    if (isPatientLoggedIn) {
      return (
        <div id="patient-portal-standalone" className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 animate-fade-in">
          <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2.5">
              {organization.logoUrl ? (
                <div className="w-8 h-8 rounded-xl bg-white p-0.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center overflow-hidden">
                  <img src={organization.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                </div>
              ) : null}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {organization.name || 'Nutri Luz Elena'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Portal del Paciente
              </span>
            </div>
            <button
              type="button"
              id="standalone-patient-logout-btn"
              onClick={logout}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
          <PatientPortalView onExitPortal={logout} />
        </div>
      );
    }

    // Single unified login for both nutritionist & patients
    return <UnifiedLoginView />;
  }

  return (
    <div id="nutriluz-app" className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedPatientId(null);
          setCurrentTab(tab);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Application Header */}
        <Header
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onToggleSidebar={() => setIsMobileMenuOpen(true)}
          onNavigate={(tab) => handleNavigate(tab)}
          onOpenCopilot={() => setCurrentTab('copilot')}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab, patientId) => handleNavigate(tab, patientId)}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onNavigate={(link) => handleNavigate(link)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
