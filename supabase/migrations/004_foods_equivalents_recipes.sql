-- ============================================================================
-- 004_foods_equivalents_recipes.sql: Foods, SMAE Equivalents, Recipes Library
-- ============================================================================

-- Food Equivalent Groups (SMAE - Sistema Mexicano de Alimentos Equivalentes)
CREATE TABLE food_equivalent_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE, -- 'Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'AOA Bajo aporte', etc.
  code VARCHAR(50) NOT NULL UNIQUE,
  color_hex VARCHAR(20) DEFAULT '#10B981',
  avg_energy_kcal NUMERIC(6,2) NOT NULL,
  avg_protein_g NUMERIC(5,2) NOT NULL,
  avg_carbs_g NUMERIC(5,2) NOT NULL,
  avg_fat_g NUMERIC(5,2) NOT NULL,
  description TEXT
);

-- Food Categories
CREATE TABLE food_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Apple',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foods Database
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL means global standard food (SMAE)
  category_id UUID REFERENCES food_categories(id) ON DELETE SET NULL,
  equivalent_group_id UUID REFERENCES food_equivalent_groups(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(150),
  serving_size VARCHAR(100) NOT NULL, -- e.g., '1 taza', '100g', '2 piezas'
  serving_weight_g NUMERIC(6,2) NOT NULL,
  
  -- Macronutrients per serving
  energy_kcal NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(5,2) NOT NULL,
  carbs_g NUMERIC(5,2) NOT NULL,
  fat_g NUMERIC(5,2) NOT NULL,
  fiber_g NUMERIC(5,2) DEFAULT 0,
  sugar_g NUMERIC(5,2) DEFAULT 0,
  sodium_mg NUMERIC(6,2) DEFAULT 0,
  
  -- Micronutrients
  potassium_mg NUMERIC(6,2) DEFAULT 0,
  calcium_mg NUMERIC(6,2) DEFAULT 0,
  iron_mg NUMERIC(6,2) DEFAULT 0,
  glycemic_index VARCHAR(20) DEFAULT 'Bajo', -- 'Bajo', 'Medio', 'Alto'
  
  is_verified BOOLEAN DEFAULT TRUE,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Substitutions & Allowed Exchanges
CREATE TABLE food_substitutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source_food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  target_food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  ratio_multiplier NUMERIC(4,2) DEFAULT 1.0, -- e.g. 1 serving of chicken = 1.2 serving of tilapia
  notes TEXT,
  is_approved_by_specialist BOOLEAN DEFAULT TRUE
);

-- Recipes Library
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  photo_url TEXT,
  category VARCHAR(50) NOT NULL, -- 'Desayuno', 'Comida', 'Cena', 'Colación', 'Pre-entreno', 'Post-entreno', 'Bebidas'
  prep_time_minutes INT DEFAULT 20,
  cook_time_minutes INT DEFAULT 15,
  difficulty VARCHAR(20) DEFAULT 'Fácil', -- 'Fácil', 'Media', 'Avanzada'
  servings INT DEFAULT 1,
  
  -- Totals per serving
  calories_kcal NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(5,2) NOT NULL,
  carbs_g NUMERIC(5,2) NOT NULL,
  fat_g NUMERIC(5,2) NOT NULL,
  fiber_g NUMERIC(5,2) DEFAULT 0,
  
  -- Filters and tags
  tags TEXT[] DEFAULT ARRAY['Alta proteína', 'Mexicana', 'Económica'],
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Ingredients
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  custom_food_name VARCHAR(255),
  amount NUMERIC(6,2) NOT NULL,
  unit VARCHAR(50) NOT NULL, -- 'g', 'ml', 'taza', 'cda', 'pieza'
  equivalent_count NUMERIC(4,2),
  equivalent_group_name VARCHAR(100),
  notes TEXT
);

-- Recipe Steps
CREATE TABLE recipe_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  instruction TEXT NOT NULL,
  timer_minutes INT
);

CREATE INDEX idx_foods_org ON foods(organization_id, name);
CREATE INDEX idx_recipes_org ON recipes(organization_id, category);
