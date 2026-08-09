## Gap Analysis (legacy Smart-main vs current project)

Audited legacy `admin.html / teacher.html / student.html` sidebars, all `js/*.js` renderers, `supabase-schema.sql` and `live_proctoring_db_updates.sql` against `src/routes/{admin,teacher,student}/*` and `src/config/navigation.ts`.

### Missing pages per role

| Role    | Missing (legacy `data-page`) |
| ------- | ---------------------------- |
| Admin   | `courses`, `reports`, `invites`, `support`, `live-proctoring`, `violations`, `broadcasts` |
| Teacher | `certificates` |
| Student | `certificates`, `progress` |

### Missing infrastructure

- **Live Proctoring engine** (`js/proctor-engine.js`, 2.3k LoC) + admin live monitor + `get_active_proctored_sessions()` RPC + `violations` table.
- **Certificates**: table, issuance, student wall, public verify.
- **Study progress**: `study_sessions` table, focus timer, study charts.
- **Topics** (curriculum grouping under courses).
- **Discussion views** (`discussion_views` — unread badges).
- **Invites / Support tickets / Broadcasts**: tables exist, admin UIs do not.
- **Reports**: admin saved-report views.
- **PWA**: `manifest.json` + `sw.js` (offline shell, push display).

---

## Implementation Plan

Additive only. Every page is a new file under `src/routes/<role>/`. Every backend surface is a new server function + service + DB module routed through the existing `provider.server.ts` seam. No renames, no signature changes to shipped code.

### Phase 0 — Schema (single migration)

New tables, each with `GRANT` + `ENABLE RLS` + policies using existing `has_role` / `is_course_teacher` / `is_teacher_of_student` helpers:

- `certificates` (user_id, course_id, code, issued_at, revoked_at, pdf_url)
- `violations` (session_id, user_id, assessment_id, assessment_type, severity, kind, payload, timestamp)
- `study_sessions` (user_id, course_id, started_at, ended_at, focus_seconds, idle_seconds)
- `topics` (course_id, title, order_index) + nullable `lessons.topic_id` FK
- `discussion_views` (discussion_id, user_id, last_viewed_at) — composite PK
- RPC `get_active_proctored_sessions()` ported from the legacy SQL

Policies: students read own; teachers read their courses'; admins full.

### Phase 1 — Domain / service / DB modules

```text
src/lib/database/  certificate.db.server.ts, proctoring.db.server.ts,
                   study.db.server.ts, curriculum.db.server.ts,
                   discussion-views.db.server.ts
src/lib/domain/    certificate.domain.ts, proctoring.domain.ts, study.domain.ts
src/lib/services/  certificate, proctoring, study, curriculum,
                   ticket, broadcast, invite, report  (.service.ts)
```

`services/index.ts` and `service-registry.ts` gain append-only re-exports.

### Phase 2 — Server functions

New `src/lib/api/*.functions.ts`: `certificates`, `proctoring`, `study`, `reports`, `tickets`, `broadcasts`, `invites`. All use `.middleware([requireSupabaseAuth])` plus a role check; none are called from public-route loaders. Public cert verification lands at `src/routes/api/public/v1/certificates/verify.ts` (code lookup only, no PII).

### Phase 3 — Live proctoring port

`js/proctor-engine.js` → `src/lib/proctoring/engine.ts` (TypeScript):

- Keeps the inline-worker pattern — edge/worker-safe, no native deps.
- Batches violations through the existing `task-queue.ts`.
- Wires into `useAntiCheat` via a new optional prop; default preserves current behavior exactly.
- `src/components/system/LiveProctoringConsole.tsx` for the admin monitor.

### Phase 4 — New routes

```text
admin/    courses.tsx  reports.tsx  invites.tsx  support.tsx
          live-proctoring.tsx  violations.tsx  broadcasts.tsx
teacher/  certificates.tsx
student/  certificates.tsx  progress.tsx
```

Each uses the existing role `route.tsx` shell (no layout changes), sets its own `head()`, and follows the project's `ensureQueryData` + `useSuspenseQuery` data contract with existing shadcn / `ui-legacy` components.

### Phase 5 — Navigation

One append-only edit to `src/config/navigation.ts` adding the new items with `permission` gates. The RBAC filter already handles visibility; no component changes.

### Phase 6 — PWA parity

`public/manifest.webmanifest` linked from `__root.tsx` head; `public/sw.js` registered from the client entry, production + secure-origin guarded. Existing `usePushNotifications` untouched.

### Phase 7 — Verification

- `bunx tsgo --noEmit` after every phase.
- Playwright smoke per role: click every new sidebar entry, screenshot, assert no console errors and non-empty content.
- Regression pass: `/student`, `/teacher`, `/admin` plus two existing leaves each, compared against a pre-change baseline.

---

## Zero-regression guarantees

- No shipped file renamed, moved, or changed in exported signature. Edits limited to `src/config/navigation.ts`, `src/lib/services/index.ts`, `service-registry.ts` (all append-only) and `__root.tsx` (one `<link>`).
- All new backend access flows through `getDatabase()` / `getStorage()`, keeping the provider-swap seam clean.
- Every new table ships GRANTs + RLS in the same migration.
- New engine code is worker/edge-safe: no `child_process`, `sharp`, or native modules.

## Order of execution

Phase 0 → 1 → 2 → 5 (nav, pages still stubs) → 4 (admin, then teacher, then student) → 3 → 6 → 7.

## Three defaults to confirm

1. **Certificate PDFs** — client-side `jspdf` (no secret, no cold start) rather than a hosted HTML-to-PDF API.
2. **Live proctoring updates** — 5s polling first, Supabase Realtime as a later upgrade.
3. **`violations` vs existing `anti_cheat_logs`** — keep both; the engine dual-writes for one release, then `anti_cheat_logs` reads are deprecated.
