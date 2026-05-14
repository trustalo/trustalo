-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('openai', 'anthropic', 'bedrock', 'openrouter');

-- CreateEnum
CREATE TYPE "AIFeature" AS ENUM ('quiz_generation', 'risk_analysis', 'policy_drafting', 'policy_generation', 'vendor_assessment', 'incident_summary', 'control_suggestion', 'automated_check_generation', 'risk_scoring', 'vendor_scoring', 'questionnaire_answering', 'trust_center_summary', 'context_extraction', 'chat_assistant', 'evidence_agent');

-- CreateEnum
CREATE TYPE "AISystemType" AS ENUM ('machine_learning', 'deep_learning', 'nlp', 'computer_vision', 'generative_ai', 'other');

-- CreateEnum
CREATE TYPE "AILifecycleStage" AS ENUM ('design', 'development', 'testing', 'deployment', 'monitoring', 'decommissioned');

-- CreateEnum
CREATE TYPE "AIRiskLevel" AS ENUM ('minimal', 'limited', 'high', 'unacceptable');

-- CreateEnum
CREATE TYPE "RiskRating" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "AIImpactStatus" AS ENUM ('pending', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AIRiskAssessmentStatus" AS ENUM ('draft', 'in_progress', 'completed', 'approved');

-- CreateEnum
CREATE TYPE "AIIncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "AIIncidentCategory" AS ENUM ('bias', 'drift', 'hallucination', 'accuracy', 'privacy', 'security', 'safety', 'misuse', 'availability', 'other');

-- CreateEnum
CREATE TYPE "AIIncidentStatus" AS ENUM ('open', 'investigating', 'mitigated', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('hardware', 'software', 'data', 'service', 'personnel', 'facility', 'cloud_resource');

-- CreateEnum
CREATE TYPE "AssetClassification" AS ENUM ('public', 'internal', 'confidential', 'restricted');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('active', 'decommissioned', 'under_review');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('internal', 'external', 'certification');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AuditFindingSeverity" AS ENUM ('critical', 'major', 'minor', 'observation', 'opportunity');

-- CreateEnum
CREATE TYPE "AuditFindingStatus" AS ENUM ('open', 'in_progress', 'remediated', 'verified', 'closed');

-- CreateEnum
CREATE TYPE "BCPStatus" AS ENUM ('draft', 'approved', 'active', 'under_review', 'archived');

-- CreateEnum
CREATE TYPE "CriticalityLevel" AS ENUM ('mission_critical', 'business_critical', 'business_operational', 'administrative');

-- CreateEnum
CREATE TYPE "BCPExerciseType" AS ENUM ('tabletop', 'walkthrough', 'simulation', 'full_scale');

-- CreateEnum
CREATE TYPE "BCPExerciseStatus" AS ENUM ('planned', 'scheduled', 'in_progress', 'conducted', 'reviewed', 'cancelled');

-- CreateEnum
CREATE TYPE "BCPExerciseOutcome" AS ENUM ('not_met', 'partially_met', 'met', 'exceeded');

-- CreateEnum
CREATE TYPE "BIAStatus" AS ENUM ('draft', 'under_review', 'approved', 'archived');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "ControlStatus" AS ENUM ('not_implemented', 'partially_implemented', 'implemented', 'not_applicable');

-- CreateEnum
CREATE TYPE "EvidenceCollectionMode" AS ENUM ('manual', 'agent');

-- CreateEnum
CREATE TYPE "EvidenceAgentLastStatus" AS ENUM ('idle', 'queued', 'running', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('document', 'screenshot', 'link', 'automated', 'attestation');

-- CreateEnum
CREATE TYPE "EvidenceApprovalStatus" AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'expired', 'stale');

-- CreateEnum
CREATE TYPE "RenewalFrequency" AS ENUM ('once', 'monthly', 'quarterly', 'semi_annually', 'annually');

-- CreateEnum
CREATE TYPE "FrameworkType" AS ENUM ('iso27001', 'iso27017', 'iso27018', 'iso22301', 'iso42001', 'soc2', 'essential8', 'nist_csf_2', 'gdpr');

-- CreateEnum
CREATE TYPE "FrameworkInstanceStatus" AS ENUM ('not_started', 'in_progress', 'ready_for_audit', 'certified');

-- CreateEnum
CREATE TYPE "MappingRelationship" AS ENUM ('equivalent', 'partial', 'informs');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('critical', 'high', 'medium', 'low', 'informational');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('reported', 'investigating', 'contained', 'resolved', 'closed', 'lessons_learned');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'published', 'archived');

-- CreateEnum
CREATE TYPE "LawfulBasis" AS ENUM ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests');

-- CreateEnum
CREATE TYPE "DataCategory" AS ENUM ('identity', 'contact', 'financial', 'health', 'location', 'online_identifier', 'demographic', 'employment', 'usage', 'special_category', 'criminal', 'other');

-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('customer', 'employee', 'prospect', 'supplier_contact', 'minor', 'website_visitor', 'patient', 'other');

-- CreateEnum
CREATE TYPE "TransferMechanism" AS ENUM ('none_eu_eea', 'adequacy_decision', 'scc', 'bcr', 'derogation_art_49');

-- CreateEnum
CREATE TYPE "ProcessingRole" AS ENUM ('controller', 'processor', 'joint_controller');

-- CreateEnum
CREATE TYPE "ProcessingActivityStatus" AS ENUM ('draft', 'active', 'under_review', 'retired');

-- CreateEnum
CREATE TYPE "DPIAStatus" AS ENUM ('draft', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "DPIANecessity" AS ENUM ('required', 'recommended', 'not_required');

-- CreateEnum
CREATE TYPE "DataBreachSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "DataBreachCategory" AS ENUM ('confidentiality', 'integrity', 'availability', 'combined');

-- CreateEnum
CREATE TYPE "DataBreachStatus" AS ENUM ('open', 'investigating', 'contained', 'notified', 'closed');

-- CreateEnum
CREATE TYPE "DSARType" AS ENUM ('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection', 'automated_decision', 'withdraw_consent');

-- CreateEnum
CREATE TYPE "DSARStatus" AS ENUM ('received', 'identity_pending', 'in_progress', 'extended', 'fulfilled', 'refused', 'closed');

-- CreateEnum
CREATE TYPE "DSARChannel" AS ENUM ('email', 'web_form', 'post', 'phone', 'in_person');

-- CreateEnum
CREATE TYPE "QuestionnaireSourceFormat" AS ENUM ('csv', 'caiq', 'sig', 'xlsx', 'docx', 'custom');

-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('draft', 'in_progress', 'completed', 'exported');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('yes_no', 'short_text', 'long_text', 'multiple_choice');

-- CreateEnum
CREATE TYPE "AnswerStatus" AS ENUM ('pending', 'draft', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "QuestionnaireImportJobStatus" AS ENUM ('pending', 'running', 'completed', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('operational', 'technical', 'compliance', 'strategic', 'financial', 'reputational', 'security', 'privacy', 'third_party', 'environmental');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('not_started', 'in_progress', 'done', 'archived');

-- CreateEnum
CREATE TYPE "TreatmentStrategy" AS ENUM ('mitigate', 'accept', 'transfer', 'avoid', 'control');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('planned', 'in_progress', 'completed', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "ControlEffectiveness" AS ENUM ('no_control', 'need_improvement', 'adequate', 'effective');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('yes', 'no', 'na', 'pending');

-- CreateEnum
CREATE TYPE "ProbabilityLevel" AS ENUM ('rare', 'unlikely', 'possible', 'likely', 'almost_certain');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('negligible', 'low', 'moderate', 'high', 'catastrophic');

-- CreateEnum
CREATE TYPE "RiskDepartment" AS ENUM ('engineering', 'product', 'operations', 'finance', 'legal', 'human_resources', 'sales', 'marketing', 'customer_support', 'it', 'security', 'compliance', 'executive', 'other');

-- CreateEnum
CREATE TYPE "RiskMatrixChangeKind" AS ENUM ('inherent', 'residual');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('manual', 'automated', 'recurring');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "TaskFrequency" AS ENUM ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'annually');

-- CreateEnum
CREATE TYPE "TaskSourceModule" AS ENUM ('training', 'control', 'risk', 'evidence', 'vendor', 'asset', 'audit', 'policy', 'bcp', 'incident', 'dsar', 'data_breach', 'dpia', 'processing_activity');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('draft', 'pending_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TenantContextCategory" AS ENUM ('company', 'tech_stack', 'processes', 'data_handling', 'risk_appetite', 'team');

-- CreateEnum
CREATE TYPE "TenantContextSource" AS ENUM ('onboarding', 'inferred', 'manual');

-- CreateEnum
CREATE TYPE "TenantContextStatus" AS ENUM ('active', 'superseded', 'archived');

-- CreateEnum
CREATE TYPE "TenantContextProposalStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "TenantContextProposalKind" AS ENUM ('paste', 'chat', 'inferred');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'cancelled');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('security_awareness', 'compliance', 'phishing_simulation', 'custom');

-- CreateEnum
CREATE TYPE "TrainingFrequency" AS ENUM ('once', 'monthly', 'quarterly', 'annually');

-- CreateEnum
CREATE TYPE "TrainingCompletionStatus" AS ENUM ('assigned', 'in_progress', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "QuizQuestionType" AS ENUM ('multiple_choice', 'true_false', 'multi_select');

-- CreateEnum
CREATE TYPE "TrustResourceType" AS ENUM ('certificate', 'report', 'policy', 'attestation');

-- CreateEnum
CREATE TYPE "TrustResourceGating" AS ENUM ('public', 'contact_required', 'nda_required');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TrustCenterPublicMode" AS ENUM ('live', 'snapshot');

-- CreateEnum
CREATE TYPE "TrustCenterEventType" AS ENUM ('view', 'resource_view', 'resource_download', 'access_request');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'admin', 'compliance_manager', 'auditor', 'viewer', 'integration_admin', 'dpo');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'invited', 'suspended');

-- CreateEnum
CREATE TYPE "VendorRiskTier" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('active', 'under_review', 'approved', 'rejected', 'offboarded');

-- CreateEnum
CREATE TYPE "ResearchFrequency" AS ENUM ('weekly', 'biweekly', 'monthly', 'yearly', 'none');

-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "DpaStatus" AS ENUM ('not_required', 'not_started', 'requested', 'received', 'approved', 'expired');

-- CreateEnum
CREATE TYPE "VendorDocumentType" AS ENUM ('agreement', 'nda', 'sla', 'dpa', 'sow', 'msa', 'insurance_certificate', 'security_assessment', 'compliance_report', 'other');

-- CreateEnum
CREATE TYPE "VulnerabilitySeverity" AS ENUM ('critical', 'high', 'medium', 'low', 'informational');

-- CreateEnum
CREATE TYPE "VulnerabilityStatus" AS ENUM ('open', 'confirmed', 'in_progress', 'remediated', 'accepted', 'false_positive');

-- CreateEnum
CREATE TYPE "VulnerabilitySource" AS ENUM ('scan', 'pentest', 'bug_bounty', 'manual', 'vendor_advisory');

-- CreateTable
CREATE TABLE "AIProviderConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "apiKey" TEXT,
    "region" TEXT,
    "accessKeyId" TEXT,
    "secretAccessKey" TEXT,
    "baseUrl" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIFeatureConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIFeatureConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISystem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "type" "AISystemType" NOT NULL,
    "lifecycleStage" "AILifecycleStage" NOT NULL DEFAULT 'design',
    "riskLevel" "AIRiskLevel" NOT NULL DEFAULT 'minimal',
    "dataTypes" TEXT[],
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRiskAssessment" (
    "id" TEXT NOT NULL,
    "aiSystemId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assessedById" TEXT NOT NULL,
    "title" TEXT,
    "methodology" TEXT,
    "biasRisk" "RiskRating" NOT NULL,
    "privacyRisk" "RiskRating" NOT NULL,
    "safetyRisk" "RiskRating" NOT NULL,
    "securityRisk" "RiskRating" NOT NULL,
    "misuseRisk" "RiskRating" NOT NULL,
    "overallRisk" "RiskRating",
    "mitigationPlan" TEXT,
    "residualRisk" "RiskRating",
    "status" "AIRiskAssessmentStatus" NOT NULL DEFAULT 'draft',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIIncident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiSystemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "AIIncidentCategory" NOT NULL,
    "severity" "AIIncidentSeverity" NOT NULL,
    "status" "AIIncidentStatus" NOT NULL DEFAULT 'open',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "rootCause" TEXT,
    "remediation" TEXT,
    "externalNotificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "externalNotificationSentAt" TIMESTAMP(3),
    "reportedById" TEXT,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIImpactAssessment" (
    "id" TEXT NOT NULL,
    "aiSystemId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assessedById" TEXT NOT NULL,
    "societalImpact" TEXT,
    "ethicalConsiderations" TEXT,
    "environmentalImpact" TEXT,
    "humanOversightMeasures" TEXT,
    "transparencyMeasures" TEXT,
    "status" "AIImpactStatus" NOT NULL DEFAULT 'pending',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIImpactAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssetType" NOT NULL,
    "classification" "AssetClassification" NOT NULL DEFAULT 'internal',
    "ownerId" TEXT,
    "deletedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "location" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AuditType" NOT NULL,
    "frameworkInstanceId" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'planned',
    "auditorName" TEXT,
    "auditorOrganization" TEXT,
    "scheduledStartDate" TIMESTAMP(3),
    "scheduledEndDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "AuditFindingSeverity" NOT NULL,
    "status" "AuditFindingStatus" NOT NULL DEFAULT 'open',
    "controlId" TEXT,
    "assignedToId" TEXT,
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditDocument" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" TEXT,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessContinuityPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT,
    "status" "BCPStatus" NOT NULL DEFAULT 'draft',
    "ownerId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessContinuityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessImpactAnalysis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bcpId" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "description" TEXT,
    "criticalityLevel" "CriticalityLevel" NOT NULL,
    "rtoHours" INTEGER NOT NULL,
    "rpoHours" INTEGER NOT NULL,
    "maxTolerableDowntimeHours" INTEGER NOT NULL,
    "mtpdHours" INTEGER,
    "financialImpactPerHour" DECIMAL(65,30),
    "dependencies" TEXT,
    "operationalImpact" TEXT,
    "regulatoryImpact" TEXT,
    "reputationalImpact" TEXT,
    "status" "BIAStatus" NOT NULL DEFAULT 'draft',
    "ownerId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessImpactAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BCPExercise" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bcpId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "BCPExerciseType" NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "conductedDate" TIMESTAMP(3),
    "status" "BCPExerciseStatus" NOT NULL DEFAULT 'planned',
    "scenario" TEXT,
    "objectives" TEXT,
    "scope" TEXT,
    "facilitatorId" TEXT,
    "participants" TEXT,
    "outcomeRating" "BCPExerciseOutcome",
    "actualRtoHours" INTEGER,
    "actualRpoHours" INTEGER,
    "findings" TEXT,
    "lessonsLearned" TEXT,
    "actionItems" TEXT,
    "nextExerciseDate" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BCPExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "modelUsed" TEXT,
    "providerSource" TEXT,
    "groundingHash" TEXT,
    "citations" JSONB NOT NULL DEFAULT '[]',
    "proposalIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Control" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "implementationDetails" TEXT,
    "status" "ControlStatus" NOT NULL DEFAULT 'not_implemented',
    "category" TEXT,
    "ownerId" TEXT,
    "reviewDate" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlEvidenceCollectionConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "mode" "EvidenceCollectionMode" NOT NULL DEFAULT 'manual',
    "agentInstructions" TEXT,
    "agentToolConnectionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "agentScheduleMinutes" INTEGER,
    "agentLastRunAt" TIMESTAMP(3),
    "agentLastStatus" "EvidenceAgentLastStatus" NOT NULL DEFAULT 'idle',
    "agentLastRunId" TEXT,
    "agentLastSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlEvidenceCollectionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "EvidenceType" NOT NULL DEFAULT 'document',
    "status" "EvidenceApprovalStatus" NOT NULL DEFAULT 'draft',
    "fileKey" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "externalUrl" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "renewalFrequency" "RenewalFrequency",
    "nextRenewalDate" TIMESTAMP(3),
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 30,
    "lastReminderSentAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Framework" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "frameworkType" "FrameworkType" NOT NULL,
    "totalControls" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Framework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkInstance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "status" "FrameworkInstanceStatus" NOT NULL DEFAULT 'not_started',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "targetDate" TIMESTAMP(3),
    "certifiedAt" TIMESTAMP(3),
    "targetMaturityLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrameworkInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "evidenceGuidance" TEXT,
    "category" TEXT,
    "maturityLevel" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkRequirementMapping" (
    "id" TEXT NOT NULL,
    "sourceRequirementId" TEXT NOT NULL,
    "targetRequirementId" TEXT NOT NULL,
    "relationship" "MappingRelationship" NOT NULL DEFAULT 'partial',
    "rationale" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrameworkRequirementMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlRequirementAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "frameworkInstanceId" TEXT NOT NULL,
    "status" TEXT,

    CONSTRAINT "ControlRequirementAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'reported',
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "detectedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "rootCause" TEXT,
    "regulatoryNotificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "regulatoryNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentTimeline" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PolicyStatus" NOT NULL DEFAULT 'draft',
    "category" TEXT,
    "ownerId" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "renewalDate" TIMESTAMP(3),
    "publicSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changeNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcknowledgment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyComment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersionId" TEXT,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "highlightedText" TEXT,
    "fromPos" INTEGER,
    "toPos" INTEGER,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyControl" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "category" TEXT,
    "frameworkTypes" "FrameworkType"[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentHtml" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "role" "ProcessingRole" NOT NULL DEFAULT 'controller',
    "lawfulBasis" "LawfulBasis" NOT NULL,
    "lawfulBasisJustification" TEXT,
    "dataCategories" "DataCategory"[],
    "subjectCategories" "SubjectCategory"[],
    "dataElements" TEXT[],
    "recipients" TEXT[],
    "crossBorderTransfer" BOOLEAN NOT NULL DEFAULT false,
    "transferMechanism" "TransferMechanism",
    "transferDestinations" TEXT[],
    "retentionPeriod" TEXT,
    "securityMeasures" TEXT,
    "ownerId" TEXT,
    "status" "ProcessingActivityStatus" NOT NULL DEFAULT 'draft',
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DPIA" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "processingActivityId" TEXT NOT NULL,
    "assessedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "necessity" "DPIANecessity" NOT NULL DEFAULT 'required',
    "necessityProportionality" TEXT,
    "riskToRights" TEXT,
    "mitigations" TEXT,
    "consultedDpo" BOOLEAN NOT NULL DEFAULT false,
    "consultedDataSubjects" BOOLEAN NOT NULL DEFAULT false,
    "residualRisk" "RiskRating",
    "status" "DPIAStatus" NOT NULL DEFAULT 'draft',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DPIA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataBreach" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "processingActivityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "DataBreachCategory" NOT NULL,
    "severity" "DataBreachSeverity" NOT NULL,
    "status" "DataBreachStatus" NOT NULL DEFAULT 'open',
    "occurredAt" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationDeadlineAt" TIMESTAMP(3) NOT NULL,
    "containedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "affectedRecordsEstimate" INTEGER,
    "affectedSubjectCategories" "SubjectCategory"[],
    "dataCategoriesInvolved" "DataCategory"[],
    "rootCause" TEXT,
    "containment" TEXT,
    "remediation" TEXT,
    "supervisoryAuthorityNotificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "supervisoryAuthorityNotifiedAt" TIMESTAMP(3),
    "supervisoryAuthorityReference" TEXT,
    "dataSubjectsNotificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "dataSubjectsNotifiedAt" TIMESTAMP(3),
    "reportedById" TEXT,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataBreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DSARRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectEmail" TEXT,
    "subjectIdentifier" TEXT,
    "requestType" "DSARType" NOT NULL,
    "channel" "DSARChannel" NOT NULL,
    "status" "DSARStatus" NOT NULL DEFAULT 'received',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "extendedAt" TIMESTAMP(3),
    "extendedDueAt" TIMESTAMP(3),
    "identityVerifiedAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "refusalReason" TEXT,
    "responseNotes" TEXT,
    "responseFileKey" TEXT,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DSARRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireImportJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requester" TEXT,
    "vendorId" TEXT,
    "dueDate" TIMESTAMP(3),
    "formatHint" "QuestionnaireSourceFormat",
    "sourceFormat" "QuestionnaireSourceFormat",
    "originalFileKey" TEXT,
    "originalFilename" TEXT,
    "originalMimeType" TEXT,
    "csvBody" TEXT,
    "status" "QuestionnaireImportJobStatus" NOT NULL DEFAULT 'pending',
    "progress" JSONB NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "questionnaireId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "QuestionnaireImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questionnaire" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceFormat" "QuestionnaireSourceFormat" NOT NULL DEFAULT 'csv',
    "requester" TEXT,
    "vendorId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "QuestionnaireStatus" NOT NULL DEFAULT 'draft',
    "headers" JSONB NOT NULL DEFAULT '[]',
    "originalFileKey" TEXT,
    "originalFilename" TEXT,
    "originalMimeType" TEXT,
    "structureMap" JSONB,
    "metadataFacts" JSONB,
    "importedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "sectionTitle" TEXT,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'short_text',
    "choices" JSONB NOT NULL DEFAULT '[]',
    "originalRow" JSONB NOT NULL DEFAULT '{}',
    "sourceRowIndex" INTEGER,
    "sourceSheetName" TEXT,
    "sourceHeaderRowIndex" INTEGER,
    "answerColumnHeader" TEXT,
    "sourceTableIndex" INTEGER,
    "answerCellA1" TEXT,
    "parentQuestionId" TEXT,
    "contextLabels" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "AnswerStatus" NOT NULL DEFAULT 'pending',
    "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" DOUBLE PRECISION,
    "aiSources" JSONB NOT NULL DEFAULT '[]',
    "aiModel" TEXT,
    "aiPrompt" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "riskIdentifier" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "riskImpactDescription" TEXT,
    "category" "RiskCategory" NOT NULL DEFAULT 'operational',
    "businessProcess" TEXT,
    "department" "RiskDepartment",
    "status" "RiskStatus" NOT NULL DEFAULT 'not_started',
    "probability" "ProbabilityLevel",
    "probabilityScore" INTEGER NOT NULL DEFAULT 1,
    "impact" "ImpactLevel",
    "impactScore" INTEGER NOT NULL DEFAULT 1,
    "riskScore" INTEGER NOT NULL DEFAULT 1,
    "residualLikelihood" "ProbabilityLevel",
    "residualLikelihoodScore" INTEGER,
    "residualImpact" "ImpactLevel",
    "residualImpactScore" INTEGER,
    "residualRiskScore" INTEGER,
    "controlDescription" TEXT,
    "controlEffectiveness" "ControlEffectiveness",
    "treatmentStrategy" "TreatmentStrategy",
    "treatmentRationale" TEXT,
    "actionPlan" TEXT,
    "actionOwnerId" TEXT,
    "actionOwnerName" TEXT,
    "estStartDate" TIMESTAMP(3),
    "estEndDate" TIMESTAMP(3),
    "budgetApproval" "ApprovalStatus",
    "managementApproval" "ApprovalStatus",
    "ownerId" TEXT,
    "riskProperty" TEXT,
    "remarks" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "processingActivityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assessedById" TEXT NOT NULL,
    "inherentLikelihood" INTEGER NOT NULL,
    "inherentImpact" INTEGER NOT NULL,
    "residualLikelihood" INTEGER NOT NULL,
    "residualImpact" INTEGER NOT NULL,
    "notes" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskTreatment" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "strategy" "TreatmentStrategy" NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "responsibleId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "TreatmentStatus" NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskTreatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRegisterConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRegisterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskMatrixChange" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "RiskMatrixChangeKind" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'matrix',
    "changedById" TEXT NOT NULL,
    "prevLikelihood" INTEGER,
    "prevImpact" INTEGER,
    "prevScore" INTEGER,
    "newLikelihood" INTEGER NOT NULL,
    "newImpact" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskMatrixChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'manual',
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "assigneeId" TEXT,
    "controlId" TEXT,
    "sourceModule" "TaskSourceModule",
    "sourceId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "frequency" "TaskFrequency",
    "nextDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskEvidence" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'draft',
    "submittedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantContext" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" "TenantContextCategory" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "source" "TenantContextSource" NOT NULL DEFAULT 'manual',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" "TenantContextStatus" NOT NULL DEFAULT 'active',
    "supersedesId" TEXT,
    "provenance" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantContextProposal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "TenantContextProposalKind" NOT NULL DEFAULT 'paste',
    "category" "TenantContextCategory" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "rationale" TEXT,
    "provenance" JSONB,
    "supersedesContextId" TEXT,
    "status" "TenantContextProposalStatus" NOT NULL DEFAULT 'pending',
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantContextProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "TenantPlan" NOT NULL DEFAULT 'free',
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companySize" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "logoUrl" TEXT,
    "defaults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TrainingType" NOT NULL,
    "frequency" "TrainingFrequency" NOT NULL DEFAULT 'annually',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCompletion" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "TrainingCompletionStatus" NOT NULL DEFAULT 'assigned',
    "score" INTEGER,
    "completedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingQuiz" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "timeLimitMinutes" INTEGER,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuizQuestionType" NOT NULL DEFAULT 'multiple_choice',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "score" INTEGER,
    "totalPoints" INTEGER,
    "percentage" INTEGER,
    "passed" BOOLEAN,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustCenterConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customDomain" TEXT,
    "brandColor" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "faqs" JSONB,
    "publicMode" "TrustCenterPublicMode" NOT NULL DEFAULT 'live',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustCenterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustCenterSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trustCenterConfigId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "publishedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustCenterSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustCenterEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trustCenterConfigId" TEXT NOT NULL,
    "type" "TrustCenterEventType" NOT NULL,
    "resourceId" TEXT,
    "visitorIp" TEXT,
    "visitorUa" TEXT,
    "visitorEmail" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustCenterEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustResource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trustCenterConfigId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frameworkType" TEXT,
    "resourceType" "TrustResourceType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "accessGating" "TrustResourceGating" NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustCenterAccessRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterCompany" TEXT NOT NULL,
    "requesterTitle" TEXT,
    "reason" TEXT,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'pending',
    "ndaAccepted" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "accessToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustCenterAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "authProvider" TEXT,
    "externalId" TEXT,
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'viewer',
    "permissions" TEXT[],
    "status" "MembershipStatus" NOT NULL DEFAULT 'invited',
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnownVendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "category" TEXT,
    "logoUrl" TEXT,
    "headquarters" TEXT,
    "employeeRange" TEXT,
    "foundedYear" INTEGER,
    "industries" TEXT[],
    "certifications" TEXT[],
    "lastResearchedAt" TIMESTAMP(3),
    "researchData" JSONB,
    "riskSummary" TEXT,
    "overallScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnownVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "category" TEXT,
    "riskTier" "VendorRiskTier" NOT NULL DEFAULT 'medium',
    "status" "VendorStatus" NOT NULL DEFAULT 'active',
    "dataProcessing" BOOLEAN NOT NULL DEFAULT false,
    "isSubprocessor" BOOLEAN NOT NULL DEFAULT false,
    "subprocessorPurpose" TEXT,
    "dataTypesShared" TEXT[],
    "dataLocations" TEXT[],
    "dpaStatus" "DpaStatus" NOT NULL DEFAULT 'not_required',
    "dpaExpiresAt" TIMESTAMP(3),
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "knownVendorId" TEXT,
    "researchFrequency" "ResearchFrequency" NOT NULL DEFAULT 'none',
    "lastResearchedAt" TIMESTAMP(3),
    "nextResearchAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAssessment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assessedById" TEXT NOT NULL,
    "score" INTEGER,
    "findings" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "researchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorResearch" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT,
    "knownVendorId" TEXT,
    "tenantId" TEXT,
    "status" "ResearchStatus" NOT NULL DEFAULT 'pending',
    "researchType" TEXT NOT NULL DEFAULT 'deep_research',
    "overallScore" INTEGER,
    "securityScore" INTEGER,
    "complianceScore" INTEGER,
    "reputationScore" INTEGER,
    "financialScore" INTEGER,
    "findings" JSONB,
    "summary" TEXT,
    "recommendations" TEXT,
    "dataBreaches" JSONB,
    "certifications" JSONB,
    "rawData" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorContact" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VendorContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentType" "VendorDocumentType" NOT NULL DEFAULT 'other',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vulnerability" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "VulnerabilitySeverity" NOT NULL,
    "status" "VulnerabilityStatus" NOT NULL DEFAULT 'open',
    "source" "VulnerabilitySource" NOT NULL DEFAULT 'manual',
    "cvssScore" DOUBLE PRECISION,
    "cveId" TEXT,
    "cweId" TEXT,
    "affectedComponent" TEXT,
    "productionImpact" BOOLEAN NOT NULL DEFAULT false,
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "detectedAt" TIMESTAMP(3),
    "remediatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vulnerability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VendorProcessingActivities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VendorProcessingActivities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DSARProcessingActivities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DSARProcessingActivities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "AIProviderConfig_tenantId_idx" ON "AIProviderConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AIProviderConfig_tenantId_provider_key" ON "AIProviderConfig"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "AIFeatureConfig_tenantId_idx" ON "AIFeatureConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AIFeatureConfig_tenantId_feature_key" ON "AIFeatureConfig"("tenantId", "feature");

-- CreateIndex
CREATE INDEX "AISystem_tenantId_idx" ON "AISystem"("tenantId");

-- CreateIndex
CREATE INDEX "AIRiskAssessment_tenantId_idx" ON "AIRiskAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "AIRiskAssessment_aiSystemId_idx" ON "AIRiskAssessment"("aiSystemId");

-- CreateIndex
CREATE INDEX "AIRiskAssessment_status_idx" ON "AIRiskAssessment"("status");

-- CreateIndex
CREATE INDEX "AIRiskAssessment_nextReviewDate_idx" ON "AIRiskAssessment"("nextReviewDate");

-- CreateIndex
CREATE INDEX "AIIncident_tenantId_idx" ON "AIIncident"("tenantId");

-- CreateIndex
CREATE INDEX "AIIncident_aiSystemId_idx" ON "AIIncident"("aiSystemId");

-- CreateIndex
CREATE INDEX "AIIncident_status_idx" ON "AIIncident"("status");

-- CreateIndex
CREATE INDEX "AIIncident_severity_idx" ON "AIIncident"("severity");

-- CreateIndex
CREATE INDEX "AIIncident_detectedAt_idx" ON "AIIncident"("detectedAt");

-- CreateIndex
CREATE INDEX "AIImpactAssessment_tenantId_idx" ON "AIImpactAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "AIImpactAssessment_aiSystemId_idx" ON "AIImpactAssessment"("aiSystemId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_deletedAt_createdAt_idx" ON "Asset"("tenantId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Asset_tenantId_status_deletedAt_idx" ON "Asset"("tenantId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Audit_tenantId_idx" ON "Audit"("tenantId");

-- CreateIndex
CREATE INDEX "AuditFinding_tenantId_idx" ON "AuditFinding"("tenantId");

-- CreateIndex
CREATE INDEX "AuditFinding_auditId_idx" ON "AuditFinding"("auditId");

-- CreateIndex
CREATE INDEX "AuditDocument_tenantId_idx" ON "AuditDocument"("tenantId");

-- CreateIndex
CREATE INDEX "AuditDocument_auditId_idx" ON "AuditDocument"("auditId");

-- CreateIndex
CREATE INDEX "BusinessContinuityPlan_tenantId_idx" ON "BusinessContinuityPlan"("tenantId");

-- CreateIndex
CREATE INDEX "BusinessImpactAnalysis_tenantId_idx" ON "BusinessImpactAnalysis"("tenantId");

-- CreateIndex
CREATE INDEX "BusinessImpactAnalysis_bcpId_idx" ON "BusinessImpactAnalysis"("bcpId");

-- CreateIndex
CREATE INDEX "BusinessImpactAnalysis_status_idx" ON "BusinessImpactAnalysis"("status");

-- CreateIndex
CREATE INDEX "BusinessImpactAnalysis_criticalityLevel_idx" ON "BusinessImpactAnalysis"("criticalityLevel");

-- CreateIndex
CREATE INDEX "BusinessImpactAnalysis_nextReviewDate_idx" ON "BusinessImpactAnalysis"("nextReviewDate");

-- CreateIndex
CREATE INDEX "BCPExercise_tenantId_idx" ON "BCPExercise"("tenantId");

-- CreateIndex
CREATE INDEX "BCPExercise_bcpId_idx" ON "BCPExercise"("bcpId");

-- CreateIndex
CREATE INDEX "BCPExercise_status_idx" ON "BCPExercise"("status");

-- CreateIndex
CREATE INDEX "BCPExercise_scheduledDate_idx" ON "BCPExercise"("scheduledDate");

-- CreateIndex
CREATE INDEX "BCPExercise_conductedDate_idx" ON "BCPExercise"("conductedDate");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_idx" ON "Conversation"("tenantId");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_archivedAt_updatedAt_idx" ON "Conversation"("tenantId", "archivedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_createdBy_idx" ON "Conversation"("createdBy");

-- CreateIndex
CREATE INDEX "Message_tenantId_idx" ON "Message"("tenantId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Control_tenantId_idx" ON "Control"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ControlEvidenceCollectionConfig_controlId_key" ON "ControlEvidenceCollectionConfig"("controlId");

-- CreateIndex
CREATE INDEX "ControlEvidenceCollectionConfig_tenantId_idx" ON "ControlEvidenceCollectionConfig"("tenantId");

-- CreateIndex
CREATE INDEX "ControlEvidenceCollectionConfig_tenantId_mode_idx" ON "ControlEvidenceCollectionConfig"("tenantId", "mode");

-- CreateIndex
CREATE INDEX "Evidence_tenantId_idx" ON "Evidence"("tenantId");

-- CreateIndex
CREATE INDEX "Evidence_controlId_idx" ON "Evidence"("controlId");

-- CreateIndex
CREATE INDEX "Evidence_expiresAt_idx" ON "Evidence"("expiresAt");

-- CreateIndex
CREATE INDEX "Evidence_status_idx" ON "Evidence"("status");

-- CreateIndex
CREATE INDEX "FrameworkInstance_tenantId_idx" ON "FrameworkInstance"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkInstance_tenantId_frameworkId_key" ON "FrameworkInstance"("tenantId", "frameworkId");

-- CreateIndex
CREATE INDEX "Requirement_frameworkId_idx" ON "Requirement"("frameworkId");

-- CreateIndex
CREATE INDEX "FrameworkRequirementMapping_sourceRequirementId_idx" ON "FrameworkRequirementMapping"("sourceRequirementId");

-- CreateIndex
CREATE INDEX "FrameworkRequirementMapping_targetRequirementId_idx" ON "FrameworkRequirementMapping"("targetRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkRequirementMapping_sourceRequirementId_targetRequi_key" ON "FrameworkRequirementMapping"("sourceRequirementId", "targetRequirementId", "relationship");

-- CreateIndex
CREATE INDEX "ControlRequirementAssignment_tenantId_idx" ON "ControlRequirementAssignment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ControlRequirementAssignment_controlId_frameworkInstanceId__key" ON "ControlRequirementAssignment"("controlId", "frameworkInstanceId", "requirementId");

-- CreateIndex
CREATE INDEX "Incident_tenantId_idx" ON "Incident"("tenantId");

-- CreateIndex
CREATE INDEX "IncidentTimeline_tenantId_idx" ON "IncidentTimeline"("tenantId");

-- CreateIndex
CREATE INDEX "IncidentTimeline_incidentId_idx" ON "IncidentTimeline"("incidentId");

-- CreateIndex
CREATE INDEX "Policy_tenantId_idx" ON "Policy"("tenantId");

-- CreateIndex
CREATE INDEX "PolicyVersion_policyId_idx" ON "PolicyVersion"("policyId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_tenantId_idx" ON "PolicyAcknowledgment"("tenantId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_policyId_idx" ON "PolicyAcknowledgment"("policyId");

-- CreateIndex
CREATE INDEX "PolicyComment_policyId_idx" ON "PolicyComment"("policyId");

-- CreateIndex
CREATE INDEX "PolicyComment_policyVersionId_idx" ON "PolicyComment"("policyVersionId");

-- CreateIndex
CREATE INDEX "PolicyComment_tenantId_idx" ON "PolicyComment"("tenantId");

-- CreateIndex
CREATE INDEX "PolicyComment_parentId_idx" ON "PolicyComment"("parentId");

-- CreateIndex
CREATE INDEX "PolicyControl_tenantId_idx" ON "PolicyControl"("tenantId");

-- CreateIndex
CREATE INDEX "PolicyControl_policyId_idx" ON "PolicyControl"("policyId");

-- CreateIndex
CREATE INDEX "PolicyControl_controlId_idx" ON "PolicyControl"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyControl_policyId_controlId_key" ON "PolicyControl"("policyId", "controlId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyTemplate_slug_key" ON "PolicyTemplate"("slug");

-- CreateIndex
CREATE INDEX "PolicyTemplate_isActive_sortOrder_idx" ON "PolicyTemplate"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ProcessingActivity_tenantId_idx" ON "ProcessingActivity"("tenantId");

-- CreateIndex
CREATE INDEX "ProcessingActivity_status_idx" ON "ProcessingActivity"("status");

-- CreateIndex
CREATE INDEX "ProcessingActivity_nextReviewAt_idx" ON "ProcessingActivity"("nextReviewAt");

-- CreateIndex
CREATE INDEX "DPIA_tenantId_idx" ON "DPIA"("tenantId");

-- CreateIndex
CREATE INDEX "DPIA_processingActivityId_idx" ON "DPIA"("processingActivityId");

-- CreateIndex
CREATE INDEX "DPIA_status_idx" ON "DPIA"("status");

-- CreateIndex
CREATE INDEX "DataBreach_tenantId_idx" ON "DataBreach"("tenantId");

-- CreateIndex
CREATE INDEX "DataBreach_status_idx" ON "DataBreach"("status");

-- CreateIndex
CREATE INDEX "DataBreach_severity_idx" ON "DataBreach"("severity");

-- CreateIndex
CREATE INDEX "DataBreach_notificationDeadlineAt_idx" ON "DataBreach"("notificationDeadlineAt");

-- CreateIndex
CREATE INDEX "DataBreach_discoveredAt_idx" ON "DataBreach"("discoveredAt");

-- CreateIndex
CREATE INDEX "DSARRequest_tenantId_idx" ON "DSARRequest"("tenantId");

-- CreateIndex
CREATE INDEX "DSARRequest_status_idx" ON "DSARRequest"("status");

-- CreateIndex
CREATE INDEX "DSARRequest_requestType_idx" ON "DSARRequest"("requestType");

-- CreateIndex
CREATE INDEX "DSARRequest_dueAt_idx" ON "DSARRequest"("dueAt");

-- CreateIndex
CREATE INDEX "QuestionnaireImportJob_tenantId_idx" ON "QuestionnaireImportJob"("tenantId");

-- CreateIndex
CREATE INDEX "QuestionnaireImportJob_tenantId_status_idx" ON "QuestionnaireImportJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "QuestionnaireImportJob_tenantId_createdAt_idx" ON "QuestionnaireImportJob"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Questionnaire_tenantId_idx" ON "Questionnaire"("tenantId");

-- CreateIndex
CREATE INDEX "Questionnaire_tenantId_status_idx" ON "Questionnaire"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Question_tenantId_idx" ON "Question"("tenantId");

-- CreateIndex
CREATE INDEX "Question_questionnaireId_idx" ON "Question"("questionnaireId");

-- CreateIndex
CREATE INDEX "Question_questionnaireId_sequenceNumber_idx" ON "Question"("questionnaireId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "Question_parentQuestionId_idx" ON "Question"("parentQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_key" ON "Answer"("questionId");

-- CreateIndex
CREATE INDEX "Answer_tenantId_idx" ON "Answer"("tenantId");

-- CreateIndex
CREATE INDEX "Answer_questionnaireId_idx" ON "Answer"("questionnaireId");

-- CreateIndex
CREATE INDEX "Answer_questionnaireId_status_idx" ON "Answer"("questionnaireId", "status");

-- CreateIndex
CREATE INDEX "Risk_tenantId_idx" ON "Risk"("tenantId");

-- CreateIndex
CREATE INDEX "Risk_tenantId_status_idx" ON "Risk"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Risk_tenantId_category_idx" ON "Risk"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Risk_tenantId_riskIdentifier_key" ON "Risk"("tenantId", "riskIdentifier");

-- CreateIndex
CREATE INDEX "RiskAssessment_tenantId_idx" ON "RiskAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "RiskAssessment_riskId_idx" ON "RiskAssessment"("riskId");

-- CreateIndex
CREATE INDEX "RiskTreatment_tenantId_idx" ON "RiskTreatment"("tenantId");

-- CreateIndex
CREATE INDEX "RiskTreatment_riskId_idx" ON "RiskTreatment"("riskId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskRegisterConfig_tenantId_key" ON "RiskRegisterConfig"("tenantId");

-- CreateIndex
CREATE INDEX "RiskMatrixChange_tenantId_idx" ON "RiskMatrixChange"("tenantId");

-- CreateIndex
CREATE INDEX "RiskMatrixChange_riskId_idx" ON "RiskMatrixChange"("riskId");

-- CreateIndex
CREATE INDEX "RiskMatrixChange_riskId_createdAt_idx" ON "RiskMatrixChange"("riskId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_tenantId_idx" ON "Task"("tenantId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_sourceModule_sourceId_idx" ON "Task"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "TaskEvidence_tenantId_idx" ON "TaskEvidence"("tenantId");

-- CreateIndex
CREATE INDEX "TaskEvidence_taskId_idx" ON "TaskEvidence"("taskId");

-- CreateIndex
CREATE INDEX "TenantContext_tenantId_idx" ON "TenantContext"("tenantId");

-- CreateIndex
CREATE INDEX "TenantContext_tenantId_status_idx" ON "TenantContext"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TenantContext_tenantId_category_status_idx" ON "TenantContext"("tenantId", "category", "status");

-- CreateIndex
CREATE INDEX "TenantContext_lastUsedAt_idx" ON "TenantContext"("lastUsedAt");

-- CreateIndex
CREATE INDEX "TenantContextProposal_tenantId_idx" ON "TenantContextProposal"("tenantId");

-- CreateIndex
CREATE INDEX "TenantContextProposal_tenantId_status_idx" ON "TenantContextProposal"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TenantContextProposal_tenantId_createdAt_idx" ON "TenantContextProposal"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE INDEX "TenantSettings_tenantId_idx" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE INDEX "TrainingProgram_tenantId_idx" ON "TrainingProgram"("tenantId");

-- CreateIndex
CREATE INDEX "TrainingCompletion_tenantId_idx" ON "TrainingCompletion"("tenantId");

-- CreateIndex
CREATE INDEX "TrainingCompletion_trainingProgramId_idx" ON "TrainingCompletion"("trainingProgramId");

-- CreateIndex
CREATE INDEX "TrainingQuiz_tenantId_idx" ON "TrainingQuiz"("tenantId");

-- CreateIndex
CREATE INDEX "TrainingQuiz_trainingProgramId_idx" ON "TrainingQuiz"("trainingProgramId");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "QuizOption_questionId_idx" ON "QuizOption"("questionId");

-- CreateIndex
CREATE INDEX "QuizAttempt_tenantId_idx" ON "QuizAttempt"("tenantId");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "QuizAnswer_attemptId_idx" ON "QuizAnswer"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustCenterConfig_tenantId_key" ON "TrustCenterConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TrustCenterConfig_tenantId_idx" ON "TrustCenterConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TrustCenterSnapshot_tenantId_createdAt_idx" ON "TrustCenterSnapshot"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TrustCenterSnapshot_trustCenterConfigId_idx" ON "TrustCenterSnapshot"("trustCenterConfigId");

-- CreateIndex
CREATE INDEX "TrustCenterEvent_tenantId_createdAt_idx" ON "TrustCenterEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TrustCenterEvent_trustCenterConfigId_createdAt_idx" ON "TrustCenterEvent"("trustCenterConfigId", "createdAt");

-- CreateIndex
CREATE INDEX "TrustCenterEvent_type_createdAt_idx" ON "TrustCenterEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "TrustResource_tenantId_idx" ON "TrustResource"("tenantId");

-- CreateIndex
CREATE INDEX "TrustResource_trustCenterConfigId_idx" ON "TrustResource"("trustCenterConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustCenterAccessRequest_accessToken_key" ON "TrustCenterAccessRequest"("accessToken");

-- CreateIndex
CREATE INDEX "TrustCenterAccessRequest_tenantId_idx" ON "TrustCenterAccessRequest"("tenantId");

-- CreateIndex
CREATE INDEX "TrustCenterAccessRequest_accessToken_idx" ON "TrustCenterAccessRequest"("accessToken");

-- CreateIndex
CREATE INDEX "TrustCenterAccessRequest_requesterEmail_tenantId_idx" ON "TrustCenterAccessRequest"("requesterEmail", "tenantId");

-- CreateIndex
CREATE INDEX "TrustCenterAccessRequest_resourceId_idx" ON "TrustCenterAccessRequest"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_authProvider_idx" ON "User"("authProvider");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProvider_externalId_key" ON "User"("authProvider", "externalId");

-- CreateIndex
CREATE INDEX "Membership_tenantId_idx" ON "Membership"("tenantId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_tenantId_key" ON "Membership"("userId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "KnownVendor_normalizedName_key" ON "KnownVendor"("normalizedName");

-- CreateIndex
CREATE INDEX "KnownVendor_normalizedName_idx" ON "KnownVendor"("normalizedName");

-- CreateIndex
CREATE INDEX "Vendor_tenantId_idx" ON "Vendor"("tenantId");

-- CreateIndex
CREATE INDEX "Vendor_knownVendorId_idx" ON "Vendor"("knownVendorId");

-- CreateIndex
CREATE INDEX "Vendor_nextResearchAt_idx" ON "Vendor"("nextResearchAt");

-- CreateIndex
CREATE INDEX "VendorAssessment_tenantId_idx" ON "VendorAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "VendorAssessment_vendorId_idx" ON "VendorAssessment"("vendorId");

-- CreateIndex
CREATE INDEX "VendorAssessment_researchId_idx" ON "VendorAssessment"("researchId");

-- CreateIndex
CREATE INDEX "VendorResearch_vendorId_idx" ON "VendorResearch"("vendorId");

-- CreateIndex
CREATE INDEX "VendorResearch_knownVendorId_idx" ON "VendorResearch"("knownVendorId");

-- CreateIndex
CREATE INDEX "VendorResearch_tenantId_idx" ON "VendorResearch"("tenantId");

-- CreateIndex
CREATE INDEX "VendorResearch_status_idx" ON "VendorResearch"("status");

-- CreateIndex
CREATE INDEX "VendorContact_vendorId_idx" ON "VendorContact"("vendorId");

-- CreateIndex
CREATE INDEX "VendorDocument_vendorId_idx" ON "VendorDocument"("vendorId");

-- CreateIndex
CREATE INDEX "VendorDocument_tenantId_idx" ON "VendorDocument"("tenantId");

-- CreateIndex
CREATE INDEX "Vulnerability_tenantId_idx" ON "Vulnerability"("tenantId");

-- CreateIndex
CREATE INDEX "Vulnerability_tenantId_status_idx" ON "Vulnerability"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Vulnerability_tenantId_severity_idx" ON "Vulnerability"("tenantId", "severity");

-- CreateIndex
CREATE INDEX "_VendorProcessingActivities_B_index" ON "_VendorProcessingActivities"("B");

-- CreateIndex
CREATE INDEX "_DSARProcessingActivities_B_index" ON "_DSARProcessingActivities"("B");

-- AddForeignKey
ALTER TABLE "AIProviderConfig" ADD CONSTRAINT "AIProviderConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIFeatureConfig" ADD CONSTRAINT "AIFeatureConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISystem" ADD CONSTRAINT "AISystem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISystem" ADD CONSTRAINT "AISystem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRiskAssessment" ADD CONSTRAINT "AIRiskAssessment_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AISystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRiskAssessment" ADD CONSTRAINT "AIRiskAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRiskAssessment" ADD CONSTRAINT "AIRiskAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRiskAssessment" ADD CONSTRAINT "AIRiskAssessment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIIncident" ADD CONSTRAINT "AIIncident_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIIncident" ADD CONSTRAINT "AIIncident_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AISystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIIncident" ADD CONSTRAINT "AIIncident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIIncident" ADD CONSTRAINT "AIIncident_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIImpactAssessment" ADD CONSTRAINT "AIImpactAssessment_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AISystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIImpactAssessment" ADD CONSTRAINT "AIImpactAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIImpactAssessment" ADD CONSTRAINT "AIImpactAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIImpactAssessment" ADD CONSTRAINT "AIImpactAssessment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_frameworkInstanceId_fkey" FOREIGN KEY ("frameworkInstanceId") REFERENCES "FrameworkInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContinuityPlan" ADD CONSTRAINT "BusinessContinuityPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContinuityPlan" ADD CONSTRAINT "BusinessContinuityPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImpactAnalysis" ADD CONSTRAINT "BusinessImpactAnalysis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImpactAnalysis" ADD CONSTRAINT "BusinessImpactAnalysis_bcpId_fkey" FOREIGN KEY ("bcpId") REFERENCES "BusinessContinuityPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImpactAnalysis" ADD CONSTRAINT "BusinessImpactAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BCPExercise" ADD CONSTRAINT "BCPExercise_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BCPExercise" ADD CONSTRAINT "BCPExercise_bcpId_fkey" FOREIGN KEY ("bcpId") REFERENCES "BusinessContinuityPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BCPExercise" ADD CONSTRAINT "BCPExercise_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlEvidenceCollectionConfig" ADD CONSTRAINT "ControlEvidenceCollectionConfig_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkInstance" ADD CONSTRAINT "FrameworkInstance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkInstance" ADD CONSTRAINT "FrameworkInstance_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkRequirementMapping" ADD CONSTRAINT "FrameworkRequirementMapping_sourceRequirementId_fkey" FOREIGN KEY ("sourceRequirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkRequirementMapping" ADD CONSTRAINT "FrameworkRequirementMapping_targetRequirementId_fkey" FOREIGN KEY ("targetRequirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlRequirementAssignment" ADD CONSTRAINT "ControlRequirementAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlRequirementAssignment" ADD CONSTRAINT "ControlRequirementAssignment_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlRequirementAssignment" ADD CONSTRAINT "ControlRequirementAssignment_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlRequirementAssignment" ADD CONSTRAINT "ControlRequirementAssignment_frameworkInstanceId_fkey" FOREIGN KEY ("frameworkInstanceId") REFERENCES "FrameworkInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyComment" ADD CONSTRAINT "PolicyComment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyComment" ADD CONSTRAINT "PolicyComment_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyComment" ADD CONSTRAINT "PolicyComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyComment" ADD CONSTRAINT "PolicyComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyComment" ADD CONSTRAINT "PolicyComment_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyComment" ADD CONSTRAINT "PolicyComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PolicyComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyControl" ADD CONSTRAINT "PolicyControl_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyControl" ADD CONSTRAINT "PolicyControl_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyControl" ADD CONSTRAINT "PolicyControl_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingActivity" ADD CONSTRAINT "ProcessingActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingActivity" ADD CONSTRAINT "ProcessingActivity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DPIA" ADD CONSTRAINT "DPIA_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DPIA" ADD CONSTRAINT "DPIA_processingActivityId_fkey" FOREIGN KEY ("processingActivityId") REFERENCES "ProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DPIA" ADD CONSTRAINT "DPIA_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DPIA" ADD CONSTRAINT "DPIA_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataBreach" ADD CONSTRAINT "DataBreach_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataBreach" ADD CONSTRAINT "DataBreach_processingActivityId_fkey" FOREIGN KEY ("processingActivityId") REFERENCES "ProcessingActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataBreach" ADD CONSTRAINT "DataBreach_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataBreach" ADD CONSTRAINT "DataBreach_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DSARRequest" ADD CONSTRAINT "DSARRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DSARRequest" ADD CONSTRAINT "DSARRequest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireImportJob" ADD CONSTRAINT "QuestionnaireImportJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireImportJob" ADD CONSTRAINT "QuestionnaireImportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireImportJob" ADD CONSTRAINT "QuestionnaireImportJob_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questionnaire" ADD CONSTRAINT "Questionnaire_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questionnaire" ADD CONSTRAINT "Questionnaire_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questionnaire" ADD CONSTRAINT "Questionnaire_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_parentQuestionId_fkey" FOREIGN KEY ("parentQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_actionOwnerId_fkey" FOREIGN KEY ("actionOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_processingActivityId_fkey" FOREIGN KEY ("processingActivityId") REFERENCES "ProcessingActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskTreatment" ADD CONSTRAINT "RiskTreatment_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskTreatment" ADD CONSTRAINT "RiskTreatment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskTreatment" ADD CONSTRAINT "RiskTreatment_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRegisterConfig" ADD CONSTRAINT "RiskRegisterConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskMatrixChange" ADD CONSTRAINT "RiskMatrixChange_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskMatrixChange" ADD CONSTRAINT "RiskMatrixChange_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskMatrixChange" ADD CONSTRAINT "RiskMatrixChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantContext" ADD CONSTRAINT "TenantContext_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "TenantContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantContext" ADD CONSTRAINT "TenantContext_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantContextProposal" ADD CONSTRAINT "TenantContextProposal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuiz" ADD CONSTRAINT "TrainingQuiz_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuiz" ADD CONSTRAINT "TrainingQuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TrainingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TrainingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuizOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterConfig" ADD CONSTRAINT "TrustCenterConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterSnapshot" ADD CONSTRAINT "TrustCenterSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterSnapshot" ADD CONSTRAINT "TrustCenterSnapshot_trustCenterConfigId_fkey" FOREIGN KEY ("trustCenterConfigId") REFERENCES "TrustCenterConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterSnapshot" ADD CONSTRAINT "TrustCenterSnapshot_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterEvent" ADD CONSTRAINT "TrustCenterEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterEvent" ADD CONSTRAINT "TrustCenterEvent_trustCenterConfigId_fkey" FOREIGN KEY ("trustCenterConfigId") REFERENCES "TrustCenterConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustResource" ADD CONSTRAINT "TrustResource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustResource" ADD CONSTRAINT "TrustResource_trustCenterConfigId_fkey" FOREIGN KEY ("trustCenterConfigId") REFERENCES "TrustCenterConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterAccessRequest" ADD CONSTRAINT "TrustCenterAccessRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterAccessRequest" ADD CONSTRAINT "TrustCenterAccessRequest_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "TrustResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCenterAccessRequest" ADD CONSTRAINT "TrustCenterAccessRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_knownVendorId_fkey" FOREIGN KEY ("knownVendorId") REFERENCES "KnownVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssessment" ADD CONSTRAINT "VendorAssessment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssessment" ADD CONSTRAINT "VendorAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssessment" ADD CONSTRAINT "VendorAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssessment" ADD CONSTRAINT "VendorAssessment_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "VendorResearch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorResearch" ADD CONSTRAINT "VendorResearch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorResearch" ADD CONSTRAINT "VendorResearch_knownVendorId_fkey" FOREIGN KEY ("knownVendorId") REFERENCES "KnownVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorResearch" ADD CONSTRAINT "VendorResearch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContact" ADD CONSTRAINT "VendorContact_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorProcessingActivities" ADD CONSTRAINT "_VendorProcessingActivities_A_fkey" FOREIGN KEY ("A") REFERENCES "ProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorProcessingActivities" ADD CONSTRAINT "_VendorProcessingActivities_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DSARProcessingActivities" ADD CONSTRAINT "_DSARProcessingActivities_A_fkey" FOREIGN KEY ("A") REFERENCES "DSARRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DSARProcessingActivities" ADD CONSTRAINT "_DSARProcessingActivities_B_fkey" FOREIGN KEY ("B") REFERENCES "ProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
