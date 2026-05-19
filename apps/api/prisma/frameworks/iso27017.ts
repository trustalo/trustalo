import type { FrameworkDef } from "./index.js";

/**
 * ISO/IEC 27017:2015 — Cloud Information Security Controls
 * Source: ISO/IEC 27017:2015 "Information technology — Security techniques
 *   — Code of practice for information security controls based on ISO/IEC
 *   27002 for cloud services", first edition (December 2015).
 *   https://www.iso.org/standard/43757.html
 *
 * Structure:
 *   - `CLD.*` controls — seven cloud-specific control objectives that do
 *     not exist in ISO/IEC 27002 (shared responsibility, removal of
 *     customer assets in cloud, virtual segregation, VM hardening,
 *     administrator security, monitoring of cloud services and aligned
 *     virtual / physical network management).
 *   - `<27002 clause>-ext` controls — cloud-specific implementation
 *     guidance extending the corresponding ISO/IEC 27002 controls
 *     (policies, organization, access, cryptography, operations, backup,
 *     logging, network and compliance).
 *
 * Identifier scheme:
 *   - `CLD.<27002 clause>` for the seven cloud-only controls.
 *   - `<27002 clause>-ext` for cloud-extension guidance applied on top of
 *     the corresponding 27002 control (e.g. `9.4-ext`).
 *
 * Description style: paraphrases the published outcome statements in the
 * outcome-focused tone used in the ISO 27001 entries, sitting close to
 * the standard's "should" language without reproducing the proprietary
 * text verbatim. Evidence guidance lists artifacts a cloud-services
 * assessor would request — shared-responsibility matrices, hypervisor
 * hardening baselines, customer-isolation evidence, and the like.
 */
export const ISO27017_FRAMEWORK: FrameworkDef = {
  name: "ISO/IEC 27017:2015",
  version: "2015",
  description:
    "Code of practice for information security controls based on ISO/IEC 27002 for cloud services. Provides cloud-specific control objectives and implementation guidance for cloud service providers and cloud service customers.",
  frameworkType: "iso27017",
  requirements: [
    // ── Cloud-specific controls (CLD.*) ─────────────────────────────────
    {
      identifier: "CLD.6.3.1",
      title: "Shared roles and responsibilities within a cloud computing environment",
      category: "Organization of Information Security",
      description:
        "Information security roles and responsibilities for the cloud service customer and the cloud service provider shall be defined and agreed, including a shared-responsibility model that documents which controls are operated by each party for each service.",
      evidenceGuidance:
        "Shared-responsibility matrix per cloud service (IaaS / PaaS / SaaS); cloud service agreement / DPA referencing the matrix; published customer guidance documents; signed customer acknowledgments where relevant.",
    },
    {
      identifier: "CLD.8.1.5",
      title: "Removal of cloud service customer assets",
      category: "Asset Management",
      description:
        "Cloud service provider assets and customer information shall be removed from the cloud service provider's systems on termination of the cloud service agreement, in a manner that prevents recovery and on a timeline agreed with the customer.",
      evidenceGuidance:
        "Documented termination / offboarding procedure with deletion SLAs; cryptographic erasure or overwrite evidence; certificates of destruction supplied to customer on request; reconciliation of customer-data lifecycle from creation to deletion.",
    },
    {
      identifier: "CLD.9.5.1",
      title: "Segregation in virtual computing environments",
      category: "Access Control",
      description:
        "A cloud service customer's virtual environment running on a cloud service shall be protected from other customers and from unauthorised persons, with logical or physical isolation that prevents data leakage between tenants.",
      evidenceGuidance:
        "Tenant isolation architecture diagrams (network, compute, storage); tenant-isolation test results; hypervisor / container security baselines; pen test reports including tenant-boundary attack scenarios.",
    },
    {
      identifier: "CLD.9.5.2",
      title: "Virtual machine hardening",
      category: "Access Control",
      description:
        "Virtual machines used in the cloud service shall be hardened to meet business needs, including the removal of unnecessary services, ports, accounts and software, and shall be patched and configured in line with documented baselines.",
      evidenceGuidance:
        "VM / container image hardening baselines (CIS, STIG); golden-image build pipelines with SBOM and vulnerability scanning; configuration drift detection; sample compliance scan output for representative workloads.",
    },
    {
      identifier: "CLD.12.1.5",
      title: "Administrator's operational security",
      category: "Operations Security",
      description:
        "Procedures for administrative operations of cloud services shall be defined and managed to limit the risk of unauthorised access or accidental damage, including secure administration interfaces, separation of duties and monitoring of admin activity.",
      evidenceGuidance:
        "Privileged access management (PAM) configuration; jump-host / bastion architecture; admin-activity log integration into SIEM; segregation-of-duties matrix for cloud operators; periodic review of administrator entitlements.",
    },
    {
      identifier: "CLD.12.4.5",
      title: "Monitoring of cloud services",
      category: "Operations Security",
      description:
        "Cloud service operations shall be monitored to detect unauthorised activity, performance degradation and errors, with monitoring information made available to cloud service customers to support their own security operations.",
      evidenceGuidance:
        "Cloud telemetry / audit-log architecture (e.g. CloudTrail, Audit Logs); customer-accessible monitoring (status page, audit log export); detection use-cases catalogue; SLA on monitoring availability.",
    },
    {
      identifier: "CLD.13.1.4",
      title: "Alignment of security management for virtual and physical networks",
      category: "Communications Security",
      description:
        "The configuration of virtual networks supporting cloud services shall be aligned with the security policies of the underlying physical network, to ensure consistent enforcement of segmentation, filtering and monitoring controls across both layers.",
      evidenceGuidance:
        "Network design documents covering virtual + physical layers; security group / NACL baselines; consistency reviews between virtual and physical firewall rulesets; change-control evidence covering both layers.",
    },

    // ── Cloud extensions to ISO/IEC 27002 controls ───────────────────────
    {
      identifier: "5.1-ext",
      title: "Information security policies for cloud services",
      category: "Information Security Policies",
      description:
        "Information security policies for cloud services shall be defined to address the cloud-specific responsibilities of both the cloud service provider and the cloud service customer, including handling of cloud service customer data and use of sub-cloud services.",
      evidenceGuidance:
        "Cloud-specific policy or addendum to the master infosec policy; published customer guidance for cloud usage; documented sub-cloud / sub-processor controls; review evidence of policies covering cloud-specific risks.",
    },
    {
      identifier: "6.1-ext",
      title: "Roles and responsibilities for cloud services",
      category: "Organization of Information Security",
      description:
        "Information security roles and responsibilities for cloud services shall be assigned and communicated, including liaison points between the cloud service provider and the cloud service customer for security operations, incident response and audit.",
      evidenceGuidance:
        "RACI matrix scoped to cloud services; named contacts for incident response, audit and operational security on both sides; published cloud-services responsibility documents.",
    },
    {
      identifier: "9.2-ext",
      title: "User access management for cloud services",
      category: "Access Control",
      description:
        "User access management for cloud services shall provide the cloud service customer with the means to register, suspend and remove its users; restrict and review access; and apply authentication appropriate to the sensitivity of the cloud service.",
      evidenceGuidance:
        "Customer-facing IAM features (SCIM provisioning, SSO/SAML/OIDC, MFA enforcement); admin-API documentation; user lifecycle audit logs accessible to customers; sample evidence of de-provisioning workflow.",
    },
    {
      identifier: "9.4-ext",
      title: "System and application access control for cloud services",
      category: "Access Control",
      description:
        "Access to cloud services and the data within them shall be restricted in accordance with documented access-control policies, with technical enforcement of authentication, authorisation and least-privilege at both the cloud service provider and the cloud service customer level.",
      evidenceGuidance:
        "RBAC / ABAC role configuration; documentation of permission scopes; strong-authentication policy (MFA / phishing-resistant where applicable); periodic access reviews; logs of privileged access.",
    },
    {
      identifier: "10.1-ext",
      title: "Cryptographic controls for cloud services",
      category: "Cryptography",
      description:
        "Cryptographic controls for cloud services shall be implemented to protect data in transit and at rest, with key-management practices that allow the cloud service customer to meet its own confidentiality and integrity obligations, including options such as customer-managed keys where appropriate.",
      evidenceGuidance:
        "Encryption-at-rest configuration per data store; TLS configuration and cipher policy; key-management documentation (KMS / HSM, CMK / BYOK options); key rotation logs; customer-controlled encryption features.",
    },
    {
      identifier: "12.1-ext",
      title: "Operational procedures for cloud services",
      category: "Operations Security",
      description:
        "Operational procedures for cloud services shall be documented, maintained and made available to operations personnel, including change management, capacity management, separation of environments and the responsibilities of the cloud service provider and customer for each procedure.",
      evidenceGuidance:
        "Cloud-operations runbooks; change-management workflow with security gates; environment separation evidence (prod / non-prod / customer tenants); capacity reports; published cloud-operations responsibility documents.",
    },
    {
      identifier: "12.3-ext",
      title: "Information backup for cloud services",
      category: "Operations Security",
      description:
        "Backups of cloud service customer data shall be implemented in line with policy and contractual commitments, protected with the same controls as the source data, and tested through periodic restoration exercises.",
      evidenceGuidance:
        "Backup policy and architecture; backup encryption configuration; restoration test reports; documented retention schedule; immutable / object-locked backup configuration where used.",
    },
    {
      identifier: "12.4-ext",
      title: "Logging and monitoring for cloud services",
      category: "Operations Security",
      description:
        "Activities of users, exceptions, faults and information security events on cloud services shall be logged and monitored, with logs protected against unauthorised changes and made available to the cloud service customer for its own security operations.",
      evidenceGuidance:
        "Log architecture covering cloud control-plane and data-plane events; log-integrity protections (write-once, retention rules); customer audit-log export; SIEM detections; sample alerts and incident records.",
    },
    {
      identifier: "13.1-ext",
      title: "Network security management for cloud services",
      category: "Communications Security",
      description:
        "Networks supporting cloud services shall be managed and controlled to protect information in systems and applications, including segmentation between tenants, hardening of management interfaces and consistent enforcement across virtual and physical layers.",
      evidenceGuidance:
        "Network architecture diagrams covering tenant segmentation; firewall / security-group rule reviews; bastion / jump-host configuration; mTLS or service-mesh policy; periodic network pen-test reports.",
    },
    {
      identifier: "18.1-ext",
      title: "Compliance with legal and contractual requirements for cloud services",
      category: "Compliance",
      description:
        "Cloud services shall be designed and operated to meet applicable legal, statutory, regulatory and contractual requirements relating to information security, including obligations on data residency, sub-processors and breach notification.",
      evidenceGuidance:
        "Compliance obligation register scoped to cloud (GDPR, HIPAA, APPs, regional sovereignty laws); published data-residency / sub-processor lists; standard customer contracts and DPAs; compliance audit / certification reports.",
    },
    {
      identifier: "18.2-ext",
      title: "Information security reviews for cloud services",
      category: "Compliance",
      description:
        "The cloud service provider's approach to managing information security shall be reviewed independently at planned intervals or when significant changes occur, with results made available to cloud service customers to support their own assurance activities.",
      evidenceGuidance:
        "Independent audit / certification reports (ISO 27001, ISO 27017, SOC 2); bridge letters between attestations; customer-accessible trust portal; documented audit / right-to-information clauses in customer contracts.",
    },
  ],
};
