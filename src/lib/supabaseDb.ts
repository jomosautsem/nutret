import { supabase, isSupabaseConfigured, supabaseUrl } from './supabase';
import {
  Patient,
  ClinicalRecord,
  AnthropometricRecord,
  NutritionPlan,
  Appointment,
  PaymentRecord,
  FoodItem,
  Recipe,
  LaboratoryResult,
  ChatMessage,
  Organization,
  Branch,
  UserProfile,
} from '../types';
import { ClinicalPreset } from '../features/ai_copilot/prescriptionPresetsData';

export interface CloudSyncResult {
  success: boolean;
  syncedCount: number;
  patientsCount?: number;
  error?: string;
  tables: Record<string, { success: boolean; count: number; error?: string }>;
  timestamp: string;
}

export interface SupabaseHealthReport {
  connected: boolean;
  readOk: boolean;
  writeOk: boolean;
  latencyMs: number;
  error?: string;
  tables: Record<string, { status: 'ok' | 'error'; count?: number }>;
  timestamp: string;
}

/**
 * Service to perform direct real-time CRUD and bulk synchronization to Supabase Cloud Database.
 */
export const supabaseDb = {
  mapDbToUser,
  // --- ORGANIZATION PERSISTENCE ---
  async getOrganization(): Promise<Organization | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', 'org-nutriluz-mexico')
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name || 'Nutri Luz Elena',
        slug: data.slug || 'nutri-luz-elena',
        logoUrl: data.logo_url || undefined,
        primaryColor: data.primary_color || '#059669',
        secondaryColor: '#047857',
        currency: 'MXN',
        country: 'México',
        phone: data.phone || '7773846122',
        address: data.address || 'Temixco, Morelos',
      };
    } catch (e) {
      console.warn('Error fetching organization from Supabase:', e);
      return null;
    }
  },

  async saveOrganization(org: Organization): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('organizations').upsert(
        {
          id: org.id || 'org-nutriluz-mexico',
          name: org.name || 'Nutri Luz Elena',
          slug: org.slug || 'nutri-luz-elena',
          logo_url: org.logoUrl || null,
          primary_color: org.primaryColor || '#059669',
          phone: org.phone || null,
          address: org.address || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.error('Error saving organization to Supabase:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error in saveOrganization:', e);
      return false;
    }
  },

  // --- BOOTSTRAP & PREREQUISITES ---
  async ensureOrganizationAndUser(org?: Partial<Organization>, user?: Partial<UserProfile>): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const orgId = org?.id || 'org-nutriluz-mexico';
      const orgName = org?.name || 'Nutri Luz Elena';
      const orgSlug = (org as any)?.slug || 'nutri-luz-elena';
      const orgLogo = org?.logoUrl || (typeof window !== 'undefined' ? localStorage.getItem('nutriluz_organization') ? (JSON.parse(localStorage.getItem('nutriluz_organization') || '{}').logoUrl) : null : null);

      // 1. Ensure Organization
      const { error: orgErr } = await supabase.from('organizations').upsert(
        {
          id: orgId,
          name: orgName,
          slug: orgSlug,
          logo_url: orgLogo || null,
          phone: org?.phone || '+52 7773846122',
          address: org?.address || 'Temixco, Morelos',
          primary_color: org?.primaryColor || '#059669',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (orgErr) {
        console.error('[Supabase] Failed to bootstrap organization:', orgErr.message);
      }

      // 2. Ensure baseline clinical specialists exist in users table so foreign keys NEVER fail
      const baselineUsers = [
        {
          id: 'user-dra-valeria',
          organization_id: orgId,
          email: 'valeria.gomez@nutriluz.com',
          full_name: 'Dra. Valeria Gómez',
          role: 'ADMIN',
          phone: '+52 55 9876 5432',
        },
        {
          id: 'user-lic-luz-elena',
          organization_id: orgId,
          email: 'luz.elena@nutriluz.mx',
          full_name: 'Lic. Luz Elena Alcocer Muñoz',
          role: 'NUTRIOLOGO',
          phone: '+52 55 1234 5678',
        },
        {
          id: 'user-dr-carlos',
          organization_id: orgId,
          email: 'dr.carlos@nutriluz.mx',
          full_name: 'Dr. Carlos Mendoza Ruiz',
          role: 'NUTRIOLOGO',
          phone: '+52 55 8765 4321',
        },
      ];

      for (const bUser of baselineUsers) {
        await supabase.from('users').upsert(bUser, { onConflict: 'id' });
      }

      // 3. Resolve current user profile dynamically from param or local storage
      let currentUser: Partial<UserProfile> | undefined = user;
      if (!currentUser && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('nutriluz_current_user');
          if (raw) currentUser = JSON.parse(raw);
        } catch {
          // fallback
        }
      }

      if (currentUser?.id) {
        const fullName = currentUser?.firstName
          ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
          : 'Dra. Valeria Gómez';

        await supabase.from('users').upsert(
          {
            id: currentUser.id,
            organization_id: orgId,
            email: currentUser.email || 'especialista@nutriluz.com',
            full_name: fullName,
            role: currentUser.role || 'NUTRIOLOGO',
            phone: currentUser.phone || currentUser.whatsapp || '+52 55 9876 5432',
            avatar_url: currentUser.avatarUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }

      return !orgErr;
    } catch (e: any) {
      console.error('[Supabase] Error ensuring org and user:', e?.message);
      return false;
    }
  },

  // --- NUTRITIONIST & USER PROFILE CRUD ---
  async getNutritionistProfile(userId: string = 'user-dra-valeria'): Promise<UserProfile | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error || !data) return null;
      return mapDbToUser(data);
    } catch (e) {
      console.warn('[Supabase] Error fetching nutritionist user:', e);
      return null;
    }
  },

  async saveNutritionistProfile(user: UserProfile): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      await this.ensureOrganizationAndUser(undefined, user);
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nutriólogo Clínico';
      const row = {
        id: user.id || 'user-dra-valeria',
        organization_id: user.organizationId || 'org-nutriluz-mexico',
        email: user.email || 'valeria.gomez@nutriluz.com',
        full_name: fullName,
        role: user.role || 'ADMIN',
        phone: user.phone || user.whatsapp || '+52 55 9876 5432',
        avatar_url: user.avatarUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        console.error('[Supabase] Error saving nutritionist user:', error.message);
        return false;
      }
      console.log(`[Supabase] Nutritionist name & profile successfully updated in database: "${fullName}" (${user.id})`);
      return true;
    } catch (e: any) {
      console.error('[Supabase] Exception in saveNutritionistProfile:', e?.message);
      return false;
    }
  },

  async saveUser(user: UserProfile): Promise<boolean> {
    return this.saveNutritionistProfile(user);
  },

  // --- PATIENTS ---
  async getPatients(): Promise<Patient[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase] getPatients error:', error.message);
        return null;
      }
      return (data as any[])?.map(mapDbToPatient) || [];
    } catch (e) {
      console.warn('[Supabase] query exception in getPatients:', e);
      return null;
    }
  },

  /**
   * Ensures that the referenced patient exists in the Supabase 'patients' table.
   * Eliminates foreign key violations (e.g. anthropometry_records_patient_id_fkey)
   * in concurrent operations or initial patient registrations.
   */
  async ensurePatientExists(patientId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured || !patientId) return false;
    try {
      // 1. If explicitly marked as deleted in tombstones, do not resurrect
      if (typeof window !== 'undefined') {
        try {
          const rawDel = localStorage.getItem('nutriluz_deleted_patient_ids');
          if (rawDel) {
            const deletedList = JSON.parse(rawDel);
            if (Array.isArray(deletedList) && deletedList.includes(patientId)) {
              return false;
            }
          }
        } catch {
          // ignore
        }
      }

      // 2. Fast check if patient already exists in Supabase
      const { data: existing } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle();

      if (existing?.id) {
        return true;
      }

      // 3. Look up patient in local storage
      let patientToSave: Patient | null = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('nutriluz_patients');
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              patientToSave = list.find((p: any) => p.id === patientId) || null;
            }
          }
        } catch {
          // ignore
        }
      }

      if (patientToSave) {
        console.log(`[Supabase] Auto-syncing parent patient ${patientId} before child record insertion...`);
        return await this.savePatient(patientToSave);
      }

      // 4. Safe fallback stub to preserve relational DB integrity
      console.warn(`[Supabase] Parent patient ${patientId} not found in cloud or local cache. Creating stub to prevent FK constraint failure.`);
      await this.ensureOrganizationAndUser();
      const stub = mapPatientToDb({
        id: patientId,
        organizationId: 'org-nutriluz-mexico',
        branchId: 'branch-cdmx-sur',
        specialistId: 'user-dra-valeria',
        firstName: 'Paciente',
        lastName: 'Registrado',
        gender: 'F',
        birthDate: '1995-01-01',
        email: `paciente_${patientId}@nutriluz.com`,
        phone: '5550000000',
        height: 165,
        initialWeight: 70,
        currentWeight: 70,
        targetWeight: 65,
        goal: 'Control Nutricional',
        status: 'Activo',
        riskLevel: 'NORMAL',
        adherenceRate: 90,
        notes: 'Expediente clínico generado automáticamente para preservar integridad de datos.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const { error: stubErr } = await supabase.from('patients').upsert(stub, { onConflict: 'id' });
      if (stubErr) {
        console.error('[Supabase] Failed to create stub patient:', stubErr.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('[Supabase] Exception in ensurePatientExists:', e?.message);
      return false;
    }
  },

  async savePatient(patient: Patient): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      await this.ensureOrganizationAndUser();
      const row = mapPatientToDb(patient);
      const { error } = await supabase
        .from('patients')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        console.error('[Supabase] CRITICAL savePatient error:', error.message, error.details);
        return false;
      }
      console.log(`[Supabase] Patient ${patient.id} (${patient.firstName}) successfully saved to cloud.`);
      return true;
    } catch (e: any) {
      console.error('[Supabase] Exception in savePatient:', e?.message);
      return false;
    }
  },

  async deletePatient(patientId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      // 1. Delete associated child records in Supabase to maintain database cleanliness
      await Promise.allSettled([
        supabase.from('nutrition_plans').delete().eq('patient_id', patientId),
        supabase.from('anthropometry_records').delete().eq('patient_id', patientId),
        supabase.from('appointments').delete().eq('patient_id', patientId),
        supabase.from('payments').delete().eq('patient_id', patientId),
        supabase.from('lab_records').delete().eq('patient_id', patientId),
      ]);

      // 2. Delete patient from patients table
      const { error } = await supabase.from('patients').delete().eq('id', patientId);
      if (error) {
        console.error('[Supabase] Error deleting patient:', error.message);
      }

      // 3. Broadcast tombstone record in messages so other devices catch the deletion in real-time
      try {
        await supabase.from('messages').insert({
          id: `tombstone-${patientId}-${Date.now()}`,
          organization_id: 'org-nutriluz-mexico',
          sender_id: 'SYSTEM_TOMBSTONE',
          receiver_id: patientId,
          content: `PATIENT_DELETED:${patientId}`,
          is_read: true,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Ignore tombstone broadcast errors
      }

      return !error;
    } catch (err: any) {
      console.error('[Supabase] Exception in deletePatient:', err?.message);
      return false;
    }
  },

  async getCloudTombstonePatientIds(): Promise<string[]> {
    if (!supabase || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('receiver_id, content')
        .eq('sender_id', 'SYSTEM_TOMBSTONE')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !data) return [];
      return data
        .map((row: any) => {
          if (row.content && String(row.content).startsWith('PATIENT_DELETED:')) {
            return String(row.content).replace('PATIENT_DELETED:', '').trim();
          }
          return row.receiver_id;
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  },

  // --- ANTHROPOMETRIC RECORDS ---
  async getAnthropometrics(): Promise<AnthropometricRecord[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('anthropometry_records')
        .select('*')
        .order('recorded_at', { ascending: false });
      if (error) return null;
      return (data as any[])?.map(mapDbToAnthro) || [];
    } catch {
      return null;
    }
  },

  async saveAnthropometric(record: AnthropometricRecord): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      if (record.patientId) {
        await this.ensurePatientExists(record.patientId);
      }
      const row = mapAnthroToDb(record);
      let { error } = await supabase
        .from('anthropometry_records')
        .upsert(row, { onConflict: 'id' });

      // Immediate self-healing retry if foreign key race condition occurred
      if (error && error.code === '23503' && record.patientId) {
        console.warn('[Supabase] Foreign key collision detected on saveAnthropometric. Retrying after ensuring patient...');
        const ensured = await this.ensurePatientExists(record.patientId);
        if (ensured) {
          const retry = await supabase
            .from('anthropometry_records')
            .upsert(row, { onConflict: 'id' });
          error = retry.error;
        }
      }

      if (error) {
        console.error('[Supabase] saveAnthropometric error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('[Supabase] Exception in saveAnthropometric:', e?.message);
      return false;
    }
  },

  // --- NUTRITION PLANS ---
  async getPlans(): Promise<NutritionPlan[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('[Supabase] getPlans error:', error.message);
        return null;
      }
      return (data as any[])?.map(mapDbToPlan) || [];
    } catch {
      return null;
    }
  },

  async getPlansByPatientId(patientId: string): Promise<NutritionPlan[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('[Supabase] getPlansByPatientId error:', error.message);
        return null;
      }
      return (data as any[])?.map(mapDbToPlan) || [];
    } catch (e: any) {
      console.warn('[Supabase] Exception in getPlansByPatientId:', e?.message);
      return null;
    }
  },

  async savePlan(plan: NutritionPlan): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      if (plan.patientId) {
        await this.ensurePatientExists(plan.patientId);
      }
      await this.ensureOrganizationAndUser();
      let row = mapPlanToDb(plan);

      // Attempt 1: Direct upsert
      let { error } = await supabase
        .from('nutrition_plans')
        .upsert(row, { onConflict: 'id' });

      // If failed due to created_by_id or patient_id foreign key constraint, handle gracefully
      if (error && error.code === '23503') {
        if (error.message?.includes('created_by_id')) {
          console.warn('[Supabase] Retrying savePlan with verified specialist user ID...');
          row.created_by_id = 'user-dra-valeria';
          const retryResult = await supabase
            .from('nutrition_plans')
            .upsert(row, { onConflict: 'id' });
          error = retryResult.error;
        } else if (plan.patientId) {
          console.warn('[Supabase] Retrying savePlan after emergency ensurePatientExists...');
          await this.ensurePatientExists(plan.patientId);
          const retryResult = await supabase
            .from('nutrition_plans')
            .upsert(row, { onConflict: 'id' });
          error = retryResult.error;
        }
      }

      if (error) {
        console.error('[Supabase] savePlan error:', error.message, error.details);
        return false;
      }
      console.log(`[Supabase] Plan ${plan.id} for patient ${plan.patientId} saved to cloud database.`);
      return true;
    } catch (e: any) {
      console.error('[Supabase] Exception in savePlan:', e?.message);
      return false;
    }
  },

  // --- APPOINTMENTS ---
  async getAppointments(): Promise<Appointment[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });
      if (error) return null;
      return (data as any[])?.map(mapDbToAppointment) || [];
    } catch {
      return null;
    }
  },

  async saveAppointment(appointment: Appointment): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      if (appointment.patientId) {
        await this.ensurePatientExists(appointment.patientId);
      }
      await this.ensureOrganizationAndUser();
      const row = mapAppointmentToDb(appointment);
      let { error } = await supabase
        .from('appointments')
        .upsert(row, { onConflict: 'id' });

      if (error && error.code === '23503' && appointment.patientId) {
        await this.ensurePatientExists(appointment.patientId);
        const retry = await supabase
          .from('appointments')
          .upsert(row, { onConflict: 'id' });
        error = retry.error;
      }

      if (error) {
        console.error('[Supabase] saveAppointment error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('[Supabase] Exception in saveAppointment:', e?.message);
      return false;
    }
  },

  // --- PAYMENTS ---
  async getPayments(): Promise<PaymentRecord[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return null;
      return (data as any[])?.map(mapDbToPayment) || [];
    } catch {
      return null;
    }
  },

  async savePayment(payment: PaymentRecord): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      if (payment.patientId) {
        await this.ensurePatientExists(payment.patientId);
      }
      await this.ensureOrganizationAndUser();
      const row = mapPaymentToDb(payment);
      let { error } = await supabase
        .from('payments')
        .upsert(row, { onConflict: 'id' });

      if (error && error.code === '23503' && payment.patientId) {
        await this.ensurePatientExists(payment.patientId);
        const retry = await supabase
          .from('payments')
          .upsert(row, { onConflict: 'id' });
        error = retry.error;
      }

      if (error) {
        console.error('[Supabase] savePayment error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('[Supabase] Exception in savePayment:', e?.message);
      return false;
    }
  },

  // --- LAB RECORDS ---
  async getLabRecords(): Promise<LaboratoryResult[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('lab_records')
        .select('*')
        .order('test_date', { ascending: false });
      if (error) return null;
      return (data as any[])?.map(mapDbToLab) || [];
    } catch {
      return null;
    }
  },

  async saveLabRecord(lab: LaboratoryResult): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      if (lab.patientId) {
        await this.ensurePatientExists(lab.patientId);
      }
      const row = mapLabToDb(lab);
      let { error } = await supabase
        .from('lab_records')
        .upsert(row, { onConflict: 'id' });

      if (error && error.code === '23503' && lab.patientId) {
        await this.ensurePatientExists(lab.patientId);
        const retry = await supabase
          .from('lab_records')
          .upsert(row, { onConflict: 'id' });
        error = retry.error;
      }

      if (error) {
        console.error('[Supabase] saveLabRecord error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('[Supabase] Exception in saveLabRecord:', e?.message);
      return false;
    }
  },

  // --- FOODS & RECIPES ---
  async getFoods(): Promise<FoodItem[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('foods').select('*');
      if (error) return null;
      return (data as any[])?.map(mapDbToFood) || [];
    } catch {
      return null;
    }
  },

  async saveFood(food: FoodItem): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      await this.ensureOrganizationAndUser();
      const row = mapFoodToDb(food);
      const { error } = await supabase.from('foods').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  },

  async deleteFood(foodId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('foods').delete().eq('id', foodId);
      return !error;
    } catch {
      return false;
    }
  },

  async getRecipes(): Promise<Recipe[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('recipes').select('*');
      if (error) return null;
      return (data as any[])?.map(mapDbToRecipe) || [];
    } catch {
      return null;
    }
  },

  async saveRecipe(recipe: Recipe): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      await this.ensureOrganizationAndUser();
      const row = mapRecipeToDb(recipe);
      const { error } = await supabase.from('recipes').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  },

  async deleteRecipe(recipeId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
      return !error;
    } catch {
      return false;
    }
  },

  // --- PRESCRIPTION PRESETS & PLANTILLAS PERSISTENCE ---
  async getPrescriptionPresets(): Promise<ClinicalPreset[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('days')
        .eq('id', '__nutriluz_meta_clinical_presets__')
        .maybeSingle();

      if (error || !data || !Array.isArray(data.days) || data.days.length === 0) {
        return null;
      }
      return data.days as ClinicalPreset[];
    } catch (e) {
      console.warn('[Supabase] Failed to fetch prescription presets from cloud:', e);
      return null;
    }
  },

  async savePrescriptionPresets(presets: ClinicalPreset[]): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      await this.ensureOrganizationAndUser();
      const payload = {
        id: '__nutriluz_meta_clinical_presets__',
        patient_id: 'pat-1791220451418', // anchored to default clinic patient reference
        created_by_id: 'user-dra-valeria',
        title: 'NUTRILUZ_SYSTEM_CLINICAL_PRESETS',
        objective: 'SYSTEM_CONFIG_STORE',
        target_calories: 2000,
        target_protein_g: 100,
        target_carbs_g: 200,
        target_fat_g: 50,
        days: presets,
        is_active: false,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('nutrition_plans')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase] Failed to persist prescription presets:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] Exception in savePrescriptionPresets:', e);
      return false;
    }
  },

  // --- MESSAGES ---
  async getMessages(): Promise<ChatMessage[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (error) return null;
      return (data as any[])?.map(mapDbToMessage) || [];
    } catch {
      return null;
    }
  },

  async saveMessage(msg: ChatMessage): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      await this.ensureOrganizationAndUser();
      const row = mapMessageToDb(msg);
      const { error } = await supabase.from('messages').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  },

  // --- FORCED BULK SYNCHRONIZATION ENGINE ---
  async forceSyncAllToCloud(snapshot: {
    patients?: Patient[];
    plans?: NutritionPlan[];
    anthropometrics?: AnthropometricRecord[];
    appointments?: Appointment[];
    payments?: PaymentRecord[];
    labs?: LaboratoryResult[];
    foods?: FoodItem[];
    recipes?: Recipe[];
    messages?: ChatMessage[];
    organization?: Organization;
    user?: UserProfile;
  }): Promise<CloudSyncResult> {
    const result: CloudSyncResult = {
      success: true,
      syncedCount: 0,
      tables: {},
      timestamp: new Date().toISOString(),
    };

    if (!supabase || !isSupabaseConfigured) {
      result.success = false;
      return result;
    }

    try {
      // 1. Ensure prerequisites (Org & User)
      await this.ensureOrganizationAndUser(snapshot.organization, snapshot.user);
      result.tables['organizations'] = { success: true, count: 1 };
      result.tables['users'] = { success: true, count: 1 };

      // 2. Sync Patients (First, as foreign keys depend on patients)
      if (snapshot.patients && snapshot.patients.length > 0) {
        const rows = snapshot.patients.map(mapPatientToDb);
        const { error } = await supabase.from('patients').upsert(rows, { onConflict: 'id' });
        result.tables['patients'] = {
          success: !error,
          count: snapshot.patients.length,
          error: error?.message,
        };
        if (!error) result.syncedCount += snapshot.patients.length;
        else result.success = false;
      }

      // 3. Sync Anthropometrics
      if (snapshot.anthropometrics && snapshot.anthropometrics.length > 0) {
        const rows = snapshot.anthropometrics.map(mapAnthroToDb);
        const { error } = await supabase.from('anthropometry_records').upsert(rows, { onConflict: 'id' });
        result.tables['anthropometry_records'] = {
          success: !error,
          count: snapshot.anthropometrics.length,
          error: error?.message,
        };
        if (!error) result.syncedCount += snapshot.anthropometrics.length;
      }

      // 4. Sync Nutrition Plans
      if (snapshot.plans && snapshot.plans.length > 0) {
        const rows = snapshot.plans.map(mapPlanToDb);
        const { error } = await supabase.from('nutrition_plans').upsert(rows, { onConflict: 'id' });
        result.tables['nutrition_plans'] = {
          success: !error,
          count: snapshot.plans.length,
          error: error?.message,
        };
        if (!error) result.syncedCount += snapshot.plans.length;
      }

      // 5. Sync Appointments
      if (snapshot.appointments && snapshot.appointments.length > 0) {
        const rows = snapshot.appointments.map(mapAppointmentToDb);
        const { error } = await supabase.from('appointments').upsert(rows, { onConflict: 'id' });
        result.tables['appointments'] = {
          success: !error,
          count: snapshot.appointments.length,
          error: error?.message,
        };
        if (!error) result.syncedCount += snapshot.appointments.length;
      }

      // 6. Sync Payments
      if (snapshot.payments && snapshot.payments.length > 0) {
        const rows = snapshot.payments.map(mapPaymentToDb);
        const { error } = await supabase.from('payments').upsert(rows, { onConflict: 'id' });
        result.tables['payments'] = {
          success: !error,
          count: snapshot.payments.length,
          error: error?.message,
        };
        if (!error) result.syncedCount += snapshot.payments.length;
      }

      // 7. Sync Lab Records
      if (snapshot.labs && snapshot.labs.length > 0) {
        const rows = snapshot.labs.map(mapLabToDb);
        const { error } = await supabase.from('lab_records').upsert(rows, { onConflict: 'id' });
        result.tables['lab_records'] = {
          success: !error,
          count: snapshot.labs.length,
          error: error?.message,
        };
        if (!error) result.syncedCount += snapshot.labs.length;
      }

      // 8. Sync Foods
      if (snapshot.foods && snapshot.foods.length > 0) {
        const rows = snapshot.foods.map(mapFoodToDb);
        const { error } = await supabase.from('foods').upsert(rows, { onConflict: 'id' });
        result.tables['foods'] = {
          success: !error,
          count: snapshot.foods.length,
          error: error?.message,
        };
        if (!error) result.syncedCount += snapshot.foods.length;
      }

      // 9. Sync Recipes
      if (snapshot.recipes && snapshot.recipes.length > 0) {
        const rows = snapshot.recipes.map(mapRecipeToDb);
        const { error } = await supabase.from('recipes').upsert(rows, { onConflict: 'id' });
        result.tables['recipes'] = {
          success: !error,
          count: snapshot.recipes.length,
          error: error?.message,
        };
        if (!error) result.syncedCount += snapshot.recipes.length;
      }

      console.log(`[Supabase] Force sync completed: ${result.syncedCount} total records synchronized.`);
    } catch (e: any) {
      result.success = false;
      console.error('[Supabase] Exception during forceSyncAllToCloud:', e?.message);
    }

    return result;
  },

  // --- LIVE HEALTH DIAGNOSTIC REPORT ---
  async testSupabaseLiveHealth(): Promise<SupabaseHealthReport> {
    const startTime = Date.now();
    const tablesChecked: Record<string, { status: 'ok' | 'error'; count?: number }> = {};

    if (!supabase || !isSupabaseConfigured) {
      return {
        connected: false,
        readOk: false,
        writeOk: false,
        latencyMs: 0,
        error: 'Supabase credentials not configured',
        tables: {},
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // 1. Check table health & count
      const tableNames = ['patients', 'anthropometry_records', 'nutrition_plans', 'appointments', 'payments', 'foods', 'recipes', 'lab_records'];
      let readOk = true;

      for (const t of tableNames) {
        const { data, count, error } = await supabase.from(t).select('id', { count: 'exact', head: true });
        if (error) {
          tablesChecked[t] = { status: 'error' };
          readOk = false;
        } else {
          tablesChecked[t] = { status: 'ok', count: count || 0 };
        }
      }

      // 2. Test active write & delete verification
      const testOrgId = 'org-nutriluz-mexico';
      const testPatId = `health-check-${Date.now()}`;
      const { error: insErr } = await supabase.from('patients').insert({
        id: testPatId,
        organization_id: testOrgId,
        first_name: 'Health',
        last_name: 'Check',
        email: 'health@check.local',
        phone: '+52 00 0000 0000',
        gender: 'Otro',
      });

      let writeOk = !insErr;
      if (writeOk) {
        await supabase.from('patients').delete().eq('id', testPatId);
      }

      const latencyMs = Date.now() - startTime;

      return {
        connected: readOk && writeOk,
        readOk,
        writeOk,
        latencyMs,
        tables: tablesChecked,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        connected: false,
        readOk: false,
        writeOk: false,
        latencyMs: Date.now() - startTime,
        error: err?.message,
        tables: tablesChecked,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

// =========================================================================
// MAPPERS: APP TYPES <---> SUPABASE POSTGRESQL CANONICAL SCHEMA
// =========================================================================

function mapPatientToDb(p: Patient): Record<string, any> {
  const orgId = p.organizationId || 'org-nutriluz-mexico';
  // Embed comprehensive clinical history & somatometry into medical_notes JSON
  const clinicalPayload = {
    initialWeight: p.initialWeight,
    currentWeight: p.currentWeight,
    targetWeight: p.targetWeight,
    height: p.height,
    goal: p.goal,
    status: p.status,
    riskLevel: p.riskLevel,
    branchId: p.branchId || 'branch-cdmx-sur',
    specialistId: p.specialistId || 'user-dra-valeria',
    whatsapp: p.whatsapp || p.phone,
    address: p.address,
    photoUrl: p.photoUrl,
    customNotes: p.notes,
    lastConsultationDate: p.lastConsultationDate,
    nextConsultationDate: p.nextConsultationDate,
    assignedRecipeIds: Array.isArray(p.assignedRecipeIds) ? p.assignedRecipeIds : [],
    portalAccessEnabled: p.portalAccessEnabled !== undefined ? p.portalAccessEnabled : true,
    portalUsername: p.portalUsername || null,
    portalPassword: p.portalPassword || null,
    portalLastLogin: p.portalLastLogin || null,
  };

  return {
    id: p.id,
    organization_id: orgId,
    assigned_specialist_id: p.specialistId || 'user-dra-valeria',
    first_name: p.firstName || 'Paciente',
    last_name: p.lastName || '',
    email: p.email || null,
    phone: p.phone || null,
    birth_date: p.birthDate || '1990-01-01',
    gender: p.gender || 'F',
    occupation: p.occupation || null,
    medical_notes: JSON.stringify(clinicalPayload),
    is_high_risk: p.riskLevel === 'HIGH_RISK',
    risk_reason: p.riskLevel === 'HIGH_RISK' ? 'Riesgo clínico detectado' : null,
    current_plan_id: null,
    adherence_rate: Number(p.adherenceRate || 85),
    tags: Array.isArray((p as any).tags) ? (p as any).tags : [],
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  };
}

function mapDbToPatient(row: any): Patient {
  let meta: any = {};
  if (row.medical_notes) {
    try {
      meta = JSON.parse(row.medical_notes);
    } catch {
      meta = { customNotes: row.medical_notes };
    }
  }

  const assignedRecipeIds: string[] = Array.isArray(meta.assignedRecipeIds)
    ? meta.assignedRecipeIds
    : (Array.isArray(row.assigned_recipe_ids) ? row.assigned_recipe_ids : []);

  return {
    id: row.id,
    organizationId: row.organization_id || 'org-nutriluz-mexico',
    branchId: meta.branchId || 'branch-cdmx-sur',
    specialistId: row.assigned_specialist_id || meta.specialistId || 'user-dra-valeria',
    firstName: row.first_name || 'Paciente',
    lastName: row.last_name || '',
    email: row.email || '',
    phone: row.phone || '',
    whatsapp: meta.whatsapp || row.phone || '',
    birthDate: row.birth_date || '1990-01-01',
    gender: (row.gender as any) || 'F',
    occupation: row.occupation || '',
    address: meta.address || '',
    photoUrl: meta.photoUrl || '',
    goal: meta.goal || 'Salud y bienestar integral',
    status: meta.status || 'Activo',
    riskLevel: row.is_high_risk ? 'HIGH_RISK' : (meta.riskLevel || 'NORMAL'),
    adherenceRate: Number(row.adherence_rate ?? 85),
    initialWeight: Number(meta.initialWeight ?? 70),
    currentWeight: Number(meta.currentWeight ?? 70),
    targetWeight: Number(meta.targetWeight ?? 65),
    height: Number(meta.height ?? 165),
    lastConsultationDate: meta.lastConsultationDate,
    nextConsultationDate: meta.nextConsultationDate,
    notes: meta.customNotes || '',
    assignedRecipeIds,
    portalAccessEnabled: meta.portalAccessEnabled !== undefined ? meta.portalAccessEnabled : true,
    portalUsername: meta.portalUsername || row.email || '',
    portalPassword: meta.portalPassword || 'Nutri2026!',
    portalLastLogin: meta.portalLastLogin || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapAnthroToDb(a: AnthropometricRecord): Record<string, any> {
  return {
    id: a.id,
    patient_id: a.patientId,
    recorded_at: a.date ? new Date(a.date).toISOString() : new Date().toISOString(),
    weight_kg: Number(a.weight || 70),
    height_cm: Number(a.height || 165),
    bmi: Number(a.bmi || (Number(a.weight || 70) / Math.pow(Number(a.height || 165) / 100, 2)).toFixed(2)),
    body_fat_pct: a.bodyFatPercentage !== undefined ? Number(a.bodyFatPercentage) : null,
    muscle_mass_kg: a.muscleMassKg !== undefined ? Number(a.muscleMassKg) : null,
    visceral_fat_level: a.visceralFatLevel !== undefined ? Number(a.visceralFatLevel) : null,
    waist_cm: a.waistCircumference !== undefined ? Number(a.waistCircumference) : null,
    hip_cm: a.hipCircumference !== undefined ? Number(a.hipCircumference) : null,
    arm_cm: (a as any).armCircumference !== undefined ? Number((a as any).armCircumference) : null,
    notes: a.notes || (a.measurementDevice ? `Dispositivo: ${a.measurementDevice}` : null),
  };
}

function mapDbToAnthro(row: any): AnthropometricRecord {
  const weight = Number(row.weight_kg || 70);
  const height = Number(row.height_cm || 165);
  const bmi = Number(row.bmi || (weight / Math.pow(height / 100, 2)).toFixed(2));
  const waist = row.waist_cm ? Number(row.waist_cm) : 75;
  const hip = row.hip_cm ? Number(row.hip_cm) : 95;

  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.recorded_at ? row.recorded_at.split('T')[0] : new Date().toISOString().split('T')[0],
    weight,
    height,
    bmi,
    bodyFatPercentage: row.body_fat_pct ? Number(row.body_fat_pct) : 22,
    muscleMassKg: row.muscle_mass_kg ? Number(row.muscle_mass_kg) : 45,
    fatMassKg: row.body_fat_pct ? Number(((weight * Number(row.body_fat_pct)) / 100).toFixed(1)) : 15,
    visceralFatLevel: row.visceral_fat_level ? Number(row.visceral_fat_level) : 4,
    waistCircumference: waist,
    hipCircumference: hip,
    waistHipRatio: Number((waist / hip).toFixed(2)),
    measurementDevice: 'InBody / Bioimpedancia',
    notes: row.notes || '',
  };
}

function mapPlanToDb(p: NutritionPlan): Record<string, any> {
  return {
    id: p.id,
    patient_id: p.patientId,
    created_by_id: p.specialistId || 'user-dra-valeria',
    title: p.title || 'Plan Nutricional Personalizado',
    objective: p.goal || 'Optimización Metabólica y Composición Corporal',
    target_calories: Number(p.targetCaloriesKcal || 1800),
    target_protein_g: Number(p.targetProteinG || 120),
    target_carbs_g: Number(p.targetCarbsG || 180),
    target_fat_g: Number(p.targetFatG || 55),
    days: Array.isArray(p.days) ? p.days : [],
    is_active: p.status === 'ACTIVE' || (p.status as any) === 'Activo',
    start_date: p.startDate ? p.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
    end_date: p.endDate ? p.endDate.split('T')[0] : null,
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  };
}

function mapDbToPlan(row: any): NutritionPlan {
  return {
    id: row.id,
    organizationId: 'org-nutriluz-mexico',
    specialistId: row.created_by_id || 'user-dra-valeria',
    patientId: row.patient_id,
    title: row.title || 'Plan Nutricional',
    goal: row.objective || 'General',
    status: row.is_active ? 'ACTIVE' : 'ARCHIVED',
    startDate: row.start_date || new Date().toISOString().split('T')[0],
    endDate: row.end_date || undefined,
    targetCaloriesKcal: Number(row.target_calories || 1800),
    targetProteinG: Number(row.target_protein_g || 120),
    targetCarbsG: Number(row.target_carbs_g || 180),
    targetFatG: Number(row.target_fat_g || 55),
    targetWaterLiters: 2.5,
    generalInstructions: 'Seguir horarios regulares y respetar las porciones de equivalentes SMAE.',
    hydrationInstructions: 'Consumir al menos 2.5L de agua natural durante el día.',
    approvedBySpecialist: true,
    days: Array.isArray(row.days) ? row.days : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapAppointmentToDb(a: Appointment): Record<string, any> {
  let normalizedType: 'PRESENCIAL' | 'ONLINE' = 'PRESENCIAL';
  const rawType = (a.appointmentType || (a as any).type || '').toUpperCase();
  if (rawType.includes('ONLINE') || rawType.includes('VIRTUAL')) {
    normalizedType = 'ONLINE';
  }

  let normalizedStatus: 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' = 'CONFIRMADA';
  const rawStatus = (a.status || '').toUpperCase();
  if (rawStatus.includes('CANCEL')) normalizedStatus = 'CANCELADA';
  else if (rawStatus.includes('COMPLET')) normalizedStatus = 'COMPLETADA';
  else if (rawStatus.includes('PEND')) normalizedStatus = 'PENDIENTE';

  return {
    id: a.id,
    organization_id: a.organizationId || 'org-nutriluz-mexico',
    patient_id: a.patientId,
    specialist_id: a.specialistId || 'user-dra-valeria',
    date: a.startTime ? a.startTime.split('T')[0] : (a as any).date || new Date().toISOString().split('T')[0],
    time: a.startTime && a.startTime.includes('T') ? a.startTime.split('T')[1].substring(0, 5) : ((a as any).time || '10:00'),
    duration_minutes: 45,
    type: normalizedType,
    status: normalizedStatus,
    clinical_notes: a.locationNotes || null,
    meeting_url: a.meetingLink || null,
    created_at: new Date().toISOString(),
  };
}

function mapDbToAppointment(row: any): Appointment {
  const startIso = `${row.date}T${row.time || '10:00'}:00.000Z`;
  const endIso = `${row.date}T11:00:00.000Z`;

  return {
    id: row.id,
    organizationId: row.organization_id || 'org-nutriluz-mexico',
    patientId: row.patient_id,
    specialistId: row.specialist_id || 'user-dra-valeria',
    patientName: 'Paciente',
    appointmentType: row.type === 'ONLINE' ? 'ONLINE' : 'PRESENCIAL',
    status: row.status === 'CONFIRMADA' ? 'CONFIRMADA' : row.status === 'REALIZADA' ? 'REALIZADA' : 'PENDIENTE',
    startTime: startIso,
    endTime: endIso,
    price: 850,
    currency: 'MXN',
    locationNotes: row.clinical_notes || '',
    meetingLink: row.meeting_url || '',
  };
}

function mapPaymentToDb(p: PaymentRecord): Record<string, any> {
  let normalizedMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'STRIPE' = 'TARJETA';
  const rawMethod = (p.paymentMethod || '').toUpperCase();
  if (rawMethod.includes('EFECT') || rawMethod.includes('CASH')) normalizedMethod = 'EFECTIVO';
  else if (rawMethod.includes('TRANS')) normalizedMethod = 'TRANSFERENCIA';
  else if (rawMethod.includes('STRIPE')) normalizedMethod = 'STRIPE';

  let normalizedStatus: 'PENDIENTE' | 'PAGADO' | 'CANCELADO' = 'PAGADO';
  const rawStatus = (p.status || '').toUpperCase();
  if (rawStatus.includes('PEND')) normalizedStatus = 'PENDIENTE';
  else if (rawStatus.includes('CANCEL')) normalizedStatus = 'CANCELADO';

  return {
    id: p.id,
    organization_id: p.organizationId || 'org-nutriluz-mexico',
    patient_id: p.patientId,
    amount: Number(p.amount || 850),
    currency: p.currency || 'MXN',
    concept: p.concept || 'Consulta Nutricional y Evaluación Integral',
    payment_method: normalizedMethod,
    status: normalizedStatus,
    paid_at: p.paidAt || new Date().toISOString(),
    receipt_url: null,
    created_at: new Date().toISOString(),
  };
}

function mapDbToPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id || 'org-nutriluz-mexico',
    patientId: row.patient_id,
    patientName: 'Paciente',
    amount: Number(row.amount || 850),
    currency: row.currency || 'MXN',
    concept: row.concept || 'Consulta de Nutrición',
    paymentMethod: row.payment_method === 'EFECTIVO' ? 'EFECTIVO' : row.payment_method === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'TARJETA',
    status: row.status === 'PAGADO' ? 'PAGADO' : 'PENDIENTE',
    paidAt: row.paid_at || row.created_at || new Date().toISOString(),
  };
}

function mapLabToDb(l: LaboratoryResult): Record<string, any> {
  return {
    id: l.id,
    patient_id: l.patientId,
    test_date: l.testDate ? l.testDate.split('T')[0] : new Date().toISOString().split('T')[0],
    glucose_mg_dl: l.glucoseMgDl ? Number(l.glucoseMgDl) : null,
    hba1c_pct: l.hba1cPercentage ? Number(l.hba1cPercentage) : null,
    total_cholesterol_mg_dl: l.totalCholesterolMgDl ? Number(l.totalCholesterolMgDl) : null,
    triglycerides_mg_dl: l.triglyceridesMgDl ? Number(l.triglyceridesMgDl) : null,
    hdl_mg_dl: l.hdlCholesterolMgDl ? Number(l.hdlCholesterolMgDl) : null,
    ldl_mg_dl: l.ldlCholesterolMgDl ? Number(l.ldlCholesterolMgDl) : null,
    uric_acid_mg_dl: l.uricAcidMgDl ? Number(l.uricAcidMgDl) : null,
    creatinine_mg_dl: l.creatinineMgDl ? Number(l.creatinineMgDl) : null,
    document_url: null,
    notes: l.specialistInterpretation || l.laboratoryName || 'Laboratorio Clínico',
    created_at: new Date().toISOString(),
  };
}

function mapDbToLab(row: any): LaboratoryResult {
  return {
    id: row.id,
    patientId: row.patient_id,
    testDate: row.test_date,
    laboratoryName: 'Laboratorio Médico Certificado',
    glucoseMgDl: row.glucose_mg_dl ? Number(row.glucose_mg_dl) : undefined,
    hba1cPercentage: row.hba1c_pct ? Number(row.hba1c_pct) : undefined,
    totalCholesterolMgDl: row.total_cholesterol_mg_dl ? Number(row.total_cholesterol_mg_dl) : undefined,
    triglyceridesMgDl: row.triglycerides_mg_dl ? Number(row.triglycerides_mg_dl) : undefined,
    hdlCholesterolMgDl: row.hdl_mg_dl ? Number(row.hdl_mg_dl) : undefined,
    ldlCholesterolMgDl: row.ldl_mg_dl ? Number(row.ldl_mg_dl) : undefined,
    uricAcidMgDl: row.uric_acid_mg_dl ? Number(row.uric_acid_mg_dl) : undefined,
    creatinineMgDl: row.creatinine_mg_dl ? Number(row.creatinine_mg_dl) : undefined,
    specialistInterpretation: row.notes || '',
  };
}

function mapFoodToDb(f: FoodItem): Record<string, any> {
  return {
    id: f.id,
    organization_id: 'org-nutriluz-mexico',
    name: f.name || 'Alimento',
    equivalent_group_code: f.equivalentGroupCode || 'AOA_MOD',
    serving_size: f.servingSize || '1 porción',
    serving_weight_g: f.servingWeightG || 100,
    energy_kcal: Number(f.energyKcal || 100),
    protein_g: Number(f.proteinG || 5),
    fat_g: Number(f.fatG || 2),
    carbs_g: Number(f.carbsG || 15),
    fiber_g: Number(f.fiberG || 1),
    glycemic_index: f.glycemicIndex || null,
    is_custom: false,
    created_at: new Date().toISOString(),
  };
}

function mapDbToFood(row: any): FoodItem {
  return {
    id: row.id,
    name: row.name,
    equivalentGroupCode: row.equivalent_group_code || 'VERDURAS',
    servingSize: row.serving_size || '1 porción',
    servingWeightG: Number(row.serving_weight_g || 100),
    energyKcal: Number(row.energy_kcal || 100),
    proteinG: Number(row.protein_g || 0),
    carbsG: Number(row.carbs_g || 0),
    fatG: Number(row.fat_g || 0),
    fiberG: Number(row.fiber_g || 0),
    glycemicIndex: 'Bajo',
  };
}

function mapRecipeToDb(r: Recipe): Record<string, any> {
  return {
    id: r.id,
    organization_id: 'org-nutriluz-mexico',
    title: r.name || 'Receta Nutricional',
    description: r.description || null,
    prep_time_minutes: Number(r.prepTimeMinutes || 15),
    difficulty: r.difficulty || 'Fácil',
    category: r.category || 'Comida',
    total_energy_kcal: Number(r.caloriesKcal || 350),
    protein_g: Number(r.proteinG || 25),
    fat_g: Number(r.fatG || 12),
    carbs_g: Number(r.carbsG || 35),
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.steps) ? r.steps : [],
    image_url: r.photoUrl || null,
    created_at: new Date().toISOString(),
  };
}

function mapDbToRecipe(row: any): Recipe {
  return {
    id: row.id,
    name: row.title || 'Receta Nutricional',
    description: row.description || '',
    category: (row.category as any) || 'Comida',
    servings: 1,
    prepTimeMinutes: Number(row.prep_time_minutes || 15),
    cookTimeMinutes: 15,
    difficulty: 'Fácil',
    caloriesKcal: Number(row.total_energy_kcal || 350),
    proteinG: Number(row.protein_g || 25),
    carbsG: Number(row.carbs_g || 35),
    fatG: Number(row.fat_g || 12),
    fiberG: 4,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    steps: Array.isArray(row.instructions) ? row.instructions : [],
    photoUrl: row.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    tags: ['Saludable', 'NutriLuz'],
  };
}

function mapMessageToDb(m: ChatMessage): Record<string, any> {
  return {
    id: m.id,
    organization_id: 'org-nutriluz-mexico',
    sender_id: m.senderId || 'user-dra-valeria',
    receiver_id: m.conversationId || 'pat-test-01',
    patient_id: m.conversationId || 'pat-test-01',
    content: m.content,
    attachment_url: m.attachmentUrl || null,
    is_read: m.isRead || false,
    created_at: m.createdAt || new Date().toISOString(),
  };
}

function mapDbToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.receiver_id || row.patient_id || 'conv-01',
    senderId: row.sender_id,
    senderName: row.sender_id?.includes('user') ? 'Dra. Valeria Gómez' : 'Paciente',
    senderRole: row.sender_id?.includes('user') ? 'NUTRIOLOGO' : 'PACIENTE',
    content: row.content,
    createdAt: row.created_at,
    isRead: row.is_read || false,
  };
}

function mapDbToUser(row: any, existingUser?: UserProfile): UserProfile {
  let firstName = 'Valeria';
  let lastName = 'Gómez';
  if (row.full_name) {
    const parts = row.full_name.trim().split(' ');
    if (parts.length === 1) {
      firstName = parts[0];
      lastName = '';
    } else if (parts.length === 2) {
      firstName = parts[0];
      lastName = parts[1];
    } else {
      // If starts with title (e.g. Dra. or Dr. or Lic.)
      if (['dra.', 'dr.', 'lic.', 'msc.', 'mtra.', 'mtro.', 'nut.'].includes(parts[0].toLowerCase())) {
        firstName = parts[1];
        lastName = parts.slice(2).join(' ');
      } else {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
    }
  }

  return {
    id: row.id || 'user-dra-valeria',
    organizationId: row.organization_id || 'org-nutriluz-mexico',
    firstName: firstName || existingUser?.firstName || 'Valeria',
    lastName: lastName || existingUser?.lastName || 'Gómez',
    email: row.email || existingUser?.email || 'valeria.gomez@nutriluz.com',
    phone: row.phone || existingUser?.phone || '+52 55 9876 5432',
    whatsapp: row.phone || existingUser?.whatsapp || '+52 55 9876 5432',
    role: (row.role as any) || existingUser?.role || 'ADMIN',
    avatarUrl: row.avatar_url || existingUser?.avatarUrl || 'https://images.unsplash.com/photo-1594824813686-639a0397500e?w=300&auto=format&fit=crop&q=80',
    professionalTitle: existingUser?.professionalTitle || 'Nutrióloga Clínica',
    licenseNumber: existingUser?.licenseNumber || '',
    specialties: existingUser?.specialties || ['Nutrición Clínica'],
    bio: existingUser?.bio || '',
    publicProfileEnabled: existingUser?.publicProfileEnabled ?? true,
    publicSlug: existingUser?.publicSlug || 'nutriologo-clinico',
    isActive: existingUser?.isActive ?? true,
  };
}


