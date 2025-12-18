# Copilot / AI Agent Instructions for the `pf` project ✅

Purpose
- Give AI agents concise, actionable context to make safe, useful edits and contributions in this codebase.

Big picture (what this project is)
- A small Nuxt 3 (Nitro) frontend + server app demonstrating a Stripe embedded Checkout flow.
- Client: Vue/Nuxt pages in `app/pages` (signup -> plans -> checkout -> return).
- Server: Nitro server routes under `server/api/*` (e.g., `create-checkout-session.post.ts`, `webhook.post.ts`, `session-status.get.ts`, `signup.post.ts`).
- Data: simple local JSON storage for demo users in `.data/users.json` (explicitly ignored by `.gitignore`).

Key files & how they map to behaviors
- `nuxt.config.ts` - runtime config exposed to client under `public`, server-only secrets under top-level keys.
- `server/api/create-checkout-session.post.ts` - builds Stripe Checkout sessions (embedded mode) and returns `client_secret`.
- `server/api/session-status.get.ts` - retrieves a Stripe Checkout session by `session_id` query param and returns status/customer email.
- `server/api/webhook.post.ts` - verifies Stripe signature using `STRIPE_WEBHOOK_SECRET` and logs/handles events.
- `app/pages/*.vue` - UI flows and how they use server endpoints (e.g., `checkout.vue` posts `priceId` to `/api/create-checkout-session`).
- `package.json` - dev/build scripts (`dev`, `build`, `preview`, `postinstall` runs `nuxt prepare`).

Project-specific patterns & conventions
- Environment variables used by runtime config:
  - `STRIPE_SECRET_KEY` (server)
  - `STRIPE_WEBHOOK_SECRET` (server)
  - `STRIPE_PUBLISHABLE_KEY` (client via `public.stripePublishableKey`)
  - `PUBLIC_BASE_URL` (optional; defaults to `http://localhost:3000`) — used to build return URLs for Stripe.
- Stripe integration details:
  - Stripe API version used in server code: `2023-10-16`.
  - Webhook signature verification is required (see `webhook.post.ts`) — when testing locally, use the Stripe CLI and set `STRIPE_WEBHOOK_SECRET` to the secret the CLI provides.
- Demo data conventions:
  - `signup.post.ts` appends plaintext passwords to `.data/users.json` by design for demo only — do NOT convert this to production storage without introducing proper hashing and validation.
  - `.data` is in `.gitignore` — do not commit sensitive test data.
- Checkout flow details:
  - `plans.vue` contains placeholder `priceId` values (e.g., `price_single`) — replace with actual Stripe Price IDs for testing.
  - `create-checkout-session` constructs `return_url` as `${PUBLIC_BASE_URL}/return?session_id={CHECKOUT_SESSION_ID}` — the client reads `session_id` on `/return` to fetch status.

Developer workflows & commands (how to run / test)
- Install deps: `npm install` (alternatives kept in README: pnpm/yarn/bun).
- Dev server: `npm run dev` (defaults to http://localhost:3000).
- Build: `npm run build`; preview: `npm run preview`.
- Post-install: `npm run postinstall` → runs `nuxt prepare`.
- Local Stripe webhook testing (typical flow):
  - Start dev server: `npm run dev`.
  - In another terminal, run Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook` and set `STRIPE_WEBHOOK_SECRET` to the value printed by the CLI.
  - Trigger events (e.g., `stripe trigger checkout.session.completed`) and verify logs in the server.

Notes for the AI agent (do this / avoid doing this)
- Be explicit and conservative when changing security-sensitive code:
  - Highlight any changes to auth, password storage, or secret handling in PR descriptions.
  - Don’t replace the demo plaintext storage with a database implementation without tests and a migration plan.
- Use file references in edits and PRs (e.g., point reviewers to `server/api/webhook.post.ts` and `nuxt.config.ts` when touching Stripe-related code).
- Follow existing idioms: use Nitro server handlers (`defineEventHandler`, `readBody`, `getQuery`, `useRuntimeConfig`) rather than inventing new server frameworks.
- Keep UI changes minimal and self-contained in `app/pages/*` and scoped styles; prefer small incremental changes with screenshots or behavior descriptions.

Testing & debugging tips
- No automated tests are present in the repo — add tests in a new PR only when small and focused.
- Use `sourcemap.server` / `sourcemap.client` (enabled in `nuxt.config.ts`) during development for easier stack traces.
- For webhook signature failures, check the raw request body and header `stripe-signature` (see `webhook.post.ts`).

If you make a change, include these in the PR body:
- Which files were changed and why (explicit file paths).
- Any environment variables required for running or testing the change.
- Manual steps to reproduce the flow you changed (e.g., exact Stripe CLI commands used).

Questions / unclear areas
- If you need instructions for CI/deployment specifics (none are present), ask whether we should add GitHub Actions or a deployment guide.

---
If you want, I can open a draft PR that adds or iterates on this file and include a short checklist to help reviewers — would you like me to do that? 🤖