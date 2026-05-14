# Permissions Matrix

Trustalo uses role-based access control (RBAC). Every authenticated user has a **role** assigned via their organization membership. Each role maps to a set of **permissions** that govern access to API endpoints and UI features.

Source of truth: `packages/auth/src/rbac.ts`

---

## Roles

| Role | Description |
| --- | --- |
| **owner** | Full access. Holds every permission, including `users:manage` and `settings:write`. One per organization. |
| **admin** | Near-full access. Holds every permission **except** `users:manage` and `settings:write` (so admin keeps `integrations:manage`, `vulnerabilities:write`, `privacy:write`, etc.). |
| **compliance_manager** | Read + write access across the compliance domain (frameworks, controls, policies, risks, evidence, vendors, audits, assets, incidents, vulnerabilities, BCP, AI governance, training, privacy). No settings/users/integrations rights. |
| **auditor** | Read-only across the platform, plus `evidence:approve` and `audits:write`. |
| **viewer** | Read-only across the platform. |
| **integration_admin** | Scoped to integration management and evidence reading: `integrations:read`, `integrations:manage`, `evidence:read`. |
| **dpo** | Data Protection Officer (GDPR Art. 38). Read across the platform, plus write on `privacy`, `incidents`, `evidence`, and `vendors`. Independent role — does not get `users:manage` or `settings:write`. |

---

## Permissions

### Action Types

| Suffix     | Meaning                                            |
| ---------- | -------------------------------------------------- |
| `:read`    | View / list resources                              |
| `:write`   | Create, update, delete resources                   |
| `:manage`  | Full lifecycle control (create, configure, delete) |
| `:approve` | Review and approve resources                       |

### Full Permission List

| Permission              | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `users:read`            | View organization members                                            |
| `users:write`           | Invite members, update profiles                                      |
| `users:manage`          | Change roles, remove members                                         |
| `settings:read`         | View organization and security settings                              |
| `settings:write`        | Modify organization settings, security policies, trust center config |
| `frameworks:read`       | View compliance frameworks and instances                             |
| `frameworks:write`      | Adopt, update, toggle, remove framework instances                    |
| `controls:read`         | View controls and mappings                                           |
| `controls:write`        | Create, update, delete controls and mappings                         |
| `policies:read`         | View policies, versions, templates                                   |
| `policies:write`        | Create, update, delete, publish, approve policies                    |
| `risks:read`            | View risks, assessments, treatments                                  |
| `risks:write`           | Create, update, delete risks and related records                     |
| `evidence:read`         | View evidence items and health                                       |
| `evidence:write`        | Create, update, delete, upload, submit evidence                      |
| `evidence:approve`      | Review and approve/reject evidence                                   |
| `vendors:read`          | View vendors, contacts, research                                     |
| `vendors:write`         | Create, update, delete vendors and trigger research                  |
| `audits:read`           | View audits and findings                                             |
| `audits:write`          | Create, update, delete audits and findings                           |
| `assets:read`           | View asset inventory                                                 |
| `assets:write`          | Create, update, delete, restore assets                               |
| `incidents:read`        | View incidents and timelines                                         |
| `incidents:write`       | Create, update, delete incidents                                     |
| `vulnerabilities:read`  | View vulnerability findings and remediation status                   |
| `vulnerabilities:write` | Create, update, triage, close vulnerability findings                 |
| `bcp:read`              | View business continuity plans, BIA, exercises                       |
| `bcp:write`             | Create, update, delete BCP records                                   |
| `ai:read`               | View AI systems and governance data                                  |
| `ai:write`              | Create, update, delete AI system records                             |
| `training:read`         | View training programs and completions                               |
| `training:write`        | Create, update, delete training programs                             |
| `integrations:read`     | View connected integrations                                          |
| `integrations:manage`   | Connect, configure, disconnect integrations                          |
| `privacy:read`          | View RoPA, DPIAs, breach register, DSARs                             |
| `privacy:write`         | Create, update, delete privacy program records                       |

---

## Role → Permission Matrix

`R` = read, `W` = write, `M` = manage, `A` = approve, `—` = no access

| Resource | Owner | Admin | Compliance Manager | Auditor | Viewer | Integration Admin | DPO |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **Users** | R W M | R W | — | R | R | — | R |
| **Settings** | R W | R | — | R | R | — | R |
| **Frameworks** | R W | R W | R W | R | R | — | R |
| **Controls** | R W | R W | R W | R | R | — | R |
| **Policies** | R W | R W | R W | R | R | — | R |
| **Risks** | R W | R W | R W | R | R | — | R |
| **Evidence** | R W A | R W | R W | R A | R | R | R W |
| **Vendors** | R W | R W | R W | R | R | — | R W |
| **Audits** | R W | R W | R W | R W | R | — | R |
| **Assets** | R W | R W | R W | R | R | — | R |
| **Incidents** | R W | R W | R W | R | R | — | R W |
| **Vulnerabilities** | R W | R W | R W | R | R | — | R |
| **BCP** | R W | R W | R W | R | R | — | R |
| **AI Governance** | R W | R W | R W | R | R | — | R |
| **Training** | R W | R W | R W | R | R | — | R |
| **Integrations** | R M | R M | — | — | — | R M | — |
| **Privacy** | R W | R W | R W | R | R | — | R W |

---

## Navigation Visibility

Menu items are hidden from users who lack the corresponding read permission.

| Menu Item | Required Permission | Visible To |
| --- | --- | --- |
| Dashboard | _(none — all authenticated)_ | All roles |
| Tasks | _(none — personal)_ | All roles |
| Frameworks | `frameworks:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Controls | `controls:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Policies | `policies:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Risks | `risks:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Evidence | `evidence:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, Integration Admin, DPO |
| Vendors | `vendors:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Assets | `assets:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Incidents | `incidents:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Vulnerabilities | `vulnerabilities:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Audits | `audits:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Business Continuity | `bcp:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| AI Governance | `ai:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Training | `training:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Privacy | `privacy:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Integrations | `integrations:read` | Owner, Admin, Integration Admin |
| Trust Center | `settings:read` | Owner, Admin, Auditor, Viewer, DPO |
| Settings | `settings:read` | Owner, Admin, Auditor, Viewer, DPO |

---

## API Enforcement

### Global Authentication

All `/api/v1/*` routes (except `/api/v1/auth/login` and `/api/v1/auth/register`) require a valid JWT Bearer token via the `authenticate` middleware.

### Per-Router Authorization

Each module router applies permission checks using `authorizeResource(readPerm, writePerm)`:

- **GET / HEAD / OPTIONS** requests require the `:read` permission
- **POST / PATCH / PUT / DELETE** requests require the `:write` permission

### Special Cases

| Route | Permission | Notes |
| --- | --- | --- |
| `POST /api/v1/evidence/:id/review` | `evidence:approve` | Additional check beyond `evidence:write` |
| `GET /api/v1/organizations` | `settings:read` | Organization info |
| `PATCH /api/v1/organizations` | `settings:write` | Update org name |
| `GET /api/v1/organizations/members` | `users:read` | List members |
| `POST /api/v1/organizations/members/invite` | `users:manage` | Invite new member |
| `PATCH /api/v1/organizations/members/:id` | `users:manage` | Change member role |
| `DELETE /api/v1/organizations/members/:id` | `users:manage` | Remove member |
| `GET /api/v1/organizations/settings` | `settings:read` | Org settings |
| `PATCH /api/v1/organizations/settings` | `settings:write` | Update settings |
| `GET /internal/vendors/due-for-research` | HMAC service-auth | Service-to-service, not JWT-protected. Lives under `/internal`, not `/api/v1`. |
| `GET /api/v1/dashboards/overview` | _(none)_ | All authenticated users |
| `/api/v1/tasks/*` | _(none)_ | Personal tasks, all authenticated users |

### UI Write Guards

The Settings page applies additional frontend guards:

| Action                                                           | Required Permission |
| ---------------------------------------------------------------- | ------------------- |
| Edit organization name                                           | `settings:write`    |
| Edit company profile                                             | `settings:write`    |
| Modify security settings (MFA, password policy, session timeout) | `settings:write`    |
| Invite members                                                   | `users:manage`      |
| Change member roles                                              | `users:manage`      |
| Remove members                                                   | `users:manage`      |

---

## Custom Permissions

The `Membership` model supports an optional `permissions` string array that overrides the default role-based permissions. When set, these take precedence over `ROLE_PERMISSIONS[role]`. This allows per-user permission customization when needed.
