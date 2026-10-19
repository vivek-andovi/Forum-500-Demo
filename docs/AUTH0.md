# Using Auth0 for Forum500 login

## Today vs. with Auth0

| | Current built-in auth (live now) | With Auth0 |
|---|---|---|
| Who checks the password | The NestJS API (argon2 hashes in our `User` table) | Auth0 (hosted Universal Login page) |
| Token | HS256 JWT signed by our API, 1 day, revocable via `tokenVersion` | RS256 access token from Auth0; the API verifies it with Auth0's public keys (JWKS) |
| Invite / reset password | Our `AuthToken` table + SES emails + `/auth/set-password` page | Auth0 password-change "tickets" (or Auth0's own emails via SES) |
| Lockout / brute force | Our 5-strikes lock + rate limits | Auth0 brute-force protection, breached-password detection, bot detection |
| MFA | Not built | Built in (authenticator app, SMS, WebAuthn/passkeys) |
| Social login | Not built | LinkedIn and Google with a toggle (LinkedIn suits this membership) |
| Who decides permissions | Our DB (`User.role`, `User.status`) | **Still our DB**. Auth0 only proves *who* someone is; Forum500 decides *what* they can do |

The NestJS API, database, admin portal and approval workflows stay the same. Only the **login layer** changes.

## Architecture

```
 Member/Admin browser
      │ 1. click "Sign in"
      ▼
 Next.js app (@auth0/nextjs-auth0 v4) ── 2. redirect ──► Auth0 Universal Login (login.forum500.club)
      ▲                                                     │ password / MFA / LinkedIn
      │ 4. encrypted httpOnly session cookie ◄── 3. code ───┘
      │
      │ 5. fetch access token for audience https://api.forum500.club
      ▼
 NestJS API ── 6. verify RS256 signature with Auth0 JWKS (cached), check iss + aud
      │
      └─ 7. find User by auth0Sub → check status/role in OUR database → handle the request
```

## Setup in Auth0 (about an hour)
1. **Tenant:** create one in the **EU** region (`forum500.eu.auth0.com`). Later add the custom domain `login.forum500.club`, which is a paid feature.
2. **API:** Applications → APIs → Create.
   - Identifier (audience): `https://api.forum500.club`
   - Signing algorithm: RS256
   - Turn on **Allow Offline Access** (refresh tokens).
3. **Applications:** create two *Regular Web Applications*, "Forum500 Members" (web) and "Forum500 Admin". For each:
   - Callback URL: `https://forum500.club/auth/callback` (and the admin equivalent)
   - Logout URL: the app's home page
   - Turn on refresh token rotation.
4. **Database connection:** Authentication → Database:
   - **Disable sign-ups.** Forum500 is invite-only: users exist only after an admin approves an application.
   - Password policy: "Good" or stronger.
5. **Security:**
   - Turn on Attack Protection (brute force, breached passwords, bot detection).
   - Turn on MFA (OTP + WebAuthn), and **require it for admins** with a Post-Login Action, shown below.
6. **Machine-to-machine app** for the API: authorise the *Auth0 Management API* with only the scopes `create:users`, `read:users`, `update:users`, `delete:users`, `create:user_tickets` and `delete:sessions`.
7. **Email:** configure **Amazon SES** as Auth0's email provider, so all mail still goes out from `no-reply@forum500.club`.

Post-Login Action, which keeps non-admins out of the admin app and enforces MFA for admins:
```js
exports.onExecutePostLogin = async (event, api) => {
  const isAdminApp = event.client.client_id === event.secrets.ADMIN_CLIENT_ID;
  const isAdmin = (event.user.app_metadata || {}).role === 'admin';
  if (isAdminApp && !isAdmin) return api.access.deny('Admins only');
  if (isAdmin) api.multifactor.enable('any', { allowRememberBrowser: false });
};
```
The API keeps `app_metadata.role` in sync when an admin changes a user's role.

## Code changes needed (≈ 1–1.5 days)

### Backend (`backends/`)
1. **Schema:** add `auth0Sub String? @unique` to `User` (migration).
2. **Packages:** `jose` (JWT/JWKS verification) and `auth0` (Management API client).
3. **`AuthGuard`:** when `AUTH_PROVIDER=auth0`, replace the HS256 check with:
   ```ts
   const JWKS = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
   const { payload } = await jwtVerify(token, JWKS, { issuer: `https://${AUTH0_DOMAIN}/`, audience: AUTH0_AUDIENCE });
   const user = await prisma.user.findUnique({ where: { auth0Sub: payload.sub } });
   // then the same status/role checks as today
   ```
   On a user's first login, link by verified email if `auth0Sub` is still empty.
4. **Approve application:** use the Management API to create the Auth0 user (`email`, `app_metadata.role='member'`, random password, `email_verified:false`). Then create a **password-change ticket** and send it with the existing SES invite email. This replaces our `AuthToken` invite.
5. **Revoke sessions / suspend:** call `DELETE /api/v2/users/{id}/sessions` and set `blocked: true` in Auth0. We still check `status` in our DB, so access stops immediately either way.
6. **Remove** our endpoints for password login, set-password, forgot-password and change-password (kept behind `AUTH_PROVIDER=local` during migration).

### Frontends (`frontends/web`, `frontends/admin`)
1. **Package:** `@auth0/nextjs-auth0` v4.
   - Add `src/lib/auth0.ts` (`new Auth0Client()`) and `middleware.ts`, which mounts `/auth/login`, `/auth/callback`, `/auth/logout` and `/auth/access-token`.
   - Env vars: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL`, `AUTH0_AUDIENCE`.
2. **`lib/api.ts`:** instead of reading localStorage, get the token with `getAccessToken()` from `@auth0/nextjs-auth0`. Tokens then live in an encrypted **httpOnly cookie** session, never in localStorage, which removes the main remaining XSS token-theft risk.
3. **Pages:** delete our `/auth`, `/auth/forgot` and `/auth/set-password` pages; "Sign in" becomes a link to `/auth/login`. Admin `/login` works the same way.

### Moving existing users (keeps their passwords)
Auth0's **bulk user import** accepts argon2 hashes (`custom_password_hash` with algorithm `argon2`). Export `User.email` + `passwordHash` + `role`, import them into the Auth0 database connection, then store each returned `user_id` in `User.auth0Sub`. Nobody has to reset their password.

## Cost
- **Free plan:** covers up to about 25,000 monthly active users, more than enough for Forum500.
- **Paid "Essentials" plan** (tens of dollars a month): needed for the custom login domain (`login.forum500.club`), advanced MFA options and longer log retention.
- Auth0 prices change, so check auth0.com/pricing before deciding.

## Auth0 vs. Amazon Cognito vs. current built-in
| | Built-in (current) | Auth0 | Amazon Cognito |
|---|---|---|---|
| Ready today | ✅ live, tested | ~1–1.5 days | ~2 days |
| MFA / passkeys | ❌ (would need building) | ✅ best-in-class | ✅ (Essentials tier) |
| LinkedIn / Google login | ❌ | ✅ toggle | ✅ (more setup; LinkedIn via OIDC) |
| Hosted login UI quality | our own pages (on-brand) | excellent, very customisable | OK (Managed Login), less flexible |
| Token storage | localStorage (Bearer) | httpOnly cookie via SDK | httpOnly cookie via Amplify/own code |
| Developer experience | full control | excellent; team already used `@auth0/auth0-react` in andovi | more AWS plumbing |
| Billing | none | separate vendor | on the AWS bill; free up to 10k MAU on Lite/Essentials |
| Compliance burden | ours | Auth0 (SOC2, ISO) | AWS |

## Recommendation
- **For launch:** the built-in auth is now solid enough:
  - argon2, lockout, rate limits, invite and reset links, instant revocation
  - security headers and full audit logging
  - tests covering all of it
- **Before scaling, or if admins need MFA:** move to **Auth0**. It gives the best login experience, and LinkedIn sign-in fits a professional club. Your team already knows it, and the API's permission model doesn't change.
- **Choose Cognito instead** only if keeping every service on the AWS bill matters more than login UX.

I can implement the Auth0 switch behind an `AUTH_PROVIDER=auth0|local` flag, so both work during migration, once you have created the tenant (steps 1–3 above).
