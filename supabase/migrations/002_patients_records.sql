-- ============================================================================
-- 002_patients_records.sql: Patients, Clinical Records, Form Builder, Allergies
-- ============================================================================

CREATE TYPE patient_status AS ENUM ('Activo', 'Inactivo', 'En pausa', 'Alta');
CREATE TYPE risk_level AS ENUM ('NORMAL', 'MEDIUM_RISK', 'HIGH_RISK');

-- Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Link to patient portal login
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  birth_date DATE NOT NULL,
  gender VARCHAR(20) NOT NULL, -- 'M', 'F', 'Otro'
  occupation VARCHAR(150),
  address TEXT,
  photo_url TEXT,
  goal VARCHAR(255) NOT NULL, -- 'Pérdida de grasa', 'Hipertrofia', 'Salud cardiovascular'
  status patient_status DEFAULT 'Activo',
  risk_level risk_level DEFAULT 'NORMAL',
  adherence_rate NUMERIC(5,2) DEFAULT 85.00,
  initial_weight NUMERIC(5,2),
  current_weight NUMERIC(5,2),
  target_weight NUMERIC(5,2),
  height NUMERIC(5,2), -- in cm
  last_consultation_date TIMESTAMPTZ,
  next_consultation_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Records (Expediente Clínico)
-- Clinical Records (Expediente Clínico)
CREATE TABLE IF NOT EXISTS clinical_records (
  id VARCHAR(100) PRIMARY KEY,
  patient_id VARCHAR(100) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialist_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Heredofamiliares
  family_history JSONB DEFAULT '{}',
  
  -- Personales patológicos y no patológicos
  pathological_history JSONB DEFAULT '{}',
  allergies JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  
  -- Hábitos de vida
  lifestyle_habits JSONB DEFAULT '{}',
  
  -- Actividad física
  physical_activity JSONB DEFAULT '{}',
  
  -- Hábitos dietéticos y 24h recall
  dietary_habits JSONB DEFAULT '{}',
  recall_24h TEXT DEFAULT '',
  recall_24h_ai_analysis JSONB DEFAULT '{}',
  
  -- Objetivos y observaciones clínicas
  clinical_goals TEXT DEFAULT '',
  clinical_observations TEXT DEFAULT '',
  
  -- Dynamic custom questions answers
  custom_fields JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Questions Builder (Constructor de formularios personalizables)
CREATE TABLE clinical_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- 'Antecedentes', 'Hábitos', 'Gastrointestinal'
  question_label TEXT NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'select', 'multiselect', 'boolean', 'scale', 'textarea'
  options JSONB, -- For select / multiselect options
  is_required BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_org ON patients(organization_id);
CREATE INDEX idx_patients_specialist ON patients(specialist_id);
CREATE INDEX idx_clinical_patient ON clinical_records(patient_id);
