-- ============================================================================
-- 007_appointments_messages_payments.sql: Calendar, WhatsApp, Chat, Payments
-- ============================================================================

CREATE TYPE appointment_type AS ENUM ('PRIMERA_CONSULTA', 'SEGUIMIENTO', 'EVALUACION', 'ONLINE', 'PRESENCIAL');
CREATE TYPE appointment_status AS ENUM ('PENDIENTE', 'CONFIRMADA', 'REALIZADA', 'CANCELADA', 'NO_ASISTIO', 'REPROGRAMADA');
CREATE TYPE payment_status AS ENUM ('PAGADO', 'PENDIENTE', 'CANCELADO', 'REEMBOLSADO');

-- Appointments (Agenda y Consultas)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  specialist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_type appointment_type DEFAULT 'SEGUIMIENTO',
  status appointment_status DEFAULT 'PENDIENTE',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  price NUMERIC(10,2) DEFAULT 800.00,
  currency VARCHAR(10) DEFAULT 'MXN',
  meeting_link TEXT,
  location_notes TEXT,
  reminder_sent_24h BOOLEAN DEFAULT FALSE,
  reminder_sent_2h BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  consultation_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations & Chat
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_specialist_count INT DEFAULT 0,
  unread_patient_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role user_role NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type VARCHAR(50), -- 'image', 'pdf', 'audio'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments & Invoicing
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  concept VARCHAR(255) NOT NULL, -- 'Consulta de seguimiento nutricional', 'Paquete 3 meses'
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'MXN',
  status payment_status DEFAULT 'PAGADO',
  payment_method VARCHAR(50) DEFAULT 'Tarjeta / Transferencia', -- 'Efectivo', 'Stripe', 'Mercado Pago', 'SPEI'
  transaction_id VARCHAR(150),
  invoice_rfc VARCHAR(50),
  invoice_cfdi_url TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'PACIENTE', 'AGENDA', 'PAGOS', 'IA', 'SISTEMA'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_specialist ON appointments(specialist_id, start_time);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX idx_payments_org ON payments(organization_id, paid_at);
