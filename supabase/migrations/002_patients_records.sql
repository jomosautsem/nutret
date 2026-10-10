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
CREATE TABLE clinical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Heredofamiliares
  family_history JSONB DEFAULT '{"diabetes": false, "hypertension": false, "cancer": false, "cardiovascular": false, "thyroid": false, "notes": ""}',
  
  -- Personales patológicos y no patológicos
  pathological_history JSONB DEFAULT '{"diagnosed_diseases": [], "previous_treatments": "", "surgeries": []}',
  allergies JSONB DEFAULT '[]', -- ['Lácteos', 'Mariscos', 'Cacahuates']
  medications JSONB DEFAULT '[]', -- [{name: 'Metformina', dose: '850mg', frequency: 'Cada 12h'}]
  
  -- Hábitos de vida
  lifestyle_habits JSONB DEFAULT '{"sleep_hours": 7, "sleep_quality": "Buena", "smoking": false, "alcohol": "Ocasional", "stress_level": "Moderado", "water_daily_liters": 2.0}',
  
  -- Actividad física
  physical_activity JSONB DEFAULT '{"activity_level": "Moderada", "exercise_type": "Fuerza y funcional", "frequency_days_per_week": 4, "duration_minutes": 60}',
  
  -- Hábitos dietéticos y 24h recall
  dietary_habits JSONB DEFAULT '{"meals_per_day": 4, "preferred_foods": [], "disliked_foods": [], "food_allergies": [], "eating_out_frequency": "1 vez por semana", "binge_eating": false}',
  recall_24h TEXT,
  recall_24h_ai_analysis JSONB,
  
  -- Objetivos y observaciones clínicas
  clinical_goals TEXT,
  clinical_observations TEXT,
  
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
