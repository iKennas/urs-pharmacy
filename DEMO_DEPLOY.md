# URS Pharmacy — Client Demo Deployment

Same stack idea as the accounting demo: **static frontend** + **Railway** (API + Postgres).

| Piece | Where | URL |
|-------|-------|------|
| Frontend (primary) | Firebase Hosting (free) | https://kennas0023.web.app |
| Frontend (also) | Cloudflare Pages (free) | https://urs-pharmacy.pages.dev |
| Backend + DB | Railway (trial → ~$5/mo) | https://backend-production-f186.up.railway.app |

## What the client opens

Send them: **https://kennas0023.web.app**

| Role | Email | Password |
|------|-------|----------|
| Platform Super Admin | `admin@urs-platform.sa` | `AdminPass123!` |
| Pharmacy GM | `a.harbi@urs-pharma.sa` | `Password123!` |

## How deploys work

1. **Backend** — Railway project `urs-pharmacy`, GitHub `iKennas/urs-pharmacy`. `railway up` or push to `main` rebuilds; preDeploy runs `prisma db push` + seed.
2. **Frontend** — rebuild with API URL then deploy:
   ```bash
   cd prototype
   set VITE_API_URL=https://backend-production-f186.up.railway.app/api
   npm run build
   npx firebase deploy --only hosting --project prototype-kennas
   # optional also:
   npx wrangler pages deploy dist --project-name=urs-pharmacy
   ```

## Env (already set)

**Railway backend:** `DATABASE_URL` (from Postgres), `JWT_SECRET`, `JWT_EXPIRES_IN=8h`

**Frontend build:** `VITE_API_URL=https://backend-production-f186.up.railway.app/api`
