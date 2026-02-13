# AI Mirror — Emotional Regulation Assistant (V1)

Minimal MVP web app that acts as a calm cognitive mirror for urge loops, mental overwhelm, and self-doubt.

- **Not therapy. Not medical advice.**
- **No accounts, analytics, or tracking.**
- Built with **Next.js (App Router)**, **TypeScript**, **OpenAI API**, and **Zod**.

## Running locally

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set:

```bash
OPENAI_API_KEY=your-key-here
```

3. Start the dev server:

```bash
npm run dev
```

The app will be available on `http://localhost:3000`.

## Railway deployment

Railway should:

- Detect this as a Node app.
- Run `npm run build` for the build step.
- Run `npm start` for the start step.

`npm start` runs:

```bash
next start -p $PORT
```

so the app listens on `process.env.PORT`, as required by Railway.

Set environment variables in Railway:

- `OPENAI_API_KEY`

## API

- `POST /api/chat`
  - Request body validated with Zod.
  - Routes requests through OpenAI with a structured system prompt.
  - Classifies messages into `URGE_LOOP`, `OVERWHELM`, `SELF_DOUBT`, or `OUT_OF_SCOPE`.
  - Performs basic keyword-based crisis detection and returns a crisis-safe response when needed.

