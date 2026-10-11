## Legacy vs current: missing features and regressions

Compared every sidebar page in `admin.html`, `teacher.html` and `student.html` (plus `js/*.js`, `api/*.js` and the `*.sql` files) with the current routes.

### Missing pages
| Role | Page | Notes |
|---|---|---|
| Student | AI Tutor ("Kofi") | Course picker plus a chat tutor. Nothing like it exists today |
| Teacher | Live Proctoring | Live sessions, a stream of violations, live feed, export. Only admins have this now |

### Regressions per page
**Student**
- Grades: no PDF export.
- Analytics: no AI assistant that explains your performance.
- Live classes: legacy opened the meeting inside the app (with a "waiting for host" screen and join/leave attendance). The current app only opens a new tab.
- Assignments: read-only behaviour for archived courses needs checking.

**Teacher**
- Assignments and Quizzes: no grid/table toggle and no due or start countdowns. Quizzes also has no results view.
- Grading: no filter by assignment, no debounced student search, no pagination and no regrade-request badges.
- Analytics: no attendance heatmap, no semester filter and no intervention or assessment cards.
- Students: CSV/PDF export, the "issue certificate" shortcut and unenrol still need checking.
- Live classes: moderation tools (mute all, lobby, restrict video) still need checking.
- Dashboard: stat cards don't link to their pages.

**Admin**
- Dashboard: shows a small set of figures instead of the 16-figure grid. No quick-broadcast box and no API success rate.
- Courses: can't change a course's teacher.
- Users: no lock for 30 minutes or 24 hours, no unlock, no flag and no CSV export (still to be confirmed).
- Maintenance: no scheduled maintenance windows.
- Management: database cleanup (preview, then purge) and backup/restore are missing. The current buttons look like they work but don't do anything.
- Reports: no PDF export and no certificate actions inside reports.
- Live Proctoring: no live-feed window, settings window or report export.

**Cross-cutting**
- No app-wide connection monitor or offline banner. Only proctoring evidence has an offline queue.
- No voice input or read-aloud (legacy `voice-engine.js`).
- No AI gateway or knowledge base (`knowledge_embeddings`, `match_knowledge`, material indexing locks).
- Missing database features: analytics summaries (`get_course_analytics_summary`, attendance heatmap, learning gaps), `purge_expired_records`, and the notification triggers.

Superseded on purpose, so nothing to do: legacy custom auth RPCs (replaced by the current auth), and the legacy Help/Settings/System stubs (the current pages are fuller).

---

## Staged plan

Every stage follows the existing chain: `api-actions -> /api/v1/* -> service -> domain -> db.server -> provider seam`. Each feature gets its own folder with a barrel export, nav comes from `navigation.ts`, and pages use loader + `useSuspenseQuery`. Changes are additive only.

### Stage 1: Shared building blocks (enables later stages)
- `src/components/common/ViewToggle.tsx` and a `useViewMode(key)` hook (saved per page) for the grid/table toggle.
- `src/components/common/DataToolbar.tsx`: search (debounced), filters, pagination and export. It reuses `report-utils.ts`.
- `src/lib/export/` to centralise CSV and PDF export (wraps jspdf and the existing report-utils).
- `src/lib/network/` + `NetworkStatusBanner` in the dashboard layout: online/offline status, latency checks, and reuse of the backoff queue pattern from `evidence-queue.ts`.

### Stage 2: Teacher list regressions
- Assignments and Quizzes: view toggle and countdowns using the existing `Countdown`. Add a quiz results view.
- Grading: assignment filter, search, pagination and regrade badges, all through `DataToolbar`.
- Students: confirm and fill in export, the issue-certificate shortcut and unenrol.
- Dashboard: stat cards link to their pages.

### Stage 3: Admin operations
- Courses: "Change owner" dialog (service method plus RBAC `course:manage`).
- Users: lock 30 minutes or 24 hours, unlock, flag and CSV export (new `locked_until` and `flagged` columns if they're missing).
- Dashboard: fuller set of figures from one stats query, plus a quick-broadcast box that reuses `BroadcastManager`.
- Maintenance: scheduled windows saved in `system_settings`.
- Management: cleanup with preview, then purge (server-side `purge_expired_records`, admin only), and a JSON backup export and restore of app tables. Remove the buttons that do nothing.
- Reports: PDF export through `src/lib/export`.

### Stage 4: Proctoring parity
- New `teacher/live-proctoring.tsx` that reuses `LiveProctoringConsole`, limited to the teacher's own courses. Nav entry gated by a new `proctoring:monitor` permission.
- Add a live-feed window, a settings window and report export to the console for both roles.

### Stage 5: Analytics depth
- Database functions: course analytics summary, attendance heatmap and learning gaps, each with RLS and security definer and a pinned search path.
- Teacher Analytics: semester filter, heatmap and intervention cards. Student Grades: PDF export.

### Stage 6: Live classes in the app
- Embedded meeting view (Jitsi iframe) with a "waiting for host" screen, join/leave attendance and teacher moderation controls. The new-tab option stays as a fallback.

### Stage 7: AI Tutor (Kofi) and voice
- Lovable AI through a server function, so no API key is needed. `src/lib/ai/` holds the prompts, conversation storage and course context.
- Knowledge base: `knowledge_embeddings` with pgvector, a material indexing job with locks, and `match_knowledge`.
- New `student/ai-tutor.tsx`, plus an assistant panel on Student Analytics.
- Voice: browser speech-to-text and read-aloud in `src/lib/voice/`, opt-in.

### Stage 8: Verification
- Typecheck after each stage. A Playwright smoke test per role that clicks every sidebar entry. Signed-in checks for each new flow.

## Decisions to confirm
1. Teacher live proctoring: should teachers see only their own courses?
2. Backups: download/upload as a JSON file, or saved in the app's file storage?
3. AI Tutor: build it now (it uses AI credits), or leave it to last as planned?
