#!/usr/bin/env bash
# Helper to run on the VPS to update repo, run smoke tests and optionally dry-run setup-ssl
set -euo pipefail

print() { printf '%s
' "$*"; }

if [ "$EUID" -ne 0 ]; then
  print "Warning: run this script as root or using sudo on the VPS."
fi

REPO_DIR="${REPO_DIR:-/opt/Project-production}"
SMOKE_SCRIPT="${SMOKE_SCRIPT:-./scripts/check-domains.sh}"

print "Updating repo in ${REPO_DIR}..."
git -C "${REPO_DIR}" pull origin main

print "Running smoke test for computed domains..."
# Load .env.production to compute DOMAIN_ROOT if present
if [ -f "${REPO_DIR}/.env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${REPO_DIR}/.env.production"
  set +a
fi

cd "${REPO_DIR}"
DOMAIN_ROOT="${DOMAIN_ROOT:-${DOMAIN:-yourdomain.com}}"
DOMAIN_ROOT="$(echo "${DOMAIN_ROOT}" | sed -e 's~^https\?://~~' -e 's~/.*~~' -e 's/:.*$//' -e 's/^www\.//' | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]' | sed 's/\.$//')"
DOMAINS=("${DOMAIN_ROOT}" "www.${DOMAIN_ROOT}" "api.${DOMAIN_ROOT}" "driver.${DOMAIN_ROOT}" "admin.${DOMAIN_ROOT}")

print "Domains: ${DOMAINS[*]}"

if [ -x "${SMOKE_SCRIPT}" ]; then
  "${SMOKE_SCRIPT}" "${DOMAINS[@]}" || true
else
  print "Smoke script not found or not executable: ${SMOKE_SCRIPT}"
fi

print "You can also run a dry-run of setup-ssl:"
print "  sudo bash scripts/all.sh setup-ssl --dry-run"
print "If all looks good, run the real setup:"
print "  sudo bash scripts/all.sh setup-ssl"
