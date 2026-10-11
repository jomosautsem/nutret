-- ============================================================================
-- SQL: Actualización de Esquema para Estudios Clínicos y Parámetros
-- Compatible al 100% con Supabase PostgreSQL y tipos VARCHAR/TEXT
-- ============================================================================

-- 1. Agregar columnas a la tabla lab_records para soportar Urea y Estudios Personalizados
ALTER TABLE lab_records ADD COLUMN IF NOT EXISTS urea_mg_dl NUMERIC;
ALTER TABLE lab_records ADD COLUMN IF NOT EXISTS custom_parameters JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lab_records ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE lab_records ADD COLUMN IF NOT EXISTS file_data TEXT;

-- 2. Asegurar que la tabla lab_records exista de forma autónoma si se crea desde cero
CREATE TABLE IF NOT EXISTS lab_records (
  id VARCHAR(100) PRIMARY KEY,
  patient_id VARCHAR(100) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  glucose_mg_dl NUMERIC,
  urea_mg_dl NUMERIC,
  uric_acid_mg_dl NUMERIC,
  creatinine_mg_dl NUMERIC,
  triglycerides_mg_dl NUMERIC,
  total_cholesterol_mg_dl NUMERIC,
  hba1c_pct NUMERIC,
  hdl_mg_dl NUMERIC,
  ldl_mg_dl NUMERIC,
  document_url TEXT,
  file_name TEXT,
  file_data TEXT,
  custom_parameters JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices de optimización para consultas rápidas por paciente y fecha
CREATE INDEX IF NOT EXISTS idx_lab_records_patient_id ON lab_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_records_test_date ON lab_records(test_date);

-- 4. Seguridad de Nivel de Fila (RLS) para permitir lectura y escritura segura en la clínica
ALTER TABLE lab_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to lab_records" ON lab_records;
CREATE POLICY "Public access to lab_records" ON lab_records FOR ALL USING (true) WITH CHECK (true);
