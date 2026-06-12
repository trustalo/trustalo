# Permissions Matrix

Trustalo uses role-based access control (RBAC). Every authenticated user has a **role** carried on their `Person` record in the tenant (the `Person` model replaced the historical `Membership`). Each role maps to a set of **permissions** that govern access to API endpoints and UI features. New people default to the `member` role; admins promote them via the People role picker.

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
| **member** | Default role for every new person (rank-and-file staff, vendor contacts). Self-service only: `self:read` + `self:write` — view own profile and devices, acknowledge assigned policies, complete assigned training. No access to any other resource. |

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

| Permission | Description |
| --- | --- |
| `users:read` | View members (legacy `/organizations/members` roster; superseded by `people:read`) |
| `users:write` | Invite members, update profiles (legacy members surface) |
| `users:manage` | Change roles, remove members (legacy members surface) |
| `people:read` | View the People directory, profiles, stats, background checks, checklists |
| `people:write` | Create/invite/update people, change roles, status transitions, HR records |
| `self:read` | View own profile, devices, assigned policies + training (the `/people/me` self-portal; `member` role) |
| `self:write` | Acknowledge own assigned policies, complete own assigned training (caller's rows only) |
| `settings:read` | View organization and security settings |
| `settings:write` | Modify organization settings, security policies, trust center config |
| `frameworks:read` | View compliance frameworks and instances |
| `frameworks:write` | Adopt, update, toggle, remove framework instances |
| `controls:read` | View controls and mappings |
| `controls:write` | Create, update, delete controls and mappings |
| `policies:read` | View policies, versions, templates |
| `policies:write` | Create, update, delete, publish, approve policies |
| `risks:read` | View risks, assessments, treatments |
| `risks:write` | Create, update, delete risks and related records |
| `evidence:read` | View evidence items and health |
| `evidence:write` | Create, update, delete, upload, submit evidence |
| `evidence:approve` | Review and approve/reject evidence |
| `vendors:read` | View vendors, contacts, research |
| `vendors:write` | Create, update, delete vendors and trigger research |
| `audits:read` | View audits and findings |
| `audits:write` | Create, update, delete audits and findings |
| `assets:read` | View asset inventory |
| `assets:write` | Create, update, delete, restore assets |
| `incidents:read` | View incidents and timelines |
| `incidents:write` | Create, update, delete incidents |
| `vulnerabilities:read` | View vulnerability findings and remediation status |
| `vulnerabilities:write` | Create, update, triage, close vulnerability findings |
| `bcp:read` | View business continuity plans, BIA, exercises |
| `bcp:write` | Create, update, delete BCP records |
| `ai:read` | View AI systems and governance data |
| `ai:write` | Create, update, delete AI system records |
| `training:read` | View training programs and completions |
| `training:write` | Create, update, delete training programs |
| `integrations:read` | View connected integrations |
| `integrations:manage` | Connect, configure, disconnect integrations |
| `privacy:read` | View RoPA, DPIAs, breach register, DSARs |
| `privacy:write` | Create, update, delete privacy program records |

---

## Role → Permission Matrix

`R` = read, `W` = write, `M` = manage, `A` = approve, `—` = no access

| Resource | Owner | Admin | Compliance Manager | Auditor | Viewer | Integration Admin | DPO | Member |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **Users** (legacy) | R W M | R W | — | R | R | — | R | — |
| **Settings** | R W | R | — | R | R | — | R | — |
| **Frameworks** | R W | R W | R W | R | R | — | R | — |
| **Controls** | R W | R W | R W | R | R | — | R | — |
| **Policies** | R W | R W | R W | R | R | — | R | — |
| **Risks** | R W | R W | R W | R | R | — | R | — |
| **Evidence** | R W A | R W | R W | R A | R | R | R W | — |
| **Vendors** | R W | R W | R W | R | R | — | R W | — |
| **Audits** | R W | R W | R W | R W | R | — | R | — |
| **Assets / Devices** | R W | R W | R W | R | R | — | R | — |
| **Incidents** | R W | R W | R W | R | R | — | R W | — |
| **Vulnerabilities** | R W | R W | R W | R | R | — | R | — |
| **BCP** | R W | R W | R W | R | R | — | R | — |
| **AI Governance** | R W | R W | R W | R | R | — | R | — |
| **Training** | R W | R W | R W | R | R | — | R | — |
| **Integrations** | R M | R M | — | — | — | R M | — | — |
| **Privacy** | R W | R W | R W | R | R | — | R W | — |
| **People** | R W | R W | R W | R | R | — | R | — |
| **Self-service** (`self:*`) | R W | R W | — | R | R | — | R | R W |

> **Devices** are gated by the `assets:*` permissions — the Device posture page lives under Assets (`assets:read` to view, `assets:write` to revoke/mint enrollment tokens). The agent's own check-in route is authenticated by a per-device HMAC secret, not a user JWT.
>
> The **member** column is `—` for every resource except Self-service; that is the whole point of the role. The `self:*` read paths (`/people/me…`) scope strictly to the calling person's own rows. Owner/Admin inherit `self:*` because they hold every permission, but they use the full surfaces, not the self-portal.

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
| People | `people:read` | Owner, Admin, Compliance Manager, Auditor, Viewer, DPO |
| Integrations | `integrations:read` | Owner, Admin, Integration Admin |
| Trust Center | `settings:read` | Owner, Admin, Auditor, Viewer, DPO |
| Settings | `settings:read` | Owner, Admin, Auditor, Viewer, DPO |

> **Devices** are not a separate nav item — the Device posture fleet view lives under **Assets** (`assets:read`), and per-person devices appear on the **People → Devices** profile tab. A `member` who signs in sees only their own self-service view (profile, devices, assigned policies/training), not the management directory.

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
| `GET /api/v1/organizations/members` | `users:read` | **Legacy** members roster (now reads `Person`; superseded by `GET /api/v1/people`) |
| `POST /api/v1/organizations/members/invite` | `users:manage` | **Legacy** invite (superseded by `POST /api/v1/people/invite`) |
| `PATCH /api/v1/organizations/members/:id` | `users:manage` | **Legacy** change member role |
| `DELETE /api/v1/organizations/members/:id` | `users:manage` | **Legacy** remove member |
| `GET /api/v1/people` · `GET /api/v1/people/:id` | `people:read` | People directory + profile (the richer surface) |
| `POST /api/v1/people` · `/invite` · `PATCH /api/v1/people/:id/role` | `people:write` | Create/invite people, role changes, HR records |
| `GET /api/v1/people/me…` | `self:read` | Self-portal: own profile, devices, assigned policies/training (`member`) |
| `POST /api/v1/people/me/policies/:id/acknowledge` · `…/training/:id/complete` | `self:write` | Self-mutations on the caller's own rows only |
| `GET /api/v1/devices` · `/:id` · `/:id/posture-history` | `assets:read` | Device fleet, detail, snapshot history |
| `POST /api/v1/devices/:id/revoke` · `/enrollment-tokens` | `assets:write` | Revoke a device, mint enrollment tokens |
| `POST /api/v1/devices/agent/check-in` | per-device HMAC | Agent posture heartbeat — signed by the device secret, not a user JWT |
| `POST /api/v1/auth/device/token` | PKCE (none) | Device-authorization code exchange → device JWT |
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

The `Person` model supports an optional `permissions` string array that overrides the default role-based permissions. When set, these take precedence over `ROLE_PERMISSIONS[role]`. This allows per-user permission customization when needed.
