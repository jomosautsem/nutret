-- ============================================================================
-- 008_exercise_supplements_documents.sql: Exercise, Supplements, Documents
-- ============================================================================

-- Exercise Library
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  muscle_group VARCHAR(100) NOT NULL, -- 'Pecho', 'Espalda', 'Pierna / Glúteo', 'Hombro', 'Brazo', 'Core', 'Cardiovascular'
  equipment VARCHAR(100) DEFAULT 'Mancuernas / Peso corporal',
  difficulty VARCHAR(50) DEFAULT 'Intermedio',
  description TEXT,
  video_url TEXT,
  gif_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise Routines
CREATE TABLE exercise_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  goal VARCHAR(255),
  frequency_per_week INT DEFAULT 4,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercise_routine_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES exercise_routines(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL,
  day_label VARCHAR(50) NOT NULL, -- 'Lunes - Tren Superior', 'Martes - Pierna'
  exercise_name VARCHAR(255) NOT NULL,
  sets INT NOT NULL DEFAULT 4,
  reps VARCHAR(50) NOT NULL DEFAULT '10-12',
  rest_seconds INT DEFAULT 90,
  weight_target VARCHAR(50),
  tempo VARCHAR(50) DEFAULT '3-0-1-0',
  notes TEXT
);

-- Supplements Prescriptions
CREATE TABLE supplement_prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL, -- 'Creatina Monohidratada Creapure', 'Omega 3 IFOS'
  dosage VARCHAR(100) NOT NULL, -- '5g al día'
  timing VARCHAR(150) NOT NULL, -- 'Post-entrenamiento con agua o bebida'
  frequency VARCHAR(100) DEFAULT 'Diario',
  duration_weeks INT DEFAULT 12,
  specialist_instructions TEXT,
  disclaimer TEXT DEFAULT 'Recomendación personalizada por el especialista en nutrición. No sustituye tratamiento médico.',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Documents & Consents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  document_type VARCHAR(100) NOT NULL, -- 'PLAN_NUTRICIONAL_PDF', 'CONSENTIMIENTO_INFORMADO', 'RESUMEN_CONSULTA', 'EVOLUCION'
  title VARCHAR(255) NOT NULL,
  file_url TEXT,
  digital_signature_data JSONB,
  signed_at TIMESTAMPTZ,
  is_signed_by_patient BOOLEAN DEFAULT FALSE,
  is_approved_by_specialist BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
