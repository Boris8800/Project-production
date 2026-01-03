# Project (Production)

Production-ready monorepo scaffold for:
- **yourdomain.com** (customer booking)
- **driver.yourdomain.com** (driver panel)
- **admin.yourdomain.com** (admin panel)
- **api.yourdomain.com** (NestJS API)

## What’s in this repo (initial scaffold)
- Docker Compose (production) for Nginx + Frontend (Next.js) + API + Postgres + Redis
- Nginx reverse proxy layout (per-subdomain configs)
- Env templates for production/development
- Scripts directory (deploy/SSL/backup to be filled next)

## About the two frontends
- `frontend/` is the **main** website (Next.js) served on port **3000** and proxied by Nginx for `yourdomain.com`, `admin.yourdomain.com`, and `driver.yourdomain.com`.
- `transfer-line-travel/` is a **separate Vite prototype** (development/experiments) and is **not** wired into the production Nginx/Docker routing.

## Next steps (you will run on the VPS)
1. Point DNS A records to **5.249.164.40** for: `@`, `www`, `api`, `driver`, `admin`.
2. Copy `.env.production.example` to `.env.production` and replace secrets/passwords.
3. Run: `sudo bash scripts/all.sh deploy`.

The deploy script will also:
- Install Docker + Docker Compose
- Enable UFW (22/80/443)
- Enable unattended upgrades
- Enable and configure Fail2ban (basic SSH jail)
- Harden SSH (key-only auth + disable root login) if an `authorized_keys` file is detected

## Security note
Do **not** commit real secrets. Commit `.env.production.example` only; keep `.env.production` on the server.

---

## Local development & Ops Dashboard (dev) 🔧

To run the Ops Dashboard locally (dev mode, attached to dev compose):

- Start the dashboard (dev):
  - `docker compose up -d --build ops-dashboard`
  - or use helper scripts: `scripts/run-ops-dashboard.sh` (mac/linux), `scripts/run-ops-dashboard.ps1` (PowerShell), `scripts/run-ops-dashboard.bat` (Windows)
- Open: `http://127.0.0.1:8090/` (API: `http://127.0.0.1:8090/api/status`)

Environment variables (dev defaults):
- `BACKEND_URL` — default: `http://backend-api:4000` (used for health checks)
- `NGINX_URL` — default: `http://Project-nginx`
- `DOMAIN_ROOT` — default: `localhost`

Notes:
- The dev dashboard attaches to the Compose `internal` network so it resolves container hostnames (recommended for editing).
- The production dashboard runs from `docker-compose.production.yml` and is intended for server environments.

