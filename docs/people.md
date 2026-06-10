# People (personnel directory & HR)

People is Trustalo's personnel directory and lightweight HR-compliance surface. A **`Person`** is the canonical per-tenant record for anyone in compliance scope — staff, contractors, and vetted vendor contacts. People **replaced the old `Membership` model**: a `Person` carries the org link, role-based access, _and_ HR attributes, and a device/asset is assigned to a Person.

> Model: `Person` (one row = one person). Everything user-facing — the module, the API (`/api/v1/people`), the RBAC scopes (`people:*`), the nav and the UI — is "People".

## Why it replaced `Membership`

`Membership` only modelled "this user has role X in this tenant". It had no employment status, no background-check history, no onboarding/offboarding, no manager/department, and devices/assets pointed at bare `User` ids. `Person` keeps the exact same role-based RBAC but adds the HR dimension and becomes the entity that devices, assets, training, and policy acknowledgments roll up to.

The migration was deliberately phased and **non-destructive**:

1. `Person` added + **backfilled** one row per existing `Membership` (same `role`, `permissions`, `status`, linked `userId`, email/name from `User`).
2. Auth (`login` / `invite` / `getMe`), the members API, directory-sync, and the owner-lookup worker were switched to read/write `Person`.
3. `Membership` is retained read-only as the backfill source and dropped in a later migration **only after the new path is verified**.

## Auth & RBAC (unchanged contract)

The JWT shape (`{ userId, tenantId, role, permissions[] }`) and every `authorize()` / `authorizeResource()` check are **unchanged**. Effective permissions are still derived at login from `Person.permissions` (override) or `getPermissionsForRole(Person.role)` — only the _source row_ changed from `Membership` to `Person`.

`Person` is an **intentional exception** to the `prismaWithTenant` tenant allow-list: login resolves a user's Person across tenants to choose which tenant to pin, so it must not be auto-tenant-scoped. Every People-module query filters `tenantId` explicitly. (The child tables `BackgroundCheck` and `PersonChecklistItem` _are_ in the allow-list — they're strictly per-tenant.)

### Roles

Every Person defaults to the new **`member`** role; admins promote to the existing system roles via the same role picker used before:

| Role | People scope | Notes |
| --- | --- | --- |
| `member` | `self:read`, `self:write` | Rank-and-file / vendor contacts. Self-service only. |
| `viewer` / `auditor` / `dpo` | `people:read` (+`self:read`) | Read directory. |
| `compliance_manager` | `people:read`, `people:write` | Manage People. |
| `admin` / `owner` | full | Manage People + everything. |
| `integration_admin` | — | No People access. |

`owner` is never assignable through the People UI (single owner per tenant; ownership transfer is a separate action). Owners can't be suspended/offboarded.

## Self-service (`member`) portal

The `member` role's only People access is the self-portal, scoped server-side to the caller's own `userId`:

- `GET  /api/v1/people/me` — own profile
- `GET  /api/v1/people/me/policies` — published policies + own ack status
- `POST /api/v1/people/me/policies/:id/acknowledge`
- `GET  /api/v1/people/me/training` — own assigned training
- `POST /api/v1/people/me/training/:id/complete`

The read routes require `self:read`; the two self-mutations require `self:write` (they only ever touch the caller's own rows). Surfaced in the web app at **My Compliance**.

## HR / compliance features

- **Lifecycle**: `invited → active → suspended → offboarded`. `invited→active` seeds the onboarding checklist; `→offboarded` seeds the offboarding checklist **and revokes the person's devices** (offboarded people also can't log in, since `completeLogin` only admits `active`/`invited` people).
- **Background checks** (`BackgroundCheck`, many per person — history): type, status, provider, expiry, adverse-findings flag. A check transitioning to `cleared` emits advisory Evidence. A scheduled sweep expires past-due checks.
- **Onboarding / offboarding checklists** (`PersonChecklistItem`): templated, idempotently seeded on transitions; completing the full offboarding set emits advisory Evidence.
- **Rollup / readiness**: each person's device posture, training %, policy-ack %, and latest background-check status compose into a `readiness` signal (`ready` / `at_risk` / lifecycle status), computed on read and batched.

### Advisory evidence (never auto-approved)

HR milestones map to framework requirements and land as advisory Evidence in `pending_review` via the same shared writer the device agent uses — honoring the advisory-never-auto-mutate contract.

| Event                    | Framework refs                               |
| ------------------------ | -------------------------------------------- |
| Background check cleared | ISO 27001:2022 **A.6.1** (screening)         |
| Training completed       | ISO **A.6.3** + SOC 2 **CC1.4** (awareness)  |
| Offboarding completed    | ISO **A.6.5** (termination responsibilities) |

If the tenant hasn't adopted a mapped control, the emit is a silent no-op (same as the device path).

## Associations (what the device UI plugs into)

- `Device.personId` — set at enrollment by resolving the enrolling user → their Person (auto-created if missing).
- `Asset.assignedPersonId` — the Computer asset for a device points at the same Person (additive; `Asset.ownerId` still holds the User-level owner).

The device list shows each device's assigned person; the Person profile's **Devices** tab shows their fleet posture. See [`device-agent.md`](device-agent.md).

## Vendor contacts as People (EE adjacency)

A `VendorContact` can be **promoted to a Person** (`kind = vendor_contact`, linked via `Person.vendorId`) so the contact can be background-checked, acknowledge policies, and take training like staff. From the vendor detail page, use "Vet as person" on a contact (requires `people:write`).

## Directory sync (EE)

Entra / Google Workspace directory sync upserts **People** (not memberships): it creates/updates a Person with the group-mapped role, links the `userId`, and suspends People whose external mapping disappeared. Keyed off `ExternalIdentityMapping`. See [`auth-providers.md`](auth-providers.md).

## API summary (`/api/v1/people`)

| Method | Path | Scope |
| --- | --- | --- | --- |
| GET | `/` | `people:read` — list + readiness rollup, filters (status/kind/role/department/search) |
| GET | `/stats` | `people:read` |
| GET | `/:id` | `people:read` — full profile (devices, assets, checks, checklist, training, policies) |
| POST | `/` | `people:write` — create a login-less person |
| POST | `/invite` | `people:write` — create a person with a login |
| PATCH | `/:id` | `people:write` — edit HR fields |
| PATCH | `/:id/role` | `people:write` — change role (owner-protected) |
| POST | `/:id/status` | `people:write` — lifecycle transition (seeds checklists / offboards) |
| DELETE | `/:id` | `people:write` (owner-protected) |
| POST | `/from-vendor-contact/:contactId` | `people:write` — promote a vendor contact |
| GET/POST/PATCH | `/:id/background-checks[/:checkId]` | `people:*` |
| GET/POST | `/:id/checklist[/seed | /:itemId/complete]` | `people:*` |
| GET/POST | `/me/*` | `self:read` / `self:write` |

The legacy `GET/PATCH/DELETE /api/v1/organizations/members[...]` endpoints are retained for backward compatibility and are now **Person-backed**; the canonical surface is `/api/v1/people`.
