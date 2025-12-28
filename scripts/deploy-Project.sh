#!/usr/bin/env bash
# Rapid Roads Taxi System - Production Deployment Script
# Domain: rapidroad.uk
# VPS IP: 5.249.164.40

set -euo pipefail

DOMAIN="${DOMAIN:-rapidroad.uk}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@rapidroad.uk}"
START_MONITORING="${START_MONITORING:-false}"
AUTO_GENERATE_SECRETS="${AUTO_GENERATE_SECRETS:-false}"
SKIP_LETSENCRYPT="${SKIP_LETSENCRYPT:-false}"
APP_ONLY="${APP_ONLY:-false}"

# Optional: update repo before deploying (replaces scripts/update-and-deploy.sh)
SYNC_REPO="${SYNC_REPO:-false}"
AUTO_STASH="${AUTO_STASH:-true}"
FORCE_RESET="${FORCE_RESET:-false}"
AUTO_DNS_CHECK="${AUTO_DNS_CHECK:-true}"

supports_color() {
  [ -t 1 ] || return 1
  [ -n "${NO_COLOR:-}" ] && return 1
  [ "${TERM:-}" = "dumb" ] && return 1
  return 0
}

if supports_color; then
  _ESC=$'\033'
  C_RESET="${_ESC}[0m"
  C_BOLD="${_ESC}[1m"
  C_RED="${_ESC}[91m"
  C_YELLOW="${_ESC}[93m"
  C_BLUE="${_ESC}[94m"
  C_CYAN="${_ESC}[96m"
else
  C_RESET=""
  C_BOLD=""
  C_RED=""
  C_YELLOW=""
  C_BLUE=""
  C_CYAN=""
fi

_print_plain() { printf '%s\n' "$*"; }

print() {
  local msg="$*"
  if [ -n "${C_RESET}" ]; then
    if [[ "${msg}" =~ ^==.*==$ ]]; then
      _print_plain "${C_BOLD}${C_CYAN}${msg}${C_RESET}"
      return 0
    fi
    if [[ "${msg}" =~ ^\[update\] ]] || [[ "${msg}" =~ ^\[deploy\] ]]; then
      _print_plain "${C_BOLD}${C_CYAN}${msg}${C_RESET}"
      return 0
    fi
    if [[ "${msg}" =~ ^Missing\ required\ command: ]] || [[ "${msg}" =~ ^Unsupported\ architecture ]] || [[ "${msg}" =~ ^Docker\ Compose\ installation\ failed ]] || [[ "${msg}" =~ ^Missing\ \.env\.production ]]; then
      _print_plain "${C_BOLD}${C_RED}${msg}${C_RESET}"
      return 0
    fi
  fi
  _print_plain "${msg}"
}

# Simple, user-friendly progress display (step-based %).
TOTAL_STEPS=15
STEP=0

step() {
  STEP=$((STEP + 1))
  # shellcheck disable=SC2004
  local pct=$(( (STEP * 100) / TOTAL_STEPS ))
  if [ -n "${C_RESET}" ]; then
    printf '%s[%3s%%] %s%s\n' "${C_BOLD}${C_BLUE}" "${pct}" "$*" "${C_RESET}"
  else
    printf '[%3s%%] %s\n' "${pct}" "$*"
  fi
}

is_interactive() {
  [ -t 0 ] && [ -t 1 ]
}

prompt_yes_no() {
  local prompt="$1"
  local default_yes="${2:-true}"

  if ! is_interactive; then
    return 1
  fi

  local suffix
  if [ "${default_yes}" = "true" ]; then
    suffix="[Y/n]"
  else
    suffix="[y/N]"
  fi

  local reply
  while true; do
    printf '%s %s: ' "${prompt}" "${suffix}" >&2
    read -r reply || true
    reply="${reply:-}"

    if [ -z "${reply}" ]; then
      [ "${default_yes}" = "true" ] && return 0
      return 1
    fi

    case "${reply}" in
      y|Y|yes|YES) return 0 ;;
      n|N|no|NO) return 1 ;;
      *) print "Please answer y/n." >&2 ;;
    esac
  done
}

open_editor_if_possible() {
  local file="$1"

  if ! is_interactive; then
    return 1
  fi

  if command -v nano >/dev/null 2>&1; then
    nano "${file}"
    return 0
  fi

  if command -v vim >/dev/null 2>&1; then
    vim "${file}"
    return 0
  fi

  if command -v vi >/dev/null 2>&1; then
    vi "${file}"
    return 0
  fi

  return 1
}

env_has_placeholders() {
  local file="$1"
  grep -Eq 'ChangeMe_|secure_password_here|your_jwt_secret_here|your_refresh_secret_here' "${file}"
}

is_root() {
  [ "$(id -u)" -eq 0 ]
}

require_cmd() {
  local cmd="$1"
  command -v "${cmd}" >/dev/null 2>&1 || { print "Missing required command: ${cmd}" >&2; exit 1; }
}

repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P
}

record_last_deploy_commit() {
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    return
  fi
  git rev-parse HEAD > .Project_last_deploy_commit 2>/dev/null || true
}

ensure_on_main_branch() {
  if git show-ref --verify --quiet refs/heads/main; then
    git checkout -q main
    return
  fi
  if git show-ref --verify --quiet refs/remotes/origin/main; then
    git checkout -q -b main origin/main
    return
  fi
  git checkout -q -b main
}

sync_repo_to_origin_main() {
  if [ "${SYNC_REPO}" != "true" ]; then
    return 0
  fi

  require_cmd git

  local root
  root="$(repo_root)"
  cd "${root}"

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    print "[update] Not a git repository: ${root} (skipping SYNC_REPO)" >&2
    return 0
  fi

  if [ ! -w . ]; then
    print "[update] No write access to repo; cannot SYNC_REPO. Fix ownership or run as deploy user." >&2
    exit 1
  fi

  record_last_deploy_commit

  print "[update] Syncing to origin/main"
  git fetch -q origin

  if ! git show-ref --verify --quiet refs/remotes/origin/main; then
    print "[update] origin/main not found. Check remote: git remote -v" >&2
    exit 1
  fi

  ensure_on_main_branch

  if ! git diff-index --quiet HEAD --; then
    if [ "${FORCE_RESET}" = "true" ]; then
      print "[update] FORCE_RESET=true: discarding local changes"
      git reset --hard -q
      git clean -fd -q
    elif [ "${AUTO_STASH}" = "true" ]; then
      print "[update] Stashing local changes"
      git stash push -u -m "server-local-changes-$(date -u +%Y%m%dT%H%M%SZ)" >/dev/null
    else
      print "[update] Working tree is dirty; set AUTO_STASH=true or FORCE_RESET=true" >&2
      git status --porcelain
      exit 1
    fi
  fi

  git reset --hard -q origin/main
}

resolve_ipv4() {
  local host="$1"

  if command -v dig >/dev/null 2>&1; then
    dig +short "${host}" A | head -n 1
    return 0
  fi
  if command -v getent >/dev/null 2>&1; then
    getent ahostsv4 "${host}" 2>/dev/null | awk 'NR==1{print $1}'
    return 0
  fi
  if command -v nslookup >/dev/null 2>&1; then
    nslookup "${host}" 2>/dev/null | awk '/^Address: /{print $2}' | head -n 1
    return 0
  fi
  return 1
}

detect_public_ip() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS https://api.ipify.org || true
  fi
}

auto_set_skip_letsencrypt() {
  # Respect explicit user choice
  if [ -n "${SKIP_LETSENCRYPT+x}" ]; then
    return
  fi
  if [ "${AUTO_DNS_CHECK}" != "true" ]; then
    return
  fi

  if [ ! -f ./.env.production ]; then
    print "[dns] .env.production not found; defaulting SKIP_LETSENCRYPT=true"
    export SKIP_LETSENCRYPT=true
    return
  fi

  set -a
  # shellcheck disable=SC1091
  . ./.env.production
  set +a

  local domain_root
  domain_root="${DOMAIN_ROOT:-${DOMAIN:-rapidroad.uk}}"

  local expected_ip
  expected_ip="${VPS_IP:-}"
  if [ -z "${expected_ip}" ]; then
    expected_ip="$(detect_public_ip)"
  fi

  if [ -z "${expected_ip}" ]; then
    print "[dns] Could not determine server public IP (set VPS_IP in .env.production)."
    print "[dns] Defaulting SKIP_LETSENCRYPT=true"
    export SKIP_LETSENCRYPT=true
    return
  fi

  local domains=(
    "${domain_root}"
    "www.${domain_root}"
    "api.${domain_root}"
    "driver.${domain_root}"
    "admin.${domain_root}"
  )

  local ok=true
  local d resolved
  for d in "${domains[@]}"; do
    resolved="$(resolve_ipv4 "${d}" || true)"
    if [ -z "${resolved}" ] || [ "${resolved}" != "${expected_ip}" ]; then
      ok=false
      print "[dns] ${d} -> ${resolved:-<no A record>} (expected ${expected_ip})"
    fi
  done

  if [ "${ok}" = true ]; then
    print "[dns] DNS matches server IP (${expected_ip}). Using Let's Encrypt."
    export SKIP_LETSENCRYPT=false
  else
    print "[dns] DNS not ready. Using dummy certs (SKIP_LETSENCRYPT=true)."
    print "[dns] Re-run once DNS points to ${expected_ip} to request real certs."
    export SKIP_LETSENCRYPT=true
  fi
}

require_root_unless_app_only() {
  if is_root; then
    return 0
  fi

  if [ "${APP_ONLY}" = "true" ]; then
    return 0
  fi

  print "Run as root (sudo), or set APP_ONLY=true to deploy containers only." >&2
  exit 1
}

install_base_packages() {
  apt-get update
  apt-get install -y ca-certificates curl gnupg lsb-release ufw fail2ban unattended-upgrades openssl
}

ensure_env_kv() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -qE "^${key}=" "${file}"; then
    # Escape sed replacement string
    local escaped
    escaped="$(printf '%s' "${value}" | sed 's/[\\&]/\\\\&/g')"
    sed -i "s|^${key}=.*$|${key}=${escaped}|" "${file}"
  else
    printf '\n%s=%s\n' "${key}" "${value}" >>"${file}"
  fi
}

autofill_env_secrets_if_requested() {
  local file="$1"

  if [ "${AUTO_GENERATE_SECRETS}" != "true" ]; then
    return
  fi

  if ! grep -Eq 'ChangeMe_|secure_password_here|your_jwt_secret_here|your_refresh_secret_here' "${file}"; then
    return
  fi

  print "[deploy] AUTO_GENERATE_SECRETS=true: generating secrets in .env.production"

  # Use hex to avoid special chars that could break .env parsing.
  ensure_env_kv "${file}" "POSTGRES_PASSWORD" "$(openssl rand -hex 32)"
  ensure_env_kv "${file}" "JWT_SECRET" "$(openssl rand -hex 64)"
  ensure_env_kv "${file}" "JWT_REFRESH_SECRET" "$(openssl rand -hex 64)"
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    return
  fi
  curl -fsSL https://get.docker.com | sh
}

install_docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    return
  fi

  print "[deploy] Installing Docker Compose plugin"

  # Prefer distro package if available.
  apt-get update
  if apt-get install -y docker-compose-plugin >/dev/null 2>&1; then
    return
  fi

  # Fallback: install compose v2 as a Docker CLI plugin.
  # Uses GitHub release assets; keep this as a best-effort fallback.
  local arch
  arch="$(uname -m)"
  case "${arch}" in
    x86_64|amd64) arch="x86_64" ;;
    aarch64|arm64) arch="aarch64" ;;
    *)
      print "Unsupported architecture for compose fallback: ${arch}" >&2
      exit 1
      ;;
  esac

  local version plugin_dir
  version="v2.29.2"
  plugin_dir="/usr/local/lib/docker/cli-plugins"
  mkdir -p "${plugin_dir}"
  curl -fL "https://github.com/docker/compose/releases/download/${version}/docker-compose-linux-${arch}" -o "${plugin_dir}/docker-compose"
  chmod +x "${plugin_dir}/docker-compose"

  if ! docker compose version >/dev/null 2>&1; then
    print "Docker Compose installation failed" >&2
    exit 1
  fi
}

ports_in_use_80_443() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk 'NR==1 || $4 ~ /:80$|:443$/' | tail -n +2 | grep -q .
    return $?
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -lntp 2>/dev/null | awk 'NR==1 || $4 ~ /:80$|:443$/' | tail -n +3 | grep -q .
    return $?
  fi
  return 1
}

free_ports_80_443_if_needed() {
  if ! ports_in_use_80_443; then
    return 0
  fi

  print "[deploy] Ports 80/443 appear to be in use (apache/nginx/caddy?)."
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp | awk 'NR==1 || $4 ~ /:80$|:443$/' || true
  elif command -v netstat >/dev/null 2>&1; then
    netstat -lntp | awk 'NR==1 || $4 ~ /:80$|:443$/' || true
  fi

  if ! is_interactive; then
    print "[deploy] Non-interactive mode: cannot auto-stop services. Stop them and re-run." >&2
    return 1
  fi

  if ! prompt_yes_no "Stop common services using 80/443 now (apache2/nginx/caddy/lighttpd)?" true; then
    return 1
  fi

  if command -v systemctl >/dev/null 2>&1; then
    for svc in apache2 nginx caddy lighttpd httpd; do
      if systemctl list-unit-files "${svc}.service" >/dev/null 2>&1; then
        systemctl stop "${svc}" >/dev/null 2>&1 || true
        systemctl disable "${svc}" >/dev/null 2>&1 || true
      fi
    done
  else
    print "[deploy] systemctl not found; cannot auto-stop services." >&2
    return 1
  fi

  if ports_in_use_80_443; then
    print "[deploy] Ports 80/443 are still in use. Please stop the process manually and re-run." >&2
    return 1
  fi

  return 0
}

ensure_env_file() {
  if [ -f ./.env.production ]; then
    # Basic safety check for placeholder secrets
    autofill_env_secrets_if_requested ./.env.production

    if env_has_placeholders ./.env.production; then
      if [ "${AUTO_GENERATE_SECRETS}" = "true" ]; then
        # already attempted autofill, but keep going if it succeeded
        if env_has_placeholders ./.env.production; then
          print "[deploy] .env.production still contains placeholder values after AUTO_GENERATE_SECRETS=true." >&2
          print "[deploy] Edit .env.production and replace placeholders." >&2
          exit 1
        fi
        return
      fi

      print "[deploy] .env.production still contains placeholder values." >&2
      print "[deploy] This is normal on first deploy. We can auto-generate safe secrets now." >&2

      if prompt_yes_no "Auto-generate secrets now (recommended)?" true; then
        AUTO_GENERATE_SECRETS=true
        autofill_env_secrets_if_requested ./.env.production
      else
        print "[deploy] Opening .env.production for editing." >&2
        if ! open_editor_if_possible ./.env.production; then
          print "[deploy] No editor found (nano/vim). Edit the file manually: ./.env.production" >&2
        fi
      fi

      if env_has_placeholders ./.env.production; then
        print "[deploy] .env.production still contains placeholder values." >&2
        print "[deploy] Please replace them, then re-run deploy." >&2
        exit 1
      fi
    fi
    return
  fi

  if [ ! -f ./.env.production.example ]; then
    print "Missing .env.production and .env.production.example" >&2
    exit 1
  fi

  cp ./.env.production.example ./.env.production
  print "[deploy] Created .env.production from .env.production.example"
  print "[deploy] Next: set secrets (auto-generate recommended)"

  if prompt_yes_no "Auto-generate secrets in .env.production now?" true; then
    AUTO_GENERATE_SECRETS=true
    autofill_env_secrets_if_requested ./.env.production
  else
    print "[deploy] Opening .env.production for editing." >&2
    if ! open_editor_if_possible ./.env.production; then
      print "[deploy] No editor found (nano/vim). Edit the file manually: ./.env.production" >&2
    fi
  fi

  if env_has_placeholders ./.env.production; then
    print "[deploy] .env.production still contains placeholder values." >&2
    print "[deploy] Please replace them, then re-run deploy." >&2
    exit 1
  fi
}

enable_firewall() {
  # Safe defaults
  ufw default deny incoming
  ufw default allow outgoing

  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
}

enable_services() {
  if ! command -v systemctl >/dev/null 2>&1; then
    return
  fi

  # Ensure Docker starts on boot
  systemctl enable --now docker >/dev/null 2>&1 || true

  # Enable Fail2ban if installed
  if command -v fail2ban-client >/dev/null 2>&1; then
    systemctl enable --now fail2ban >/dev/null 2>&1 || true
  fi
}

configure_fail2ban() {
  if ! command -v fail2ban-client >/dev/null 2>&1; then
    return
  fi

  mkdir -p /etc/fail2ban/jail.d

  local jail_file
  jail_file="/etc/fail2ban/jail.d/Project-sshd.conf"

  # Only write if not already present (don't clobber server-specific tuning)
  if [ ! -f "${jail_file}" ]; then
    cat >"${jail_file}" <<'EOF'
[sshd]
enabled = true
port = ssh
mode = normal
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
EOF
  fi

  if command -v systemctl >/dev/null 2>&1; then
    systemctl restart fail2ban >/dev/null 2>&1 || true
  fi
}

ensure_ssh_keys_present() {
  # Guardrail: don't disable password auth unless there's at least one public key installed.
  if [ -f /root/.ssh/authorized_keys ] && [ -s /root/.ssh/authorized_keys ]; then
    return
  fi
  if ls /home/*/.ssh/authorized_keys >/dev/null 2>&1; then
    # Any non-empty authorized_keys counts
    if awk 'BEGIN{found=0} { if (length($0)>0) found=1 } END{ exit(found?0:1) }' /home/*/.ssh/authorized_keys 2>/dev/null; then
      return
    fi
  fi
  return 1
}

harden_ssh() {
  if [ ! -f /etc/ssh/sshd_config ]; then
    return
  fi

  if ! ensure_ssh_keys_present; then
    print "[deploy] SSH hardening skipped: no authorized_keys found (would risk lockout)."
    print "[deploy] Add your SSH key first, then re-run this script to harden SSH."
    return
  fi

  mkdir -p /etc/ssh/sshd_config.d
  cat >/etc/ssh/sshd_config.d/99-Project.conf <<'EOF'
# RapidRoads hardening (managed by scripts/deploy-Project.sh)
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
EOF

  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload ssh >/dev/null 2>&1 || systemctl restart ssh >/dev/null 2>&1 || true
  fi
}

enable_auto_updates() {
  dpkg-reconfigure -f noninteractive unattended-upgrades || true
}

main() {
  require_root_unless_app_only

  step "Updating code from GitHub (optional)"
  sync_repo_to_origin_main

  print "== Rapid Roads Production Deploy =="
  print "Domain: ${DOMAIN}"
  print "Email:  ${EMAIL}"
  print "Auto-generate secrets: ${AUTO_GENERATE_SECRETS}"
  print "Skip Let's Encrypt:     ${SKIP_LETSENCRYPT}"
  print
  print "Tip: If deploy pauses for questions, answer Y/N."
  print "Tip: If DNS is not ready, use SKIP_LETSENCRYPT=true."
  print

  if [ "${APP_ONLY}" != "true" ]; then
    step "Installing base packages (ufw, fail2ban, openssl, curl)"
    install_base_packages

    step "Checking ports 80/443 (freeing if needed)"
    free_ports_80_443_if_needed || true

    step "Installing Docker (if needed)"
    install_docker

    step "Installing Docker Compose plugin (if needed)"
    install_docker_compose

    step "Configuring firewall (UFW: allow 22/80/443)"
    enable_firewall

    step "Enabling automatic security updates"
    enable_auto_updates

    step "Enabling system services (docker, fail2ban)"
    enable_services

    step "Configuring fail2ban"
    configure_fail2ban

    step "Hardening SSH (only if SSH keys exist)"
    harden_ssh

    step "Making scripts executable"
    chmod +x scripts/*.sh || true

    step "Installing daily backup cron (template)"
    if [ -f backups/schedule/cron.d.Project-backup.example ]; then
      install -m 0644 backups/schedule/cron.d.Project-backup.example /etc/cron.d/Project-backup
    fi
  else
    step "APP_ONLY=true: skipping system setup (packages/firewall/ssh)"
  fi

  step "Preparing .env.production (secrets + domain config)"
  ensure_env_file

    auto_set_skip_letsencrypt

    # Docker Compose variable interpolation reads from the shell environment (and optional .env).
    # Our canonical file is .env.production, so export its values for this script run.
    set -a
    # shellcheck disable=SC1091
    . ./.env.production
    set +a

  step "Starting database and redis"
  docker compose -f docker-compose.production.yml up -d postgres redis

  step "Setting up SSL (dummy certs or Let's Encrypt)"
  export LETSENCRYPT_EMAIL="${EMAIL}"
  if [ "${SKIP_LETSENCRYPT}" = "true" ]; then
    export SKIP_LETSENCRYPT="true"
  fi
  bash scripts/setup-ssl.sh

  step "Starting application services"
  docker compose -f docker-compose.production.yml up -d

  if [ "${START_MONITORING}" = "true" ]; then
    step "Starting monitoring stack"
    print "[deploy] Starting monitoring stack"
    docker compose -f docker-compose.monitoring.yml up -d
  fi

  step "Done"
  print "Deployment complete. URLs:"
  local domain_root
  domain_root="${DOMAIN_ROOT:-${DOMAIN}}"
  print "- https://${domain_root}"
  print "- https://driver.${domain_root}"
  print "- https://admin.${domain_root}"
  print "- https://api.${domain_root}"
}

main "$@"
