-- ============================================================================
-- 009_ai_copilot.sql: NutriCopilot AI Conversations, Generations, Audit
-- ============================================================================

-- AI Conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  title VARCHAR(255) DEFAULT 'Consulta NutriCopilot AI',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Generations & Logs
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL, -- 'DRAFT_PLAN', '24H_RECALL', 'CONSULTATION_PREP', 'ANALYZE_LABS', 'FOOD_RECOGNITION'
  input_payload JSONB NOT NULL,
  generated_output TEXT NOT NULL,
  model_name VARCHAR(100) DEFAULT 'gemini-3.7-flash',
  is_approved_by_user BOOLEAN DEFAULT FALSE,
  user_feedback TEXT,
  disclaimer_shown BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
