# SpendWise — Full Application Audit

**Repository:** `D:\TypeScript\expense-tracker\client`
**Branch:** `master` · **Baseline commit:** `1068253` ("Fix soft 404s, duplicate-host indexing, and sitemap signals")
**Canonical origin:** `https://thespendwise.vercel.app`
**Duplicate app origin:** `https://money-spend-tracker.vercel.app` (robots-disallowed, serves identical routes)
**Audit date:** 2026-09-28

---

## 0. Methodology & Evidence Standard

Every finding below is derived from reading the repository at the commit named above. Claims carry one of
three evidence labels:

| Label | Meaning |
| --- | --- |
| **Verified** | Reproduced by direct file/line inspection or a command in this repo. Cited with `file:line`. |
| **Measured** | Produced by running a tool (build, `npm audit`, route enumeration) during this audit. |
| **Estimated** | Inferred from architecture or documentation. Not independently confirmed. Treated as a hypothesis to test, never as a basis for destructive change. |

Commands run during this audit:

- `npm audit --json` → 31 advisories (2 critical, 17 high, 11 moderate, 1 low) — **Measured**
- Route/API enumeration via filesystem walk → 50 `page.tsx`, 116 `route.ts` — **Measured**
- Auth-guard adoption scan across all 116 route handlers — **Measured**
- `prisma/schema.prisma` structural parse → 28 models, 0 enums, 6 `@@index` — **Measured**
- Client/server boundary scan → 102 of 130 `.tsx` files are `"use client"` — **Measured**

Corrections to prior automated findings: an earlier audit subagent reported "no CSP configured". This is
**false**. `next.config.ts:77-108` emits a full Content-Security-Policy with `default-src`, `script-src`,
`style-src`, `font-src`, `img-src`, `connect-src`, `frame-src`, `frame-ancestors`, `object-src`, `base-uri`,
`form-action` and `upgrade-insecure-requests`. That finding is discarded.

No production environment variable was read, changed, or written. No data was written to any database.

---

## 1. Architecture & Tech Stack

### 1.1 Stack (Verified — `package.json`)

| Layer | Technology | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | `^16.2.11` |
| Runtime | React / React DOM | `19.2.4` (pinned) |
| Language | TypeScript | `^5` |
| Styling | Tailwind CSS | `^4` (PostCSS pipeline) |
| Database | MongoDB via Prisma | `@prisma/client ^6.19.3` |
| Auth | NextAuth v4 (Credentials + Google) | `^4.24.15` |
| AI | Google GenAI + Groq (`groq-sdk`) | `^1.50.1` / `^1.5.0` |
| Charts | Recharts | `^3.8.1` |
| Animation | Framer Motion | `^12.38.0` |
| Background jobs | BullMQ + ioredis | `^5.76.5` |
| Email | Nodemailer + Resend | `^7.0.13` / `^6.12.3` |
| Media | Cloudinary | via env |
| PWA | `@ducanh2912/next-pwa` | `^10.2.9` |
| PDF | jsPDF + html-to-image | `^4.2.1` / `^1.11.13` |
| Tests | Vitest | `^1.2.1` |
| Lint | ESLint 9 + `eslint-config-next` | `16.2.3` |

Build commands are non-standard in two ways (`package.json:8-11`): both `dev` and `build` force
`--webpack` (Turbopack disabled), and `build` runs `prisma generate` inline. Note also that
`eslint-config-next` is pinned to `16.2.3` while `next` floats on `^16.2.11` — the two can drift.

### 1.2 Route Surface (Measured)

- **50** `page.tsx` routes: 16 under `/admin`, 13 inside the `(authenticated)` route group, 21 top-level.
- **116** `route.ts` API handlers.
- Route groups: `app/(authenticated)/` holds the user app behind a **client-side** layout
  (`app/(authenticated)/layout.tsx:1` — `"use client"`).
- Multi-origin: `lib/origins.ts` + `lib/site-url.ts` centralize allowed origins, driving CORS
  (`middleware.ts:18-31`), CSP `connect-src` (`next.config.ts:86-91`), and the `redirect` callback
  (`lib/auth.ts:128-136`).

### 1.3 Data Model (Measured)

`prisma/schema.prisma`: **28 models, 0 enums, 6 `@@index` declarations.** MongoDB connector, so Prisma
`enum` is unavailable and all "enumerations" (`status`, `mode`, `authProvider`, `categoryType`, …) are
free-form `String` fields. There is no migration history and no seed script in the repository.

### 1.4 Middleware Trust Boundaries (Verified)

`middleware.ts` performs, in order: CORS preflight (`:55-57`), in-memory rate limiting (`:60-101`),
JWT presence check for protected **pages** (`:117-122`), JWT presence check for protected **APIs**
(`:138-149`), and HMAC admin-cookie checks for `/admin` and `/api/admin` (`:152-172`).

Two structurally important observations:

1. The middleware gate is a **presence** check (`if (!token)`), not an **entitlement** check. It cannot
   express "token valid but 2FA incomplete" or "token valid but account suspended". This single fact is
   the root cause of findings **SEC-01** and **SEC-02**.
2. `middleware.ts:7-12` defines a second, parallel authentication path (`x-internal-user-id` +
   `x-internal-api-secret`) that **short-circuits the session check entirely** (`:139-141`). See **SEC-04**.

### 1.5 Authorization Coverage (Measured, after correcting a false positive)

A naive scan for `getServerSession` reports only 35 of 116 handlers as guarded. That number is wrong:
the codebase uses three helpers. Corrected adoption counts:

| Guard | Handlers |
| --- | --- |
| `verifyAdminSession` (`lib/admin-auth.ts`) | 69 |
| `getServerSession` called inline | 35 |
| `getAuthenticatedUserId` (`lib/internal-api-auth.ts`) | 4 |

Only **7** of 116 handlers contain no recognizable guard, and all 7 are legitimately public or
self-authenticating: `/api/admin/login`, `/api/admin/logout`, `/api/auth/[...nextauth]`, `/api/contact`,
`/api/health`, `/api/public/stats`, `/api/unsubscribe`.

**Conclusion: route-level authentication is broadly and consistently present. This is a genuine strength
of the codebase and should be preserved through all remediation.** The weaknesses are in *entitlement*
logic, not in the presence of guards.

### 1.6 Ownership Filtering (IDOR) Review (Measured + Verified)

23 handlers take an `[id]` path param. 14 scope the database query with `userId`; 9 do not. Every one of
the 9 is either an admin-console route (correct — admins are global by design), a public-content route
(`/api/faq/[id]`, `/api/docs/*`), or a member-scoped check. The one case needing scrutiny,
`app/api/expenses/[id]/mark-paid/route.ts`, fetches by `id` alone at `:32-34` but **does** enforce
ownership at `:41` (`expense.paidById !== user.id → 403`).

**No confirmed cross-tenant IDOR was found.** This is a positive finding. The residual weakness is
stylistic: ownership is checked *after* fetching the row rather than in the query predicate, so a
missed check leaks existence via a 404-vs-403 difference. Logged as **DEBT-06**, not a security defect.

---

## 2. Feature Inventory (Verified)

### 2.1 Public / Marketing surface (14 indexable routes)

`/` · `/features` · `/how-it-works` · `/faq` · `/docs` · `/sitemap` · `/reviews` · `/contact` ·
`/privacy` · `/terms` · `/status` · `/download` · `/compare/*` (2 pages) · `/tools/*` (1 page) ·
`/llms.txt`

### 2.2 Authenticated product (13 route-group pages)

Dashboard · Expenses · Income · Groups (shared expenses) · Reports · Analyze (AI "Forensic Analysis") ·
Onboarding · Settings (incl. `/settings/categories`) · Profile · Notifications · Feedback ·
Groups invite acceptance (`/groups/invite/[token]`)

Also present: `app/api/2fa/{send,toggle,verify}` (TOTP-style OTP), `app/api/analyze` (AI categorization,
Gemini + Groq), `app/api/chat` (assistant, multi-turn), `app/api/docs/*` (AI-assisted documentation
authoring with feedback), `app/api/admin/notifications/*` (campaign send, templates, unsubscribes,
admin alerts), `app/api/admin/reports/*` (usage stats, generation, cleanup), `app/api/admin/security/*`
(audit log, IP blocklist, user lockout/ban, 2FA override, security alerts), `app/api/cron/budget-alerts`,
`app/api/system/status` (feature flags + maintenance).

### 2.3 Admin console (16 pages)

Users (suspend, reset-2FA), Transactions (+ per-transaction context), Security, Sessions, Roles, Reports,
Reviews, Notifications, Settings (AI / Email / Feature Flags / Maintenance), Logs, Analytics, Categories,
Subcategories, Activity, Cache invalidation, Stats, Top users, Login history, OTP log.

### 2.4 Feature quality observations

- **Groups is built but hidden.** `app/(authenticated)/layout.tsx:68-73` has the entire "Community" nav
  group — Expenses Groups — commented out. Fully-implemented multi-user split-expense functionality
  (`groupExpense`, splits, `mark-paid`, invitations) is unreachable from the primary navigation. See
  **MISS-01**.
- **Reviews are data-driven, not fabricated.** `app/reviews/page.tsx` server-renders approved reviews and
  `aggregateRating` structured data from the database, and `app/api/admin/reviews/*` gates moderation. This
  satisfies the no-fake-reviews constraint. It must stay that way.
- **Payments/bank sync does not exist.** There is no Plaid/Razorpay/Open banking integration anywhere. The
  product is manual-entry-first. See **MISS-02**.

---

## 3. User Journeys

### 3.1 Acquisition → first value

`/ ` → `/features` or `/tools/50-30-20-budget-calculator` → `/download` or `/login` → `/onboarding` →
`/dashboard`. The calculator is the only genuinely interactive top-of-funnel asset and it is a single
isolated page with no links into the rest of the funnel (**SEO-05**).

### 3.2 Daily driver

`/dashboard` → `AddExpenseModal` (available from header, mobile FAB, and a `open-add-expense` window
event) → `/expenses` → `/reports`. The core loop is sound and the add-expense path is unusually well
served with three entry points.

### 3.3 Returning user

`/dashboard` with `ActivityTracker`, `NotificationDropdown`, and a global `ChatPanel` FAB. Reasonable.

### 3.4 Journey defects found

| ID | Journey | Defect | Evidence |
| --- | --- | --- | --- |
| **JRN-01** | 2FA users, any page | The 2FA redirect can never succeed — see SEC-01. Any user who enables 2FA is trapped in a `/verify-2fa` loop. | `app/(authenticated)/layout.tsx:143-148` |
| **JRN-02** | Suspended users | Suspension presents a client-side overlay; the app beneath it keeps working and every API stays live. | `app/(authenticated)/layout.tsx:510` |
| **JRN-03** | Group expenses | Feature is implemented and tested but unreachable from nav. | `app/(authenticated)/layout.tsx:68-73` |
| **JRN-04** | First-time evaluator | No path from the calculator (highest-intent Search Console query) into signup. | `app/tools/50-30-20-budget-calculator/page.tsx` |
| **JRN-05** | Error states | `app/(authenticated)/layout.tsx:165-209` ships a full skeleton for `status === "loading" \|\| !session`, but any *auth* failure that yields a session-less client shows an indefinite skeleton rather than an error. | same |

---

## 4. SEO Audit

The prior commit fixed the major technical defects (soft 404s, duplicate-host indexing, sitemap
`lastmod`, review structured data, canonicals on `/faq` and `/sitemap`). What remains is largely
*policy* and *architecture*, not bug repair.

### 4.1 Status of previously fixed items (Verified — still correct at this commit)

- Real HTTP 404 for unknown and multi-segment docs URLs (loading boundary removed).
- Host-aware `robots.ts` returning blanket `Disallow: /` on the non-canonical host, with no `Sitemap:`
  line on that host (`app/robots.ts:93-100`).
- 24 canonical-origin sitemap URLs with stable `lastmod`, hourly revalidation.
- `aggregateRating` + `review` JSON-LD server-rendered from approved DB rows.
- `noindex` layouts for `/status`, `/maintenance`, `/verify-2fa`.

### 4.2 Open SEO findings

**SEO-01 — The `Allow` list is a no-op, so the crawl policy is not an allowlist.** *(Verified — High)*

`app/robots.ts:7-25` defines `ALLOWED_PATHS` beginning with `"/"`, and emits it as the `allow` array at
`:106` and `:111`. `robots.txt` uses longest-match-wins, so `Allow: /` matches every path, and the
subsequent `Allow: /faq`, `Allow: /tools/` etc. are all longer *but* no-op. Net effect: the intent
documented in the comment at `app/robots.ts:5-6` — "Everything not listed is blocked" — is not what the
file does. The site is governed entirely by `DISALLOWED_PATHS` (`:30-46`).
*Impact:* moderate, not catastrophic, because the disallow list is decent. It is a correctness and
intent bug, and it is fragile: any private path not in `DISALLOWED_PATHS` is silently crawlable.
*Fix:* delete the `allow` array entirely and let `Disallow` be the policy. There is no benefit to a
partial `Allow` list in `robots.txt`.

**SEO-02 — Unlisted public-looking routes are crawlable.** *(Verified — Medium)*

Routes that answer HTTP 200 with a rendered page but appear in neither list: `/login`, `/onboarding`,
`/bridge`, `/groups/invite/[token]`, `/api/2fa/*`. `/groups/invite/[token]` is especially undesirable —
a token-bearing URL is crawlable and linkable, so invite tokens can leak through referrers, the
crawl budget, or shared links. `robots.txt` is not an access control and cannot be the fix.
*Fix:* disallow `/groups/invite/`, `/bridge`, `/login`, `/onboarding`; and make invite tokens
single-use + short-lived so a crawled URL is inert.

**SEO-03 — GA is hardcoded, pre-consent, and double-loaded.** *(Verified — High; see **PERF-05** and **PRIV-01**)*

`app/layout.tsx:136-146` hardcodes `G-66Q0PWXL6H` and loads it unconditionally in `<head>`, while
`components/layout/CookieConsent.tsx` *also* injects a second, consent-gated gtag using
`NEXT_PUBLIC_GA_ID`. The documented env var (`NEXT_PUBLIC_GA_ID` in `.env.example`) is thus ignored by the
primary tag. Consequences: (a) analytics fires before consent — a GDPR/cookie-compliance exposure; (b) two
`gtag('config')` calls fire on every pageview, inflating or corrupting all GA metrics, which directly
undermines the Search Console/GA reconciliation the project depends on.

**SEO-04 — `NEXT_PUBLIC_GA_ID` is dead config.** *(Verified — Low)* The same root cause as SEO-03;
resolves with it.

**SEO-05 — Topical authority is one page deep.** *(Verified — High, strategic)*

The Search Console signal concentrates on "SpendWise", `50/30/20 budget calculator`, budget calculator
India, expense categorization, and financial insights. The site has exactly one `/tools/` page and two
`/compare/` pages. There is no `/tools/` index, no hub-and-spoke cluster, no `/blog/`, and no internal
linking from the calculator into the product. This is the largest *organic growth* constraint in the
audit, and the cheapest to improve without touching product code.

**SEO-06 — `llms.txt` is declared but unlinked.** *(Verified — Low)* Listed at `app/robots.ts:20`; not
referenced from any `<head>`. Harmless, but it is a signal with no path to a consumer.

### 4.3 SEO scorecard

| Area | State | Verdict |
| --- | --- | --- |
| Canonicals | Correct, cross-domain, on all indexables | Pass |
| `robots.txt` correctness | Functional but intent-violating (SEO-01, SEO-02) | Needs work |
| XML sitemap | 24 URLs, stable `lastmod`, correct origin | Pass |
| Soft 404 | Fixed and verified | Pass |
| Structured data | Review + aggregateRating present, DB-backed | Pass |
| `noindex` hygiene | Applied to status/maintenance/2FA | Pass |
| Internal linking / topical depth | One tool page, no hub, no cross-links | **Weak** |
| Measurement integrity | GA double-loaded and pre-consent (SEO-03) | **Broken** |

---

## 5. UX Audit

### 5.1 Strengths (Verified)

- A coherent dark/light token system in `app/globals.css` with semantic names (`bg-background`,
  `text-foreground`, `border-border-subtle`, `text-muted`) rather than raw palette classes. This is
  better than most projects at this scale and makes theming safe.
- Three redundant add-expense entry points (header button, mobile FAB, `open-add-expense` window event)
  make the core action genuinely reachable.
- The `useModal` provider gives destructive actions (logout) a consistent confirmation pattern.
- Status/loading states use real skeletons (`app/(authenticated)/layout.tsx:165-209`), not spinners.

### 5.2 Findings

**UX-01 — Groups is a hidden feature.** *(Verified — High)* `app/(authenticated)/layout.tsx:68-73`.
Multi-user split expenses, invitations, and settlement are all built. Users who discover them via a shared
link get an app whose nav does not mention the feature. This is simultaneously a UX gap and a wasted
differentiator.

**UX-02 — Primary nav hides income-side value.** *(Verified — Medium)* The nav is expense-centric
(`navGroups` at `app/(authenticated)/layout.tsx:46-81`) while the product models income, budgets, groups,
and reports. The page header falls back to the literal string `"Dashboard"` for any unmatched route
(`:322`), so nested routes like `/settings/categories` or `/groups/[id]` always display "Dashboard" as the
H1. That is a visible correctness bug on every nested page.

**UX-03 — Indefinite skeleton on session failure.** *(Verified — Medium)* `:165-209` renders the skeleton
whenever `!session`, with no error branch and no timeout. Combined with **JRN-01** this means a 2FA user
who fails the client check sees a permanent skeleton rather than a prompt.

**UX-04 — Two FABs collide conceptually.** *(Verified — Low)* The chat FAB (`fixed bottom-6 right-6`)
and Add FAB (`fixed bottom-6 right-24`) are adjacent circles on mobile. `app/(authenticated)/layout.tsx:477-491`.

**UX-05 — `dangerouslySetInnerHTML` for analytics config.** *(Verified — Low)* `app/layout.tsx:137-146`.
Not user-controlled today, but it is a CSP-relevant pattern that becomes a stored-XSS sink the moment the
ID or any interpolated value is made dynamic.

**UX-06 — Chat assistant is globally mounted and always fetching state.** *(Verified — Estimated)*
`ChatPanel` is mounted unconditionally at `app/(authenticated)/layout.tsx:493` in all 13 route-group
pages. Its bundle and any prefetch cost every dashboard load regardless of use.

### 5.3 Missing features

**MISS-01** Re-enable or deliberately remove Groups from nav. *(Decision needed, not a code change.)*
**MISS-02** No bank/payment import. Every transaction is manual. This is the single largest product gap
for a "smart expense tracker" and the most common reason users churn to competitors.
**MISS-03** No recurring/subscription transaction detection, so forecasting cannot anticipate fixed costs.
**MISS-04** No multi-currency. `en-IN` and `₹` formatting are hardcoded at
`app/(authenticated)/layout.tsx:325-331`; amounts are stored without a currency column. Multi-currency is
therefore a data-migration project, not a UI change.
**MISS-05** No export (CSV/PDF of user data) despite jsPDF being a dependency. A GDPR "download my data"
path is also absent.
**MISS-06** No `/tools/` index and no content cluster (**SEO-05**).

---

## 6. Performance Audit

### 6.1 Measured findings

**PERF-01 — 102 of 130 `.tsx` files are `"use client"`.** *(Measured — High)*

Only 28 of 130 client components are actually server components. The App Router's main benefit — shipping
HTML and reducing client JS — is largely forfeited. The `(authenticated)` shell is the worst case: its
layout is `"use client"` (`app/(authenticated)/layout.tsx:1`), so the sidebar, header, date rendering,
theme toggle, notification dropdown, chat panel, and add-expense modal are all client-rendered, and every
nested page inherits the client boundary.

**PERF-02 — Turbopack is disabled for both dev and build.** *(Verified — Medium)* `package.json:8-9`
(`next dev --webpack`, `next build --webpack`). This forfeits the framework's fastest build path and
several built-in optimizations. Needs a compatibility check before removal.

**PERF-03 — Raw `<img>` is used 20 times; `next/image` twice.** *(Measured — High)*

`next/image` is configured with AVIF/WebP, a 30-day `minimumCacheTTL`, and allowed remote patterns
(`next.config.ts:27-40`) — and is then barely used. So there is no responsive `sizes`, no automatic format
negotiation, no lazy loading, and no width/height enforcement on 20 elements, including profile avatars
rendered inside the authenticated shell (`app/(authenticated)/layout.tsx:274-283`, `:361-367`).

**PERF-04 — No code splitting anywhere.** *(Measured — High)*

Zero uses of `next/dynamic` across the whole `app/` and `components/` trees. Recharts (`^3.8.1`),
Framer Motion (`^12.38.0`), jsPDF (`^4.2.1`) and html-to-image (`^1.11.13`) are all heavy and are loaded
into the shared authenticated shell. jsPDF in particular is a document-generation library that should never
be in the initial payload of a dashboard.

**PERF-05 — Analytics blocks first paint.** *(Verified — Medium)* `app/layout.tsx:136` loads
`googletag/js` with `async` in `<head>`, plus four `preconnect`/`dns-prefetch` hints (`:129-134`) to
Google properties on every page, including pages where analytics contributes nothing. Combined with the
duplicate load (**SEO-03**), this is wasted main-thread and network budget on the critical path.

**PERF-06 — No caching strategy on data reads.** *(Verified — Estimated)* Static marketing pages get
`s-maxage=3600, stale-while-revalidate=86400` (`next.config.ts:119-137`), but the 116 API handlers show no
`revalidate`/tag-based caching. Every dashboard mount is a live MongoDB round trip. `lib/prisma.ts` should
be checked for a missing connection-pool reuse under serverless concurrency.

**PERF-07 — MongoDB queries are unindexed at the field level.** *(Measured — High)*

Only **6** `@@index` declarations exist across **28** models. Meanwhile the hottest query in the entire
product is `app/api/expenses/route.ts:22-40`, which filters by `userId` **and** a `date` range **and**
often `category`. Without a compound `{ userId, date }` index, every dashboard and every expense list is a
collection scan. This is a very likely dominant latency cost and is the highest-value performance fix in
the audit.

**PERF-08 — `next-pwa` is unmaintained and pulls a vulnerable transitive.** *(Verified — Medium)*
`@ducanh2912/next-pwa ^10.2.9` is a fork of a deprecated package. It is the sole reason
`serialize-javascript <=7.0.4` (high, RCE via `RegExp.flags`, `GHSA-5c6j-r48x-rmvq`) is in the tree at
all. See **DEP-01**.

### 6.2 Performance priority order

1. Add compound indexes (`userId`+`date` on transactions, `userId`+`createdAt` on most user-scoped models) — **PERF-07**
2. Move Recharts / Framer Motion / jsPDF behind `next/dynamic` — **PERF-04**
3. Convert 20 `<img>` to `next/image` — **PERF-03**
4. Server-render the authenticated shell so it is not a client boundary — **PERF-01**
5. Remove the duplicate pre-consent GA tag — **PERF-05 / SEO-03**
6. Re-evaluate `--webpack` and `next-pwa` — **PERF-02 / PERF-08**

---

## 7. Security Audit

Severity reflects exploitability *for this deployment* (Next.js on Vercel, Linux) as well as intrinsic risk.

### SEC-01 — 2FA is not enforced anywhere server-side · **CRITICAL** *(Verified)*

This is the most serious finding in the audit and it is a compound defect.

1. `app/api/2fa/verify/route.ts:119-126` sets the `2fa_verified` cookie with **`httpOnly: true`**.
2. `app/(authenticated)/layout.tsx:143-144` reads it with **`document.cookie`**. An `httpOnly` cookie is
   never exposed to JavaScript, so this expression is **permanently false for every user, including those
   who correctly completed 2FA.**
3. There is no other reader. A whole-repository scan for `2fa_verified` returns exactly **two** hits: the
   setter at `app/api/2fa/verify/route.ts:120` and the broken client read at
   `app/(authenticated)/layout.tsx:144`.
4. The comment at `app/api/2fa/verify/route.ts:117-118` claims enforcement via a "server-side session claim
   via a flag on the user record." **No such flag is ever written.** The only persistence is the httpOnly
   cookie, which no server code reads.
5. `middleware.ts:117-122` and `:138-149` — the only server-side gates — check **JWT presence only**. They
   cannot express a 2FA requirement.

**Impact.** A user with 2FA enabled who simply never opens `/verify-2fa` can call every authenticated
endpoint directly (`/api/expenses`, `/api/analyze`, `/api/chat`, …) with their ordinary session JWT. 2FA
currently provides **zero** server-side protection. Simultaneously, users who *do* complete 2FA are bounced
back to `/verify-2fa` on every navigation (**JRN-01**) — a self-inflicted denial of service on exactly the
security-conscious users.

*Remediation.* Persist a real 2FA-completion claim (JWT claim, or a `twoFactorVerifiedAt` timestamp on the
user compared against session issue time) and enforce it in `middleware.ts` for page routes **and** in a
shared API guard. The pure-JWT strategy at `lib/auth.ts:123-125` means a 30-day JWT is minted *before* 2FA
completes, so the claim must be re-evaluated per request against the DB, not baked into the token.

**SEC-02 — Account suspension is a visual overlay, not an access control · HIGH** *(Verified)*

`isSuspended` is loaded into the session (`lib/auth.ts:207`, `:217`) but is consumed **only** by admin
pages, the auth bridge, and system status. The sole product-side use is
`app/(authenticated)/layout.tsx:510`, which swaps in `<SuspendedOverlay />`. The real `content` tree and
all 116 API handlers remain fully functional. A suspended user closes the overlay — or never opens the
browser at all — and continues reading and writing financial data. An admin action taken in response to
abuse or fraud is therefore reversible by the suspended party.

*Remediation.* Enforce `isSuspended` in `middleware.ts` (redirect + 403 on APIs) and in the shared API
guard, so the overlay becomes presentation rather than the control.

**SEC-03 — Credentials provider auto-registers unknown emails, enabling account pre-hijack · HIGH** *(Verified)*

`lib/auth.ts:68-92`: when no user matches the submitted email, `authorize()` **creates an account** with the
attacker-chosen password and returns it as a valid session.

*Attack.* An attacker registers `victim@gmail.com` with a password they control. The victim later clicks
"Continue with Google" for that same address. The `signIn` callback (`lib/auth.ts:151-176`) finds
`existingUser` and simply proceeds — it never links, never merges, and never rejects. The victim now
believes they authenticated with Google, while the attacker retains a working password on the same address.

*Remediation.* Remove auto-registration from `authorize()`. Send unverified emails to a distinct
verification step before any row is created, and make the Google path claim a passwordless account
explicitly.

**SEC-04 — `INTERNAL_API_SECRET` silently falls back to `NEXTAUTH_SECRET` and impersonates any user · HIGH** *(Verified)*

`lib/internal-api-auth.ts:7-9` resolves the expected secret as
`process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET || ""`. `middleware.ts:139-141` then
**bypasses the session check entirely** for any request presenting a matching secret plus an arbitrary
`x-internal-user-id`. The user ID is never bound to anything.

*Impact.* `NEXTAUTH_SECRET` has a much wider blast radius than a dedicated internal secret: it is read by
NextAuth, it participates in JWT signing, and it is the documented session secret. Any leak of it — a
logged env dump, a leaked server bundle, an SSRF, a compromised preview deployment, a support engineer with
env access — yields **immediate full impersonation of every user**, not merely a session-signing capability.
The `.env.example` documents `INTERNAL_API_SECRET`, so the intent was clearly a separate secret; the
fallback defeats it. The `expected &&` check at `:23` also means that if both env vars are unset the guard
fails closed, which is correct.

*Remediation.* Remove the `NEXTAUTH_SECRET` fallback so the dedicated secret is mandatory. Bind the
internal path to a service account rather than a caller-supplied user ID, or drop it entirely now that
`getAuthenticatedUserId` already falls back to a real session.

**SEC-05 — Next.js: 2 critical advisories · CRITICAL (dependency) · MUST FIX** *(Measured)*

`npm audit` reports `next` in range `9.3.4-canary.0 - 16.3.2`. Two critical advisories:

| Advisory | Title | Applicability to this deployment |
| --- | --- | --- |
| `GHSA-p293-qw3h-jr36` | Unauthenticated RCE on **Windows-hosted** servers | **Not exploitable** — production is Vercel/Linux. Fix anyway. |
| `GHSA-2xp9-vwfh-vxw4` | Unauthenticated RCE in Image Optimization API when **AVIF** is used | **Exploitable.** `next.config.ts:38` sets `formats: ["image/avif", "image/webp"]`, so this app requests AVIF from the optimizer. |

Both are fixed in **`next >= 16.3.3`**. The second is the one that matters, and it is directly enabled by
this project's own image config. `eslint-config-next` should move in lockstep.

**SEC-06 — Dependency backlog · HIGH** *(Measured)*

Full `npm audit` on the current lockfile: **31 advisories — 2 critical, 17 high, 11 moderate, 1 low.**

| Package | Sev | Advisory | Note |
| --- | --- | --- | --- |
| `next` | critical | `GHSA-p293-qw3h-jr36`, `GHSA-2xp9-vwfh-vxw4` | `>=16.3.3`. **Priority 1.** |
| `vitest` | critical | `GHSA-5xrq-8626-4rwp` | Arbitrary file read/exec when the **Vitest UI server** is listening. Dev-only; never start `vitest --ui` on a shared host. `^1.2.1` is 2 majors behind. |
| `sharp` | high | `GHSA-f88m-g3jw-g9cj`, `GHSA-rgj7-g3m4-5g8c` | Inherited libvips/libheif CVEs. `fixAvailable: true`. |
| `postcss` | high | `GHSA-6g55-p6wh-862q`, `GHSA-r28c-9q8g-f849` | Arbitrary file read via `sourceMappingURL`; build-time. |
| `nodemailer` | high | 10 advisories incl. `GHSA-p6gq-j5cr-w38f` (SSRF/file read), `GHSA-2x7j-588g-ccc2` (quadratic DoS) | Pinned `^7.0.13`; `>=10.0.11` required — a **major** bump. Directly reachable via the contact form and transactional mail. |
| `next-pwa` → `serialize-javascript` | high | `GHSA-5c6j-r48x-rmvq` | RCE via `RegExp.flags`. Pulled in only by `next-pwa`. |
| `vite` | high | `GHSA-fx2h-pf6j-xcff` | `server.fs.deny` bypass on Windows alternate paths. Dev-only. |
| `fast-uri`, `js-yaml`, `nanoid`, `ws`, `brace-expansion`, `protobufjs`, `browserslist`, `@babel/plugin-transform-modules-systemjs` | high | various DoS / host-confusion / prototype-write | Mostly transitive build- and test-time; upgrade via lockfile refresh. |
| `next-auth` | high | via `nodemailer` | `next-auth@4` pins an old nodemailer range. Resolving nodemailer likely requires `next-auth` v5 or an override. |
| `prisma` / `@prisma/config` | high | via `deepmerge-ts` (`GHSA-ggr8-5vv4-36mx`, stack exhaustion) | `npm` proposes a **downgrade** to `6.12.0` — reject that; update forward instead. |

*Assessment.* Only **two** items are genuinely production-critical: `next` (SEC-05) and `nodemailer`.
`vitest`, `vite`, and most transitives are dev/build-time. The `prisma` "fix" that npm suggests is a
semver-major **downgrade** and should not be taken.

**SEC-07 — Credentials rate limiter is per-instance and in-memory · MEDIUM** *(Verified)*

`lib/auth.ts:9`, `:54-62` keeps a `Map` in module scope: 10 failures per 15 min, per email, per warm
lambda. On Vercel this resets on every cold start and is not shared across concurrent instances, so the
effective limit is materially weaker than it appears. `middleware.ts:34-48` has the same design for its
own limits. `lib/rate-limit-redis.ts` and `lib/rateLimit.ts` exist and ioredis is a dependency — the
correct backing store is already in the project and simply is not used on the credential path.

*Remediation.* Back `lib/auth.ts` with `lib/rate-limit-redis.ts`; key on IP + email, not email alone.

**SEC-08 — Login history records a placeholder IP · MEDIUM** *(Verified)*

`lib/auth.ts:186` writes `ip: "0.0.0.0"` and `device/browser/userAgent: "Unknown"`, `:189` writes
`userAgent: ""`. The same placeholder appears in the 2FA audit log (`app/api/2fa/verify/route.ts:87`,
`:111`). The admin Security console therefore displays fabricated-looking zeros, and any incident
reconstruction, IP blocklist, or geo analysis built on this data is impossible. This is also a data-integrity
issue: the admin UI cannot distinguish "not collected" from "not applicable."

**SEC-09 — CSP relies on `'unsafe-inline'` for scripts · MEDIUM** *(Verified)*

`next.config.ts:81`. The inline comment at `:80` is candid that a nonce-based CSP is a larger change, and
that is correct — but `'unsafe-inline'` in `script-src` substantially negates CSP's XSS value. The
analytics snippet at `app/layout.tsx:137-146` is itself the reason inline script is required; removing the
duplicate tag (**SEO-03**) and moving to a nonce would let `script-src` tighten meaningfully.

**SEC-10 — Rate-limit and lockout state is not shared · MEDIUM** *(Verified)*

`app/api/2fa/verify/route.ts:13-15` keeps the 5-attempt OTP tracker in an in-memory `Map`, and OTP codes
plus expiry are stored on the `User` document (`:66`, `:95-101`). Same cold-start problem as SEC-07. A
second, more serious consequence: storing the **current OTP value** on the user row means anyone with read
access to the users collection can read pending 2FA codes. Prefer a hashed, short-lived, single-use store.

**SEC-11 — `INTERNAL_API_SECRET` is accepted over any transport path · LOW** *(Verified, combined with SEC-04)*
`middleware.ts:7-12` applies the internal-secret check unconditionally, including to browser-reachable
paths. Once SEC-04 is fixed this should also be restricted to server-to-server callers.

### 7.1 What is genuinely well built (Verified)

This deserves explicit credit, because it constrains how remediation should be done:

- **Rate limiting exists and is deliberate** — contact, auth, and the paid `/api/analyze` endpoint
  (`middleware.ts:60-101`), with an explicit cost rationale and a documented staging-only override that
  cannot affect production (`:86-88`). The AI billing-abuse case was thought about.
- **CSRF validation is real** — `lib/csrf.ts` with `validateOrigin` on 9 mutating handlers.
- **XSS surface is defended** — `isomorphic-dompurify` in the dependency tree, and the docs pipeline
  combines `react-markdown` + `rehype-raw` + `remark-gfm` (a combination that *requires* sanitization).
- **Security headers are comprehensive** — HSTS with preload, `frame-ancestors`, `object-src 'none'`,
  `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy`.
- **Admin auth is HMAC-signed and constant-time**, not a plaintext cookie.
- **Timing-safe OTP comparison** (`app/api/2fa/verify/route.ts:17-24`, `:78`).
- **API keys come from env and are never hardcoded**; `.env` is gitignored.
- **CORS is allowlisted, never `*`**, with `Vary: Origin` (`middleware.ts:18-31`).
- **26 test files** including `tests/security/remediation.test.ts` and `tests/middleware-auth-rate-limit.test.ts`.
  The project has clearly been through a security pass before — SEC-01 through SEC-04 are the gaps that pass
  missed, all in the *session entitlement* layer rather than the perimeter.

---

## 8. Accessibility Audit

**A11Y-01 — Icon-only buttons without accessible names · MEDIUM** *(Verified)*

Six files contain `<button>` elements with only an icon child and no `aria-label`, no `sr-only` text, and
no `title`: `app/admin/security/page.tsx`, `app/admin/sessions/page.tsx`,
`app/admin/transactions/page.tsx`, `app/admin/logs/page.tsx`, `app/admin/reports/page.tsx`,
`app/(authenticated)/groups/[id]/page.tsx`. A screen-reader user hears "button" with no purpose. Note the
contrast with the correctly-labelled mobile menu (`app/(authenticated)/layout.tsx:313`) — the standard
exists, it is just not applied uniformly.

**A11Y-02 — The mobile Add FAB has no accessible name · MEDIUM** *(Verified)*
`app/(authenticated)/layout.tsx:486-491`. The header equivalent at `:337` has visible text "Add"; the FAB
has none.

**A11Y-03 — Overlay divs are click handlers, not dialogs · MEDIUM** *(Verified)*
`app/(authenticated)/layout.tsx:398-401` (backdrop) and `:402-404` (drawer) are `div`s with `onClick`,
no `role="dialog"`, no `aria-modal`, no focus trap, no `Escape` handler, and no focus restore on close.
Keyboard and screen-reader users cannot dismiss the mobile navigation. The chat panel and add-expense
modal have the same class of problem.

**A11Y-04 — Avatar images use `alt=""` inside a link with no text alternative · LOW** *(Verified)*
`app/(authenticated)/layout.tsx:274-283` (sidebar profile link) and `:356-377` (header avatar link).
The link's only content is an image with empty alt; the adjacent text is in a sibling `<div>` that is
*inside* the link at `:286-293` for the sidebar (acceptable) but the header avatar link at `:356-377`
wraps only the image, so it is announced as an unlabelled link.

**A11Y-05 — 20 raw `<img>` elements bypass `next/image`'s alt discipline · LOW** *(Verified)
Width/height are supplied (good — no CLS), but there is no enforced alt contract.

**A11Y-06 — `X-XSS-Protection` header is obsolete · LOW** *(Verified) `next.config.ts:56-59`.
Ignored by all current browsers; retained only for legacy. Harmless, but it is dead config that suggests
XSS protection is handled here — it is not; see SEC-09.

**A11Y-07 — Reduced-motion is not honoured · Estimated.** Framer Motion animations (`:398`, `:464`, `:477`)
are used pervasively with no `useReducedMotion` check and no `prefers-reduced-motion` media query found.
Worth verifying before acting on.

---

## 9. Technical Debt

| ID | Debt | Evidence | Cost to fix |
| --- | --- | --- | --- |
| **DEBT-01** | 0 Prisma enums across 28 models — every "enum" is a free-form `String`, so invalid states are storable and unqueryable as categories | `prisma/schema.prisma` (0 `enum` blocks) | High on MongoDB; needs a data-cleanup migration |
| **DEBT-02** | Only 6 `@@index` for 28 models; hottest query filters `userId` + `date` + `category` with no compound index | `prisma/schema.prisma`; `app/api/expenses/route.ts:22-40` | **Low cost, very high value** — do first |
| **DEBT-03** | Extensive `as any` casts to reach Prisma — 4+ in `lib/auth.ts` alone (`:71`, `:96`, `:102`, `:181`) | `lib/auth.ts`; `app/api/expenses/[id]/mark-paid/route.ts:32`, `:45` | Low, mechanical |
| **DEBT-04** | 4 divergent auth paths: NextAuth session, `getAuthenticatedUserId`, middleware internal-secret, admin HMAC cookie. Only 4 of 116 routes use the shared helper | `lib/internal-api-auth.ts`; `middleware.ts:7-12`; 116-route scan | **High** — the root cause of SEC-01/02/04 |
| **DEBT-05** | `console.log` in the sign-in path with commented-out debug lines | `lib/auth.ts:152`, `:165` | Trivial |
| **DEBT-06** | Ownership checked after `findUnique({where:{id}})` rather than in the query predicate — leaks existence via 404-vs-403 | `app/api/expenses/[id]/mark-paid/route.ts:32-43` | Low |
| **DEBT-07** | In-memory rate limiting for auth/2FA/contact in a serverless deployment | `lib/auth.ts:9`; `app/api/2fa/verify/route.ts:13`; `middleware.ts:34` | Low (library exists) |
| **DEBT-08** | `allowedDevOrigins: ['*']` | `next.config.ts:12` | Trivial; confirm no prod impact |
| **DEBT-09** | 102/130 client components; no server/client boundary discipline | Measured | High — but high value too |
| **DEBT-10** | `eslint-config-next` (16.2.3) pinned independently of `next` (`^16.2.11`) | `package.json:36`, `:58` | Trivial once SEC-05 is fixed |
| **DEBT-11** | `next-pwa` is an unmaintained fork of a deprecated package, and the sole source of a high-severity transitive | `package.json:20`; audit | Medium — needs a PWA migration |
| **DEBT-12** | A staging-only rate-limit override is live in `middleware.ts` with a "TEMPORARY — remove once samples collected" comment | `middleware.ts:80-88` | Trivial; needs an owner decision on removal |
| **DEBT-13** | Feature flags are fetched client-side after mount rather than injected server-side, so the first paint uses hardcoded defaults (`{ aiAnalysis: true }`) | `app/(authenticated)/layout.tsx:95`, `:99-106` | Low–Medium; a flag-off feature flashes enabled |
| **DEBT-14** | `tsc-output.txt` still tracked despite new ignore rules | `.gitignore` | Trivial |

---

## 10. Missing Features

Ranked by expected impact on the two stated goals — a more defensible product, and more organic acquisition.

| ID | Missing | Why it matters |
| --- | --- | --- |
| **MISS-02** | Bank / payment import | Largest product gap. Every transaction is manual; competitors auto-import. Biggest retention lever. |
| **MISS-06** | `/tools/` hub + content cluster | Directly serves the observed Search Console demand (**SEO-05**). Cheapest growth win available. |
| **MISS-05** | CSV/PDF data export | jsPDF is already a dependency. Also the GDPR "access my data" path. |
| **MISS-03** | Recurring transaction detection | Prerequisite for any real forecasting; without it the budget feature is shallow. |
| **MISS-01** | Groups surfaced in nav | Built, tested, invisible (**UX-01**). Decision, not work. |
| **MISS-04** | Multi-currency | Hardcoded `en-IN`/`₹` (`app/(authenticated)/layout.tsx:325-331`); needs a schema migration, so it is a *project*, not a ticket. |
| **MISS-07** | No `/blog/` or comparison depth beyond 2 pages | Limits topical authority. |
| **MISS-08** | No consent-gated analytics event taxonomy | Cannot safely add product analytics today — see SEO-03. |

---

## 11. Quick Wins

Low risk, low effort, clear benefit. Ordered by benefit/effort.

| # | Action | Refs | Effort |
| --- | --- | --- | --- |
| 1 | Remove the `allow` array from `robots.ts`; disallow `/groups/invite/`, `/bridge`, `/login`, `/onboarding` | SEO-01, SEO-02 | ~15 min |
| 2 | Delete the hardcoded pre-consent GA block from `app/layout.tsx` | SEO-03, SEO-04, PERF-05 | ~10 min |
| 3 | Add `aria-label` to the 6+ unlabelled icon buttons and the mobile Add FAB | A11Y-01, A11Y-02 | ~30 min |
| 4 | Fix the nested-route H1 fallback (`"Dashboard"` → route-aware label) | UX-02 | ~20 min |
| 5 | Add the `{ userId, date }` compound index on the expense model | DEBT-02, PERF-07 | ~20 min + backfill |
| 6 | Remove `allowedDevOrigins: ['*']`; delete stray `console.log`s | DEBT-05, DEBT-08 | ~10 min |
| 7 | Add `role="dialog"`, `aria-modal`, Escape handling, and a focus trap to the mobile drawer, chat panel, and add-expense modal | A11Y-03 | ~1 h |
| 8 | Untrack `tsc-output.txt` | DEBT-14 | ~2 min |
| 9 | Link `/llms.txt` from a `<head>` link, or drop it | SEO-06 | ~10 min |
| 10 | Give the header avatar link an accessible name | A11Y-04 | ~5 min |

---

## 12. High-Impact Improvements

Grouped by the phases agreed for remediation.

### Phase 2 — Security & correctness (must ship first)

| ID | Work | Why first |
| --- | --- | --- |
| **SEC-05** | Upgrade `next` to `>=16.3.3` (+ `eslint-config-next` in lockstep) | Removes 2 criticals; the AVIF RCE is live because `next.config.ts:38` requests AVIF |
| **SEC-06** | Upgrade `nodemailer` to `>=10.0.11` (expect a `next-auth` v5 decision); refresh the lockfile for the dev/build transitives; **reject** npm's proposed `prisma` downgrade | 10 advisories on a mail path reachable from the contact form |
| **SEC-01** | Real 2FA enforcement: DB-backed claim, enforced in `middleware.ts` for pages *and* APIs | 2FA is currently decorative, and it also breaks legitimate users |
| **SEC-02** | Enforce `isSuspended` in middleware and the API guard | An admin abuse action is currently reversible |
| **SEC-03** | Remove auto-registration from `authorize()`; add email verification | Enables account pre-hijack |
| **SEC-04** | Delete the `NEXTAUTH_SECRET` fallback in `lib/internal-api-auth.ts:8` | Contains blast radius of the session secret |
| **SEC-07/10** | Back auth + 2FA rate limiting with `lib/rate-limit-redis.ts`; hash OTPs and move them out of the `User` row | Fixes serverless-unsafe limits and OTP-at-rest |
| **SEC-08** | Record real IP/UA in login and 2FA history, or drop the columns | Admin security console currently shows fabricated data |
| **PERF-07** | Compound indexes on the user-scoped hot paths | Cheapest large latency win in the audit |

### Phase 3 — Organic acquisition

- **`/tools/` hub + cluster** (**MISS-06**): a real index at `/tools`, each tool a substantive page, all
  internally linked. This is where the observed query demand already exists.
- **Calculator → product path** (**JRN-04**): contextual links from the 50/30/20 calculator into the
  product. The highest-intent page currently dead-ends.
- **Authoritative content** for "expense categorization" and "financial insights" — the two non-brand
  themes in the Search Console data.
- **Fix the internal-link graph** from the marketing pages into `/dashboard`-adjacent public value.
- **Measurement integrity first** (SEO-03) so any subsequent growth work is measurable. Optimising before
  fixing double-counted pageviews means optimising against bad data.

### Phase 4 — Product & UX

- Groups: surface or remove (**UX-01** / **MISS-01**) — a decision, and it should be made explicitly.
- `next/dynamic` for Recharts / Framer Motion / jsPDF (**PERF-04**).
- Server-render the authenticated shell (**PERF-01** / **DEBT-09**).
- Convert 20 `<img>` → `next/image` (**PERF-03**).
- Dialog semantics and focus management across overlays (**A11Y-03**).
- Feature flags server-injected (**DEBT-13**).

### Phase 5 — Data & platform

- Prisma enums / MongoDB validation for the 28 models (**DEBT-01**) — needs a data audit first.
- Ownership moved into query predicates (**DEBT-06**).
- PWA migration off `next-pwa` (**PERF-08** / **DEBT-11**).
- Re-evaluate `--webpack` (**PERF-02**).
- API response caching / revalidation (**PERF-06**).
- Consolidate the four auth paths into one guard (**DEBT-04**).

---

## 13. Implementation Order

The order below is a **dependency graph**, not a preference. Each step is safe to do before the ones below it.

**Phase 0 — already shipped (commit `1068253`)**
Soft-404 fix · duplicate-host robots · sitemap `lastmod` · review structured data · canonicals on
`/faq` and `/sitemap` · `noindex` layouts.

**Phase 1 — this audit** *(complete; this document)*

**Phase 2 — Security & data integrity.** Gate: `npm audit` shows 0 critical, 0 high production-reachable;
`npm run build` green; new regression tests green.
1. `next >=16.3.3` + `eslint-config-next` — **SEC-05**
2. Lockfile refresh for dev/build transitives; `nodemailer >=10.0.11` — **SEC-06**
3. 2FA enforcement end to end — **SEC-01**
4. Suspension enforcement — **SEC-02**
5. Remove credentials auto-registration — **SEC-03**
6. Remove the `NEXTAUTH_SECRET` fallback — **SEC-04**
7. Redis-backed rate limiting + hashed OTPs — **SEC-07, SEC-10**
8. Real IP/UA capture — **SEC-08**
9. Compound indexes — **PERF-07**

**Phase 3 — Measurement & organic acquisition.** Gate: GA fires exactly once, post-consent, with a
documented event taxonomy; `/tools` hub live and internally linked.
1. Remove the duplicate GA tag; define a consent-gated event taxonomy — **SEO-03**
2. `robots.txt` correctness — **SEO-01, SEO-02**
3. `/tools/` hub + cluster — **MISS-06**
4. Calculator → product internal links — **JRN-04**
5. Content for "expense categorization" / "financial insights"

**Phase 4 — Performance & UX.** Gate: LCP and TBT improved on `/dashboard`; axe scan shows no criticals.
1. `next/dynamic` for heavy libs — **PERF-04**
2. Server-render the authenticated shell — **PERF-01**
3. `next/image` migration — **PERF-03**
4. Dialog semantics, focus management — **A11Y-03**
5. Groups decision + surface — **UX-01**
6. Nested-route H1 fix — **UX-02**

**Phase 5 — Platform & debt.** Gate: `npm run lint` clean repo-wide.
1. PWA migration off `next-pwa` — **DEBT-11**
2. Auth-path consolidation — **DEBT-04**
3. Prisma enums / validation — **DEBT-01**
4. Re-evaluate `--webpack` — **PERF-02**
5. API caching — **PERF-06**
6. Ownership-in-predicate — **DEBT-06**

**Phase 6 — Validation & documentation.** Gate: build + lint + tests green; audit re-run shows the findings
above closed; `docs/spendwise-improvements.md` written with per-change before/after.

---

## 14. Finding Index

| Sev | Count | IDs |
| --- | --- | --- |
| **Critical** | 2 | SEC-01, SEC-05 |
| **High** | 12 | SEC-02, SEC-03, SEC-04, SEC-06, SEO-01, SEO-03, SEO-05, PERF-01, PERF-03, PERF-04, PERF-07, UX-01 |
| **Medium** | 16 | SEC-07, SEC-08, SEC-09, SEC-10, SEO-02, UX-02, UX-03, A11Y-01, A11Y-02, A11Y-03, DEBT-02, DEBT-04, DEBT-07, PERF-02, PERF-05, PERF-08 |
| **Low** | 16 | SEO-04, SEO-06, UX-04, UX-05, A11Y-07, A11Y-04, A11Y-05, A11Y-06, DEBT-05, DEBT-06, DEBT-08, DEBT-10, DEBT-11, DEBT-12, DEBT-13, DEBT-14 |
| **Positive** | 9 | Route auth (109/116 guarded), no confirmed IDOR, CSRF, sanitization, security headers, admin HMAC auth, timing-safe OTP, rate limiting, no hardcoded secrets |

Counts are of *distinct findings*, not advisories. `SEC-06` rolls up 31 dependency advisories (2 critical,
17 high, 11 moderate, 1 low) whose individual severities are tabulated in §7; only the `next` pair
(**SEC-05**) and `nodemailer` are production-reachable.

**Top three by expected value:**

1. **SEC-01 — 2FA is not enforced.** A security control that appears active and provides nothing, which
   also breaks the users who rely on it. Worst combination of severity and deception in the audit.
2. **SEC-05 — AVIF image-optimizer RCE.** Two criticals, one of them enabled by this project's own
   `next.config.ts:38`. One version bump closes both.
3. **PERF-07 — missing compound indexes.** 6 indexes for 28 models, with the product's hottest query
   filtering `userId` + `date`. Small change, likely the single largest latency improvement available.
