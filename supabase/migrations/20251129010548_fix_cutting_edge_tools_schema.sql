-- Migration to fix and create cutting-edge AI tools tables
-- This migration creates all 18 cutting-edge AI tool tables with proper syntax

-- 1. AI Job Estimates
CREATE TABLE IF NOT EXISTS ai_job_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    job_type TEXT NOT NULL,
    complexity_factors JSONB,
    estimated_duration INTEGER,
    estimated_cost DECIMAL(10,2),
    confidence_score DECIMAL(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
    ai_model_version TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sentiment Analyses
CREATE TABLE IF NOT EXISTS sentiment_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID,
    conversation_id TEXT,
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score BETWEEN -1 AND 1),
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
    emotions JSONB,
    key_phrases TEXT[],
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    ai_confidence DECIMAL(5,2) CHECK (ai_confidence BETWEEN 0 AND 100),
    account_id UUID
);

-- 3. Equipment Registry
CREATE TABLE IF NOT EXISTS equipment_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID,
    equipment_id TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    make TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    purchase_date DATE,
    warranty_expires DATE,
    location JSONB,
    current_status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Equipment Maintenance
CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id TEXT NOT NULL,
    equipment_type TEXT,
    maintenance_date DATE NOT NULL,
    maintenance_type TEXT,
    cost DECIMAL(10,2),
    notes TEXT,
    performed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Equipment Predictions
CREATE TABLE IF NOT EXISTS equipment_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id TEXT NOT NULL,
    equipment_type TEXT,
    predicted_failure_date TIMESTAMPTZ,
    confidence_level DECIMAL(5,2) CHECK (confidence_level BETWEEN 0 AND 100),
    risk_factors JSONB,
    failure_probability DECIMAL(5,2) CHECK (failure_probability BETWEEN 0 AND 1),
    maintenance_recommendation TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Dynamic Pricing Rules
CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    base_price DECIMAL(10,2) NOT NULL,
    adjusted_price DECIMAL(10,2) NOT NULL,
    adjustment_factors JSONB,
    adjustment_reason TEXT,
    confidence_score DECIMAL(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
    market_position TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 7. Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    job_type TEXT NOT NULL,
    location TEXT,
    overall_risk_score INTEGER CHECK (overall_risk_score BETWEEN 0 AND 100),
    safety_risk INTEGER CHECK (safety_risk BETWEEN 0 AND 100),
    financial_risk INTEGER CHECK (financial_risk BETWEEN 0 AND 100),
    reputation_risk INTEGER CHECK (reputation_risk BETWEEN 0 AND 100),
    risk_factors TEXT[],
    mitigation_strategies TEXT[],
    requires_permit BOOLEAN DEFAULT FALSE,
    recommended_insurance TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Churn Predictions
CREATE TABLE IF NOT EXISTS churn_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID,
    churn_risk_score INTEGER CHECK (churn_risk_score BETWEEN 0 AND 100),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    warning_signs TEXT[],
    intervention_strategies TEXT[],
    retention_probability INTEGER CHECK (retention_probability BETWEEN 0 AND 100),
    recommended_actions TEXT[],
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Sales Interactions
CREATE TABLE IF NOT EXISTS sales_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_rep_id UUID,
    contact_id UUID,
    interaction_date TIMESTAMPTZ DEFAULT NOW(),
    interaction_type TEXT,
    duration_minutes INTEGER,
    outcome TEXT,
    notes TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Sales Coaching Sessions
CREATE TABLE IF NOT EXISTS sales_coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID,
    sales_person_id UUID,
    coaching_context TEXT,
    current_score INTEGER CHECK (current_score BETWEEN 0 AND 100),
    strengths_identified TEXT[],
    improvement_areas TEXT[],
    recommended_next_steps TEXT[],
    talking_points TEXT[],
    questions_to_ask TEXT[],
    closing_probability INTEGER CHECK (closing_probability BETWEEN 0 AND 100),
    recommended_approach TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Compliance Rules
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    description TEXT,
    requirements JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Compliance Checks
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT CHECK (entity_type IN ('job', 'invoice', 'contract', 'communication')),
    entity_id TEXT NOT NULL,
    rule_id UUID,
    compliance_type TEXT NOT NULL,
    is_compliant BOOLEAN,
    compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    violations_found TEXT[],
    required_actions TEXT[],
    documentation_needed TEXT[],
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    recommendations TEXT[],
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Route Plans
CREATE TABLE IF NOT EXISTS route_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tech_id UUID,
    job_ids TEXT[] NOT NULL,
    optimized_order TEXT[],
    total_distance_km DECIMAL(8,2),
    estimated_duration_minutes INTEGER,
    start_time TIMESTAMPTZ,
    optimization_metric TEXT CHECK (optimization_metric IN ('time', 'distance', 'priority')),
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Route Plan Jobs (junction table)
CREATE TABLE IF NOT EXISTS route_plan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_plan_id UUID,
    job_id UUID,
    sequence_number INTEGER NOT NULL,
    estimated_arrival TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Photo Analyses
CREATE TABLE IF NOT EXISTS photo_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    photo_urls TEXT[] NOT NULL,
    analysis_type TEXT CHECK (analysis_type IN ('issues', 'documentation', 'quality', 'all')),
    analysis_results JSONB,
    overall_quality_score INTEGER CHECK (overall_quality_score BETWEEN 0 AND 100),
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Signature Verifications
CREATE TABLE IF NOT EXISTS signature_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    signature_image_url TEXT NOT NULL,
    reference_signature_id TEXT,
    is_verified BOOLEAN,
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    match_features JSONB,
    anomalies_detected TEXT[],
    fraud_risk_score INTEGER CHECK (fraud_risk_score BETWEEN 0 AND 100),
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Document Scans
CREATE TABLE IF NOT EXISTS document_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_url TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('invoice', 'contract', 'receipt', 'form', 'other')),
    extracted_text TEXT,
    extracted_fields JSONB,
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    extraction_fields_requested TEXT[],
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Video Support Sessions
CREATE TABLE IF NOT EXISTS video_support_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    contact_id UUID,
    job_id UUID,
    technician_id UUID,
    session_reason TEXT,
    status TEXT CHECK (status IN ('initiated', 'active', 'ended', 'failed')),
    webrtc_url TEXT,
    recording_url TEXT,
    duration_minutes INTEGER,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 19. IoT Devices
CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    device_type TEXT NOT NULL,
    customer_id UUID,
    location JSONB,
    installation_date DATE,
    last_heartbeat TIMESTAMPTZ,
    firmware_version TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. IoT Device Monitoring
CREATE TABLE IF NOT EXISTS iot_device_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID,
    monitoring_period TEXT,
    connection_status TEXT,
    last_reading JSONB,
    alerts JSONB,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Blockchain Transactions
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID,
    cryptocurrency TEXT CHECK (cryptocurrency IN ('BTC', 'ETH', 'USDC', 'USDT')),
    amount DECIMAL(15,8) NOT NULL,
    from_wallet TEXT NOT NULL,
    to_wallet TEXT NOT NULL,
    transaction_hash TEXT UNIQUE,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'failed')),
    gas_fee DECIMAL(15,8),
    confirmation_count INTEGER DEFAULT 0,
    estimated_confirmation_time TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- 22. AR Models
CREATE TABLE IF NOT EXISTS ar_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_type TEXT,
    file_urls TEXT[],
    compatibility_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. AR Previews
CREATE TABLE IF NOT EXISTS ar_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    preview_type TEXT CHECK (preview_type IN ('before', 'after', 'process')),
    model_id UUID,
    ar_url TEXT,
    qr_code TEXT,
    required_app TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Candidate Profiles
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    resume_url TEXT,
    skills TEXT[],
    experience_years INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Candidate Evaluations
CREATE TABLE IF NOT EXISTS candidate_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID,
    position_id TEXT,
    success_probability INTEGER CHECK (success_probability BETWEEN 0 AND 100),
    technical_score INTEGER CHECK (technical_score BETWEEN 0 AND 100),
    cultural_fit_score INTEGER CHECK (cultural_fit_score BETWEEN 0 AND 100),
    growth_potential_score INTEGER CHECK (growth_potential_score BETWEEN 0 AND 100),
    strengths_identified TEXT[],
    concerns_identified TEXT[],
    recommended_level TEXT CHECK (recommended_level IN ('junior', 'mid', 'senior')),
    recommended_interview_questions TEXT[],
    resume_data JSONB,
    assessment_scores JSONB,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Voice Clones
CREATE TABLE IF NOT EXISTS voice_clones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID,
    audio_sample_url TEXT NOT NULL,
    use_case TEXT CHECK (use_case IN ('notifications', 'reminders', 'updates', 'custom')),
    consent_recorded BOOLEAN NOT NULL,
    voice_id TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('processing', 'ready', 'failed')),
    estimated_ready_time TEXT,
    voice_quality TEXT,
    account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ready_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_job_estimates_job_id ON ai_job_estimates(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_estimates_job_type ON ai_job_estimates(job_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_contact_id ON sentiment_analyses(contact_id);
CREATE INDEX IF NOT EXISTS idx_equipment_registry_account_id ON equipment_registry(account_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment_id ON equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_predictions_equipment_id ON equipment_predictions(equipment_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_job_id ON dynamic_pricing_rules(job_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_job_id ON risk_assessments(job_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_contact_id ON churn_predictions(contact_id);
CREATE INDEX IF NOT EXISTS idx_sales_interactions_rep_id ON sales_interactions(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_route_plans_tech_id ON route_plans(tech_id);
CREATE INDEX IF NOT EXISTS idx_photo_analyses_job_id ON photo_analyses(job_id);
CREATE INDEX IF NOT EXISTS idx_signature_verifications_job_id ON signature_verifications(job_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_contact_id ON video_support_sessions(contact_id);
CREATE INDEX IF NOT EXISTS idx_iot_monitoring_device_id ON iot_device_monitoring(device_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_invoice_id ON blockchain_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ar_previews_job_id ON ar_previews(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_candidate_id ON candidate_evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_voice_clones_contact_id ON voice_clones(contact_id);

-- Enable Row Level Security (RLS) for all new tables
ALTER TABLE ai_job_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_plan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_device_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;