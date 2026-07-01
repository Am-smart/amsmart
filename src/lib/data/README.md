# Data Layer

This folder owns the **only** seam between the application and the underlying
database / file storage. Everything else in the app talks to the abstractions
defined here — never to Supabase, S3, or any other provider directly.

- `Database` (`database.ts`) — generic CRUD + RPC + count.
- `Storage` (`storage.ts`) — upload / download / signed URLs / list.

## Use

```ts
// inside a createServerFn handler or server route only:
import { getDatabase, getStorage } from "@/lib/data/provider.server";

const db = getDatabase();
const users = await db.find("users", { where: { active: true }, limit: 50 });
```

## Swap providers

1. Add an adapter under `adapters/<name>.server.ts` implementing
   `Database` and/or `Storage`.
2. Change the two imports in `provider.server.ts`.

No application code needs to change.

## Layer boundaries (enforced by filename)

Provider-specific modules end in `.server.ts` so the bundler blocks
accidental client imports:

- `src/lib/supabase.server.ts` / `src/lib/supabase-admin.server.ts` — legacy
  Supabase client entries used by `database/*.server.ts`. Do not import from
  `@/lib/supabase*` elsewhere.
- `src/lib/database/*.db.server.ts` — legacy per-domain query modules.
  **Frozen**: no new call sites. Port to `getDatabase()` on next touch.
- `src/lib/data/adapters/*.server.ts` — provider implementations.

### Swap Supabase → Oracle Cloud Infrastructure

1. `cp adapters/supabase.server.ts adapters/oci.server.ts` and reimplement.
2. Update `provider.server.ts` imports/exports to the OCI adapter.
3. Port remaining `database/*.db.server.ts` call sites to `getDatabase()`.

### Vercel deployment

See `.env.vercel.example` and `vercel.json` at the repo root. Build with
`NITRO_PRESET=vercel bun run build`; output in `.vercel/output`.