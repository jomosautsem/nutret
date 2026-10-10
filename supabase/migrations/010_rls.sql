-- ============================================================================
-- 010_rls.sql: Strict Multi-Tenant Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS across all sensitive tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anthropometric_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Helper functions for JWT-based auth checking
CREATE OR REPLACE FUNCTION current_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 1. Organizations Policy: Members can view their own organization
CREATE POLICY "org_member_read" ON organizations
  FOR SELECT
  USING (
    id = current_user_organization_id()
    OR current_user_role() = 'SUPER_ADMIN'
  );

-- 2. Profiles Policy: Users can view profiles in their organization, or their own profile
CREATE POLICY "profiles_org_read" ON profiles
  FOR SELECT
  USING (
    organization_id = current_user_organization_id()
    OR id = auth.uid()
  );

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- 3. Patients Policy:
-- Specialists and Admins can access patients belonging to their organization
-- Patients can only access their own record linked via user_id
CREATE POLICY "patients_specialist_access" ON patients
  FOR ALL
  USING (
    (organization_id = current_user_organization_id() AND current_user_role() IN ('OWNER', 'ADMIN', 'NUTRIOLOGO', 'ASISTENTE', 'SUPER_ADMIN'))
    OR (user_id = auth.uid())
  );

-- 4. Clinical Records Policy: Only medical staff of the org or patient read-only
CREATE POLICY "clinical_staff_access" ON clinical_records
  FOR ALL
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE organization_id = current_user_organization_id()
    )
    AND current_user_role() IN ('OWNER', 'ADMIN', 'NUTRIOLOGO', 'SUPER_ADMIN')
  );

CREATE POLICY "clinical_patient_read" ON clinical_records
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- 5. Anthropometric Records:
CREATE POLICY "anthropometry_org_access" ON anthropometric_records
  FOR ALL
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE organization_id = current_user_organization_id()
    )
    OR patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- 6. Nutrition Plans:
CREATE POLICY "plans_org_access" ON nutrition_plans
  FOR ALL
  USING (
    organization_id = current_user_organization_id()
    OR patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- 7. Meal Logs & Water Logs (Patient can create/update own logs, Specialist can view):
CREATE POLICY "meal_logs_access" ON meal_logs
  FOR ALL
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
    OR patient_id IN (
      SELECT id FROM patients WHERE organization_id = current_user_organization_id()
    )
  );

CREATE POLICY "water_logs_access" ON water_logs
  FOR ALL
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
    OR patient_id IN (
      SELECT id FROM patients WHERE organization_id = current_user_organization_id()
    )
  );

-- 8. Appointments:
CREATE POLICY "appointments_access" ON appointments
  FOR ALL
  USING (
    organization_id = current_user_organization_id()
    OR patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- 9. Payments:
CREATE POLICY "payments_access" ON payments
  FOR ALL
  USING (
    organization_id = current_user_organization_id()
    OR patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );
