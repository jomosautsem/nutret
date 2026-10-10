-- ============================================================================
-- 006_logs_tracking_photos.sql: Meal Logs, Water, Exercise, Progress Photos
-- ============================================================================

CREATE TYPE adherence_status AS ENUM ('Cumplí', 'Parcialmente', 'No cumplí');

-- Patient Meal Logs (Registro de comidas del paciente)
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  plan_meal_id UUID REFERENCES nutrition_plan_meals(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type VARCHAR(50) NOT NULL, -- 'Desayuno', 'Colación 1', 'Comida', 'Colación 2', 'Cena', 'Extra'
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  status adherence_status NOT NULL DEFAULT 'Cumplí',
  description TEXT,
  photo_url TEXT,
  ai_estimated_calories INT,
  ai_estimated_macros JSONB,
  hunger_level INT, -- 1-10
  satiety_level INT, -- 1-10
  patient_comment TEXT,
  specialist_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water Logs (Registro diario de hidratación)
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INT NOT NULL, -- e.g. 250, 500, 1000
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  daily_total_ml INT DEFAULT 0
);

-- Supplement Logs
CREATE TABLE supplement_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplement_name VARCHAR(150) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  is_taken BOOLEAN DEFAULT TRUE
);

-- Progress Photos (Fotografías de evolución con comparador)
CREATE TABLE progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pose_type VARCHAR(20) NOT NULL, -- 'FRONT', 'SIDE', 'BACK'
  photo_url TEXT NOT NULL,
  weight_at_photo NUMERIC(5,2),
  body_fat_at_photo NUMERIC(4,2),
  is_private BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_logs_patient ON meal_logs(patient_id, date);
CREATE INDEX idx_water_logs_patient ON water_logs(patient_id, date);
CREATE INDEX idx_photos_patient ON progress_photos(patient_id, date);
