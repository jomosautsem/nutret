-- ============================================================================
-- 001_initial_schema.sql: Multi-tenant, Organizations, Profiles, Roles, Audit Logs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles enum
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'OWNER',
  'ADMIN',
  'NUTRIOLOGO',
  'ASISTENTE',
  'ENTRENADOR',
  'PACIENTE'
);

-- Organizations (Clinics, Practices)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(20) DEFAULT '#059669', -- Emerald 600
  secondary_color VARCHAR(20) DEFAULT '#047857',
  currency VARCHAR(10) DEFAULT 'MXN',
  country VARCHAR(50) DEFAULT 'México',
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  website TEXT,
  tax_id VARCHAR(50), -- RFC
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches / Sucursales
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (Linked to Supabase Auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- Matches auth.users(id)
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'NUTRIOLOGO',
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  professional_title VARCHAR(150) DEFAULT 'Lic. en Nutrición',
  license_number VARCHAR(100), -- Cédula Profesional
  specialties TEXT[] DEFAULT ARRAY['Nutrición Clínica', 'Recomposición Corporal'],
  avatar_url TEXT,
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  bio TEXT,
  digital_signature_url TEXT,
  public_profile_enabled BOOLEAN DEFAULT TRUE,
  public_slug VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Memberships (For multi-specialist clinics)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'NUTRIOLOGO',
  permissions JSONB DEFAULT '{"can_edit_patients": true, "can_prescribe": true, "can_view_finances": false}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, EXPORT, APPROVE
  entity_type VARCHAR(100) NOT NULL, -- patients, clinical_records, nutrition_plans
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_branches_org ON branches(organization_id);
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
