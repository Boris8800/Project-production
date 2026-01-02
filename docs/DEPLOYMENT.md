# Deployment (Production)

## DNS
Point these records to `5.249.164.40`:
- `A @` → `5.249.164.40`
- `A www` → `5.249.164.40`
- `A api` → `5.249.164.40`
- `A driver` → `5.249.164.40`
- `A admin` → `5.249.164.40`

## VPS install path
Recommended: `/opt/Project-production`

## One-command deploy
1. Copy repo to VPS.
2. Copy `.env.production.example` to `.env.production` on the VPS, then set real secrets.
3. Run:
   - `sudo bash scripts/all.sh deploy`

## Frontend runs in Docker (production)
Production `docker-compose.production.yml` includes the Next.js frontend as a container.
Nginx (in Docker) proxies web traffic to the `frontend` service on port `3000`.

Notes:
- You do not need Node.js installed on the VPS for the frontend.
- If the frontend container is down, you will see 502 errors on the web domains.

## Fresh VPS deploy (from scratch)
On a clean Ubuntu/Debian VPS, this installs prerequisites, clones into `/opt/Project-production`, prepares `.env.production`, then deploys:
- `sudo bash scripts/all.sh vps-deploy-fresh 5.249.164.40`

## Updating on the server (automatic)
To update code from GitHub and redeploy in one command, use the deploy script with repo sync enabled:
- `sudo SYNC_REPO=true bash scripts/all.sh deploy`

By default it stashes local changes, syncs to `origin/main`, then deploys.
If you want to discard local changes instead:
- `sudo SYNC_REPO=true FORCE_RESET=true bash scripts/all.sh deploy`

### Helpful flags
- Auto-generate required secrets (replaces placeholder values in `.env.production`):
   - `sudo AUTO_GENERATE_SECRETS=true bash scripts/all.sh deploy`
- Start with self-signed (dummy) certs and skip Let's Encrypt issuance (useful before DNS points to the VPS):
   - `sudo SKIP_LETSENCRYPT=true bash scripts/all.sh deploy`

Optional:
- Start monitoring too: `sudo START_MONITORING=true bash scripts/all.sh deploy`

## VPS management helper
For quick status/logs/health/restart on the VPS:
- `sudo bash scripts/all.sh menu status`
- `sudo bash scripts/all.sh menu health`
- `sudo bash scripts/all.sh menu logs backend-api`
- `sudo bash scripts/all.sh menu restart`

## TLS
TLS is bootstrapped by `bash scripts/all.sh setup-ssl` using Let’s Encrypt **webroot** validation.
It requests individual certs for each hostname and reloads Nginx.

## Monitoring
Start monitoring stack:
- `docker compose -f docker-compose.monitoring.yml up -d`

Grafana runs on the internal docker network by default. Expose it only via SSH tunnel or add an Nginx site later.
