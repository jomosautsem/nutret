-- ============================================================================
-- SQL para crear y actualizar la tabla clinical_records (Expedientes Clínicos)
-- Compatible al 100% con los IDs de pacientes y usuarios existentes
-- ============================================================================

-- 1. Crear tabla clinical_records si no existe
CREATE TABLE IF NOT EXISTS public.clinical_records (
  id VARCHAR(100) PRIMARY KEY,
  patient_id VARCHAR(100) NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  specialist_id VARCHAR(100) REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Antecedentes heredofamiliares
  family_history JSONB DEFAULT '{}'::jsonb,
  
  -- Antecedentes patológicos, alergias y medicamentos
  pathological_history JSONB DEFAULT '{}'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  medications JSONB DEFAULT '[]'::jsonb,
  
  -- Estilo de vida y actividad física
  lifestyle_habits JSONB DEFAULT '{}'::jsonb,
  physical_activity JSONB DEFAULT '{}'::jsonb,
  
  -- Hábitos dietéticos y Recordatorio 24 Horas
  dietary_habits JSONB DEFAULT '{}'::jsonb,
  recall_24h TEXT DEFAULT '',
  recall_24h_ai_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Objetivos y observaciones del nutriólogo
  clinical_goals TEXT DEFAULT '',
  clinical_observations TEXT DEFAULT '',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índice para búsquedas por paciente
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient_id ON public.clinical_records(patient_id);

-- 3. Habilitar seguridad de nivel de fila (RLS) y permitir operaciones a la app
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clinical_records' 
    AND policyname = 'Allow public all access on clinical_records'
  ) THEN
    CREATE POLICY "Allow public all access on clinical_records"
      ON public.clinical_records FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
