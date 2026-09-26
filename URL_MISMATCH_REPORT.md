# URL / Domain Mismatch Audit — SpendWise

**Date:** 2026-09-26
**Scope:** `client/` — all application source, config, and static assets
**Reported symptom:** a feedback-request email produced a link on the wrong domain
**Status:** all findings remediated and covered by regression tests

---

## 1. The reported bug, root-caused

`lib/mail.ts` built **every** link in every outbound email from `process.env.NEXTAUTH_URL`:

```ts
<a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/feedback">Share My Experience</a>
```

`NEXTAUTH_URL` is the Auth.js **OAuth callback base**, not a public site URL. It is
`http://localhost:3000` in local dev, and the committed `.env` still carries that value.
Every call site also had a `|| 'http://localhost:3000'` fallback, so a *missing* env var
produced the same broken link.

Result: the "Share Feedback" / "Share My Experience" button in feedback-request emails
pointed at `http://localhost:3000/feedback`. Recipients clicked through to nothing. The
same defect silently affected five other links in the same file, plus group-invite emails.

**Why it was never caught:** there was no single place that owned "what is our URL".
`NEXTAUTH_URL` was used as a general-purpose base URL in 9 places while 20 other files
independently hardcoded `"https://thespendwise.vercel.app"`. Nothing tied the two together,
and no test asserted that a generated link was reachable.

---

## 2. Canonical URL contract

The app is deployed to three origins from one codebase and one database. Two of them
matter for user-facing links, and they are **not** interchangeable:

| Constant | Value | Used for |
|---|---|---|
| `APP_ORIGIN` | `https://money-spend-tracker.vercel.app` | Authenticated routes a signed-in (or soon-to-be-signed-in) user clicks: `/dashboard`, `/settings`, `/feedback`, `/groups/invite/*`, `/api/unsubscribe` |
| `SITE_ORIGIN` | `https://thespendwise.vercel.app` | Public indexable pages: canonical tags, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, `llms.txt` |

`APP_ORIGIN` is correct for app links because it is the **only origin registered in the
Google OAuth console**. `/login` already redirects any non-primary origin there
(`app/login/page.tsx:85-93`) and bridges the session back via `/bridge` → `/auth/bridge`.
A `/feedback` link on any other origin would force a cross-origin bounce for no benefit.

`SITE_ORIGIN` is correct for SEO because announcing the same page on two domains splits
ranking signals and defeats canonicalisation.

### Environment variables that now control this

| Variable | Resolves | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `SITE_ORIGIN` | Preferred. New. |
| `NEXT_PUBLIC_PRODUCTION_LINK` | `SITE_ORIGIN` | Legacy alias, still honoured. |
| `NEXT_PUBLIC_MARKETING_ORIGIN` | `SITE_ORIGIN` | Accepted so the CORS allowlist and SEO cannot disagree. |
| `NEXT_PUBLIC_APP_URL` | `APP_ORIGIN` | Preferred. New. |
| `NEXT_PUBLIC_APP_ORIGIN` | `APP_ORIGIN` | Also feeds the CORS allowlist. |
| `NEXTAUTH_URL` | **nothing in production** | Auth callback base only. Honoured in dev/test **only when loopback**. |

**Single source of truth: `client/lib/site-url.ts`.** No other module may build a
first-party absolute URL by hand. `client/lib/origins.ts` now imports its primary and
marketing origins from this module, so the CORS allowlist, the SEO surfaces, and outbound
email can no longer disagree about which host is which.

---

## 3. Complete mismatch register

Severity: **P0** = users click a dead/wrong link · **P1** = wrong or duplicated canonical
· **P2** = latent fragility · **P3** = cosmetic / verified intentional.

### P0 — Email links built from `NEXTAUTH_URL` (the reported bug)

| # | File | Line | Link | Was | Now |
|---|---|---|---|---|---|
| 1 | `lib/mail.ts` | 172 | `sendFeedbackRequestEmail` → "Share My Experience" | `${NEXTAUTH_URL}/feedback` | `appUrl("/feedback")` |
| 2 | `lib/mail.ts` | 80 | `wrapLayout` footer → "Share Feedback" | `${NEXTAUTH_URL}/feedback` | `appUrl("/feedback")` |
| 3 | `lib/mail.ts` | 82 | `wrapLayout` footer → "Manage Notifications" | `${NEXTAUTH_URL}/settings` | `appUrl("/settings")` |
| 4 | `lib/mail.ts` | 84 | `wrapLayout` footer → "Unsubscribe" | `${NEXTAUTH_URL}/api/unsubscribe?email=…` | `appUrl(\`/api/unsubscribe?email=…\`)` |
| 5 | `lib/mail.ts` | 101 | `sendWelcomeEmail` → "Go to Dashboard" | `${NEXTAUTH_URL}/dashboard` | `appUrl("/dashboard")` |
| 6 | `lib/mail.ts` | 159 | `sendBudgetAlertEmail` → "View Dashboard" | `${NEXTAUTH_URL}/dashboard` | `appUrl("/dashboard")` |
| 7 | `app/api/invitations/send/route.ts` | 73 | Group invite link | `${NEXTAUTH_URL}/groups/invite/${token}` | `appUrl(\`/groups/invite/${token}\`)` |

Finding #1 is what was reported. Findings #2–#7 were the same defect in the same blast
radius: every budget-alert email, welcome email, and group invitation was equally broken.

### P0 — Email logo image resolved from a different variable than the links

| # | File | Line | Was | Now |
|---|---|---|---|---|
| 8 | `lib/mail.ts` | 69 | `${NEXT_PUBLIC_PRODUCTION_LINK \|\| 'http://localhost:3000'}/web-app-manifest-192x192.png` | `appUrl("/web-app-manifest-192x192.png")` |

Inside one function the logo came from `NEXT_PUBLIC_PRODUCTION_LINK` while every link came
from `NEXTAUTH_URL`. With only one of the two set, users got a broken image next to
working links — or, in this incident, a working image next to localhost links.

### P1 — Docs pages used the inverse env precedence of every other page

| # | File | Line | Was | Now |
|---|---|---|---|---|
| 9 | `app/docs/[[...slug]]/page.tsx` | 39 | `NEXTAUTH_URL \|\| NEXT_PUBLIC_PRODUCTION_LINK \|\| "https://…"` | `siteUrl()` |
| 10 | `app/docs/[[...slug]]/page.tsx` | 124 | `NEXTAUTH_URL \|\| NEXT_PUBLIC_PRODUCTION_LINK \|\| "https://…"` | `siteUrl()` |

Every other file in the codebase read `NEXT_PUBLIC_PRODUCTION_LINK` **first**. These two
read `NEXTAUTH_URL` first. With `NEXTAUTH_URL=localhost`, `/docs` emitted
`http://localhost:3000/docs` in its Open Graph `url`, its two JSON-LD blocks
(`mainEntityOfPage`, publisher `logo`), and its breadcrumb `item` — while `/`, `/features`,
`/faq` and the sitemap all said `https://thespendwise.vercel.app`. Google was being handed
two contradictory origins for the same site.

### P1 — Hardcoded domain literals across all SEO surfaces

Each of these repeated `process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"`.
No functional bug while that env var was set, but it duplicated the domain ~40 times, so
changing the domain meant finding all of them by hand — the mechanism that produced this
incident.

| # | File | Occurrences |
|---|---|---|
| 11 | `app/layout.tsx` | 2 — `metadataBase` (line 64), Open Graph `url` (line 74) |
| 12 | `app/sitemap.ts` | 1 (line 5) |
| 13 | `app/robots.ts` | 1 (line 5) |
| 14 | `app/llms.txt/route.ts` | 1 (line 7) |
| 15 | `app/page.tsx` | 1 (line 66) |
| 16 | `app/contact/page.tsx` | 5 |
| 17 | `app/privacy/page.tsx` | 5 |
| 18 | `app/terms/page.tsx` | 5 |
| 19 | `app/faq/page.tsx` | 2 |
| 20 | `app/download/page.tsx` | 4 |
| 21 | `app/features/page.tsx` | 1 |
| 22 | `app/status/page.tsx` | 1 |
| 23 | `app/how-it-works/page.tsx` | 1 |
| 24 | `app/login/page.tsx` | 1 |
| 25 | `app/reviews/page.tsx` | 1 |
| 26 | `app/compare/spendwise-vs-walnut/page.tsx` | 2 |
| 27 | `app/compare/spendwise-vs-et-money/page.tsx` | 2 |
| 28 | `app/tools/50-30-20-budget-calculator/page.tsx` | 3 |

All now use `SITE_ORIGIN` / `siteUrl()`.

### P1 — Chat API gateway resolved its own base URL from `NEXTAUTH_URL`

| # | File | Line | Was | Now |
|---|---|---|---|---|
| 29 | `lib/chat/v1/api-gateway.ts` | 48-51 | `NEXTAUTH_URL` else `http://localhost:3000` | `appUrl()` |

This one was load-bearing in the opposite direction: in production, chat budget/income
updates were issued as server-side `fetch` calls against `http://localhost:3000/api/…`,
i.e. the app calling itself on the developer's own machine. It failed silently because the
call sites only assert on the parsed response body.

### P2 — Electron desktop shell loaded the marketing site, not the app

| # | File | Line | Was | Now |
|---|---|---|---|---|
| 30 | `desktop/main.js` | 36-38 | `'https://thespendwise.vercel.app'` | `'https://money-spend-tracker.vercel.app'` (overridable via `NEXT_PUBLIC_APP_URL`) |

The desktop build is a logged-in product shell. Booting it into the marketing site meant
users had to navigate to sign in, on an origin that is not Google-OAuth-registered, so
`/login` bounced them to a third host and back through the auth bridge.

### P2 — `NEXTAUTH_URL` folded into the CORS/CSRF allowlist

| # | File | Line | Issue |
|---|---|---|---|
| 31 | `lib/origins.ts` | 48 (old) | `getAllowedOrigins()` treated the Auth.js callback base as a trusted CORS peer. |

A deployment that misconfigured `NEXTAUTH_URL` would silently widen its own CORS allowlist.
`NEXTAUTH_URL` is no longer consulted by `getAllowedOrigins()`. The two now-redundant entries
(`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PRODUCTION_LINK`) were removed too — `PRIMARY_APP_ORIGIN`
and `MARKETING_ORIGIN` already absorb them via `lib/site-url.ts`, so the allowlist is now
exactly the deployment topology plus explicitly whitelisted extras. `http://localhost:3000`
remains hardcoded for dev — unchanged behaviour.

### P2 — No guard against a loopback origin reaching production

There was no assertion that a generated link was even well-formed for its environment. Added:
`hasLocalhostOriginLeak()` in `lib/site-url.ts`, plus a hard structural rule —
`resolveAppOrigin()` **ignores `NEXTAUTH_URL` entirely when `NODE_ENV === "production"`**,
so this class of bug is now unreachable by construction rather than by convention.

### P3 — Verified correct, intentionally left alone

| # | Location | Finding |
|---|---|---|
| 32 | `components/layout/Footer.tsx:118` | `https://vinoths.vercel.app/` — the author's external portfolio. Correct, first-party? No. Leave. |
| 33 | `app/admin/settings/page.tsx:788` | Same portfolio link. Leave. |
| 34 | `public/.well-known/security.txt:3-4` | Hardcoded to `https://thespendwise.vercel.app`. Correct — RFC 9116 requires one stable canonical host, and this file cannot read env vars. Matches `SITE_ORIGIN`. |
| 35 | `next.config.ts:88` | `.filter((o) => o !== "http://localhost:3000")` — deliberate localhost exclusion from the CSP `connect-src`. Correct. |
| 36 | `tests/**` | `NEXTAUTH_URL` / `localhost` fixtures. Correct. |
| 37 | `components/layout/CookieConsent.tsx:46`, `app/layout.tsx:128-135` | Google/GA endpoints. Third-party, correct. |
| 38 | `app/download/DownloadClient.tsx:48` | GitHub release-asset URL for the desktop installer. Correct. |

---

## 4. Changes made

**New files**
- `client/lib/site-url.ts` — single source of truth. Exports `APP_ORIGIN`, `SITE_ORIGIN`,
  `appUrl()`, `siteUrl()`, `resolveAppOrigin()`, `resolveSiteOrigin()`,
  `hasLocalhostOriginLeak()`. Normalises any env value to a bare origin; strips trailing
  slashes; joins paths without doubling separators; preserves query strings.
- `client/tests/site-url.test.ts` — 13 regression tests.

**Modified**
- `client/lib/mail.ts` — all 7 links + logo now via `appUrl()`.
- `client/lib/origins.ts` — imports `APP_ORIGIN` / `SITE_ORIGIN` from `site-url.ts`;
  `NEXTAUTH_URL` removed from the CORS allowlist.
- `client/lib/chat/v1/api-gateway.ts` — `getBaseUrl()` returns `appUrl()`.
- `client/app/api/invitations/send/route.ts` — invite link via `appUrl()`.
- `client/app/docs/[[...slug]]/page.tsx` — both `baseUrl` sites → `siteUrl()`; precedence bug fixed.
- `client/app/layout.tsx`, `sitemap.ts`, `robots.ts`, `llms.txt/route.ts`, `page.tsx`,
  `reviews/page.tsx` — `siteUrl()` / `SITE_ORIGIN`.
- `client/app/{contact,privacy,terms,faq,download,features,status,how-it-works,login,reviews}/page.tsx`,
  `client/app/compare/*/page.tsx`, `client/app/tools/50-30-20-budget-calculator/page.tsx`
  — hardcoded literals → `SITE_ORIGIN`.
- `client/desktop/main.js` — loads `APP_ORIGIN`.
- `client/.env.example` — documents the new contract; warns against `localhost` in
  production `NEXTAUTH_URL`; explains that `*_ORIGIN` feeds CORS while `*_URL` feeds links.

**Note on a design decision:** `appUrl()` / `siteUrl()` re-resolve the origin on every
call rather than reading a frozen module constant. `tests/v2-budget-update.test.ts` sets
`NEXTAUTH_URL` in a `beforeEach`, after module import — a constant would have snapshotted
the stale `.env` value and broken the suite. Lazy resolution keeps that working while the
production guard still prevents any loopback leak.

---

## 5. Required action outside the codebase

The code is now correct, but **the production deployment's environment variables must be
set** or the defaults will be used:

```bash
# Vercel → Project → Settings → Environment Variables
NEXT_PUBLIC_SITE_URL=https://thespendwise.vercel.app
NEXT_PUBLIC_APP_URL=https://money-spend-tracker.vercel.app

# CRITICAL — was http://localhost:3000, which breaks Google OAuth outright,
# because Auth.js builds its callback URLs from this value.
NEXTAUTH_URL=https://money-spend-tracker.vercel.app
```

If `NEXT_PUBLIC_APP_URL` is left unset the app falls back to the hardcoded
`https://money-spend-tracker.vercel.app`, which is correct — but setting it explicitly
removes the ambiguity. **`NEXTAUTH_URL` has no safe default and must be corrected.**

`NEXT_PUBLIC_*` variables are inlined at build time. After changing them, redeploy — a
rebuild is required, not just a restart.

### Verification after deploy

```bash
# Every one of these must return the production domain, never localhost.
curl -s https://<app-origin>/sitemap.xml | head -3
curl -s https://<app-origin>/robots.txt | grep -i sitemap
curl -s https://<app-origin>/llms.txt | head -5
curl -s https://<site-origin>/docs | grep -o 'https://[^"]*docs' | sort -u
```

Then send one feedback-request email from `/admin/reviews` and confirm the button resolves
to `https://money-spend-tracker.vercel.app/feedback`.

---

## 6. Verification performed

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **Pass** — no type errors |
| `npx vitest run` | **Pass** — 26 files, 222 tests, 0 failures |
| `npx vitest run tests/site-url.test.ts` | **Pass** — 13 new regression tests |
| `npx next build --webpack` | **Pass** — compiled successfully |
| `npx eslint lib/site-url.ts lib/origins.ts` | **Clean** |

Of the 222 tests, 13 are new (`tests/site-url.test.ts`); the 213 pre-existing tests all
still pass, including the 26-test security-remediation suite that exercises the origin
allowlist.

Three pre-existing issues, unrelated to this work and left alone:
- `npx next build` without `--webpack` fails: the config has a `webpack` key and no
  `turbopack` key. Use `--webpack` or migrate the config.
- A full-suite run in the default threaded pool can end in a Prisma query-engine Rust panic
  (`failed to delete napi ref`) at process teardown, after all assertions pass. Adding
  `--no-file-parallelism` avoids it. Windows sandbox issue, not a test failure.
- `npx eslint` reports ~490 pre-existing `no-explicit-any` errors across the codebase.
