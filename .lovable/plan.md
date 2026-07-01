## Scope

Three independent tracks delivered in one pass.

---

### Track A — Step 4: Migrate to shadcn `ui/sidebar`

Replace the bespoke `ui-legacy/Sidebar.tsx` + `UnifiedSidebar` overlay with the shadcn `ui/sidebar` primitive (already installed). Keeps the existing config-driven nav from `src/config/navigation.ts` and RBAC filter.

- Rewrite `src/components/common/UnifiedSidebar.tsx` around `<Sidebar collapsible="icon">`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton asChild` wrapping TanStack `<Link>`.
  - Active state via `useRouterState({ select: s => s.location.pathname })` and `isActive` prop.
  - Mobile sheet + desktop rail come for free from shadcn (offcanvas on mobile, icon collapse on desktop).
- Rewrite `src/components/layout/BaseDashboardLayout.tsx`:
  - Wrap the layout in `<SidebarProvider>` (controlled via existing `isSidebarOpen` from `AppContext`, mapped to `open`/`onOpenChange`).
  - Replace the manual `lg:ml-[240px]` margin with `<SidebarInset>` so content reflows with collapse.
  - Drop the old `onClose` overlay; sheet handles itself.
  - Surface a `<SidebarTrigger />` in the header area so users can re-open after collapse.
- Pass `SidebarTrigger` ref through `DashboardHeader` (small prop addition) so the existing menu button uses the shadcn trigger semantics.
- Delete `src/components/ui-legacy/Sidebar.tsx` and remove its `index.ts` re-export.
- Verify with `tsc --noEmit` and a browser screenshot of one dashboard route.

### Track B — Step 5: Audit & route legacy code through the provider seam

Goal: make `src/lib/data/provider.server.ts` (Database/Storage) the single seam, so swapping Supabase → Oracle Cloud Infrastructure is one adapter file + zero call-site edits.

Current leakage (confirmed by `rg`):
- `src/lib/database/*.db.ts` (4 files) import `@/lib/supabase` and `@/lib/supabase-admin` directly.
- `src/lib/services/*.service.ts` (4 files) compose those db modules; some also touch supabase directly.
- `src/routes/api/v1/system.ts` imports `@/lib/supabase`.

Approach (minimal-risk, no behaviour change):
1. **Mark seams explicitly.** `src/lib/supabase.ts` and `src/lib/supabase-admin.ts` become server-only by renaming to `*.server.ts`:
   - `src/lib/supabase.server.ts`, `src/lib/supabase-admin.server.ts`
   - Bundler then blocks any accidental client import; today they ride the client graph through `src/lib/database/*` because nothing forces them server-side.
2. **Rename `src/lib/database/*.db.ts` → `src/lib/database/*.db.server.ts`** so the entire legacy DB layer is provably server-only. Update internal imports.
3. **Re-point service callers**: `src/lib/services/*.service.ts` keeps its current API surface but now its DB calls go through a thin adapter shim. Two ways the seam is honored:
   - Direct `*.db.server.ts` calls stay (server-only) — acceptable because they sit behind services and never reach the client graph.
   - New code (and the Oracle migration path) MUST use `getDatabase()` / `getStorage()` from `src/lib/data/provider.server.ts`. Add an ESLint rule (or a README enforcement note + a CI grep) banning new imports of `@/lib/supabase*` outside `src/integrations/supabase/`, `src/lib/data/adapters/`, and `src/lib/database/*.server.ts`.
4. **Fix the one client-graph leak**: `src/routes/api/v1/system.ts` already runs server-side (it's a route handler), so the rename to `*.server.ts` imports satisfies the boundary automatically — no behaviour change.
5. **Document the seam** in `src/lib/data/README.md` with a one-page "swap to OCI" recipe: copy `adapters/supabase.server.ts` → `adapters/oci.server.ts`, implement Database+Storage against the OCI SDK, swap two imports in `provider.server.ts`. Mark the legacy `database/*.server.ts` as "frozen — port to provider on next touch."

Out of scope (next pass): migrating individual `*.db.server.ts` queries onto `getDatabase().find/insert/...` — large mechanical refactor, deferred so we don't conflate it with the sidebar + deploy work. The seam is then truly call-site-free.

### Track C — Vercel deployment readiness

Current target is Cloudflare Workers (`vite.config.ts` uses `@lovable.dev/vite-tanstack-config` which builds via nitro → cloudflare). Vercel needs the nitro Vercel preset and a small entry change.

- **`vite.config.ts`**: pass through `nitro: { preset: "vercel" }` (or `vercel-edge` if we want edge functions). Default to `vercel` (Node runtime) — broader compat with Supabase auth flows and avoids the Worker-only quirks already documented in `server-runtime`.
- **`src/server.ts`**: the current Cloudflare-style `export default { fetch }` Worker entry is incompatible with Vercel's Node handler. Replace with the standard TanStack Start server entry, keeping the error-capture wrapper but exporting in the shape nitro's vercel preset expects (default export of a Node `RequestListener` produced by `toNodeListener(handler)`).
- **`package.json`**:
  - Add `"engines": { "node": ">=20" }` (Vercel needs the runtime declared).
  - Confirm `build` outputs `.vercel/output` (nitro vercel preset does this automatically).
- **`vercel.json`** (new): minimal — `{ "framework": null, "buildCommand": "bun run build", "outputDirectory": ".vercel/output" }`. No rewrites needed (nitro generates them).
- **Env vars**: document the required Vercel project envs:
  - Server: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
  - Add a `.env.vercel.example` listing them.
- **`.gitignore`**: add `.vercel/`.
- **README**: add a "Deploy to Vercel" section with the env list and the build command.
- **Sanity check**: run `bun run build` locally and confirm `.vercel/output/` is produced with `config.json` + `functions/`.

Caveats called out up front:
- Lovable's hosted preview still uses Cloudflare; the Vite plugin is owned by `@lovable.dev/vite-tanstack-config` and may override the `nitro.preset` option. If override wins, the fallback is a documented `VERCEL=1 vite build --mode production` flag with a small `vite.config.vercel.ts` that re-exports the base config with the preset forced. We'll detect this at build time and pick the working path.
- Switching to Vercel does NOT change how Lovable Cloud (Supabase) is used — the same envs, same RLS, same auth flow.

---

## Order of operations

1. Track A (sidebar) — isolated, low risk, visible win.
2. Track B (seam audit + renames) — pure refactor, no behaviour change, sets up future OCI swap.
3. Track C (Vercel) — config + entry rewrite, verified with a local build.

Each track ends with `bunx tsc --noEmit` and (for A) a screenshot.

## Open question

Track C: do you want **Vercel Node runtime** (default I'll use — best compat) or **Vercel Edge runtime** (faster cold starts, but Supabase admin + some Node APIs are restricted)? I'll proceed with Node unless you say otherwise.
