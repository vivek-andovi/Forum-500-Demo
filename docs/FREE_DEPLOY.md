# Free deployment (Neon + Render + Vercel + Cloudflare R2)

A $0 setup for demos and early users. The AWS setup in [AWS_SETUP.md](AWS_SETUP.md) is the production path. Nothing in the code changes between the two, only environment variables.

| Piece | Free service | Free limit | Catch |
|---|---|---|---|
| Postgres | **Neon** | 0.5 GB storage | Sleeps when idle and wakes in about 1 s |
| API (`backends`) | **Render** web service (Docker) | 750 h/month, 512 MB RAM | Sleeps after 15 min idle, so the first request takes about 50 s |
| Uploads | **Cloudflare R2** | 10 GB, no egress fees | Cloudflare asks for a card on file but does not charge within the free limit |
| Member app (`frontends/web`) | **Vercel** Hobby | Non-commercial use | Commercial use needs Vercel Pro |
| Admin portal (`frontends/admin`) | **Vercel** Hobby | Same | Same |
| Email | none (`MAIL_DRIVER=log`) | – | Invite and reset emails are only printed in the Render log |

Accounts needed: GitHub, Neon, Render, Vercel and Cloudflare. All of them let you sign up with GitHub.

---

## 1. Push the repo to GitHub
```bash
cd "Forum Club/Monorepo"
git add -A && git commit -m "Initial commit"
gh auth login                                   # or create the repo on github.com
gh repo create forum500 --private --source . --push
```

## 2. Database: Neon
1. Go to neon.tech, create a project called `forum500` and pick a region near your users. Use AWS eu-west-2 (London) if they are in the UK.
2. Under **Connect**, turn **Connection pooling off** and copy the string. It looks like
   `postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require`
3. Create the tables and load the starting content from your Mac:
   ```bash
   cd backends
   DATABASE_URL='<neon string>' npx prisma migrate deploy
   DATABASE_URL='<neon string>' npm run db:seed     # only on this empty DB: the seed wipes all tables
   ```
   The seed creates `admin@forum500.club` / `Admin@12345`. **Change that password straight after your first login.** If you want an empty site instead, skip the seed and run `DATABASE_URL=... npm run admin:create`.

## 3. Uploads: Cloudflare R2
1. Go to dash.cloudflare.com → **R2** → **Create bucket** and name it `forum500-uploads`.
2. Open the bucket → **Settings** → **Public access** → enable the **r2.dev subdomain**. Copy the `https://pub-….r2.dev` URL; this is `ASSET_PUBLIC_BASE_URL`.
3. In the same Settings page, open **CORS policy** and paste the policy below. Fill in the Vercel URLs after step 5.
   ```json
   [{ "AllowedOrigins": ["https://<web>.vercel.app", "https://<admin>.vercel.app"],
      "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```
4. Go to **R2** → **Manage API tokens** → **Create token** with *Object Read & Write* on this bucket. Copy the **Access Key ID**, the **Secret Access Key** and the S3 endpoint `https://<account-id>.r2.cloudflarestorage.com`.

## 4. API: Render
1. Go to render.com → **New** → **Blueprint**, pick the GitHub repo, and Render will read [`render.yaml`](../render.yaml).
2. Fill in the values it asks for:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Neon string from step 2 |
   | `S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | from step 3.4 |
   | `ASSET_PUBLIC_BASE_URL` | r2.dev URL from step 3.2 |
   | `PUBLIC_API_URL` | `https://forum500-api.onrender.com` (the service URL) |
   | `CORS_ORIGINS`, `WEB_APP_URL`, `ADMIN_APP_URL` | put `https://example.com` for now and update them after step 5 |
3. When the deploy finishes, `https://forum500-api.onrender.com/api/health` should return OK. `JWT_SECRET` is generated for you.

## 5. Frontends: Vercel (two projects from the same repo)
For each app: vercel.com → **Add New Project** → import the repo, then set:

| | Member app | Admin portal |
|---|---|---|
| Root Directory | `frontends/web` | `frontends/admin` |
| Env `NEXT_PUBLIC_API_URL` | `https://forum500-api.onrender.com/api` | same |

Vercel only rebuilds a project when files under its root directory change. To turn this on, go to Settings → Git → *Ignored Build Step* and choose "Only build if there are changes in the root directory".

## 6. Connect everything
1. In Render → Environment, set the following, then save. Render redeploys after you save.
   - `CORS_ORIGINS=https://<web>.vercel.app,https://<admin>.vercel.app`
   - `WEB_APP_URL=https://<web>.vercel.app`
   - `ADMIN_APP_URL=https://<admin>.vercel.app`
2. Put the same two Vercel URLs into the R2 CORS policy (step 3.3).
3. Log in to the admin portal and change the admin password.

## Keeping the API awake (optional)
A free uptime monitor such as UptimeRobot or cron-job.org can call `/api/health` every 10 minutes. This keeps Render from sleeping and still fits inside the 750 free hours a month.

## Moving to AWS later
Run `pg_dump` against Neon and restore the dump into RDS. Copy the R2 bucket to S3 with `rclone`. Then follow [AWS_SETUP.md](AWS_SETUP.md).
