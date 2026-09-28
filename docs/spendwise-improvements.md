# SpendWise — Phase 2 Implementation Log

Companion to `docs/spendwise-audit.md`. This records what was changed, why, and how each
change was verified. Every claim is labeled **Verified** (measured in this repo or observed
at runtime), **User-provided** (decided by the owner), or **Estimated**.

Date of work: 2026-09-28
Branch: `master` · Base commit: `1068253` (prior SEO work)
Status at time of writing: **uncommitted, not pushed**

---

## 1. Summary

Phase 2 targeted the two critical dependency advisories and the four highest-severity
authentication findings from the audit. All six are closed. Every file created or
rewritten in this phase is lint-clean, the full test suite passes, and the production
build succeeds.

| Metric | Before | After |
| --- | --- | --- |
| `npm audit` critical | 2 | **0** |
| `npm audit` high | 17 | 11 |
| `npm audit` total | 31 | 21 |
| Tests passing | 222 | **250** (28 new) |
| `tsc --noEmit` | clean | clean |
| `npm run build` | success | success |
| Lint errors in files touched | 24 | **23** (net −1) |

---

## 2. Dependency remediation

### 2.1 `next` 16.2.11 → 16.3.6 (SEC-05, critical)

`next@16.2.11` carried two critical advisories, one of them an AVIF image-optimizer RCE.
That one is **reachable in this deployment** because `next.config.ts` sets
`images.formats` to include AVIF. Upgrading to 16.3.6 clears both.

`eslint-config-next` was moved to the identical `16.3.6` version in the same change. The two
packages must stay in lockstep; a mismatch reintroduces config drift.

### 2.2 `nodemailer` 7 → 10.0.11 (SEC-06)

Cleared 10 advisories in the mail path. Two adjustments were required:

- `@types/nodemailer@^8` was **removed**. Nodemailer 10 ships its own type definitions, and
  the external `@types` package shadows the real ones.
- The direct dependency had to be moved to `^10.0.11` as well as the `overrides` entry.
  Leaving it at `^7.0.13` made `npm install` fail with `EOVERRIDE` because npm refuses to
  let an override contradict a direct dependency.

`lib/mail.ts` was verified against the v10 surface: `createTransport`, `sendMail`,
`info.messageId`, and `close` are unchanged, and the `nodemailer/lib/smtp-transport`
subpath — which `lib/mail.ts` imports for the `SMTPTransport.Options` type — is still
declared in v10's `exports` map and still exports `Options`. `tsc --noEmit` passes unchanged.

### 2.3 `vitest` 1.6.1 → 5.0.2 and `vite` → 7 (last critical)

The remaining critical was `vitest` (arbitrary file disclosure in the Vitest UI server).
It is dev-only and needs the UI bound to a non-localhost interface to be exploitable, but it
was the last critical, so it was cleared.

Two knock-on effects:

- **Node types aligned to the runtime.** Vitest 5 requires `@types/node@^22 || >=24`; the
  project declared `^20` while actually running Node 24.4.1. Bumped to `^24`.
- **A pre-existing test flake and a Windows crash both disappeared.** The suite previously
  failed intermittently in `tests/security/remediation.test.ts` under parallel execution
  (6.9s in-suite vs 1.5s isolated) and then **segfaulted with `0xC0000005`** during teardown,
  so the run never printed a summary. Under vitest 5 the suite is deterministic: 27/27 files,
  250/250 tests, exit code 0.

### 2.4 What was deliberately *not* done

- **No Prisma downgrade.** npm offers to fix the remaining `prisma` / `@prisma/config` /
  `deepmerge-ts` highs by moving `prisma` to `6.12.0`. That is a downgrade, not a fix, and
  the vulnerable code is in the Prisma CLI, not the runtime query path. Rejected.
- **`serialize-javascript` (build-time RCE) left open.** It is pulled in by
  `@ducanh2912/next-pwa` and only executes during `next build`. The fix requires replacing
  or pinning that package, which is the Phase 5 `DEBT-11` work.

---

## 3. Security fixes

### 3.1 SEC-01 — 2FA was never actually enforced (critical)

**The finding, stated precisely.** Two independent defects made 2FA entirely non-functional,
in *both* directions:

1. **The server never recorded a completed challenge.** `app/api/2fa/verify/route.ts` set a
   cookie named `2fa_verified`, and a comment claimed it was "server-side session claim via a
   flag on the user record". No such flag existed. Nothing server-side could tell whether a
   user had passed 2FA.
2. **The client check could never pass.** `app/(authenticated)/layout.tsx:144` tested for
   that cookie via `document.cookie`, but the cookie was set `httpOnly` — so the browser
   never exposes it to JavaScript. The check was guaranteed to fail.

Net effect: every user with 2FA enabled was permanently redirected to `/verify-2fa` and
could not use the app, while the API — which never checked anything — was fully open to
their session. 2FA was decorative in both directions.

**The fix.**

- Added `User.twoFactorVerifiedAt` (`prisma/schema.prisma`), written only on a successful
  challenge and cleared whenever a new OTP is issued.
- `lib/user-entitlement.ts` (new) is the single place that decides access:
  `ok` / `unauthenticated` / `suspended` / `two_factor_required`, with a 12-hour grant window
  on a completed challenge.
- `middleware.ts` now reads the authoritative user row and enforces that decision for every
  protected page **and** API route. API denials return `403` with a machine-readable code
  (`ACCOUNT_SUSPENDED` / `TWO_FACTOR_REQUIRED`); pages redirect to `/verify-2fa`.
- `lib/internal-api-auth.ts` calls the same `evaluateEntitlement` and **fails closed** — it
  returns `null`, which every one of its 14 existing callers already treats as
  unauthenticated. This closed the gap for all of them without editing a single handler.
- The client check in `(authenticated)/layout.tsx` now reads `twoFactorVerifiedAt` from the
  session and calls the same shared function, so client and server cannot disagree.

**Why middleware, and not 63 individual routes.** 49 routes call `getServerSession` directly
and 14 use `getAuthenticatedUserId`. Hand-editing 63 handlers is a large, high-risk diff. The
middleware is the chokepoint every request already passes, so one change covers the whole
surface. This required switching middleware to the Node.js runtime so it can query Prisma
(`export const config = { runtime: "nodejs" }`); the build confirms it is honored.

**Fail-closed on error.** If the entitlement lookup throws, the request is refused (`503`
for API, redirect for pages) rather than waved through. A token whose user row no longer
exists is also refused.

**One accepted trade-off.** The verification grant is 12 hours, not per-request. With a
30-day JWT there is no way to expire a claim client-side without re-architecting sign-in into
a step-up flow, which is out of Phase 2 scope. 12 hours is recorded in
`TWO_FACTOR_GRANT_MS` and is a single constant to change.

### 3.2 SEC-02 — suspension was client-side only (high)

Suspended users kept a valid 30-day session and could keep calling every API. Enforcement is
now in the same middleware gate, above. Two layers are in place:
`evaluateEntitlement` refuses a suspended user, and `authorize` in `lib/auth.ts` also refuses
a suspended user's credentials outright. A lookup failure fails closed.

`SuspendedOverlay` remains, but is now a display concern on top of real enforcement rather
than the enforcement itself.

### 3.3 SEC-04 — internal API secret fell back to the session secret (critical)

`lib/internal-api-auth.ts:8` and `middleware.ts:10` both resolved the internal service
secret as:

```ts
process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET
```

`NEXTAUTH_SECRET` signs session JWTs. Any process able to read it — or any deployment
misconfiguration that exposed it — could send `x-internal-user-id` with an arbitrary user id
and impersonate that user, because `middleware.ts:139` lets a trusted internal request skip
the session check entirely. Reusing one secret for two different trust domains is the defect.

**Fix:** both sites now resolve `INTERNAL_API_SECRET` only, with no fallback. An unset value
means internal requests are simply not trusted — fail closed, which is the safe direction.
`lib/internal-api-auth.ts` also compares with `crypto.timingSafeEqual` instead of `===`.

**Required deployment action:** `INTERNAL_API_SECRET` must be set in the Vercel environment,
otherwise internal service-to-service calls will stop being trusted. Per the standing
constraint, no production environment variable was modified from this environment.

### 3.4 SEC-03 — credentials sign-up enabled account pre-hijack (high)

The credentials `authorize` handler creates an account when the email is unknown, and there
is **no separate sign-up route or page** in the app — so that path is also the registration
flow. An attacker could therefore pre-register a victim's address with a password they know.
Worse, the OAuth `signIn` callback looked up the email, found the attacker's row, and
signed the victim straight into it.

Removing auto-registration would have locked out every email-only user, so instead the
takeover is neutralized at the OAuth boundary: when a verified OAuth identity claims an email
whose account was created via credentials *with a password*, that password is cleared and
`authProvider` is switched to the OAuth provider. Google has just proven control of the
mailbox, so it outranks a password set through the other flow. The attacker is locked out,
the verified owner keeps access, and nobody is permanently locked out. Each occurrence writes
a `CREDENTIAL_OVERRIDE` `SecurityAlert` and a server warning for the admin trail.

Also folded in: the failure message is now the uniform `"Invalid email or password"`, closing
a user-enumeration difference between "no such account" and "wrong password".

### 3.5 SEC-08 — rate limiting was in-memory, therefore unenforceable on serverless

Four separate in-memory `Map` counters were in play: login attempts in `lib/auth.ts`, 2FA
attempts in the verify route, and two in `middleware.ts`. On serverless these are
per-instance and reset on every cold start, so the caps were effectively decorative.

The repo already contained a Redis-backed limiter at `lib/rate-limit-redis.ts` and a wrapper
at `lib/rateLimit.ts` — but **nothing imported them.** The wrapper's `rateLimiter()` was
additionally a no-op: it computed an IP and then unconditionally `return null`, so any caller
would have had no limiting at all.

Fixed by:

- Rewriting `rateLimiter()` to actually delegate, and adding `checkIdentifierRateLimit()` for
  the pre-session `authorize` callback, which has neither a request nor a user id.
- Moving login throttling, 2FA send (3/15min) and 2FA verify (5/15min) onto the shared limiter.
- Making the 2FA attempt cap **durable** rather than relying on Redis alone: failed attempts
  are counted from `OTPLog` rows inside the window, and reaching the cap nulls the pending
  OTP. This holds even with no `REDIS_URI` configured. The new `@@index([userId, createdAt])`
  on `OTPLog` backs that count.
- Deleting the now-dead `failedLogins` map.

The two in-memory limiters still in `middleware.ts` are unchanged and remain per-instance;
they are a coarse abuse-speed bump on top of the durable checks and are called out in §6.

### 3.6 SEC-09 — OTPs were stored in plaintext (medium)

`User.twoFactorOTP` held the raw 6-digit code. A 6-digit space is 10^6 candidates, so even
an unsalted digest would fall to brute force in seconds given a database read.

`lib/otp.ts` (new) stores an **HMAC-SHA256** keyed with a server-side pepper and
domain-separated by context, so a database leak alone cannot recover live codes. Verification
is a `timingSafeEqual` over the digests. `hashOtp` **throws rather than falling back** if no
pepper is configured, so the app fails loudly instead of quietly storing weak hashes.

Migration note: a stored value that is not a 32-byte digest is rejected as invalid, so any
pre-existing plaintext row will not verify. Those codes are replaced by requesting a new OTP
within their 10-minute life — self-healing, and the correct outcome.

### 3.7 SEC-10 — audit records held fabricated data (medium)

`LoginHistory`, `UserSession` and `OTPLog` rows were written with `"0.0.0.0"`, `"Unknown"`,
`""`. The audit trail was unusable for the incidents it exists to investigate.

`lib/request-meta.ts` (new) resolves the real client IP through the standard proxy header
chain (`x-forwarded-for` first hop → `x-real-ip` → `cf-connecting-ip` → `true-client-ip`) and
the real user agent, reporting `"unknown"` rather than inventing an address. `lib/user-agent.ts`
(new) derives browser and device from the user agent with no new dependency. The 2FA routes
now use `prisma.oTPLog` typed directly instead of through `as any`.

---

## 4. Database indexes

Added to `prisma/schema.prisma`, chosen to back the queries introduced or leaned on by this
phase and the hottest list views:

| Model | Index | Backs |
| --- | --- | --- |
| `User` | `[isSuspended]` | admin suspension queries |
| `UserSession` | `[userId, expires]` | session list / revoke |
| `OTPLog` | `[userId, createdAt]` | **the durable 2FA attempt count** |
| `GroupMember` | `[groupId]` | group member list (`@@unique([userId, groupId])` only covers the reverse direction) |
| `GroupExpense` | `[groupId, date]` | group expense list |

**These are declared but not yet materialized.** The datasource is MongoDB, which Prisma
syncs with `db push` rather than `migrate` — `prisma migrate` errors out on this provider.
The new `twoFactorVerifiedAt` **field** needs no database change: MongoDB is schemaless, and
documents without the field read as `undefined`, which `evaluateEntitlement` treats as
"verification required", the safe fail-closed default.

Running `db push` against the production cluster was deliberately **not** done from this
environment, per the standing constraint on production changes. A `db:sync` script was added
so the indexes can be created deliberately:

```
npm run db:sync   # review the diff it prints before accepting
```

---

## 5. Product change

`Expense Groups` was commented out of the authenticated navigation, so a fully built Groups
feature — 5 routes including group detail, settings, and invite tokens — was unreachable from
the UI. Per the owner's decision, the **Community** nav group is now present in
`app/(authenticated)/layout.tsx`. The `Users` icon was already imported, so no new import
was needed.

---

## 6. Verification

**Static and build**

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0, compiled in 36.0s, all routes emitted |
| ESLint on all 5 new + 6 rewritten files | 0 problems |
| ESLint delta on 4 files shared with baseline | 24 → 23 errors (net **−1**) |

The one remaining new lint error is a single `(session.user as any)` line added to match the
six identical lines already surrounding it in the same `session` callback. Removing the dead
`failedLogins` map and the `as any` in `internal-api-auth.ts` offset the rest.

**Tests** — `npx vitest run`: **27/27 files, 250/250 tests, exit 0.**

`tests/security/entitlement.test.ts` (new, 28 tests) covers the entitlement gate
(including suspension-before-2FA precedence, the 12-hour re-lock, and rejection of an
unparseable timestamp rather than trusting it), the exemption list (including that
`/api/2faevil/verify` does **not** slip through on the `/api/2fa` prefix), OTP hashing
(including that a plaintext stored value never verifies), and request-metadata parsing.

**Runtime** — production server on Next 16.3.6, probed directly:

| Path | Result | Meaning |
| --- | --- | --- |
| `/` | 200 | public page unaffected |
| `/faq` | 200 | public page unaffected |
| `/login` | 307 | auth redirect intact |
| `/dashboard` | 307 | middleware page guard fires |
| `/api/expenses` | 401 | middleware API guard fires |
| `/api/2fa/verify` | 405 | **reached the route** — the 2FA exemption works, so a user can still satisfy the gate |

No 500s, confirming the Node-runtime middleware executes Prisma without crashing.

---

## 7. Deployment checklist

1. **Set `INTERNAL_API_SECRET`** in the Vercel environment. Without it, internal
   service-to-service calls are no longer trusted (SEC-04). This is the one change that can
   break a working flow.
2. **Run `npm run db:sync`** to materialize the five indexes. Review the diff it prints;
   it is additive only, but it targets production.
3. Consider `REDIS_URI`. Login, 2FA send and 2FA verify now throttle through the shared
   Redis limiter. Without it they fall back to a per-instance in-memory store; the durable
   OTP-invalidation cap still applies, but the request-rate cap does not survive a cold start.
4. Note the `middleware` → `proxy` convention deprecation warning in the Next 16 build. The
   file still works; renaming `middleware.ts` to `proxy.ts` is deferred to a later phase
   rather than bundled into a security change.

## 8. Known remaining items

Carried forward from the audit, not addressed in Phase 2:

- `serialize-javascript` build-time RCE via `@ducanh2912/next-pwa` (Phase 5 `DEBT-11`).
- The 12 in-memory counters in `middleware.ts` are still per-instance.
- `middleware.ts` is renamed `proxy.ts` when the Next 16 convention migration happens.
- The `prisma` / `deepmerge-ts` CLI highs have no forward fix available.
