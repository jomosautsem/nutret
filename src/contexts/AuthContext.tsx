import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, Organization, Branch, UserRole, Patient } from '../types';
import { storageService } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseDb } from '../lib/supabaseDb';

interface AuthContextType {
  currentUser: UserProfile;
  organization: Organization;
  branches: Branch[];
  currentBranch: Branch | null;
  activeRole: UserRole;
  isLoggedIn: boolean;
  activePatientId: string | null;
  activePatient: Patient | null;
  isPatientLoggedIn: boolean;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  loginUnified: (identifier: string, pass: string) => {
    success: boolean;
    role?: 'NUTRIOLOGO' | 'PACIENTE';
    user?: UserProfile;
    patient?: Patient;
    error?: string;
  };
  logout: () => void;
  setCurrentUser: (user: UserProfile) => void;
  updateCurrentUser: (user: Partial<UserProfile> | UserProfile) => void;
  setOrganization: (org: Organization) => void;
  updateOrganization: (org: Partial<Organization> | Organization) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  switchRole: (role: UserRole) => void;
  isNutriologo: boolean;
  isPatient: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cross-tab / cross-window sync channel
const authBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('nutriluz_auth_channel')
  : null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => storageService.getCurrentUser());
  const [organization, setOrganizationState] = useState<Organization>(() => storageService.getOrganization());
  const [branches, setBranches] = useState<Branch[]>(() => storageService.getBranches());
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(() => {
    const list = storageService.getBranches();
    return list.length > 0 ? list[0] : null;
  });
  const [activeRole, setActiveRole] = useState<UserRole>(() => storageService.getCurrentUser().role);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storageService.isNutritionistAuthenticated());
  const [activePatientId, setActivePatientId] = useState<string | null>(() => storageService.getActivePortalPatientId());
  const isInitialFetchDone = useRef(false);

  const activePatient = activePatientId
    ? storageService.getPatients().find((p) => p.id === activePatientId) || null
    : null;
  const isPatientLoggedIn = Boolean(activePatientId);

  useEffect(() => {
    let isMounted = true;
    const handleAuthChange = (e: any) => {
      if (typeof e.detail?.isAuthenticated === 'boolean') {
        setTimeout(() => {
          if (isMounted) setIsLoggedIn(e.detail.isAuthenticated);
        }, 0);
      }
    };
    const handlePatientSession = () => {
      setTimeout(() => {
        if (isMounted) {
          const pId = storageService.getActivePortalPatientId();
          setActivePatientId(pId);
        }
      }, 0);
    };
    const handleOrgChange = (e: any) => {
      if (e.detail) {
        setTimeout(() => {
          if (isMounted) setOrganizationState(e.detail);
        }, 0);
      }
    };

    window.addEventListener('nutriluz:nutritionist_auth_changed', handleAuthChange);
    window.addEventListener('nutriluz:patient_session_updated', handlePatientSession);
    window.addEventListener('nutriluz:organization_updated', handleOrgChange);
    window.addEventListener('storage', handlePatientSession);

    // BroadcastChannel handler for multi-tab sync
    if (authBroadcastChannel) {
      authBroadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'ORG_UPDATED' && event.data.organization) {
          setOrganizationState(event.data.organization);
        } else if (event.data?.type === 'USER_UPDATED' && event.data.user) {
          applyUserUpdate(event.data.user, false);
        }
      };
    }

    return () => {
      isMounted = false;
      window.removeEventListener('nutriluz:nutritionist_auth_changed', handleAuthChange);
      window.removeEventListener('nutriluz:patient_session_updated', handlePatientSession);
      window.removeEventListener('nutriluz:organization_updated', handleOrgChange);
      window.removeEventListener('storage', handlePatientSession);
    };
  }, []);

  const login = (email: string, pass: string) => {
    const res = storageService.authenticateNutritionist(email, pass);
    if (res.success) {
      setIsLoggedIn(true);
      if (res.user) {
        applyUserUpdate(res.user, true);
      }
    }
    return res;
  };

  const loginUnified = (identifier: string, pass: string) => {
    const res = storageService.authenticateUnified(identifier, pass);
    if (res.success) {
      if (res.role === 'NUTRIOLOGO') {
        setIsLoggedIn(true);
        setActiveRole('NUTRIOLOGO');
        if (res.user) {
          applyUserUpdate(res.user, true);
        }
      } else if (res.role === 'PACIENTE' && res.patient) {
        setActivePatientId(res.patient.id);
        setActiveRole('PACIENTE');
      }
    }
    return res;
  };

  const logout = () => {
    storageService.logoutNutritionist();
    storageService.setActivePortalPatientId(null);
    setIsLoggedIn(false);
    setActivePatientId(null);
  };

  // Helper to apply user change locally and notify all listeners
  const applyUserUpdate = (newUser: UserProfile, broadcast: boolean = true) => {
    setCurrentUserState((prev) => {
      // Only trigger state update if there's an actual change
      if (
        prev.firstName === newUser.firstName &&
        prev.lastName === newUser.lastName &&
        prev.professionalTitle === newUser.professionalTitle &&
        prev.licenseNumber === newUser.licenseNumber &&
        prev.avatarUrl === newUser.avatarUrl &&
        prev.email === newUser.email &&
        prev.phone === newUser.phone
      ) {
        return prev;
      }
      return newUser;
    });

    if (broadcast && authBroadcastChannel) {
      try {
        authBroadcastChannel.postMessage({ type: 'USER_UPDATED', user: newUser });
      } catch (e) {
        // ignore
      }
    }
  };

  // 1. Initial & Continuous Multi-device Database Hydration
  useEffect(() => {
    let isMounted = true;

    const fetchLatestProfileFromDatabase = async () => {
      try {
        // Priority 1: Supabase Cloud PostgreSQL
        if (supabase && isSupabaseConfigured) {
          const [cloudProfile, cloudOrg] = await Promise.all([
            supabaseDb.getNutritionistProfile(currentUser.id || 'user-dra-valeria'),
            supabaseDb.getOrganization(),
          ]);

          if (cloudOrg && isMounted) {
            setOrganizationState((prev) => {
              const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('nutriluz_organization_logo') : null;
              const effectiveLogo = cloudOrg.logoUrl || savedLogo || prev.logoUrl;
              const savedOpacity = typeof window !== 'undefined' ? localStorage.getItem('nutriluz_watermark_opacity') : null;
              const effectiveOpacity = cloudOrg.watermarkOpacity ?? (savedOpacity ? parseFloat(savedOpacity) : prev.watermarkOpacity);

              if (prev.logoUrl === effectiveLogo && prev.name === cloudOrg.name && prev.watermarkOpacity === effectiveOpacity) {
                return prev;
              }
              const merged = {
                ...prev,
                ...cloudOrg,
                logoUrl: effectiveLogo,
                watermarkOpacity: typeof effectiveOpacity === 'number' ? effectiveOpacity : (prev.watermarkOpacity ?? 0.22),
              };
              storageService.saveOrganization(merged);
              return merged;
            });
          }

          if (cloudProfile && cloudProfile.firstName && isMounted) {
            const current = storageService.getCurrentUser();
            const merged: UserProfile = {
              ...current,
              firstName: cloudProfile.firstName,
              lastName: cloudProfile.lastName || current.lastName,
              email: cloudProfile.email || current.email,
              phone: cloudProfile.phone || current.phone,
              avatarUrl: cloudProfile.avatarUrl || current.avatarUrl,
              role: cloudProfile.role || current.role,
              professionalTitle: cloudProfile.professionalTitle || current.professionalTitle,
              licenseNumber: cloudProfile.licenseNumber || current.licenseNumber,
              specialties: cloudProfile.specialties || current.specialties,
              bio: cloudProfile.bio || current.bio,
            };
            storageService.saveCurrentUserLocally(merged);
            applyUserUpdate(merged, false);
            return;
          }
        }

        // Priority 2: Backend server database store (/api/user/profile & /api/organization)
        const [res, orgRes] = await Promise.all([
          fetch('/api/user/profile').catch(() => null),
          fetch('/api/organization').catch(() => null),
        ]);

        if (res && res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.user) {
            const serverUser: UserProfile = data.user;
            const current = storageService.getCurrentUser();
            const merged: UserProfile = {
              ...current,
              ...serverUser,
              avatarUrl: serverUser.avatarUrl || current.avatarUrl,
            };
            storageService.saveCurrentUserLocally(merged);
            applyUserUpdate(merged, false);
          }
        }

        if (orgRes && orgRes.ok && isMounted) {
          const orgData = await orgRes.json();
          if (orgData.success && orgData.organization) {
            setOrganizationState((prev) => {
              const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('nutriluz_organization_logo') : null;
              const savedOpacity = typeof window !== 'undefined' ? localStorage.getItem('nutriluz_watermark_opacity') : null;
              const merged = {
                ...prev,
                ...orgData.organization,
                logoUrl: orgData.organization.logoUrl || savedLogo || prev.logoUrl,
                watermarkOpacity: orgData.organization.watermarkOpacity ?? (savedOpacity ? parseFloat(savedOpacity) : prev.watermarkOpacity),
              };
              storageService.saveOrganization(merged);
              return merged;
            });
          }
        }
      } catch (err) {
        // Non-blocking fallback
      }
    };

    // Run on initial mount
    if (!isInitialFetchDone.current) {
      isInitialFetchDone.current = true;
      fetchLatestProfileFromDatabase();
    }

    // Polling every 4 seconds to catch multi-device / multi-browser updates in real-time
    const interval = setInterval(fetchLatestProfileFromDatabase, 4000);

    // 2. Supabase Realtime WebSocket subscription (when PostgreSQL changes occur)
    let channel: any = null;
    if (supabase && isSupabaseConfigured) {
      try {
        channel = supabase
          .channel('users-changes-nutriluz')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'users' },
            (payload) => {
              if (payload.new) {
                const updatedRow: any = payload.new;
                const cloudUser = supabaseDb.mapDbToUser ? supabaseDb.mapDbToUser(updatedRow) : null;
                if (cloudUser) {
                  const current = storageService.getCurrentUser();
                  const merged: UserProfile = { ...current, ...cloudUser };
                  storageService.saveCurrentUserLocally(merged);
                  applyUserUpdate(merged, true);
                } else {
                  fetchLatestProfileFromDatabase();
                }
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('[Supabase Realtime] Setup error:', e);
      }
    }

    // 3. Listen to cross-tab BroadcastChannel
    if (authBroadcastChannel) {
      authBroadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'USER_UPDATED' && event.data.user) {
          applyUserUpdate(event.data.user, false);
        }
      };
    }

    // 4. Local storage event listener (for other tabs on same origin)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'nutriluz_current_user' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          applyUserUpdate(parsed, false);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 5. Custom in-app event
    const handleUserUpdatedEvent = (e: any) => {
      if (e.detail?.user) {
        applyUserUpdate(e.detail.user, false);
      }
    };
    window.addEventListener('nutriluz:user_updated', handleUserUpdatedEvent);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('nutriluz:user_updated', handleUserUpdatedEvent);
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, []);

  const setCurrentUser = (user: UserProfile) => {
    applyUserUpdate(user, true);
    setActiveRole(user.role);
    storageService.saveCurrentUser(user);
    const specs = storageService.getSpecialists();
    const idx = specs.findIndex((s) => s.id === user.id);
    if (idx >= 0) {
      specs[idx] = user;
      storageService.saveSpecialists(specs);
    }
  };

  const updateCurrentUser = (userUpdate: Partial<UserProfile> | UserProfile) => {
    const merged: UserProfile = { ...currentUser, ...userUpdate };
    applyUserUpdate(merged, true);
    if (userUpdate.role) {
      setActiveRole(userUpdate.role);
    }
    storageService.saveCurrentUser(merged);
    const specs = storageService.getSpecialists();
    const idx = specs.findIndex((s) => s.id === merged.id);
    if (idx >= 0) {
      specs[idx] = merged;
      storageService.saveSpecialists(specs);
    }
  };

  const setOrganization = (org: Organization) => {
    setOrganizationState(org);
    storageService.saveOrganization(org);
    supabaseDb.saveOrganization(org);
    if (authBroadcastChannel) {
      try {
        authBroadcastChannel.postMessage({ type: 'ORG_UPDATED', organization: org });
      } catch (e) {}
    }
  };

  const updateOrganization = (orgUpdate: Partial<Organization> | Organization) => {
    const merged = { ...organization, ...orgUpdate };
    setOrganizationState(merged);
    storageService.saveOrganization(merged);
    supabaseDb.saveOrganization(merged);
    if (authBroadcastChannel) {
      try {
        authBroadcastChannel.postMessage({ type: 'ORG_UPDATED', organization: merged });
      } catch (e) {}
    }
  };

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
  };

  const isNutriologo = activeRole === 'NUTRIOLOGO' || activeRole === 'OWNER' || activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN';
  const isPatient = activeRole === 'PACIENTE';
  const isAdmin = activeRole === 'OWNER' || activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        organization,
        branches,
        currentBranch,
        activeRole,
        isLoggedIn,
        activePatientId,
        activePatient,
        isPatientLoggedIn,
        login,
        loginUnified,
        logout,
        setCurrentUser,
        updateCurrentUser,
        setOrganization,
        updateOrganization,
        setCurrentBranch,
        switchRole,
        isNutriologo,
        isPatient,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

