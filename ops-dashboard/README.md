# Ops Dashboard (local-only)

This is a small, self-contained dashboard intended for VPS operators (non-technical friendly):
- Shows service health checks
- Shows integration keys as **set/unset** (masked)
- Shows certificate expiry (reads LetsEncrypt volume)

It is bound to `127.0.0.1` in production compose by default.

Access:
- On the VPS: `curl -fsS http://127.0.0.1:8090/`
- From your laptop (SSH tunnel):
  - `ssh -L 8090:127.0.0.1:8090 root@YOUR_SERVER_IP`
  - Open: `http://localhost:8090/`

## Development (local)

To run the dashboard locally (dev):

- Start (dev):
  - `docker compose up -d --build ops-dashboard`
  - or use helper scripts in the repo root: `scripts/run-ops-dashboard.sh` / `.ps1` / `.bat`
- Dev URL: `http://127.0.0.1:8090/` (API: `http://127.0.0.1:8090/api/status`)

Useful environment variables (dev-friendly defaults):
- `BACKEND_URL` — (default `http://backend-api:4000`) used for backend health checks
- `NGINX_URL` — (default `http://Project-nginx`)
- `DOMAIN_ROOT` — (default `localhost`)

Notes:
- In dev the service attaches to the internal docker network so it can reach other containers by name.
- In production the dashboard reads LetsEncrypt certs from the `letsencrypt` volume and expects to be bound to `127.0.0.1`.

