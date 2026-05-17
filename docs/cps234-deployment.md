# Trustalo for APRA CPS 234 — AU Data-Residency Deployment

This document describes a reference deployment of Trustalo for an APRA-regulated entity that needs to assert **all customer data, processing and inference happen inside Australia**. It exists because the regulator's Question #1 in any CPS 234 review is invariably _"where does our data leave Australia?"_ — and the right answer for an APRA-regulated entity is "it doesn't".

> Status: reference architecture. Trustalo is multi-cloud-capable; this doc focuses on the AWS `ap-southeast-2` (Sydney) topology because that is the only AWS region today that hosts every component (compute, storage, queue, KMS, RDS Postgres, **Bedrock Anthropic Claude**) inside Australia. `ap-southeast-4` (Melbourne) is a viable secondary as additional Bedrock model SKUs land there.

---

## 1. Architectural intent

| Concern | Decision | Rationale |
| --- | --- | --- |
| Region | `ap-southeast-2` (Sydney) | Only AU region today carrying RDS + S3 + SQS + KMS + Bedrock-Claude. |
| Compute | ECS Fargate (or EKS) in a single region | No cross-region replication of running workloads. |
| Database | Amazon RDS for PostgreSQL, Multi-AZ inside `ap-southeast-2` | Multi-AZ stays within the region — never cross-region. |
| Document store | Amazon DocumentDB (Mongo-compatible) in `ap-southeast-2` | Same region as RDS. |
| Object storage | S3 buckets created with `LocationConstraint = ap-southeast-2`, **plus** an explicit deny of any cross-region replication target | "Region pinning" enforced via bucket policy + SCP. |
| Queue | SQS queues in `ap-southeast-2` | Same region as compute. |
| KMS | Customer-Managed Keys (CMK) in `ap-southeast-2` only; cross-region key replication disabled | Data is encrypted with keys that physically cannot leave AU. |
| Identity provider | Cognito User Pool in `ap-southeast-2` (or Keycloak / Microsoft Entra in-region) | The auth-provider plugin abstracts this. |
| AI inference | **Amazon Bedrock — `ap-southeast-2`** only | Anthropic Claude (Sonnet) and Titan models are GA in Sydney. No request is allowed to fall back to a US/EU region. |
| Static assets | CloudFront with origin restricted to AU edge locations | Optional — global CDN may serve static JS/CSS from non-AU edges; **no customer data** transits it. |
| Backups | RDS automated backups + S3 cross-AZ replication, all `ap-southeast-2` | No `aws s3 cp` to another region in any pipeline. |

---

## 2. Component topology

```
┌─────────────────────────────────────────────────────────────────┐
│ AWS Region: ap-southeast-2 (Sydney)                            │
│                                                                 │
│   VPC ─ private subnets across 3 AZs (apse2-az1/2/3)           │
│   │                                                             │
│   ├── ECS Fargate cluster                                       │
│   │     ├── @trustalo/api    (Express, port 4000)              │
│   │     ├── @trustalo/collector (Express, port 4100)           │
│   │     └── @trustalo/web    (Next.js SSR, port 3000)          │
│   │                                                             │
│   ├── RDS PostgreSQL — Multi-AZ                                 │
│   │     • encrypted at rest with CMK arn:aws:kms:ap-southeast-2:.../prod-trustalo  │
│   │     • automated backups: 35 days, same region only          │
│   │                                                             │
│   ├── DocumentDB cluster (3 instances across AZs)               │
│   │                                                             │
│   ├── SQS queues                                                │
│   │     • evidence-agent.fifo                                   │
│   │     • collector-runs.fifo                                   │
│   │                                                             │
│   ├── S3 buckets                                                │
│   │     • trustalo-prod-evidence    (encryption: SSE-KMS, CMK)  │
│   │     • trustalo-prod-policies                                │
│   │     • trustalo-prod-questionnaires                          │
│   │     ⛔ no Cross-Region Replication rules                     │
│   │                                                             │
│   ├── KMS CMK                                                   │
│   │     • used for RDS, S3, SQS, Secrets Manager                │
│   │     • policy denies kms:ReplicateKey                        │
│   │                                                             │
│   └── Bedrock                                                   │
│         • model: anthropic.claude-sonnet-4-7                    │
│         • inference profile: arn:aws:bedrock:ap-southeast-2:... │
│         • guardrail: trustalo-prod-guardrail (also ap-southeast-2)│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                       │
                       │ HTTPS only, cert from ACM in ap-southeast-2
                       ▼
                 trustalo.example.com.au
```

There are **no** dependencies on `us-east-1`, `eu-west-1`, OpenAI, or the Anthropic public API. The only cross-region traffic is:

- ACM-issued cert validation (DNS, no customer data).
- AWS Service Health metrics emitted to the AWS account's home region.
- _Optional_ CloudFront edge delivery of compiled web bundles — no customer data is in those bundles.

---

## 3. Configuration knobs

The Trustalo monorepo is region-agnostic; pin a deployment to AU by setting the following environment variables.

### `apps/api/.env` (production)

```dotenv
AWS_REGION=ap-southeast-2
DATABASE_URL=postgresql://trustalo:${PG_PASS}@${RDS_ENDPOINT}.ap-southeast-2.rds.amazonaws.com:5432/trustalo?schema=public&sslmode=require
MONGODB_URI=mongodb://...docdb.amazonaws.com:27017/trustalo?tls=true&replicaSet=rs0&readPreference=secondaryPreferred
S3_BUCKET=trustalo-prod-evidence
S3_REGION=ap-southeast-2
SQS_QUEUE_URL=https://sqs.ap-southeast-2.amazonaws.com/.../evidence-agent.fifo
KMS_KEY_ID=arn:aws:kms:ap-southeast-2:...:key/...

# AI provider — pin to Bedrock + AU inference profile.
AI_PROVIDER=bedrock
BEDROCK_REGION=ap-southeast-2
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-7
BEDROCK_INFERENCE_PROFILE_ARN=arn:aws:bedrock:ap-southeast-2:...:inference-profile/trustalo-au-only
BEDROCK_GUARDRAIL_ID=trustalo-prod-guardrail
BEDROCK_GUARDRAIL_VERSION=DRAFT

# Hard fail rather than silently fall back if the AU model isn't available.
AI_ALLOW_REGION_FALLBACK=false
```

### `apps/collector/.env`

Same `AWS_REGION`, S3, and KMS values. The collector never speaks to Bedrock directly — it relays through the API's AI resolver — so it does not need Bedrock env vars.

### `apps/web/.env`

```dotenv
NEXT_PUBLIC_API_URL=https://api.trustalo.example.com.au
# Tenant-visible "data location" badge in the trust center.
NEXT_PUBLIC_DATA_REGION=ap-southeast-2
```

### Bedrock model selection

The `apps/api/src/config/ai.ts` resolver already supports per-tenant provider override. For an APRA tenant, _block_ the OpenAI / Anthropic public-API providers at the operator-defaults layer:

```ts
operatorDefaults.allowedProviders = ["bedrock"];
operatorDefaults.allowedRegions = ["ap-southeast-2", "ap-southeast-4"];
```

A tenant attempting to switch to an off-region provider will receive `AINotConfiguredError` rather than have its prompts silently routed to the United States.

---

## 4. Guard-rails enforced in code

The codebase ships several guard-rails that complement the deployment:

- **PII pre-pass** — `packages/ai/src/extraction/scrub.ts` strips emails, phone numbers, IP addresses and long digit runs from any prose before it reaches a model. Even if the model were mis-configured to a non-AU region, the prose itself never carries the raw PII.
- **Tenant allow-list** — `apps/api/scripts/check-tenant-allowlist.ts` CI gate prevents a new tenant-scoped table from accidentally bypassing the `prismaWithTenant` row-level filter. CPS 234 Para 23 asks for evidence the entity's controls are enforced at every layer; the gate is one of the artefacts you cite.
- **Grounding bundle audit hash** — every chat reply records a `groundingHash` over the bundle the model saw. APRA can be shown exactly which records were in front of the model on any specific turn.
- **CPS 234 chat persona** — `apps/api/src/modules/chat/system-prompt.ts` injects the 72-hour and 10-business-day clocks plus the materiality framework when the tenant has adopted CPS 234. The persona is unit-tested (`system-prompt.test.ts`) so a regression cannot ship.
- **ControlWeakness 10-business-day clock** — `apps/api/src/lib/business-days.ts` skips weekends and Australian national public holidays. The clock is unit-tested with the AU holiday calendar through 2027.

---

## 5. Operational evidence to keep on file

For a CPS 234 prudential review, the following artefacts demonstrate the residency claim:

1. **AWS account-level Service Control Policy** explicitly denying `s3:CreateBucket` and `s3:PutBucketReplication` in regions other than `ap-southeast-2` and `ap-southeast-4`.
2. **CloudTrail trails** in `ap-southeast-2`, with multi-region trails _enabled_ so cross-region API calls are still recorded (so you can detect drift).
3. **AWS Config rules** enforcing `s3-bucket-region`, `rds-instance-region`, `kms-cmk-region` against the AU allow-list.
4. **Bedrock invocation logs** routed to S3 with the `requestArn` field showing only `arn:aws:bedrock:ap-southeast-2:...`.
5. **Network egress audit** showing no NAT-gateway egress to non-AWS destinations during the assessment window. (CloudFront edge delivery of static bundles is fine — the Trust Center should document it as static-asset-only.)

These are exactly the same artefacts an internal-audit review under CPS 234 Para 32 would request, so collecting them once buys you double duty.

---

## 6. Disaster recovery (still inside AU)

- **Primary**: `ap-southeast-2` Multi-AZ RDS + cross-AZ S3 replication.
- **Secondary** (optional): `ap-southeast-4` (Melbourne). When invoking cross-region replication for DR, **target only `ap-southeast-4`** — configure SCPs to deny replication targets outside the AU allow-list.
- **RTO/RPO**: Multi-AZ RDS gives < 60 s RPO and ~ 60 s RTO without leaving Sydney. A Melbourne warm standby raises the RPO to ~ 5 minutes but is still inside AU.

---

## 7. Frequently-asked regulator questions, with where to look

| Regulator question | Where to point them |
| --- | --- |
| "Where does customer data live?" | This document, §2 + §3. |
| "What happens to the data when an LLM is asked a question?" | `packages/ai/src/extraction/scrub.ts` + the Bedrock guardrail console. |
| "Can a chat answer cite something the user didn't share?" | `apps/api/src/modules/chat/grounding.ts` (`filterValidCitations`) — citations are validated against the bundle hash. |
| "How do you track control weaknesses against the 10-day clock?" | `apps/api/src/modules/control-weaknesses/router.ts` + the `notificationOverdue` filter. |
| "How do you classify information assets?" | `packages/ai/src/extraction/asset-classification.ts` + the Asset register. |
| "Who approved your information-security policy framework?" | The platform's policy module — `lastApprovedById` + `lastApprovedAt` on every policy row. |

---

## 8. Out of scope (yet)

- **Data sovereignty for sub-processor email/Slack notifications.** The platform sends transactional notifications via SES (which can be pinned to `ap-southeast-2`) but Slack / Microsoft Teams webhook destinations are tenant-controlled — out of Trustalo's residency scope.
- **Customer-supplied integration connections.** A tenant may wire the collector to an integration that itself processes data outside AU (e.g. a US-hosted SaaS). The Trust Center should disclose this.

If a regulator asks about either, the honest answer is _"that integration runs in the customer's chosen region, not ours; the inventory is visible per-tenant in the Trust Center"_.
