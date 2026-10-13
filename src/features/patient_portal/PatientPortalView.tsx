import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Utensils,
  Droplet,
  Dumbbell,
  Pill,
  Camera,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Award,
  ChevronRight,
  TrendingDown,
  Clock,
  Heart,
  Upload,
  Download,
  ShoppingCart,
  FileText,
  Check,
  Apple,
  Salad,
  Info,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  BookOpen,
  RotateCcw,
  MapPin,
  Video,
  ExternalLink,
  Phone,
  ChefHat,
  Search,
  X,
  Maximize2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Patient, NutritionPlan, NutritionPlanMeal, MealLog, Appointment, AppointmentType, Recipe, UserProfile } from '../../types';
import { storageService } from '../../lib/storage';
import {
  pdfService,
  formatCleanItemDescription,
  getSavedMealPhotos,
  generateDishCanvasThumbnail,
} from '../../lib/pdf';
import { isMobileOrAndroid } from '../../lib/pdfDelivery';

/**
 * Normaliza y formatea la descripción de porción para el paciente en pantalla,
 * asegurando separación limpia, gramajes exactos y que ningún ingrediente (como jitomate o espinacas)
 * carezca de su cantidad o aparezca pegado a títulos de platillos.
 */
function formatPatientPortionOnly(item: { name?: string; portionDescription?: string }): string {
  if (!item) return '';
  let portion = (item.portionDescription || '').trim();
  const name = (item.name || '').trim();

  // Sanitizar si venía pegado un sufijo que duplica el platillo (ej. "... de Huevos revueltos...")
  portion = portion.replace(/\s+de\s+huevos\s+revueltos.*$/i, '');
  portion = portion.replace(/\s+de\s+omelette.*$/i, '');
  portion = portion.replace(/\s+de\s+chilaquiles.*$/i, '');
  portion = portion.replace(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?|\d+\/\d+)\s+/i, '$2 ');

  const lowerName = name.toLowerCase();
  const lowerPortion = portion.toLowerCase();

  // Corrección integral para Huevos revueltos con espinacas y jitomate:
  const isHuevosConEspinacasYJitomate =
    (lowerName.includes('huevos revueltos') && lowerName.includes('espinaca') && lowerName.includes('jitomate')) ||
    (lowerPortion.includes('huevos') && lowerPortion.includes('espinaca') && (lowerName.includes('jitomate') || lowerPortion.includes('jitomate')));

  if (isHuevosConEspinacasYJitomate) {
    let eggsPart = '2 piezas (100g) de huevo entero';
    if (lowerPortion.includes('clara')) {
      eggsPart = '3 claras + 1 huevo entero';
    }
    const spinachPart = '1 taza (60g) de espinacas frescas';
    const tomatoPart = '1/2 pieza (60g) de jitomate saladette picado';
    return `${eggsPart} + ${spinachPart} + ${tomatoPart}`;
  }

  // Normalizar si contiene taza de espinacas
  if (/\b(?:1\s+)?taza\s+espinacas?\b/i.test(portion) && !portion.includes('(60g)')) {
    portion = portion.replace(/\b(?:1\s+)?taza\s+espinacas?\b/i, '1 taza (60g) de espinacas frescas');
  }

  portion = portion.replace(/\s*\+\s*/g, ' + ');
  return portion || '1 porción';
}
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { ExecutivePdfExportModal } from '../../components/ExecutivePdfExportModal';
import { SmaeInfographicBento } from '../../components/SmaeInfographicBento';
import { NutriluzLogo } from '../../components/common/NutriluzLogo';
import { PatientNutritionalRationaleCard } from './PatientNutritionalRationaleCard';

interface PatientPortalViewProps {
  onExitPortal?: () => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({ onExitPortal }) => {
  const { currentUser, organization } = useAuth();
  const { showToast } = useToast();

  const [patients, setPatients] = useState<Patient[]>(() => storageService.getPatients());
  const [activePatientId, setActivePatientId] = useState<string | null>(() => {
    const portalId = storageService.getActivePortalPatientId();
    if (portalId) return portalId;
    const clinicalId = storageService.getActiveClinicalPatientId();
    if (clinicalId) {
      storageService.setActivePortalPatientId(clinicalId);
      return clinicalId;
    }
    return null;
  });
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    return !storageService.getActivePortalPatientId() && !storageService.getActiveClinicalPatientId();
  });

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const currentPatient = activePatientId ? patients.find((p) => p.id === activePatientId) || null : null;

  const [activeSubTab, setActiveSubTab] = useState<'hoy' | 'plan' | 'smae' | 'recetas' | 'fotos' | 'citas'>('hoy');
  const [recipes, setRecipes] = useState<Recipe[]>(() => storageService.getRecipes());
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedRecipeCategory, setSelectedRecipeCategory] = useState<string>('ALL');
  const [selectedRecipeForModal, setSelectedRecipeForModal] = useState<Recipe | null>(null);
  const [isExecutiveExportModalOpen, setIsExecutiveExportModalOpen] = useState(false);
  const [isDownloadingSmae, setIsDownloadingSmae] = useState(false);
  const [isDownloadingRecipesPdf, setIsDownloadingRecipesPdf] = useState(false);

  const specialistProfile: UserProfile = useMemo(() => {
    const found = storageService.getSpecialists().find((s) => s.id === currentPatient?.specialistId);
    if (found) return found;
    if (currentUser) return currentUser;
    return {
      id: 'user-lic-luz-elena',
      organizationId: organization?.id || 'org-nutriluz-mexico',
      email: 'luzelenaalcocer14@gmail.com',
      role: 'NUTRIOLOGO',
      firstName: 'Luz Elena',
      lastName: 'Alcocer',
      professionalTitle: 'Lic. en Nutrición',
      licenseNumber: '15573967',
      specialties: ['Nutrición Clínica', 'Recomposición Corporal', 'Salud Metabólica'],
      publicProfileEnabled: true,
      publicSlug: 'luz-elena-alcocer',
      isActive: true,
      bio: 'Especialista en nutrición personalizada y bienestar integral.',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
  }, [currentPatient, currentUser, organization]);
  const [plans, setPlans] = useState<NutritionPlan[]>(() => {
    const pId = storageService.getActivePortalPatientId();
    return pId ? storageService.getPlansByPatientId(pId) : [];
  });
  const activePlan = plans.find((p) => p.status === 'ACTIVE') || plans[0];

  // Saved photos from PDF / Customizer
  const [customMealPhotos, setCustomMealPhotos] = useState<Record<string, string>>(() => {
    return getSavedMealPhotos(activePlan?.id || '');
  });
  const [zoomedPhoto, setZoomedPhoto] = useState<{
    url: string;
    title: string;
    mealName: string;
    time?: string;
    bullets?: string[];
    isCustom?: boolean;
  } | null>(null);

  // Appointments sync state
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const pId = storageService.getActivePortalPatientId();
    if (!pId) return [];
    const list = storageService.getAppointmentsByPatientId(pId);
    return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  });
  const [isSyncingAppointments, setIsSyncingAppointments] = useState(false);
  const [isRequestApptModalOpen, setIsRequestApptModalOpen] = useState(false);
  const [requestApptData, setRequestApptData] = useState({
    appointmentType: 'SEGUIMIENTO' as AppointmentType,
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time: '10:00',
    notes: 'Revisión y seguimiento mensual de mi plan de alimentación',
  });

  // Re-fetch meal photos when plan changes or event dispatches
  useEffect(() => {
    const handlePhotosUpdate = (e: any) => {
      const photos = e.detail?.photos || getSavedMealPhotos(activePlan?.id || '');
      setCustomMealPhotos(photos);
    };
    window.addEventListener('nutriluz_meal_photos_updated', handlePhotosUpdate);
    window.addEventListener('storage', () => {
      setCustomMealPhotos(getSavedMealPhotos(activePlan?.id || ''));
    });
    return () => {
      window.removeEventListener('nutriluz_meal_photos_updated', handlePhotosUpdate);
    };
  }, [activePlan?.id]);

  // Method to get display photo for any meal (Custom uploaded photo > plan photo > recipe photo > canvas thumbnail)
  const getMealDisplayPhoto = (dayIdx: number, mealIdx: number, meal: NutritionPlanMeal): { url: string; isCustom: boolean } => {
    const key = `${dayIdx}_${mealIdx}`;
    if (meal.photoUrl) {
      return { url: meal.photoUrl, isCustom: true };
    }
    if (activePlan?.customPhotos?.[key]) {
      return { url: activePlan.customPhotos[key], isCustom: true };
    }
    if (customMealPhotos[key]) {
      return { url: customMealPhotos[key], isCustom: true };
    }
    const mainItemName = meal.items?.[0]?.name || meal.name;
    const matchingRecipe = recipes.find(
      (r) => r.name.toLowerCase().trim() === mainItemName.toLowerCase().trim()
    );
    if (matchingRecipe?.photoUrl) {
      return { url: matchingRecipe.photoUrl, isCustom: true };
    }
    const fallbackCanvas = generateDishCanvasThumbnail(mainItemName, meal.name);
    return { url: fallbackCanvas, isCustom: false };
  };

  const syncAppointmentsFromCloud = async (patientId: string) => {
    if (!patientId) return;
    setIsSyncingAppointments(true);
    try {
      const fetched = await storageService.fetchPatientAppointments(patientId);
      if (fetched && fetched.length > 0) {
        setAppointments(fetched.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      }
    } catch (e) {
      console.warn('Could not sync appointments from cloud:', e);
    } finally {
      setIsSyncingAppointments(false);
    }
  };

  const handleRequestAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    const startTime = `${requestApptData.date}T${requestApptData.time}:00`;
    const startObj = new Date(startTime);
    const endObj = new Date(startObj.getTime() + 45 * 60000);
    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      organizationId: organization?.id || 'org-nutriluz-mexico',
      branchId: 'branch-1',
      patientId: currentPatient.id,
      patientName: `${currentPatient.firstName} ${currentPatient.lastName}`.trim(),
      specialistId: currentPatient.specialistId || 'user-lic-luz-elena',
      appointmentType: requestApptData.appointmentType,
      status: 'PENDIENTE',
      startTime: startTime,
      endTime: endObj.toISOString(),
      price: 650,
      currency: 'MXN',
      locationNotes:
        requestApptData.appointmentType === 'ONLINE'
          ? 'Videoconsulta Online (Google Meet / Zoom)'
          : 'Sucursal Polanco (Consultorio 302)',
      consultationSummary: requestApptData.notes,
    };
    storageService.saveAppointment(newApp);
    const updated = [newApp, ...appointments];
    setAppointments(updated);
    setIsRequestApptModalOpen(false);
    showToast('Cita Solicitada', 'Tu cita quedó registrada y tu especialista la revisará en breve.', 'success');
  };

  const lastSyncedPatientIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const handleUpdate = () => {
      setTimeout(() => {
        if (!isMounted) return;
        const list = storageService.getPatients();
        setPatients(list);
        const activeId = storageService.getActivePortalPatientId() || storageService.getActiveClinicalPatientId();
        if (activeId) {
          setActivePatientId(activeId);
          setIsLoggedOut(false);
          setPlans(storageService.getPlansByPatientId(activeId));
          const appts = storageService.getAppointmentsByPatientId(activeId);
          setAppointments(appts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
        } else {
          setActivePatientId(null);
          setIsLoggedOut(true);
          setAppointments([]);
        }
      }, 0);
    };

    window.addEventListener('nutriluz_plan_updated', handleUpdate);
    window.addEventListener('nutriluz:db_updated', handleUpdate);
    window.addEventListener('nutriluz:cloud_synced', handleUpdate);
    window.addEventListener('nutriluz:patient_session_updated', handleUpdate);
    window.addEventListener('nutriluz_appointment_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('nutriluz_plan_updated', handleUpdate);
      window.removeEventListener('nutriluz:db_updated', handleUpdate);
      window.removeEventListener('nutriluz:cloud_synced', handleUpdate);
      window.removeEventListener('nutriluz:patient_session_updated', handleUpdate);
      window.removeEventListener('nutriluz_appointment_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Hydrate plans and appointments when the current patient changes
  useEffect(() => {
    const pId = currentPatient?.id;
    if (pId) {
      setPlans(storageService.getPlansByPatientId(pId));
      const appts = storageService.getAppointmentsByPatientId(pId);
      setAppointments(appts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));

      // Only perform cloud fetch once per patient selection to avoid cycle
      if (lastSyncedPatientIdRef.current !== pId) {
        lastSyncedPatientIdRef.current = pId;
        storageService.fetchPatientPlans(pId).then((fetched) => {
          if (fetched && fetched.length > 0) {
            setPlans(fetched);
          }
        }).catch(() => {});

        storageService.fetchPatientAppointments(pId).then((fetched) => {
          if (fetched && fetched.length > 0) {
            setAppointments(fetched.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
          }
        }).catch(() => {});
      }
    } else {
      setAppointments([]);
      lastSyncedPatientIdRef.current = null;
    }
  }, [currentPatient?.id]);

  // Synchronize meal photos when active plan changes
  useEffect(() => {
    if (activePlan?.id) {
      setCustomMealPhotos(getSavedMealPhotos(activePlan.id));
    }
  }, [activePlan?.id]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('Por favor ingresa tu usuario o correo y contraseña.');
      return;
    }
    const authenticated = storageService.authenticatePatient(loginIdentifier, loginPassword);
    if (authenticated) {
      storageService.setActivePortalPatientId(authenticated.id);
      setActivePatientId(authenticated.id);
      setIsLoggedOut(false);
      setLoginError(null);
      setPlans(storageService.getPlansByPatientId(authenticated.id));
      const appts = storageService.getAppointmentsByPatientId(authenticated.id);
      setAppointments(appts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      setCustomMealPhotos(getSavedMealPhotos(activePlan?.id || ''));
      storageService.fetchPatientPlans(authenticated.id).then((fetched) => {
        if (fetched && fetched.length > 0) {
          setPlans(fetched);
        }
      }).catch(() => {});
      storageService.fetchPatientAppointments(authenticated.id).then((fetched) => {
        if (fetched && fetched.length > 0) {
          setAppointments(fetched.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
        }
      }).catch(() => {});
      showToast('¡Bienvenido(a)!', `Sesión iniciada como ${authenticated.firstName} ${authenticated.lastName}.`, 'success');
    } else {
      setLoginError('Credenciales incorrectas o el acceso del paciente no está habilitado. Verifica con tu nutriólogo.');
      showToast('Error de Acceso', 'Usuario o contraseña no válidos.', 'error');
    }
  };

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      storageService.setActivePortalPatientId(null);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('nutriluz_active_patient_id');
      }

      setActivePatientId(null);
      setIsLoggedOut(true);
      setLoginIdentifier('');
      setLoginPassword('');
      setLoginError(null);
      setPlans([]);
      setAppointments([]);

      showToast('Sesión Cerrada', 'Has salido de tu cuenta de paciente exitosamente.', 'info');
      if (onExitPortal) onExitPortal();
    } catch (err) {
      console.error('Error during patient logout:', err);
      setActivePatientId(null);
      setIsLoggedOut(true);
      showToast('Sesión Cerrada', 'Has salido del portal.', 'info');
      if (onExitPortal) onExitPortal();
    }
  };

  // --- A. Calendario Real & Sincronización Automática ---
  const WEEK_DAYS = useMemo(
    () => [
      { dayOfWeek: 1, shortName: 'Lun', fullName: 'Lunes' },
      { dayOfWeek: 2, shortName: 'Mar', fullName: 'Martes' },
      { dayOfWeek: 3, shortName: 'Mié', fullName: 'Miércoles' },
      { dayOfWeek: 4, shortName: 'Jue', fullName: 'Jueves' },
      { dayOfWeek: 5, shortName: 'Vie', fullName: 'Viernes' },
      { dayOfWeek: 6, shortName: 'Sáb', fullName: 'Sábado' },
      { dayOfWeek: 7, shortName: 'Dom', fullName: 'Domingo' },
    ],
    []
  );

  const getRealTodayDayOfWeek = (): number => {
    const jsDay = new Date().getDay(); // 0: Dom, 1: Lun, ..., 6: Sáb
    return jsDay === 0 ? 7 : jsDay;
  };

  const getDateKeyForDay = (targetDayOfWeek: number): string => {
    const now = new Date();
    const currentJsDay = now.getDay();
    const currentDOW = currentJsDay === 0 ? 7 : currentJsDay;
    const diff = targetDayOfWeek - currentDOW;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Real today day of week (1: Lun ... 7: Dom)
  const [todayDayOfWeek, setTodayDayOfWeek] = useState<number>(getRealTodayDayOfWeek);
  // Selected day in "Mi Día" (starts synchronized with today)
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(getRealTodayDayOfWeek);

  const isViewingToday = selectedDayOfWeek === todayDayOfWeek;
  const currentDateKey = getDateKeyForDay(selectedDayOfWeek);

  // Rollover a las 00:00 hrs: avanza automáticamente al día siguiente
  useEffect(() => {
    const checkMidnightRollover = () => {
      const realToday = getRealTodayDayOfWeek();
      setTodayDayOfWeek((prevToday) => {
        if (prevToday !== realToday) {
          return realToday;
        }
        return prevToday;
      });
      setSelectedDayOfWeek((prevSelected) => {
        if (prevSelected === todayDayOfWeek && todayDayOfWeek !== realToday) {
          return realToday; // Avanzar automáticamente al nuevo día
        }
        return prevSelected;
      });
    };

    const interval = setInterval(checkMidnightRollover, 15000);
    window.addEventListener('focus', checkMidnightRollover);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkMidnightRollover);
    };
  }, []);

  // --- C. Registro Diario Independiente (Checklist por fecha) ---
  const [mealStatus, setMealStatus] = useState<Record<string, boolean>>({});
  const [waterGlasses, setWaterGlasses] = useState<number>(6);
  const targetGlasses = 10; // 2.5L

  // Cargar checklist y agua vinculados a la fecha seleccionada
  useEffect(() => {
    if (!currentPatient?.id) return;

    const mealKey = `nutriluz_patient_meals_${currentPatient.id}_${currentDateKey}`;
    try {
      const saved = localStorage.getItem(mealKey);
      if (saved) {
        setMealStatus(JSON.parse(saved));
      } else {
        setMealStatus({});
      }
    } catch {
      setMealStatus({});
    }

    const waterKey = `nutriluz_patient_water_${currentPatient.id}_${currentDateKey}`;
    try {
      const savedWater = localStorage.getItem(waterKey);
      if (savedWater !== null) {
        setWaterGlasses(Number(savedWater) || 0);
      } else {
        setWaterGlasses(isViewingToday ? 6 : 0);
      }
    } catch {
      setWaterGlasses(0);
    }
  }, [currentPatient?.id, currentDateKey, isViewingToday]);

  const toggleMeal = (mealId: string) => {
    if (!currentPatient?.id) return;
    const isCurrentlyDone = !!mealStatus[mealId];
    const next = !isCurrentlyDone;
    const updated = { ...mealStatus, [mealId]: next };
    setMealStatus(updated);

    const mealKey = `nutriluz_patient_meals_${currentPatient.id}_${currentDateKey}`;
    try {
      localStorage.setItem(mealKey, JSON.stringify(updated));
    } catch {}

    if (next) {
      showToast('¡Excelente!', 'Comida registrada en tu diario clínico', 'success');
    }
  };

  const addWater = () => {
    if (!currentPatient?.id) return;
    if (waterGlasses < targetGlasses + 4) {
      const next = waterGlasses + 1;
      setWaterGlasses(next);
      const waterKey = `nutriluz_patient_water_${currentPatient.id}_${currentDateKey}`;
      try {
        localStorage.setItem(waterKey, String(next));
      } catch {}
      showToast('💧 Vaso Registrado', '+250 ml de agua añadidos a tu meta', 'info');
    }
  };

  // Obtener comidas para el día seleccionado del plan activo
  const currentDayMeals = useMemo(() => {
    if (!activePlan || !activePlan.days || activePlan.days.length === 0) return [];

    // 1. Coincidencia exacta por dayOfWeek (1 = Lun ... 7 = Dom)
    const exact = activePlan.days.find((d) => d.dayOfWeek === selectedDayOfWeek);
    if (exact && exact.meals && exact.meals.length > 0) return exact.meals;

    // 2. Coincidencia por nombre de día
    const dayNames = ['', 'lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
    const targetName = dayNames[selectedDayOfWeek] || '';
    const matchByName = activePlan.days.find(
      (d) => d.dayName && d.dayName.toLowerCase().includes(targetName)
    );
    if (matchByName && matchByName.meals && matchByName.meals.length > 0) return matchByName.meals;

    // 3. Si el plan tiene suficientes días indexados
    if (activePlan.days.length >= selectedDayOfWeek && activePlan.days[selectedDayOfWeek - 1]?.meals?.length) {
      return activePlan.days[selectedDayOfWeek - 1].meals;
    }

    // 4. Modulo fallback seguro
    const fallbackIndex = (selectedDayOfWeek - 1) % activePlan.days.length;
    return activePlan.days[fallbackIndex]?.meals || activePlan.days[0]?.meals || [];
  }, [activePlan, selectedDayOfWeek]);

  const currentDayName = useMemo(() => {
    return WEEK_DAYS.find((w) => w.dayOfWeek === selectedDayOfWeek)?.fullName || 'Hoy';
  }, [WEEK_DAYS, selectedDayOfWeek]);

  const completedMealsCount = useMemo(() => {
    return currentDayMeals.filter((m) => !!mealStatus[m.id]).length;
  }, [currentDayMeals, mealStatus]);

  // Exercise checklist
  const [exerciseDone, setExerciseDone] = useState(false);

  // Photo upload modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  // Download PDF Actions
  const handleDownloadPlanPdf = () => {
    if (!activePlan) {
      showToast('Sin plan asignado', 'Aún no cuentas con un plan nutricional activo para descargar.', 'info');
      return;
    }
    setIsExecutiveExportModalOpen(true);
  };

  const handleDownloadShoppingListPdf = async () => {
    if (!activePlan) {
      showToast('Sin plan asignado', 'Aún no cuentas con un plan para generar la lista de compras.', 'info');
      return;
    }

    const allItems: string[] = [];
    (activePlan.days || []).forEach((d) => {
      (d.meals || []).forEach((m) => {
        (m.items || []).forEach((item) => {
          allItems.push(`${item.name} (${item.portionDescription})`);
        });
      });
    });

    const uniqueItems = Array.from(new Set(allItems));
    await pdfService.generateShoppingListPdf(
      uniqueItems,
      `${currentPatient.firstName} ${currentPatient.lastName}`,
      organization
    );
    if (isMobileOrAndroid()) {
      showToast('Lista de Compras Lista', 'Se ha abierto el menú para guardar o compartir la lista.', 'success');
    } else {
      showToast('Lista de Compras en PDF', 'Tu lista de supermercado organizada ha sido descargada.', 'success');
    }
  };

  const handleDownloadSmaeGuidePdf = async () => {
    if (!activePlan || !currentPatient) {
      showToast('Sin plan asignado', 'Aún no cuentas con un plan nutricional activo para generar la guía SMAE.', 'info');
      return;
    }
    setIsDownloadingSmae(true);
    try {
      const specialist =
        storageService.getSpecialists().find((s) => s.id === currentPatient.specialistId) || currentUser;
      await pdfService.generateSmaeGuidePdf(activePlan, currentPatient, organization, specialist);
      if (isMobileOrAndroid()) {
        showToast('Guía SMAE Lista', 'Se ha abierto el menú para guardar o compartir tu guía.', 'success');
      } else {
        showToast('Guía SMAE Descargada', 'Tu guía médica de equivalencias SMAE se ha generado con éxito.', 'success');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Error', 'No se pudo generar la guía SMAE.', 'error');
    } finally {
      setIsDownloadingSmae(false);
    }
  };

  // Configuración de los 6 botones con paleta clínica diferenciada
  const NAV_TABS = useMemo(
    () => [
      {
        id: 'hoy' as const,
        label: 'Mi Día',
        icon: Flame,
        palette: {
          activeBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-amber-400/40',
          inactiveBg: 'bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/50',
          inactiveBorder: 'border-amber-300/80 dark:border-amber-800/60',
          inactiveText: 'text-amber-900 dark:text-amber-200',
          iconColor: 'text-amber-600 dark:text-amber-400',
        },
      },
      {
        id: 'plan' as const,
        label: 'Plan Completo',
        icon: Utensils,
        palette: {
          activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400/40',
          inactiveBg: 'bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50',
          inactiveBorder: 'border-emerald-300/80 dark:border-emerald-800/60',
          inactiveText: 'text-emerald-900 dark:text-emerald-200',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
      },
      {
        id: 'smae' as const,
        label: 'SMAE',
        icon: Apple,
        palette: {
          activeBg: 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400/40',
          inactiveBg: 'bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100/80 dark:hover:bg-purple-900/50',
          inactiveBorder: 'border-purple-300/80 dark:border-purple-800/60',
          inactiveText: 'text-purple-900 dark:text-purple-200',
          iconColor: 'text-purple-600 dark:text-purple-400',
        },
      },
      {
        id: 'recetas' as const,
        label: 'Recetas',
        icon: ChefHat,
        palette: {
          activeBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-400/40',
          inactiveBg: 'bg-teal-50/70 dark:bg-teal-950/30 hover:bg-teal-100/80 dark:hover:bg-teal-900/50',
          inactiveBorder: 'border-teal-300/80 dark:border-teal-800/60',
          inactiveText: 'text-teal-900 dark:text-teal-200',
          iconColor: 'text-teal-600 dark:text-teal-400',
        },
      },
      {
        id: 'fotos' as const,
        label: 'Fotos',
        icon: Camera,
        palette: {
          activeBg: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400/40',
          inactiveBg: 'bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/80 dark:hover:bg-rose-900/50',
          inactiveBorder: 'border-rose-300/80 dark:border-rose-800/60',
          inactiveText: 'text-rose-900 dark:text-rose-200',
          iconColor: 'text-rose-600 dark:text-rose-400',
        },
      },
      {
        id: 'citas' as const,
        label: 'Citas',
        icon: Calendar,
        palette: {
          activeBg: 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-400/40',
          inactiveBg: 'bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50',
          inactiveBorder: 'border-indigo-300/80 dark:border-indigo-800/60',
          inactiveText: 'text-indigo-900 dark:text-indigo-200',
          iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
      },
    ],
    []
  );

  // IF LOGGED OUT: Show the Patient App Login Screen
  if (isLoggedOut || !currentPatient) {
    return (
      <div id="patient-portal-login-screen" className="max-w-md mx-auto py-10 px-4 animate-fade-in space-y-6">
        {/* App Branding Header */}
        <div className="text-center space-y-3">
          <NutriluzLogo
            size="lg"
            variant="full"
            showBadge={true}
            showSubtitle={true}
            customLogoUrl={organization.logoUrl}
          />
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Portal & App del Paciente
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Ingresa con tu usuario, correo o teléfono y la contraseña asignada para consultar tu plan, equivalencias SMAE y registrar tus comidas.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-950/5 space-y-5">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-medium animate-shake flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Usuario, Correo o Teléfono
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="ej. ana.morales@correo.com o tu usuario"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Puedes ingresar con tu usuario, tu correo registrado o tu teléfono móvil.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Asignada por tu nutriólogo
                </span>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  title={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <KeyRound className="w-4 h-4" />
              <span>Iniciar Sesión en mi App</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="patient-portal-view" className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Mobile Device Frame Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={currentPatient.photoUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/40 shadow-sm shrink-0"
            />
            <div className="truncate">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
                {organization.logoUrl ? (
                  <div className="w-5 h-5 rounded-full bg-white p-0.5 overflow-hidden inline-flex items-center justify-center shrink-0">
                    <img src={organization.logoUrl} alt="" className="w-full h-full object-contain" />
                  </div>
                ) : null}
                <span>{organization.name || 'Portal del Paciente'}</span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight truncate">Hola, {currentPatient.firstName} 👋</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="header-download-plan-pdf-btn"
              type="button"
              onClick={handleDownloadPlanPdf}
              title="Descargar mi Plan en PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white transition-all cursor-pointer border border-white/25 shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar Plan PDF</span>
            </button>
            <button
              id="header-patient-logout-btn"
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión de la app del paciente"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-rose-950/20 active:scale-95 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
            <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold flex items-center gap-1 border border-white/20">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentPatient.adherenceRate}%</span>
            </div>
          </div>
        </div>

        {/* Motivational Goal Strip */}
        <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-200">Objetivo Activo</span>
            <p className="font-semibold text-white truncate max-w-xs">{currentPatient.goal}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-200">Peso Actual</span>
            <p className="font-bold text-white">{currentPatient.currentWeight} kg</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Pills: Grid 3x2 en celular (todos visibles sin arrastrar), Grid 6 en sm */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`patient-nav-tab-${tab.id}`}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? `${tab.palette.activeBg} border-transparent`
                  : `${tab.palette.inactiveBg} ${tab.palette.inactiveBorder} ${tab.palette.inactiveText}`
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tab.palette.iconColor}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Opción 1: Tarjeta Plegable / Acordeón Inteligente - ¿Por qué tus calorías? (No invasiva, plegada por defecto) */}
      <PatientNutritionalRationaleCard
        patient={currentPatient}
        plan={activePlan || null}
        appointments={appointments}
        organizationName={organization.name || 'Nutri Elena'}
        defaultExpanded={false}
      />

      {/* SUB-VIEW 1: MI DÍA */}
      {activeSubTab === 'hoy' && (
        <div className="space-y-6">
          {/* Barra Interactiva de Días de la Semana (Selector Rápido) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {isViewingToday
                    ? `Menú de Hoy (${currentDayName})`
                    : `Menú de ${currentDayName}`}
                </span>
                {isViewingToday ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Hoy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Consulta anticipada
                  </span>
                )}
              </div>

              {!isViewingToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDayOfWeek(todayDayOfWeek)}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Volver a Hoy</span>
                </button>
              )}
            </div>

            {/* Fila de 7 días: [Lun] [Mar] [Mié] [Jue • Hoy] [Vie] [Sáb] [Dom] */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {WEEK_DAYS.map((day) => {
                const isToday = day.dayOfWeek === todayDayOfWeek;
                const isSelected = day.dayOfWeek === selectedDayOfWeek;

                return (
                  <button
                    key={day.dayOfWeek}
                    type="button"
                    onClick={() => setSelectedDayOfWeek(day.dayOfWeek)}
                    className={`relative py-2 sm:py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-400/40'
                        : isToday
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400/80 dark:border-amber-500/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Indicador luminoso para Hoy */}
                    {isToday && (
                      <span
                        className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ${
                          isSelected
                            ? 'bg-amber-200 ring-white'
                            : 'bg-amber-500 ring-amber-100 dark:ring-amber-950 animate-pulse'
                        }`}
                        title="Día de Hoy (Sincronizado con calendario)"
                      />
                    )}

                    <span className={`text-[11px] sm:text-xs font-black tracking-tight ${isSelected ? 'text-white' : ''}`}>
                      {day.shortName}
                    </span>

                    {isToday ? (
                      <span
                        className={`text-[9px] sm:text-[10px] font-extrabold uppercase mt-0.5 ${
                          isSelected ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        Hoy
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] sm:text-[10px] font-medium mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        Día {day.dayOfWeek}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick PDF Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-950/20 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">¿Quieres llevar tu plan impreso o en tu celular?</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Descarga tu plan en PDF con diseño visual y guía de porciones.</p>
              </div>
            </div>
            <button
              id="patient-quick-download-pdf-btn"
              onClick={handleDownloadPlanPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
          </div>

          {/* Water & Exercise Quick Widget */}
          <div className="grid grid-cols-2 gap-4">
            {/* Water widget */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-blue-500" />
                  Agua
                </span>
                <span className="font-extrabold text-blue-600">{(waterGlasses * 0.25).toFixed(1)} / 2.5L</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(waterGlasses / targetGlasses) * 100}%` }}
                />
              </div>
              <button
                onClick={addWater}
                className="w-full py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer active:scale-98"
              >
                + Registrar 250ml
              </button>
            </div>

            {/* SMAE Quick Card */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                  <Apple className="w-3.5 h-3.5 text-emerald-500" />
                  Guía SMAE
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Intercambios
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">Sustituye porciones dentro de tu plan</p>
              <button
                type="button"
                onClick={() => setActiveSubTab('smae')}
                className="w-full py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 active:scale-98"
              >
                <span>Ver Tarjetas SMAE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Today's Meals Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isViewingToday ? `Menú de Hoy (${currentDayName})` : `Menú del ${currentDayName}`}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentDayMeals.length > 0 ? (
                    <>
                      {completedMealsCount} de {currentDayMeals.length} comidas registradas ({Math.round((completedMealsCount / currentDayMeals.length) * 100)}%)
                    </>
                  ) : (
                    'Sin comidas asignadas para este día'
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" /> Subir foto de comida
              </button>
            </div>

            {/* Barra de progreso de cumplimiento de comidas */}
            {currentDayMeals.length > 0 && (
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${(completedMealsCount / currentDayMeals.length) * 100}%` }}
                />
              </div>
            )}

            {currentDayMeals.map((meal, mealIdx) => {
              const isChecked = !!mealStatus[meal.id];
              const dayIdx = Math.max(0, Math.min(6, selectedDayOfWeek - 1));
              const photoInfo = getMealDisplayPhoto(dayIdx, mealIdx, meal);
              const mainDishTitle = meal.items?.[0]?.name || meal.name;
              const totalKcal = meal.items.reduce((s, it) => s + (it.energyKcal || 0), 0);
              const totalProt = meal.items.reduce((s, it) => s + (it.proteinG || 0), 0).toFixed(0);
              const totalCarbs = meal.items.reduce((s, it) => s + (it.carbsG || 0), 0).toFixed(0);
              const totalFat = meal.items.reduce((s, it) => s + (it.fatG || 0), 0).toFixed(0);
              const bulletsList = meal.items.map((it) => `${formatPatientPortionOnly(it)} • ${it.name}`);
              const matchingRecipe = recipes.find(
                (r) => r.name.toLowerCase().trim() === mainDishTitle.toLowerCase().trim()
              );

              const mealBadgeColor = meal.name.toLowerCase().includes('desayun')
                ? 'bg-rose-500 text-white'
                : meal.name.toLowerCase().includes('comida')
                ? 'bg-emerald-600 text-white'
                : meal.name.toLowerCase().includes('cena')
                ? 'bg-sky-600 text-white'
                : 'bg-purple-600 text-white';

              return (
                <div
                  key={meal.id}
                  id={`patient-meal-${meal.id}`}
                  className={`rounded-3xl border transition-all overflow-hidden ${
                    isChecked
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Photo Banner with Badges */}
                  <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 group">
                    <img
                      src={photoInfo.url}
                      alt={mainDishTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() =>
                        setZoomedPhoto({
                          url: photoInfo.url,
                          title: mainDishTitle,
                          mealName: meal.name,
                          time: meal.suggestedTime,
                          bullets: bulletsList,
                          isCustom: photoInfo.isCustom,
                        })
                      }
                    />

                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/35 pointer-events-none" />

                    {/* Upper Left: Meal Type Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${mealBadgeColor}`}>
                        {meal.name}
                      </span>
                      {photoInfo.isCustom && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-400 text-amber-950 shadow-sm flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          <span>Foto del plan</span>
                        </span>
                      )}
                    </div>

                    {/* Upper Right: Time & Zoom Button */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-black/60 backdrop-blur-md text-white shadow-sm flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>{meal.suggestedTime || 'Horario flexible'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedPhoto({
                            url: photoInfo.url,
                            title: mainDishTitle,
                            mealName: meal.name,
                            time: meal.suggestedTime,
                            bullets: bulletsList,
                            isCustom: photoInfo.isCustom,
                          })
                        }
                        className="w-7 h-7 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                        title="Ver fotografía ampliada"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom overlay: Dish title & Kcal on the photo */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
                      <div className="text-white drop-shadow-md">
                        <h4 className="font-black text-base sm:text-lg leading-tight line-clamp-1">
                          {mainDishTitle}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/90 text-white backdrop-blur-md shrink-0 shadow-sm">
                        {totalKcal} kcal
                      </span>
                    </div>
                  </div>

                  {/* Body: Action Buttons, Macros, Porciones & Instructions */}
                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Header bar: Checkbox & Quick Macros */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => toggleMeal(meal.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer w-fit ${
                          isChecked
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isChecked ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white dark:fill-emerald-500" />
                            <span>¡Comida completada!</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-slate-400" />
                            <span>Marcar como consumida</span>
                          </>
                        )}
                      </button>

                      {/* Macros Chips */}
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60">
                          P: {totalProt}g
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60">
                          C: {totalCarbs}g
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60">
                          G: {totalFat}g
                        </span>
                      </div>
                    </div>

                    {/* Porciones e Ingredientes Limpios */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Ingredientes & Porciones:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {meal.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-xs"
                          >
                            <span className="font-bold text-slate-900 dark:text-white truncate mr-2">
                              • {item.name}
                            </span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md text-[11px] border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                              {formatPatientPortionOnly(item)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notas culinarias y Receta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      {meal.notes ? (
                        <div className="flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex-1">
                          <ChefHat className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="font-medium leading-relaxed">{meal.notes}</span>
                        </div>
                      ) : <div />}

                      {matchingRecipe && (
                        <button
                          type="button"
                          onClick={() => setSelectedRecipeForModal(matchingRecipe)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                          <span>Ver receta paso a paso</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: PLAN COMPLETO Y DESCARGAS PDF */}
      {activeSubTab === 'plan' && (
        <div className="space-y-6">
          {activePlan ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
              {/* Header & Download Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {activePlan.title || (activePlan as any).name || 'Plan Nutricional Integral'}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {activePlan.durationMode ? `Modalidad ${activePlan.durationMode}` : 'Activo / Vigente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Objetivo: <span className="font-semibold text-slate-800 dark:text-slate-200">{activePlan.goal}</span>
                    {activePlan.startDate && (
                      <> • Periodo: <span className="font-medium text-slate-700 dark:text-slate-300">{activePlan.startDate} {activePlan.endDate ? `al ${activePlan.endDate}` : ''}</span></>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="patient-portal-download-plan-pdf"
                    onClick={handleDownloadPlanPdf}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-md shadow-emerald-950/20 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Plan en PDF</span>
                  </button>

                  <button
                    id="patient-portal-download-shopping-list-pdf"
                    onClick={handleDownloadShoppingListPdf}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    <span>Lista de Súper</span>
                  </button>
                </div>
              </div>

              {/* Bento de Macronutrientes y Metas */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Calorías Meta</div>
                  <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{activePlan.targetCaloriesKcal || 1800} <span className="text-xs font-normal">kcal</span></div>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase">Proteínas</div>
                  <div className="text-xl font-extrabold text-blue-700 dark:text-blue-400 mt-0.5">{activePlan.targetProteinG || 130} <span className="text-xs font-normal">g</span></div>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">Carbohidratos</div>
                  <div className="text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">{activePlan.targetCarbsG || 180} <span className="text-xs font-normal">g</span></div>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                  <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase">Grasas</div>
                  <div className="text-xl font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">{activePlan.targetFatG || 45} <span className="text-xs font-normal">g</span></div>
                </div>
                <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300 uppercase">Hidratación</div>
                  <div className="text-xl font-extrabold text-cyan-700 dark:text-cyan-400 mt-0.5">{activePlan.targetWaterLiters || 2.5} <span className="text-xs font-normal">L / día</span></div>
                </div>
              </div>

              {/* Pautas Clínicas e Instrucciones */}
              {activePlan.generalInstructions && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 text-xs">Pautas e Indicaciones de tu Nutriólogo:</span>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{activePlan.generalInstructions}</p>
                </div>
              )}

              {/* Tiempos de Comida Detallados y Recetas del Plan Semanal */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-600" />
                    <span>Distribución de tus Tiempos de Comida y Recetas Semanales</span>
                  </h4>
                  <span className="text-xs font-semibold text-slate-400">
                    {(activePlan.days || []).length} días estructurados
                  </span>
                </div>

                {(activePlan.days || []).map((day, dIdx) => (
                  <div key={day.id || dIdx} className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 px-5 py-3.5 font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>{day.dayName || `Día ${dIdx + 1} - Menú Semanal`}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {activePlan.targetCaloriesKcal} kcal / día
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 p-5 space-y-5 bg-white dark:bg-slate-900">
                      {(day.meals || []).map((meal, mealIdx) => {
                        const photoInfo = getMealDisplayPhoto(dIdx, mealIdx, meal);
                        const mainDishTitle = meal.items?.[0]?.name || meal.name;
                        const bulletsList = meal.items.map((it) => `${formatPatientPortionOnly(it)} • ${it.name}`);
                        const totalMealKcal = meal.items.reduce((s, it) => s + (it.energyKcal || 0), 0);

                        return (
                          <div key={meal.id} className="pt-5 first:pt-0">
                            <div className="flex flex-col md:flex-row gap-4 items-start pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                              {/* Thumbnail with zoom */}
                              <div className="w-full md:w-44 h-32 md:h-28 rounded-2xl overflow-hidden relative shrink-0 bg-slate-100 dark:bg-slate-800 shadow-2xs group">
                                <img
                                  src={photoInfo.url}
                                  alt={mainDishTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                  onClick={() =>
                                    setZoomedPhoto({
                                      url: photoInfo.url,
                                      title: mainDishTitle,
                                      mealName: meal.name,
                                      time: meal.suggestedTime,
                                      bullets: bulletsList,
                                      isCustom: photoInfo.isCustom,
                                    })
                                  }
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedPhoto({
                                      url: photoInfo.url,
                                      title: mainDishTitle,
                                      mealName: meal.name,
                                      time: meal.suggestedTime,
                                      bullets: bulletsList,
                                      isCustom: photoInfo.isCustom,
                                    })
                                  }
                                  className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/60 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer hover:bg-black/80"
                                  title="Ver foto"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                                {photoInfo.isCustom && (
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-amber-950 flex items-center gap-0.5 shadow-2xs">
                                    <Camera className="w-2.5 h-2.5" />
                                    <span>Plan</span>
                                  </span>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1 w-full space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      {meal.name}
                                    </span>
                                    <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                                      • {mainDishTitle}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      {meal.suggestedTime ? `${meal.suggestedTime} hrs` : 'Horario flexible'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                                      {totalMealKcal} kcal
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {(meal.items || []).map((item) => {
                                    const matchingRecipe = recipes.find(
                                      (r) => r.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                                    );

                                    return (
                                      <div
                                        key={item.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 gap-2"
                                      >
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                              {item.name}
                                            </span>
                                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                                              {formatPatientPortionOnly(item)}
                                            </span>
                                            {matchingRecipe && (
                                              <button
                                                type="button"
                                                onClick={() => setSelectedRecipeForModal(matchingRecipe)}
                                                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/60"
                                              >
                                                <ChefHat className="w-3 h-3" />
                                                <span>Ver receta</span>
                                              </button>
                                            )}
                                          </div>
                                          {item.preparationTip && (
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                              Nota: {item.preparationTip}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                                          <span>P: {item.proteinG || 0}g</span>
                                          <span>C: {item.carbsG || 0}g</span>
                                          <span>G: {item.fatG || 0}g</span>
                                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                            {item.energyKcal || 0} kcal
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {meal.notes && (
                                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs">
                                    <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
                                      <ChefHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>Preparación:</span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                      {meal.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Guía Rápida de Intercambios SMAE */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-2 text-xs">
                <h5 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Apple className="w-4 h-4 text-amber-600" />
                  <span>Equivalencias y Sustituciones Rápidas (SMAE)</span>
                </h5>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Si no tienes un ingrediente exacto, puedes sustituirlo por otro de su mismo grupo manteniendo la porción:
                  <br />• <strong>Frutas:</strong> 1 Manzana = 1 taza de fresas = 1/2 plátano = 2 mandarinas.
                  <br />• <strong>Cereales:</strong> 1 Tortilla de maíz = 1/3 taza arroz cocido = 1/2 taza avena.
                  <br />• <strong>Proteínas:</strong> 30g Pollo = 30g Atún = 1 Huevo entero = 40g Queso panela.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Aún no tienes un plan nutricional asignado</h3>
              <p className="text-xs text-slate-400 mt-1">Tu nutriólogo te asignará un plan personalizado en tu próxima consulta.</p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: BIBLIOTECA DE RECETAS CLÍNICAS */}
      {activeSubTab === 'recetas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Biblioteca de Recetas Clínicas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preparaciones saludables calculadas por tu nutriólogo especialmente para tu plan y objetivos.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-xs font-bold w-fit">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {(() => {
                      const assignedIds = currentPatient?.assignedRecipeIds || [];
                      const count = recipes.filter((r) => assignedIds.includes(r.id)).length;
                      return `${count} recetas asignadas`;
                    })()}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isDownloadingRecipesPdf}
                  onClick={async () => {
                    const assignedIds = currentPatient?.assignedRecipeIds || [];
                    const assignedList = recipes.filter((r) => assignedIds.includes(r.id));
                    const listToExport = assignedList.length > 0 ? assignedList : recipes;
                    if (listToExport.length === 0 || !currentPatient) {
                      showToast('Sin recetas', 'No hay recetas clínicas disponibles para descargar.', 'info');
                      return;
                    }
                    setIsDownloadingRecipesPdf(true);
                    try {
                      await pdfService.generateRecipesCatalogPdf(listToExport, currentPatient, organization, specialistProfile);
                      showToast('Recetario Descargado', 'Se generó el recetario con ingredientes detallados y preparación.', 'success');
                    } catch (err) {
                      console.error(err);
                      showToast('Error', 'No se pudo generar el PDF del recetario.', 'error');
                    } finally {
                      setIsDownloadingRecipesPdf(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Descargar recetario clínico en PDF con ingredientes y preparación"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingRecipesPdf ? 'Generando PDF...' : 'Descargar Recetario en PDF'}</span>
                </button>
              </div>
            </div>

            {/* Búsqueda y Filtro de Categorías */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar receta, ingrediente o etiqueta..."
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Categorías pill selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {['ALL', 'Desayuno', 'Comida', 'Cena', 'Colación', 'Bebidas'].map((cat) => {
                  const isSelected = selectedRecipeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedRecipeCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat === 'ALL' ? 'Todas' : cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid de Recetas */}
          {(() => {
            // Regla de asignación clínica: En el perfil del paciente SOLO aparecen las recetas asignadas por su nutriólogo
            const assignedIds = currentPatient?.assignedRecipeIds || [];
            const availableRecipes = recipes.filter((r) => assignedIds.includes(r.id));
            const hasAssignedRecipes = availableRecipes.length > 0;

            if (!hasAssignedRecipes) {
              return (
                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <ChefHat className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                    Recetario Clínico Personalizado
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Tu nutriólogo aún no te ha asignado recetas clínicas personalizadas. En cuanto tu especialista vincule las recetas ideales para tu plan y objetivo nutricional, aparecerán aquí para que consultes sus ingredientes, calorías y modo de preparación.
                  </p>
                </div>
              );
            }

            const filteredRecipes = availableRecipes.filter((r) => {
              const matchSearch = `${r.name} ${r.description} ${(r.tags || []).join(' ')}`
                .toLowerCase()
                .includes(recipeSearch.toLowerCase());
              const matchCat = selectedRecipeCategory === 'ALL' || r.category === selectedRecipeCategory;
              return matchSearch && matchCat;
            });

            if (filteredRecipes.length === 0) {
              return (
                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                  <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    No se encontraron recetas
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No hay recetas asignadas que coincidan con tu búsqueda o filtro. Prueba seleccionando otra categoría.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/50 flex items-center justify-between gap-3 text-xs text-teal-900 dark:text-teal-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>
                      <strong>Recetario Personalizado:</strong> Mostrando las {availableRecipes.length} recetas asignadas por tu nutriólogo para tu tratamiento.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedRecipeForModal(recipe)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={recipe.photoUrl}
                            alt={recipe.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-md">
                            {recipe.category}
                          </div>
                          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-extrabold bg-teal-600 text-white shadow-md">
                            {recipe.caloriesKcal} kcal
                          </div>

                          {hasAssignedRecipes && (
                            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-md flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Para ti</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2.5">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors line-clamp-1">
                            {recipe.name}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {recipe.description}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {recipe.prepTimeMinutes} min
                            </span>
                            <span>•</span>
                            <span>{recipe.servings} porción</span>
                            {recipe.difficulty && (
                              <>
                                <span>•</span>
                                <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                  {recipe.difficulty}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Macronutrientes en tarjeta */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold">
                              P: {recipe.proteinG}g
                            </div>
                            <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold">
                              C: {recipe.carbsG}g
                            </div>
                            <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold">
                              G: {recipe.fatG}g
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {recipe.ingredients?.length || 0} ingredientes
                        </span>
                        <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Ver receta <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-VIEW 4: SMAE EQUIVALENCIAS BENTO */}
      {activeSubTab === 'smae' && (
        <SmaeInfographicBento
          plan={activePlan}
          patient={currentPatient}
          organization={organization}
          onDownloadPdf={handleDownloadSmaeGuidePdf}
          isDownloadingPdf={isDownloadingSmae}
        />
      )}

      {/* SUB-VIEW 5: FOTOS */}
      {activeSubTab === 'fotos' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Tus Fotos de Progreso</h3>
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Subir Foto
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400">Inicio (Enero)</span>
              <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300" alt="" className="w-full h-40 object-cover rounded-2xl" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400">Mes 2 (Marzo)</span>
              <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300" alt="" className="w-full h-40 object-cover rounded-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: CITAS & CONSULTAS CLÍNICAS */}
      {activeSubTab === 'citas' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Tus Próximas Citas con tu Nutriólogo</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultas agendadas en tiempo real por tu especialista con fecha, horario y sede.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => syncAppointmentsFromCloud(currentPatient.id)}
                disabled={isSyncingAppointments}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                title="Sincronizar citas con la base de datos de tu nutriólogo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAppointments ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
                <span>{isSyncingAppointments ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRequestApptModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Solicitar Cita</span>
              </button>
              {appointments.length > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                  {appointments.length} {appointments.length === 1 ? 'cita programada' : 'citas programadas'}
                </span>
              )}
            </div>
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appt) => {
                const isConfirmed = appt.status === 'CONFIRMADA';
                const isPending = appt.status === 'PENDIENTE';
                const isRealizada = appt.status === 'REALIZADA';

                // Formateo de fecha y hora idéntico al perfil clínico (ej. "lun 9 de nov • 10:00 a.m. hrs")
                let formattedDateTime = appt.startTime;
                try {
                  const cleaned = appt.startTime.includes('T') ? appt.startTime : appt.startTime.replace(' ', 'T');
                  const d = new Date(cleaned);
                  if (!isNaN(d.getTime())) {
                    const datePart = d.toLocaleDateString('es-MX', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    });
                    const timePart = d.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });
                    formattedDateTime = `${datePart} • ${timePart} hrs`;
                  }
                } catch {}

                const specialist =
                  storageService.getSpecialists().find((s) => s.id === (appt.specialistId || currentPatient.specialistId)) || currentUser;
                const specialistName =
                  (specialist as any)?.name ||
                  `${specialist?.firstName || ''} ${specialist?.lastName || ''}`.trim() ||
                  'Nutrióloga Titular';
                const specialistPhone = specialist?.phone || organization?.phone || '5551234567';
                const cleanPhone = specialistPhone.replace(/\D/g, '');
                const waMessage = encodeURIComponent(
                  `¡Hola! Soy ${currentPatient.firstName} ${currentPatient.lastName}. Confirmo mi asistencia para mi cita de ${appt.appointmentType.toLowerCase()} programada para el ${formattedDateTime}.`
                );
                const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;

                return (
                  <div
                    key={appt.id}
                    id={`patient-appointment-card-${appt.id}`}
                    className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all space-y-3.5 relative overflow-hidden"
                  >
                    {/* Fila superior: Tipo de Consulta & Precio */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          {appt.appointmentType.replace('_', ' ')}
                        </span>
                        {appt.meetingLink ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Online
                          </span>
                        ) : null}
                      </div>

                      {appt.price ? (
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                          ${appt.price} {appt.currency || 'MXN'}
                        </span>
                      ) : null}
                    </div>

                    {/* Nombre del Paciente & Nutriólogo */}
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {appt.patientName || `${currentPatient.firstName} ${currentPatient.lastName}`}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Especialista a cargo: <span className="font-semibold text-slate-700 dark:text-slate-300">{specialistName}</span>
                      </p>
                    </div>

                    {/* Fecha y Horario */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{formattedDateTime}</span>
                      </div>

                      {/* Sede o Consultorio */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{appt.locationNotes || 'Consultorio Principal • Sucursal NutriLuz'}</span>
                      </div>

                      {appt.meetingLink && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Video className="w-4 h-4 shrink-0" />
                          <a
                            href={appt.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold underline flex items-center gap-1 hover:text-blue-700"
                          >
                            <span>Unirse a videoconsulta</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Notas clínicas / Motivo de consulta */}
                    {appt.consultationSummary && (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        <p>{appt.consultationSummary}</p>
                      </div>
                    )}

                    {/* Footer: Estatus y Acción de Confirmación */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isConfirmed
                              ? 'bg-emerald-500'
                              : isPending
                              ? 'bg-amber-500'
                              : isRealizada
                              ? 'bg-blue-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span
                          className={
                            isConfirmed
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : isPending
                              ? 'text-amber-700 dark:text-amber-400'
                              : isRealizada
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }
                        >
                          • {appt.status}
                        </span>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Confirmar por WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-3xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  No tienes citas programadas actualmente
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Tu nutrióloga registrará tus citas de seguimiento y evaluación antropométrica. También puedes solicitar una consulta directamente.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestApptModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agendar Consulta en la App</span>
                </button>
                {organization?.phone && (
                  <a
                    href={`https://wa.me/${organization.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `¡Hola! Soy ${currentPatient.firstName} ${currentPatient.lastName}. Quisiera agendar una consulta de nutrición.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Solicitar por WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Food Photo Modal */}
      <Modal
        id="upload-meal-photo-modal"
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Registrar Foto de Platillo"
        subtitle="NutriCopilot AI analizará automáticamente los grupos SMAE y calorías aproximadas"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
            <Camera className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-slate-600 dark:text-slate-300">Toma una foto de tu plato o súbela desde tu galería</p>
            <input
              type="text"
              placeholder="O pega URL de imagen (ej. https://...)"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs mt-2"
            />
          </div>

          <button
            onClick={() => {
              setIsPhotoModalOpen(false);
              showToast('Foto Analizada', 'NutriCopilot estimó ~420 kcal (32g Proteína, 38g Carbos, 12g Grasas)', 'success');
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Analizar y Guardar Platillo
          </button>
        </div>
      </Modal>

      {/* Patient Portal Footer & Logout Section */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2 text-slate-400">
          <Salad className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>App del Paciente • {organization?.name || 'Nutri Luz Elena'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            id="footer-patient-logout-btn"
            type="button"
            onClick={handleLogout}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs active:scale-95"
            title="Cerrar la sesión activa del paciente"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Executive PDF Export Center Modal (Read-Only for Patient: Download & WhatsApp only) */}
      {activePlan && currentPatient && (
        <ExecutivePdfExportModal
          isOpen={isExecutiveExportModalOpen}
          onClose={() => setIsExecutiveExportModalOpen(false)}
          plan={activePlan}
          patient={currentPatient}
          organization={organization}
          specialist={
            storageService.getSpecialists().find((s) => s.id === currentPatient.specialistId) || currentUser
          }
          showToast={showToast}
          readOnly={true}
        />
      )}

      {/* Modal de Detalle de Receta Clínica para Paciente */}
      {selectedRecipeForModal && (
        <Modal
          id="patient-recipe-detail-modal"
          isOpen={!!selectedRecipeForModal}
          onClose={() => setSelectedRecipeForModal(null)}
          title={selectedRecipeForModal.name}
          subtitle={`${selectedRecipeForModal.category} • ${selectedRecipeForModal.caloriesKcal} kcal • Tiempo: ${selectedRecipeForModal.prepTimeMinutes} min`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-slate-700 dark:text-slate-200">
            <div className="relative rounded-2xl overflow-hidden h-56 w-full bg-slate-100 dark:bg-slate-800">
              <img
                src={selectedRecipeForModal.photoUrl}
                alt={selectedRecipeForModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md">
                {selectedRecipeForModal.category}
              </div>
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-600 text-white shadow-md">
                {selectedRecipeForModal.caloriesKcal} kcal
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedRecipeForModal.description}
            </p>

            {/* Macros Bar */}
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Proteína</span>
                <div className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {selectedRecipeForModal.proteinG}g
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">Carbos</span>
                <div className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-400 mt-0.5">
                  {selectedRecipeForModal.carbsG}g
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">Grasas</span>
                <div className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-400 mt-0.5">
                  {selectedRecipeForModal.fatG}g
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                <span className="text-[10px] uppercase font-bold text-purple-800 dark:text-purple-300">Fibra</span>
                <div className="text-sm sm:text-base font-black text-purple-700 dark:text-purple-400 mt-0.5">
                  {selectedRecipeForModal.fiberG || 4}g
                </div>
              </div>
            </div>

            {/* Ingredientes & Porciones Detallados con Gramajes y Medidas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Ingredientes ({selectedRecipeForModal.servings} porción)</span>
                </h4>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800/60">
                  {selectedRecipeForModal.ingredients?.length || 0} ingredientes
                </span>
              </div>

              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {selectedRecipeForModal.ingredients && selectedRecipeForModal.ingredients.length > 0 ? (
                  selectedRecipeForModal.ingredients.map((ing, iIdx) => (
                    <div
                      key={ing.id || iIdx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {ing.foodName}
                          </span>
                          {ing.isSeasoning && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              Condimento
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-extrabold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/60">
                            {ing.amount} {ing.unit}
                          </span>
                          {ing.gramWeight && (
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              ⚖️ {ing.gramWeight} g
                            </span>
                          )}
                          {ing.equivalentGroupName && (
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              {ing.equivalentGroupName}
                            </span>
                          )}
                        </div>
                      </div>

                      {ing.prepState && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-4 italic">
                          📝 Forma / Preparación: {ing.prepState}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Ingredientes detallados por tu nutriólogo.</p>
                )}
              </div>
            </div>

            {/* Instrucciones de Preparación con Letra Más Grande */}
            <div className="space-y-3">
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Pasos de Preparación</span>
              </h4>
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {selectedRecipeForModal.steps && selectedRecipeForModal.steps.length > 0 ? (
                  selectedRecipeForModal.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 leading-relaxed text-sm p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
                    >
                      <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {step.stepNumber || idx + 1}
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {step.instruction}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Pasos de preparación recomendados por tu nutriólogo.</p>
                )}
              </div>
            </div>

            {/* Botones de acción: Descargar Receta en PDF y Cerrar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (selectedRecipeForModal && currentPatient) {
                    try {
                      await pdfService.generateRecipesCatalogPdf(
                        [selectedRecipeForModal],
                        currentPatient,
                        organization,
                        specialistProfile
                      );
                      showToast('Receta Descargada', 'Se ha generado el PDF con ingredientes detallados y preparación.', 'success');
                    } catch (e) {
                      console.error(e);
                      showToast('Error', 'No se pudo generar el PDF de la receta.', 'error');
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-600" />
                <span>Descargar Receta en PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecipeForModal(null)}
                className="py-2.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm active:scale-98"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Zoomed Dish Photo Modal */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={zoomedPhoto.url}
                alt={zoomedPhoto.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                <span>{zoomedPhoto.mealName}</span>
                {zoomedPhoto.time && <span>• {zoomedPhoto.time}</span>}
              </div>
            </div>
            <div className="p-5 pt-0 space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {zoomedPhoto.title}
                </h3>
                {zoomedPhoto.isCustom && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-400 text-amber-950 shrink-0">
                    Foto Personalizada
                  </span>
                )}
              </div>

              {zoomedPhoto.bullets && zoomedPhoto.bullets.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ingredientes & Porciones del Platillo:
                  </span>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                    {zoomedPhoto.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Cerrar Fotografía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Appointment Modal */}
      <Modal
        id="request-appointment-modal"
        isOpen={isRequestApptModalOpen}
        onClose={() => setIsRequestApptModalOpen(false)}
        title="Agendar / Solicitar Consulta Nutricional"
        subtitle="Registra tu fecha y horario preferido. Quedará sincronizado en tiempo real con tu especialista."
        maxWidth="md"
      >
        <form onSubmit={handleRequestAppointmentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Tipo de Consulta
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRequestApptData((prev) => ({ ...prev, appointmentType: 'SEGUIMIENTO' }))}
                className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  requestApptData.appointmentType === 'SEGUIMIENTO'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-black">Seguimiento Clínico</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Revisión de plan y peso</div>
              </button>
              <button
                type="button"
                onClick={() => setRequestApptData((prev) => ({ ...prev, appointmentType: 'ONLINE' }))}
                className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  requestApptData.appointmentType === 'ONLINE'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-black flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-blue-500" />
                  <span>Videoconsulta Online</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Vía Meet o Zoom</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Fecha Sugerida
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={requestApptData.date}
                onChange={(e) => setRequestApptData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Horario Preferido
              </label>
              <input
                type="time"
                required
                value={requestApptData.time}
                onChange={(e) => setRequestApptData((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Motivo o Notas para el Nutriólogo
            </label>
            <textarea
              rows={3}
              value={requestApptData.notes}
              onChange={(e) => setRequestApptData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="¿Qué te gustaría revisar en esta consulta?"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRequestApptModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all active:scale-95"
            >
              Confirmar Solicitud de Cita
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
