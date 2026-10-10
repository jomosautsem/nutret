-- ============================================================================
-- 003_anthropometry_labs.sql: Anthropometry, Body Composition, Labs, InBody
-- ============================================================================

-- Anthropometric Records (Antropometría periódica)
CREATE TABLE anthropometric_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Basic metrics
  weight NUMERIC(5,2) NOT NULL, -- kg
  height NUMERIC(5,2) NOT NULL, -- cm
  bmi NUMERIC(4,2) GENERATED ALWAYS AS (weight / ((height/100.0) * (height/100.0))) STORED,
  
  -- Body Composition
  body_fat_percentage NUMERIC(4,2), -- % grasa
  fat_mass_kg NUMERIC(5,2), -- kg grasa
  muscle_mass_kg NUMERIC(5,2), -- kg masa muscular
  bone_mass_kg NUMERIC(4,2),
  body_water_percentage NUMERIC(4,2),
  visceral_fat_level INT,
  basal_metabolic_rate_kcal INT,
  metabolic_age INT,
  
  -- Circumferences (cm)
  waist_circumference NUMERIC(5,2),
  hip_circumference NUMERIC(5,2),
  waist_hip_ratio NUMERIC(4,2),
  chest_circumference NUMERIC(5,2),
  relaxed_arm_circumference NUMERIC(5,2),
  contracted_arm_circumference NUMERIC(5,2),
  thigh_circumference NUMERIC(5,2),
  calf_circumference NUMERIC(5,2),
  neck_circumference NUMERIC(5,2),
  
  -- Skinfolds (Pliegues cutáneos en mm)
  tricipital_skinfold NUMERIC(4,2),
  bicipital_skinfold NUMERIC(4,2),
  subscapular_skinfold NUMERIC(4,2),
  suprailiac_skinfold NUMERIC(4,2),
  abdominal_skinfold NUMERIC(4,2),
  thigh_skinfold NUMERIC(4,2),
  calf_skinfold NUMERIC(4,2),
  
  -- Source & Notes
  measurement_device VARCHAR(100) DEFAULT 'Manual / Báscula Clínica', -- 'InBody 270', 'Tanita', 'Cinta seca'
  inbody_pdf_url TEXT,
  inbody_raw_data JSONB,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Laboratory Results (Exámenes de laboratorio)
CREATE TABLE laboratory_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  laboratory_name VARCHAR(150),
  pdf_url TEXT,
  image_url TEXT,
  
  -- Standard panel parameters
  glucose_mg_dl NUMERIC(6,2),
  hba1c_percentage NUMERIC(4,2),
  total_cholesterol_mg_dl NUMERIC(6,2),
  hdl_cholesterol_mg_dl NUMERIC(6,2),
  ldl_cholesterol_mg_dl NUMERIC(6,2),
  vldl_cholesterol_mg_dl NUMERIC(6,2),
  triglycerides_mg_dl NUMERIC(6,2),
  uric_acid_mg_dl NUMERIC(4,2),
  creatinine_mg_dl NUMERIC(4,2),
  urea_mg_dl NUMERIC(6,2),
  bun_mg_dl NUMERIC(6,2),
  tgo_ast_u_l NUMERIC(6,2),
  tgp_alt_u_l NUMERIC(6,2),
  hemoglobin_g_dl NUMERIC(4,2),
  hematocrit_percentage NUMERIC(4,2),
  tsh_uiu_ml NUMERIC(6,2),
  t3_free_pg_ml NUMERIC(6,2),
  t4_free_ng_dl NUMERIC(6,2),
  vitamin_d_ng_ml NUMERIC(6,2),
  ferritin_ng_ml NUMERIC(6,2),
  
  -- Custom parameters & AI Summary
  custom_parameters JSONB DEFAULT '[]', -- [{name: 'Insulina basal', value: '12.5', unit: 'uUI/ml', ref_range: '2.6-24.9'}]
  ai_analysis_summary TEXT,
  specialist_interpretation TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anthropometry_patient ON anthropometric_records(patient_id, date);
CREATE INDEX idx_laboratories_patient ON laboratory_results(patient_id, test_date);
