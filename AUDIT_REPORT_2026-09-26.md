# OneMoreGift — Bug & Logic-Error Audit

Date: 2026-09-26
Scope: `onemoregift/` (backend, frontend, email-service)
Method: full source review + live reproduction against an **isolated** local stack
(throwaway MongoDB container + the real backend code + a stub email server).
No production database, no real credentials, and no real email provider were used.

Existing test suites were also run: email-service **13/13 pass**; backend **30/32 pass**
(the 2 failures are stale test mocks, see L-7, not product bugs).

---

## Severity summary

| # | Severity | Area | Finding |
|---|----------|------|---------|
| H-1 | High | Admin/RBAC | Core `/admin/*` routes ignore roles — any admin gets full access |
| H-2 | High | Admin/RBAC | `/admin/register` lets any admin create a `super_admin` (privilege escalation) |
| H-3 | High | Admin | Admin user list returns plaintext password-reset tokens → account takeover |
| H-4 | High | Secrets | `APP_MASTER_KEY` and an admin JWT are committed to git |
| M-1 | Medium | Auth | Hard-coded OTP `123456` works on any non-production deploy |
| M-2 | Medium | Auth | `@test.com` emails skip email verification — even in production |
| M-3 | Medium | Auth | Login by username can never succeed (name is encrypted) |
| M-4 | Medium | Admin | User search by email/phone always returns nothing (encrypted fields) |
| M-5 | Medium | Email | Send failures are reported to users as success |
| M-6 | Medium | Privacy | Public giveaway endpoint leaks the full participant ID list |
| L-1 | Low | Admin | "Banned users" stat always 0 (wrong field name) |
| L-2 | Low | Export | User CSV "Blocked" column always "No" (wrong field name) |
| L-3 | Low | Admin | `?blocked=` user filter is broken (string vs boolean) |
| L-4 | Low | Shop | Stock can be set to `NaN` by a malformed stock adjustment |
| L-5 | Low | — | Two stale contract tests fail |

Things that were checked and **work correctly**: coupon discount recomputation & per-user
limits, atomic stock decrement + rollback on order creation, per-item quantity cap across
split cart lines, COD stock reservation and cancel/restock, order status-transition guards,
giveaway duplicate-entry protection, and rejection of entries on ended giveaways.

---

## High severity

### H-1. Core admin routes enforce no role permissions
`backend/routes/admin.js` protects every route with `isAdmin` only — never `hasRole(...)`.
So config, coupons, all-users, user edit/delete/ban, CSV exports and DB maintenance are
open to **every** admin account regardless of role. The newer module routers
(`productsAdmin`, `ordersAdmin`, `momentsAdmin`, …) *do* use `hasRole`, which makes the gap
easy to miss — the RBAC system exists but is bypassed for the most sensitive routes.

Reproduced: a `support_agent` (permissions `users:read`, `orders:read`) successfully:
changed the payment UPI ID, created a 100%-off unlimited coupon, reset another user's
password, and exported the full user list — all returned `200/201`.

The only thing standing between a low-privilege admin and full control is
`ADMIN_EMAIL_WHITELIST`. **That variable is set in the current `backend/.env`, but it is
absent from `.env.production.example`** — so a deploy made from the template has it empty
and the whitelist disabled. Do not rely on it as the access control.

Fix: add `hasRole('...')` to each route in `routes/admin.js`, matching the pattern already
used in the module routers.

### H-2. `/admin/register` privilege escalation
`adminController.register` (`backend/controller/adminController.js:77`) only checks that the
caller's token has `isAdmin`, then creates a new admin with the **role supplied in the
request body**. There is no `hasRole`/root check.

Reproduced:
- A `support_agent` token created a new `super_admin` account (`200`, `role=super_admin`).
- With **no token at all**, registering the `ROOT_ADMIN_EMAILS` address
  (`admin@onemoregift.in`, the template default) created a working `super_admin`, because
  the bootstrap branch allows any root email to self-register. If that account has not been
  created on your server, anyone can claim it.

Fix: require `isRootAdmin` for creating admins, and never let the requester choose a role
above their own. Ensure the root account is created and locked down at deploy time.

### H-3. Admin user list leaks plaintext password-reset tokens
`allUsers` does `.select("-password")` only, so `resetToken.token` (a plaintext reset token,
not a hash) is returned in the admin user list. Anyone who can read that list — or any
stored-XSS / lower-priv admin per H-1 — can call `/auth/set-pass` with a user's live token
and take over the account.

Reproduced: triggered a reset for a victim, read the token from `all-users`, then
`set-pass` with it → `200` (password changed). `loginOtp` hashes are also exposed but are
bcrypt-hashed so lower risk.

Fix: exclude `resetToken`, `loginOtp` (and any secrets) from all admin user queries, e.g.
`.select("-password -resetToken -loginOtp")`.

### H-4. Secrets committed to git
- `onemoregift/ecosystem.backend-only.config.cjs` contains a hard-coded
  `APP_MASTER_KEY` (the key that decrypts `.env.enc`). It is tracked in git.
- `onemoregift/frontend/cookies.txt` is tracked and contains a real `admin_token` JWT.

If `.env.enc` is ever committed or leaks, the master key in the repo decrypts every secret.
Fix: remove both files from the repo and from history (`git rm --cached`, rewrite history if
already pushed), rotate `APP_MASTER_KEY`, `JWT_SECRET` and the admin credentials, and add
`cookies.txt` / `ecosystem.backend-only.config.cjs` to `.gitignore`.

---

## Medium severity

### M-1. Hard-coded OTP `123456` bypass
`controller/authController.js:30` — `TEST_OTP_BYPASS_ENABLED = NODE_ENV === 'test' || NODE_ENV !== 'production'`.
So on **any deploy that isn't exactly `NODE_ENV=production`** (dev, staging, a
mis-set env), `123456` verifies registration OTPs *and* login OTPs for any account.
Reproduced on the default `NODE_ENV=development`: registered a real-looking email and
logged in as it using only `request-otp` + `123456`. Correctly disabled when
`NODE_ENV=production`. Fix: gate the bypass behind an explicit, non-production-only flag
(e.g. `ALLOW_TEST_OTP=true`) and never key it off "not production".

### M-2. `@test.com` emails skip verification in production too
`authController.js:241` — `isTest = NODE_ENV === 'test' || email.endsWith('@test.com')`,
and `isTest` short-circuits OTP. Unlike M-1 this is **not** production-gated, so on the live
site anyone registering `x@test.com` gets a verified account with no email check.
Reproduced. Fix: remove the `@test.com` branch, or gate it to non-production.

### M-3. Login by username is impossible
`login` looks users up by `{ name: { $regex: ... } }`, but `name` is encrypted at rest with
a random IV (`model/Users.js`), so the regex runs on ciphertext and never matches. The UI
(`UserLogin.js`) and API accept a `loginId`/username, so username login silently always
fails with "invalid credentials". Reproduced: username `401`, same password by email `200`.
Fix: drop username login, or add a searchable `nameHash` (like `emailHash`/`phoneHash`).

### M-4. Admin user search by email/phone never matches
`allUsers` builds `queryObj.email = email` / `queryObj.phone = phone`, but both fields are
encrypted with random IVs, so equality queries can't match. Reproduced: searching an
existing user's email and phone both returned `total: 0`. Fix: query by `emailHash` /
`phoneHash` (`hmacHash(value)`), as the auth code already does.

### M-5. Email send failures reported as success
With `EMAIL_SERVICE_REQUIRED=false` (the value in `.env.production.example`), `sendEmail`
returns `true` even when delivery fails, so `register`/`resetPass` tell the user
"OTP sent" / "reset link sent" when nothing was delivered. Reproduced: forced the email
server to `502`; register still returned `200 "OTP sent to email"`. Users then can't
complete signup or reset (except via the M-1 bypass). Fix: when a user-blocking email
(registration OTP, password reset) fails, return an error, independent of
`EMAIL_SERVICE_REQUIRED`.

### M-6. Public giveaway detail leaks participant IDs
`getSingleGiveaway` (public `GET /giveaway/:id`) computes `participantCount` and `joined`
but, unlike `getGiveaways`/`getAllGiveaways`, never deletes the `participants` array — so the
full list of participant user ObjectIds is returned to anonymous callers. Reproduced:
`participants: ["6ab8...ede"]` present in the public response. Fix: `delete giveaway.participants`
before responding, as the list endpoints do.

---

## Low severity

- **L-1** `adminController.getDbStatus` counts `{ isBanned: true }`; the field is `blocked`,
  so the "Banned users" figure is always 0. (`controller/adminController.js:789`)
- **L-2** `exportController.exportUsers` reads `u.isBlocked`; the field is `blocked`, so the
  CSV "Blocked" column is always "No". (`controller/exportController.js:100`)
- **L-3** `allUsers` sets `queryObj.blocked = blocked` from a query string ("true"), compared
  against a boolean field — the `?blocked=` filter never matches. Coerce to boolean.
- **L-4** `productController.adjustStock` does `Math.max(0, stock + Number(adjustment))`; a
  missing/non-numeric `adjustment` yields `NaN` and writes `NaN` to stock. Validate that
  `adjustment` is an integer first.
- **L-5** `backend/test/contracts.test.js` — the two failing tests ("giveaway list contract",
  "admin stats contract") stub `Giveaway.find`/`countDocuments` but the controllers now also
  call `getConfigHelper()` (which hits the DB) and other models, so the stubs no longer cover
  the code path and the requests 500 without a DB. Product code is fine; the mocks are stale.

---

## How to reproduce

An isolated harness was used (kept out of the repo, under the session scratchpad):
a `mongo:7` container on port 27099, the backend booted with throwaway secrets on port 9099,
and a stub email server that records/【optionally fails】 sends. The scripts
(`audit.js`, `audit2.js`, `run-backend.sh`, `email-stub.js`) drive the flows above and print
one line per check. They can be re-pointed at a staging environment for regression testing.
