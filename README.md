# Project (Production)

Production-ready monorepo scaffold for:
- **yourdomain.com** (customer booking)
- **driver.yourdomain.com** (driver panel)
- **admin.yourdomain.com** (admin panel)
- **api.yourdomain.com** (NestJS API)

## What’s in this repo (initial scaffold)
- Docker Compose (production) for Nginx + API + Postgres + Redis (frontend runs on the host in production)
- Nginx reverse proxy layout (per-subdomain configs)
- Env templates for production/development
- Scripts directory (deploy/SSL/backup to be filled next)

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
