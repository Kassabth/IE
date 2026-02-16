# AI Mirror — Project Architecture

## High-level stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Runtime     | Node.js (Railway)                    |
| Framework   | Next.js 14 (App Router)              |
| Language    | TypeScript                           |
| API         | OpenAI Chat Completions (GPT-4.1-mini) |
| Validation  | Zod                                  |
| Styling     | Plain CSS (no UI framework)          |

The app runs as a **single Node process**: `next start -p $PORT`. No serverless; all API routes run in that process.

---

## Directory structure

```
IE-InnerEnterprise/
├── app/                    # Next.js App Router
│   ├── api/chat/
│   │   └── route.ts         # POST /api/chat — only API endpoint
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout + metadata
│   └── page.tsx             # Single-page chat UI (client component)
├── lib/                     # Shared logic (no React)
│   ├── openai.ts            # OpenAI client singleton
│   ├── prompt.ts            # System prompt for the model
│   ├── safety.ts            # Crisis detection + bucket labels
│   ├── schemas.ts           # Zod schemas for API
│   └── types.ts             # Shared TypeScript types
├── next.config.js
├── package.json
├── tsconfig.json
└── .env                     # OPENAI_API_KEY (not committed)
```

- **`app/`** — Routes and UI. `app/page.tsx` is the only page; `app/api/chat/route.ts` is the only backend route.
- **`lib/`** — Pure logic: validation, safety, prompts, OpenAI client. Structured so you can later add a `lib/db/`, `lib/stripe/`, etc., without touching the API surface.

---

## Request flow (chat)

1. **User** types a message and submits the form in `app/page.tsx`.
2. **Frontend** sends `POST /api/chat` with body:  
   `{ messages: [{ role, content }, ...] }`  
   (full conversation history; 1–20 messages, validated by Zod).
3. **`app/api/chat/route.ts`**:
   - Validates body with `chatRequestSchema` (Zod). Returns 400 if invalid.
   - Takes the latest user message and runs **crisis check** (`lib/safety.ts`): keyword-based detection (e.g. self-harm, suicide). If triggered, returns a fixed crisis response and **does not** call OpenAI.
   - Builds the message list: `[system prompt, ...messages]`. System prompt lives in `lib/prompt.ts` and defines the “AI Mirror” behavior and the three buckets (URGE_LOOP, OVERWHELM, SELF_DOUBT).
   - Calls **OpenAI** via `lib/openai.ts`: `gpt-4.1-mini`, temperature 0.35, `response_format: { type: 'json_object' }`. The model is instructed to return JSON: `{ bucket, crisis, response }`.
   - Parses the JSON and re-validates with Zod. On parse failure, returns a safe fallback message.
   - Returns `{ bucket, crisis, response }` to the client.
4. **Frontend** appends the assistant message (with optional bucket/crisis pill) to the UI state. No persistence; everything is in React state for V1.

So: **Browser → Next.js API route → (optional crisis short-circuit) → OpenAI → validate → JSON response → Browser.**

---

## Key modules

### `lib/openai.ts`

- Creates a single `OpenAI` client using `process.env.OPENAI_API_KEY`.
- Throws at import/build time if the key is missing (so Railway build fails fast if the env var isn’t set).

### `lib/schemas.ts`

- **`chatMessageSchema`** — one message: `role` ('user' | 'assistant' | 'system'), `content` (1–4000 chars).
- **`chatRequestSchema`** — body of `POST /api/chat`: `messages` array (1–20 messages).
- **`bucketEnum`** — Zod enum for the four buckets (including `OUT_OF_SCOPE`).

Used in the route for request validation and for validating the model’s JSON response.

### `lib/safety.ts`

- **`isCrisis(text)`** — returns true if the text contains any of a fixed list of crisis-related phrases (e.g. suicide, self-harm). Used before calling OpenAI to avoid ever sending crisis content to the model for “advice”; we always return the same crisis resource message.
- **`bucketLabel(bucket)`** — maps bucket enum to human-readable label for the UI (e.g. “Urge loop”, “Mental overwhelm”).

### `lib/prompt.ts`

- **`SYSTEM_PROMPT`** — single long string that defines:
  - Role: cognitive mirror, not therapist/doctor.
  - Philosophy: slow down, name state, separate feeling from action, one small next step, autonomy.
  - The three supported buckets and how to respond (urge loop, overwhelm, self-doubt).
  - Out-of-scope: redirect or suggest grounding.
  - Safety: do not try to fix crisis; encourage real-world support.
  - Output format: strict JSON `{ bucket, crisis, response }` with constraints on length and structure.

The model is instructed to classify into one of the four buckets and to keep answers short and concrete.

### `lib/types.ts`

- **`Bucket`** — union of the four bucket literals.
- **`ChatMessage`** — role + content (matches API and UI).
- **`ClassifiedResponse`** — what the API returns: `bucket`, `crisis`, `response`.

Used by the route and the frontend so types stay aligned with the API contract.

---

## Data flow summary

- **No database** — conversations are not stored; they exist only in the client’s React state and in the request/response to `/api/chat`.
- **No auth** — anyone with the URL can use the app. No user identity.
- **Secrets** — only `OPENAI_API_KEY` is required; it is read from `process.env` (e.g. Railway Variables or local `.env`).

This keeps V1 minimal and makes it straightforward to add later: Postgres (e.g. Railway), user sessions, Stripe, or in-memory/DB-backed rate limiting (see TODO in `app/api/chat/route.ts`).

---

## Deployment (Railway)

- **Build**: `npm run build` — Next.js builds the app; at build time, `OPENAI_API_KEY` must be set so `lib/openai.ts` does not throw.
- **Start**: `npm start` → `next start -p $PORT` — single Node process listening on Railway’s `PORT`.
- **Config**: `next.config.js` uses `output: 'standalone'` for a self-contained deployable output. No Vercel-specific or serverless config.

---

## Future-proofing (not implemented)

The layout is prepared for, but does not include:

- **Database** — e.g. `lib/db/` for Postgres; could store threads or user state.
- **Sessions / auth** — no cookies or JWT yet; adding auth would likely sit in middleware or the route and not change the `lib/` structure.
- **Stripe** — could live under `lib/stripe/` and be called from a future billing route.
- **Rate limiting** — placeholder TODO in `app/api/chat/route.ts`; implementation could be Redis or DB-backed.
- **Memory / state** — e.g. “last time you said…” would be a small extension of the `messages` array (and optionally persisted in a DB).

All of these can be added without changing the core flow: **client → Zod-validated POST /api/chat → optional crisis short-circuit → OpenAI with system prompt → validated JSON response.**
