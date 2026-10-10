-- ============================================================================
-- 005_nutrition_plans_templates.sql: Meal Plans, Weeks, Days, Meals, Items
-- ============================================================================

CREATE TYPE plan_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- Nutrition Plans (Plan Nutricional)
CREATE TABLE nutrition_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Plan de Recomposición Nutricional',
  goal VARCHAR(255) NOT NULL,
  status plan_status DEFAULT 'ACTIVE',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Target targets
  target_calories_kcal INT NOT NULL DEFAULT 2000,
  target_protein_g INT NOT NULL DEFAULT 140,
  target_carbs_g INT NOT NULL DEFAULT 200,
  target_fat_g INT NOT NULL DEFAULT 65,
  target_water_liters NUMERIC(3,1) DEFAULT 2.5,
  
  -- Guidelines & notes
  general_instructions TEXT,
  hydration_instructions TEXT,
  allowed_substitutions_policy TEXT,
  digital_signature_approved_at TIMESTAMPTZ,
  approved_by_specialist BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan Templates (Plantillas reutilizables)
CREATE TABLE nutrition_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Pérdida de grasa', 'Hipertrofia', 'Mantenimiento', 'Vegano', 'Adulto mayor'
  description TEXT,
  target_calories_kcal INT NOT NULL,
  target_protein_g INT NOT NULL,
  target_carbs_g INT NOT NULL,
  target_fat_g INT NOT NULL,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrition Plan Days (Lunes, Martes, Miércoles, etc.)
CREATE TABLE nutrition_plan_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 1 = Lunes, 2 = Martes ... 7 = Domingo (or 0 for generic day)
  day_name VARCHAR(50) NOT NULL, -- 'Lunes', 'Día 1', 'Menú Base A'
  notes TEXT,
  total_calories_kcal NUMERIC(6,2) DEFAULT 0,
  total_protein_g NUMERIC(5,2) DEFAULT 0,
  total_carbs_g NUMERIC(5,2) DEFAULT 0,
  total_fat_g NUMERIC(5,2) DEFAULT 0
);

-- Nutrition Plan Meals (Desayuno, Colación 1, Comida, Colación 2, Cena)
CREATE TABLE nutrition_plan_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL REFERENCES nutrition_plan_days(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 'Desayuno', 'Colación Matutina', 'Comida', 'Colación Vespertina', 'Cena'
  meal_order INT NOT NULL DEFAULT 1,
  suggested_time TIME,
  meal_calories_kcal NUMERIC(6,2) DEFAULT 0,
  meal_protein_g NUMERIC(5,2) DEFAULT 0,
  meal_carbs_g NUMERIC(5,2) DEFAULT 0,
  meal_fat_g NUMERIC(5,2) DEFAULT 0,
  notes TEXT
);

-- Nutrition Plan Items (Alimento o Receta dentro de la comida)
CREATE TABLE nutrition_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID NOT NULL REFERENCES nutrition_plan_meals(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL DEFAULT 'FOOD', -- 'FOOD', 'RECIPE', 'EQUIVALENT_GROUP'
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  custom_name VARCHAR(255),
  portion_description VARCHAR(150) NOT NULL, -- '1 taza (240ml)', '120g en crudo'
  portion_quantity NUMERIC(5,2) DEFAULT 1.0,
  equivalent_group_code VARCHAR(50),
  equivalent_count NUMERIC(4,2),
  
  -- Calculated macros for this item
  energy_kcal NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(5,2) NOT NULL,
  carbs_g NUMERIC(5,2) NOT NULL,
  fat_g NUMERIC(5,2) NOT NULL,
  
  interchange_options JSONB DEFAULT '[]', -- Alternative foods allowed for this item
  preparation_tip TEXT
);

CREATE INDEX idx_plans_patient ON nutrition_plans(patient_id, status);
