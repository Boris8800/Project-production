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

### Domain & SSL — Guide & Troubleshooting ✅

Use `bash scripts/all.sh setup-ssl` to bootstrap SSL for your domain. The script includes runtime flags and diagnostics to simplify setup and troubleshooting.

Common usage examples

- Print computed domains (quick sanity check):

  ```sh
  bash scripts/all.sh setup-ssl --print-domains
  ```

- Dry-run checks without requesting certificates:

  ```sh
  bash scripts/all.sh setup-ssl --dry-run
  ```

- Wait for DNS propagation (e.g., wait 10 minutes):

  ```sh
  bash scripts/all.sh setup-ssl --wait-for-dns 600
  ```

- Force dummy certs (useful if DNS can't be pointed yet):

  ```sh
  bash scripts/all.sh setup-ssl --skip-letsencrypt
  ```

- Run a smoke test for HTTP/HTTPS reachability for the computed domains:

  ```sh
  bash scripts/all.sh setup-ssl --smoke-test
  # or run directly
  bash scripts/check-domains.sh <yourdomain> www.<yourdomain> api.<yourdomain> admin.<yourdomain> driver.<yourdomain>
  ```

Troubleshooting checklist

1) Verify DNS A records exist for the root and subdomains (A records for @, www, api, admin, driver).
2) Use `dig +short <host>` or `nslookup <host>` to check propagation.
3) If propagation is slow, run `--wait-for-dns` with a generous timeout (e.g., 600).
4) Non-interactive runs default to dummy certs when DNS is not ready; re-run with DNS fixed to obtain real certs.
5) If your VPS is behind a firewall/NAT, ensure ports 80 and 443 are reachable from the public internet.

CI smoke-tests

We added an optional GitHub Actions workflow that can run `scripts/check-domains.sh` on push/schedule or manually. It expects a repository secret `SMOKE_TEST_DOMAINS` (space-separated list of domains to test) or can be triggered manually with inputs.

VPS validation helper

There's also a helper script `scripts/vps-setup-validate.sh` you can run on the VPS to pull the latest code, run the smoke-test locally, and optionally run `setup-ssl` in `--dry-run` mode.  

If you'd like, enable the GitHub Action and set `SMOKE_TEST_DOMAINS` in your repository secrets so the workflow can verify reachability automatically.

## Monitoring
Start monitoring stack:
- `docker compose -f docker-compose.monitoring.yml up -d`

Grafana runs on the internal docker network by default. Expose it only via SSH tunnel or add an Nginx site later.
