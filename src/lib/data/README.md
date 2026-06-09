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