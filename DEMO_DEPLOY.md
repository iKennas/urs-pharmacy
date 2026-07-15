# URS Pharmacy — Client Demo Deployment

Same stack as the accounting demo (`copies/accounting`): Cloudflare Pages (frontend) + Railway (API + Postgres).

| Piece | Where | Cost |
|-------|-------|------|
| Frontend | Cloudflare Pages | Free |
| Backend + DB | Railway | Trial credit, then ~$5/mo Hobby |

## How deploys work

1. **Backend** — Railway watches `main` on GitHub. Root directory = `backend`. On deploy: build → `prisma db push` + seed → `node dist/main.js`.
2. **Frontend** — GitHub Action builds `prototype/` and deploys to Cloudflare Pages project `urs-pharmacy`, or deploy locally with wrangler.

## Demo logins (after seed)

| Role | Email | Password |
|------|-------|----------|
| Platform Super Admin | `admin@urs-platform.sa` | `AdminPass123!` |
| Pharmacy GM | `a.harbi@urs-pharma.sa` | `Password123!` |

## Env

**Railway (backend):** `DATABASE_URL` (from Postgres plugin), `JWT_SECRET`, `JWT_EXPIRES_IN=8h`

**Cloudflare / GitHub Actions:** `VITE_API_URL=https://<railway-public-url>/api`
