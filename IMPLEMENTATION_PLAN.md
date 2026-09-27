# Implementation Plan — NEW-CONVERT-FOLLOW-UP-APP

> Source: `New_Convert_Followup_Attendance_App_PRD.docx` (50 sections)
> Promise: Every person is seen. Every person is assigned. Every person is followed up. Every person has a next step.
> Workflow: REGISTER → ASSIGN → CONTACT → RECORD → SCHEDULE → ATTEND → MONITOR → RE-ENGAGE → INTEGRATE → RETAIN

Local folder: `C:\Users\HomePC\Desktop\NEW CONVERT FOLLOW-UP AND ATTENDANCE APP`
Repo: `https://github.com/aladeaji/NEW-CONVERT-FOLLOW-UP-APP`

---

## 1. Architecture decisions

### 1.1 Stack (MVP — local-first, no Supabase, no Vercel)
- **App:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui as PWA (mobile-first, installable on workers' phones)
- **DB:** PostgreSQL 16 on local device, ORM: Prisma. Run via Docker Compose (`postgres:16-alpine`, persisted volume) or native Postgres install. GUI optional: DBeaver / pgAdmin. No Supabase.
- **Auth:** BetterAuth (Prisma adapter, email+password; `admin` plugin for roles, `phone-number` plugin optional). Session in Postgres. No Supabase Auth.
- **Storage:** Cloudflare R2 (S3-compatible via `aws-sdk` S3 client). Buckets: `app-uploads` (profile photos, attachments). Presigned URLs for upload/download.
- **Hosting:** Local device (Windows). `next build && next start` on `http://localhost:3000`, exposed on LAN via device IP + firewall rule; optional `pm2` / NSSM service + Caddy reverse proxy. Backups: `pg_dump` scheduled task.
- **Comms (MVP):** `tel:` / `wa.me:` / `sms:` deep links only. No messaging platform.

Rationale: one codebase serves admin dashboards + worker mobile; fastest path to reports; low ops for churches. Native mobile deferred post-MVP.

### 1.2 Architecture style
- Modular monolith (Next.js). Modules: `people, assignment, followup, attendance, groups, workers, pastoral, reports, alerts, storage`.
- Multi-tenancy ready: every row carries `churchId`; `branchId` nullable.
- Timeline = immutable event log. Every register/assign/contact/attend/stage-change/pastoral action appends `ActivityEvent`. Profile timeline is a read view. Reassignment never deletes history.
- Derived, not stored: `attentionStatus` (On Track / Due / Overdue / Needs Attention / Unresponsive / Lost / Pastoral) and `attendanceSignal` (New / Regular / Declining / Missing / Re-engagement Needed) computed server-side.
- RBAC: Super Admin > Church Admin > Coordinator > Worker (assigned-people scope) > Pastor/Leadership (read + pastoral cases). Implemented via BetterAuth `admin` plugin + `role`/`banned` fields on User + server-side guards in middleware + Prisma filters.
- R2 storage: S3 client (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`); uploads via presigned PUT, served via presigned GET or public bucket URL; file keys namespaced `churchId/personId/...`.
- Attendance signal engine v1 (explainable rules): e.g. regular 4 weeks then missed 2 expected services → `Attendance Concern` → auto-creates `Follow-up Due`.

### 1.3 Data model (MVP — Prisma + local Postgres + BetterAuth tables)
```
Church(id, name, settings)
User(id [BetterAuth], churchId, role, name, email, phone, active) + BetterAuth tables: Session, Account, Verification
Person(id, churchId, branchId?, fullName, phone [unique per church], personType[new-convert/first-time/returning/member], visitDate, ageGroup, gender, area, howCame, fellowshipId?, photoKey? [R2], journeyStage, nextAction, nextFollowUpAt, assignedWorkerId?, createdAt)
Assignment(id, personId, workerId, assignedBy, assignedAt, active)
FollowUp(id, personId, workerId, date, type[call/whatsapp/sms/visit/church-chat/home-visit/invite/prayer/other], outcome, notes, concerns, nextAction, nextDate)
AttendanceService(id, churchId, name, date, kind[sunday/midweek/special/fellowship/class/other])
AttendanceRecord(serviceId, personId, present, recordedBy)
Group(id, churchId, kind[fellowship/class/dept], name) + Membership(personId, groupId)
PastoralCase(id, personId, raisedBy, reason, status, resolution)
ActivityEvent(id, personId, actorId, type, payload, at)
```

---

## 2. Design system

Principles: Simple, Action-Before-Information, People-not-Numbers, No-fall-through-cracks.

- **Tokens:** Inter font; neutrals + primary navy `#1A2B4A`; success green, warn amber, danger red (overdue/pastoral only); 10px radius; 4pt spacing.
- **Components (shadcn-based):** TodayCard, AttentionBadge, PersonCard, QueueTable, Timeline, NextActionInput, AttendanceChecklist, StageStepper, EmptyState, ConfirmReassign.
- **Navigation:** Today, People, Follow-ups, Attendance, Workers, Groups, Reports, Alerts, Settings. Workers see reduced: Today → My People → Follow-up → Attendance.
- **Home:** answers "WHO NEEDS MY ATTENTION TODAY?" with counts + actionable lists, no decorative charts. 44px touch targets, offline-tolerant forms.

---

## 3. Phased build

### Phase 0 — Repo & foundations (0.5 wk)
Scaffold Next.js+TS+Tailwind+shadcn+Prisma+BetterAuth+R2 client, `docker-compose.yml` (postgres:16-alpine + volume), ESLint/Prettier, `.env.example` (`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/followup`, `BETTER_AUTH_SECRET`, `R2_*`), seed script.
Done when: `docker compose up -d && npx prisma migrate dev && npm run dev` works on `http://localhost:3000`.

### Phase 1 — Auth, roles, church setup, onboarding
BetterAuth email+password (+ optional phone-number plugin), setup wizard: church setup → add admins → add workers → stages → groups → import (optional) → register. Role guards + scoped queries.
Acceptance: admin adds workers; worker logs in to empty Today.

### Phase 2 — People
Short registration, duplicate check (name+phone) before save, central profile (Personal / Follow-up / Attendance / Connection / Care), search (name/phone/worker/location) + filters (type/stage/status/worker/attendance/date/fellowship).
Acceptance: register in <60s, duplicate warning works, permanent profile created.

### Phase 3 — Assignment
Manual + recommended assign (location/age/language/fellowship/workload), Unassigned Queue (count + wait-time + urgency), reassign with history intact, workload-cap warning.
Acceptance: assign John→Peter, Peter sees instantly, reassign keeps timeline, unassigned always visible.

### Phase 4 — Follow-up engine
Journey stepper (Registered → Assigned → First Contact → Engaging → Attending → Growing → Connected → Integrated → Active Member), activity form (date/type/outcome/notes/concerns/nextAction/nextDate), due-today/upcoming/overdue/awaiting-first-contact lists, call/WhatsApp/SMS links.
Acceptance: record contact + outcome + next date; due/overdue correct; stage changes reflected.

### Phase 5 — Attendance + signal → follow-up
Service CRUD, individual + group checklist entry (bulk post-MVP), per-person history + pattern, nightly signal job → auto attention item.
Acceptance: record Sunday; missing 2x after regular → Attention "may need follow-up"; worker resolves with contact record.

### Phase 6 — Dashboards + alerts + pastoral
Worker Today (due/overdue/new-awaiting/concerns + My People + Recent). Admin health (new/unassigned/due/overdue/attention/declining/regular/progressing/integrated). Pastoral queue + leadership action log. In-app notifications for key events.
Acceptance: counts match queries; pastoral flag visible to leadership.

### Phase 7 — Workers & groups
Add/deactivate workers, workload + overdue-per-worker views, groups (fellowship/class/dept) + membership. Default small-church structure; branch fields stubbed.

### Phase 8 — Reports & metrics
New People, Follow-up (completed/due/overdue/outstanding), Attendance (totals/trends/declining/missing), Retention/Progression funnels, CSV export. North star: Meaningfully Connected People.

### Phase 9 — Hardening + release gate
Playwright E2E for 15-step John→Peter journey; release gate (5 YES); Today <2s @10k people (local Postgres indexed); local backup verified (`pg_dump` restore test) + R2 bucket versioning; audit review. Run via `next build && next start` on host device + LAN test from a phone. No release until gate passes.

### Phase 10 — Post-MVP backlog — do not build in MVP
QR registration, WhatsApp-assisted follow-up, bulk assign/attendance, advanced insights, multi-branch, custom journeys, advanced reporting, imports, broadcast messages, analytics.

---

## 4. Testing / quality bar

Unit (status engine, matcher), integration (assign→notify→timeline), E2E, phone UAT. Every feature must be useful, simple, actionable, measurable, people-centered.

## 5. Order / dependencies

`0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9`. No attendance signals before follow-up engine; no reports before dashboards.
