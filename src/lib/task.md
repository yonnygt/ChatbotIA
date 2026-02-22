# Multi-User Concurrency Fixes

- [x] Create `src/lib/rate-limit.ts` — in-memory sliding-window rate limiter
- [x] Modify `src/app/api/chat/route.ts` — rate limit + dedup + timeout
- [x] Modify `src/app/api/voice/transcribe/route.ts` — rate limit + size cap + timeout
- [x] Modify `src/lib/db.ts` — configure connection pool max/timeout
- [x] Modify `src/lib/providers.tsx` — increase polling interval + visibility API
