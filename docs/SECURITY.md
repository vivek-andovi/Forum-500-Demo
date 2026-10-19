# Security controls

**Last reviewed:** 2026-10-19.

**Test coverage:** each control below is covered by the automated admin API suite (432 checks, including 25 negative/security cases).

## Authentication & sessions
| Control | Where |
|---|---|
| Passwords hashed with **argon2id** | `auth.service.ts` |
| Password policy: 10+ chars, letter + number (API and UI) | `common/util.ts → passwordSchema` |
| Lockout for 15 min after 5 failed logins; timing-equalised for unknown emails | `AuthService.login` |
| JWT HS256 with issuer/audience checks; expiry `JWT_EXPIRES_IN` (default 1 day) | `auth.module.ts` |
| **Instant revocation**: every request re-checks user status and `tokenVersion`. Suspending, changing role, changing password or "sign out everywhere" kills existing tokens | `auth.guard.ts` |
| Invite and reset links: 32-byte random, **only the SHA-256 hash is stored**, single-use, expire after 7 days (invite) or 1 hour (reset) | `AuthToken`, `AuthService.createToken` |
| Forgot-password gives the same response whether or not the email exists | `AuthService.forgotPassword` |
| Approved applicants get an emailed invite; no shared default password | `AdminWorkflowsService.approveApplication` |
| Admin guard rails: you can't delete, suspend or demote yourself; at least one active admin must remain | `AdminCrudService.checkUserWrite` |

## Authorisation
- One global guard covers every route.
  - `/admin/*` requires role `admin`.
  - `/v1/*` requires a logged-in user.
  - `/public/*` is open, and only routes marked `@Public()` are.
- Members only ever receive `status=published` content. Private fields such as an event's address or a WhatsApp invite link are released only when the rules allow it.
- Member writes are always scoped to the caller's own `memberId`.

## Input validation
- **Admin generic API:** every write is checked against the Prisma schema.
  - Fields that aren't in the schema, or are read-only, hidden or system-managed, are dropped.
  - Field types and enum values are checked.
  - Dates, numbers and IDs are validated.
  - **URL and image fields must be http(s)** (blocks `javascript:` / `data:` URLs).
  - Slug and email formats are checked.
  - Text is capped at 50k characters and lists at 200 items.
- **Member, public and auth APIs:** every body is checked against a zod schema. The profile schema rejects unknown fields. UUID path params use `ParseUUIDPipe`.
- **List queries:** `sort`, `status` and `filter.*` are checked against known fields and enum values; search is capped at 100 characters.
- **Errors:** database errors become clean 400/404/409 responses; stack traces and SQL never reach clients (`AllExceptionsFilter`).

## Uploads
- The real file type is detected from its **bytes**; the browser's MIME type is ignored.
- Allowed: JPEG, PNG, WebP, GIF, AVIF, PDF, MP3, M4A, WAV, OGG. **SVG and HTML are rejected.**
- Size limits per type: images 15 MB, PDF 50 MB, audio 150 MB.
- Random object keys; the original filename is sanitised.
- `X-Content-Type-Options: nosniff` on served files.
- S3 presigned uploads expire after 5 minutes. On `confirm`, the server checks the object's real type and size in S3 before recording it.
- Deleting an asset removes the stored file.

## Abuse protection
- Rate limit per IP: `RATE_LIMIT_PER_MINUTE`, default 300.
- Stricter fixed limits:

| Route | Limit |
|---|---|
| login, set-password, change-password | 10/min |
| forgot-password | 5/min |
| public apply | 5/min |
| uploads | 60/min |

- Apply form: honeypot field, plus duplicate open applications per email are collapsed.

## Transport & headers
- Helmet sets security headers: HSTS, nosniff, frame-ancestors, and others. `x-powered-by` is removed.
- CORS allows only `CORS_ORIGINS`, with limited methods and headers.
- Request body limit is 1 MB (uploads are handled separately).
- `trust proxy` is set behind the ALB, so rate limits and audit IPs use the real client IP.
- Swagger `/docs` is **disabled in production** unless `ENABLE_SWAGGER=true`.

## Configuration
- All environment variables are validated at startup.
- In production the API **refuses to start** if `JWT_SECRET` is weak or a default, or if storage is set to local disk.
- Secrets come from AWS Secrets Manager; AWS access uses IAM task roles, with no keys in env vars.

## Audit trail
Every admin write is recorded:
- **who:** email, name and IP
- **what:** action, resource type and record title
- **field-level changes:** before → after, with relation IDs shown as names and secrets masked

Audit writes never block the action itself.

## Container
- Runs as the non-root `node` user.
- Multi-stage build with production dependencies only.
- Health check at `/api/health`.

## Known remaining items
| Item | Risk | Plan |
|---|---|---|
| Access token kept in **localStorage** (Bearer) | Token theft if an XSS bug appears | Move to httpOnly-cookie sessions, either via Auth0's Next.js SDK (see `AUTH0.md`) or our own refresh-cookie flow |
| No MFA for admins | Phished admin password | Auth0/Cognito MFA, or add TOTP |
| In-memory rate-limit counters | With several ECS tasks, limits apply per task | Redis (ElastiCache) storage for the throttler, plus AWS WAF rate rules |
| `npm audit`: 3 high advisories in the **Prisma CLI config loader** (`deepmerge-ts`) | Not reachable at runtime (it only parses our own config) | Upgrade to Prisma 7 |
| Next.js 15 bundles PostCSS < 8.5.10 | Only relevant when processing untrusted CSS at build time; not the case here | Upgrade to Next 16 |
| No antivirus scan on uploads | Admin-only uploads; type checked by content | Optional: S3 → GuardDuty Malware Protection for S3 |
| Member photo uploads not available | n/a | When added, reuse the same sniff/limit pipeline with a smaller size cap |
