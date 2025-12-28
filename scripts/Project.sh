#!/usr/bin/env bash
# Rapid Roads - Main menu (non-technical friendly)
# Run on the VPS from the repo root:
#   sudo bash scripts/Project.sh

set -euo pipefail

# Compose files
COMPOSE_PROD_FILE="${COMPOSE_PROD_FILE:-docker-compose.production.yml}"
COMPOSE_MON_FILE="${COMPOSE_MON_FILE:-docker-compose.monitoring.yml}"

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
  C_GREEN="${_ESC}[92m"
  C_YELLOW="${_ESC}[93m"
  C_BLUE="${_ESC}[94m"
  C_CYAN="${_ESC}[96m"
else
  C_RESET=""
  C_BOLD=""
  C_RED=""
  C_GREEN=""
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
    if [[ "${msg}" =~ ^\[ok\] ]]; then
      _print_plain "${C_BOLD}${C_GREEN}${msg}${C_RESET}"
      return 0
    fi
    if [[ "${msg}" =~ ^\[warn\] ]]; then
      _print_plain "${C_BOLD}${C_YELLOW}${msg}${C_RESET}"
      return 0
    fi
    if [[ "${msg}" =~ ^\[error\] ]] || [[ "${msg}" =~ ^ERROR: ]]; then
      _print_plain "${C_BOLD}${C_RED}${msg}${C_RESET}"
      return 0
    fi
  fi

  _print_plain "${msg}"
}

die() {
  print "ERROR: $*" >&2
  exit 1
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    die "Run as root (sudo)."
  fi
}

require_repo_root() {
  if [ ! -f ./docker-compose.production.yml ] || [ ! -d ./scripts ]; then
    die "Run this from the repo root (example: /opt/Project-production)."
  fi
}

require_cmd() {
  local cmd="$1"
  command -v "${cmd}" >/dev/null 2>&1 || die "Missing required command: ${cmd}"
}

require_docker_compose() {
  require_cmd docker
  docker compose version >/dev/null 2>&1 || die "docker compose plugin is required"
}

prod() { docker compose -f "${COMPOSE_PROD_FILE}" "$@"; }
mon() { docker compose -f "${COMPOSE_MON_FILE}" "$@"; }

cmd_stack_status() {
  require_docker_compose
  print "== production stack =="
  prod ps || true

  if [ -f "${COMPOSE_MON_FILE}" ]; then
    print
    print "== monitoring stack =="
    mon ps || true
  fi
}

cmd_stack_logs() {
  require_docker_compose
  local service="${1:-}"
  local tail="${TAIL:-200}"

  if [ -z "${service}" ]; then
    die "Usage: logs <service> (example: logs nginx-proxy)"
  fi

  prod logs --tail="${tail}" "${service}" || true
}

cmd_stack_start() {
  require_docker_compose
  load_env_if_present
  prod up -d
}

cmd_stack_stop() {
  require_docker_compose
  prod down || true
  if [ -f "${COMPOSE_MON_FILE}" ]; then
    mon down || true
  fi
}

cmd_stack_restart() {
  require_docker_compose
  load_env_if_present
  prod up -d
  if [ -f "${COMPOSE_MON_FILE}" ]; then
    mon up -d || true
  fi
}

cmd_stack_health() {
  require_docker_compose

  print "== nginx (host) =="
  if command -v curl >/dev/null 2>&1; then
    curl -fsS http://localhost/health || true
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O- http://localhost/health || true
  else
    print "curl/wget not installed"
  fi

  print
  print "== backend-api (container) =="
  prod exec -T backend-api sh -lc 'wget -q -O- http://localhost:4000/v1/health || curl -fsS http://localhost:4000/v1/health' || true

  print
  print "== frontend-web (container) =="
  prod exec -T frontend-web sh -lc 'wget -q -O- http://localhost:3000/ || curl -fsS http://localhost:3000/' || true
}

cmd_stack_troubleshoot() {
  require_docker_compose

  print "== troubleshoot =="
  print "[info] repo: $(pwd)"
  print "[info] compose prod: ${COMPOSE_PROD_FILE}"
  print "[info] compose mon:  ${COMPOSE_MON_FILE}"
  print

  print "== versions =="
  docker --version || true
  docker compose version || true
  print

  if [ -f ./.env.production ] && grep -Eq 'ChangeMe_|secure_password_here|your_jwt_secret_here|your_refresh_secret_here' ./.env.production; then
    print "[warn] .env.production contains placeholder secrets"
    print "[warn] Fix by editing .env.production, or deploy with AUTO_GENERATE_SECRETS=true"
    print
  fi

  print "== compose config check =="
  prod config -q && print "[ok] production compose config" || print "[error] production compose config"
  if [ -f "${COMPOSE_MON_FILE}" ]; then
    mon config -q && print "[ok] monitoring compose config" || print "[error] monitoring compose config"
  fi
  print

  print "== containers =="
  cmd_stack_status
  print

  print "== ports (80/443) =="
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp | awk 'NR==1 || $4 ~ /:80$|:443$/' || true
    print
    print "If ports 80/443 are used by apache/nginx, stop it:"
    print "- sudo systemctl stop apache2 || sudo systemctl stop nginx"
  else
    print "ss not found (install iproute2)"
  fi
  print

  print "== firewall =="
  if command -v ufw >/dev/null 2>&1; then
    ufw status verbose || true
  else
    print "ufw not installed"
  fi
  print

  print "== quick health =="
  cmd_stack_health || true
}

cmd_full_check() {
  require_root

  print "== RapidRoads complete check =="
  print

  print "== config =="
  print_current_config
  print

  print "== preflight =="
  cmd_preflight_checks || true
  print

  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    print "== stacks =="
    cmd_stack_status
    print

    print "== health =="
    cmd_stack_health
    print

    print "== SSL expiry =="
    ssl_expiry_report
    print
  else
    print "Docker/Compose not installed; skipping stack checks"
    print
  fi

  print "== ports (project) =="
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp | awk 'NR==1 || $4 ~ /:80$|:443$|:3000$|:4000$|:8090$/' || true
  elif command -v netstat >/dev/null 2>&1; then
    netstat -lntp 2>/dev/null | awk 'NR==1 || $4 ~ /:80$|:443$|:3000$|:4000$|:8090$/' || true
  else
    print "ss/netstat not available"
  fi
  print

  print "== host resources =="
  df -h || true
  print
  free -h || true
  print

  if command -v docker >/dev/null 2>&1; then
    print "== docker usage =="
    docker system df || true
    print
  fi

  print "== monitoring =="
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 && [ -f "${COMPOSE_MON_FILE}" ]; then
    mon ps || true
  else
    print "Monitoring compose not available or docker missing"
  fi
}

cmd_backup_database() {
  require_docker_compose

  local backup_dir="${BACKUP_DIR:-./backups}"
  local keep_days="${KEEP_DAYS:-14}"
  local with_certs="${WITH_CERTS:-true}"
  local with_config="${WITH_CONFIG:-true}"

  load_env_if_present
  local postgres_db="${POSTGRES_DB:-Project}"
  local postgres_user="${POSTGRES_USER:-Project_admin}"

  mkdir -p "${backup_dir}/db" "${backup_dir}/certs" "${backup_dir}/config" "${backup_dir}/logs"

  local ts
  ts="$(date -u +%Y%m%dT%H%M%SZ)"

  local db_out db_out_gz
  db_out="${backup_dir}/db/Project_${ts}.dump"
  db_out_gz="${db_out}.gz"

  print "[backup] dumping database -> ${db_out_gz}"
  prod exec -T postgres pg_dump -U "${postgres_user}" -d "${postgres_db}" -Fc | gzip -9 > "${db_out_gz}"

  test -s "${db_out_gz}"
  ln -sf "$(basename "${db_out_gz}")" "${backup_dir}/db/latest.dump.gz"

  if [ "${with_certs}" = "true" ]; then
    local le_volume="Project_letsencrypt"
    if docker volume inspect "${le_volume}" >/dev/null 2>&1; then
      local cert_out
      cert_out="${backup_dir}/certs/letsencrypt_${ts}.tar.gz"
      docker run --rm -v "${le_volume}:/data:ro" -v "$(pwd)/${backup_dir}/certs:/out" alpine:3.20 sh -eu -c 'tar -czf "/out/$1" -C /data .' -- "$(basename "${cert_out}")"
      ln -sf "$(basename "${cert_out}")" "${backup_dir}/certs/latest.tar.gz"
    else
      print "[backup] WARN: letsencrypt volume not found (skipping cert backup)" >&2
    fi
  fi

  if [ "${with_config}" = "true" ]; then
    local cfg_out
    cfg_out="${backup_dir}/config/config_${ts}.tar.gz"
    tar -czf "${cfg_out}" \
      nginx \
      database \
      "${COMPOSE_PROD_FILE}" \
      "${COMPOSE_MON_FILE}" \
      Makefile \
      scripts \
      docs \
      2>/dev/null || true
    ln -sf "$(basename "${cfg_out}")" "${backup_dir}/config/latest.tar.gz"
  fi

  if command -v rclone >/dev/null 2>&1 && [ -n "${RCLONE_REMOTE:-}" ]; then
    print "[backup] syncing to remote: ${RCLONE_REMOTE}"
    rclone copy "${backup_dir}" "${RCLONE_REMOTE}" --copy-links --transfers 8
  fi

  print "[backup] pruning backups older than ${keep_days} days"
  find "${backup_dir}/db" -type f -name '*.dump.gz' -mtime "+${keep_days}" -delete || true
  find "${backup_dir}/certs" -type f -name '*.tar.gz' -mtime "+${keep_days}" -delete || true
  find "${backup_dir}/config" -type f -name '*.tar.gz' -mtime "+${keep_days}" -delete || true

  print "[backup] done"
}

cmd_restore_database() {
  require_docker_compose

  local dump_gz="${1:-backups/db/latest.dump.gz}"
  if [ ! -f "${dump_gz}" ]; then
    die "Provide path to a .dump.gz file (not found: ${dump_gz})"
  fi

  load_env_if_present
  local postgres_db="${POSTGRES_DB:-Project}"
  local postgres_user="${POSTGRES_USER:-Project_admin}"

  print "[restore] stopping app services (keeping postgres/redis running)"
  prod stop backend-api frontend-web nginx-proxy || true

  print "[restore] dropping and recreating database ${postgres_db}"
  prod exec -T postgres psql -U "${postgres_user}" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${postgres_db}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${postgres_db};
CREATE DATABASE ${postgres_db};
SQL

  print "[restore] restoring from ${dump_gz}"
  gzip -dc "${dump_gz}" | prod exec -T postgres pg_restore -U "${postgres_user}" -d "${postgres_db}" --clean --if-exists --no-owner

  print "[restore] starting services"
  prod up -d nginx-proxy backend-api frontend-web

  print "[restore] done"
}

cmd_update_system_packages() {
  require_root
  print "[update] apt update/upgrade"
  apt-get update
  apt-get upgrade -y

  if command -v systemctl >/dev/null 2>&1; then
    if systemctl list-unit-files | grep -q '^fail2ban\.service'; then
      print "[update] restarting fail2ban"
      systemctl restart fail2ban || true
    fi
  fi

  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    print "[update] pulling docker images"
    prod pull || true
  fi

  print "[update] done"
}

stop_common_web_servers() {
  if ! command -v systemctl >/dev/null 2>&1; then
    return 0
  fi
  # Best-effort: stop services that commonly bind 80/443.
  for svc in apache2 nginx caddy lighttpd httpd; do
    if systemctl list-unit-files "${svc}.service" >/dev/null 2>&1; then
      systemctl stop "${svc}" >/dev/null 2>&1 || true
      systemctl disable "${svc}" >/dev/null 2>&1 || true
    fi
  done
}

kill_listeners_on_ports() {
  # Kills listeners on the provided TCP ports.
  # Uses fuser if available, otherwise parses ss output.
  local ports=("$@")

  if command -v fuser >/dev/null 2>&1; then
    local p
    for p in "${ports[@]}"; do
      fuser -k -TERM -n tcp "${p}" >/dev/null 2>&1 || true
    done
    sleep 1
    for p in "${ports[@]}"; do
      fuser -k -KILL -n tcp "${p}" >/dev/null 2>&1 || true
    done
    return 0
  fi

  if ! command -v ss >/dev/null 2>&1; then
    return 0
  fi

  # ss output includes users:("proc",pid=123,fd=3)
  local p line pid
  for p in "${ports[@]}"; do
    while IFS= read -r line; do
      pid="$(printf '%s' "${line}" | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -n 1)"
      if [ -n "${pid}" ]; then
        kill -TERM "${pid}" >/dev/null 2>&1 || true
      fi
    done < <(ss -ltnp 2>/dev/null | grep -E ":[[:space:]]*${p}[[:space:]]|:${p}[[:space:]]" || true)
  done
  sleep 1
  for p in "${ports[@]}"; do
    while IFS= read -r line; do
      pid="$(printf '%s' "${line}" | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -n 1)"
      if [ -n "${pid}" ]; then
        kill -KILL "${pid}" >/dev/null 2>&1 || true
      fi
    done < <(ss -ltnp 2>/dev/null | grep -E ":[[:space:]]*${p}[[:space:]]|:${p}[[:space:]]" || true)
  done
}

cmd_free_project_ports() {
  # Stops RapidRoads services so no project ports are in use.
  # This does NOT touch SSH (22).
  require_root

  local ports=(80 443 3000 4000 8090)

  print "== Free RapidRoads project ports =="
  print "Ports: ${ports[*]}"
  print

  # 1) Stop compose stacks (best effort)
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    print "[free-ports] Stopping docker compose stacks"

    # Production
    if [ -f "${COMPOSE_PROD_FILE}" ]; then
      prod down --remove-orphans >/dev/null 2>&1 || true
    fi

    # Monitoring
    if [ -f "${COMPOSE_MON_FILE}" ]; then
      mon down --remove-orphans >/dev/null 2>&1 || true
    fi

    # IP/dev compose (docker-compose.yml)
    if [ -f ./docker-compose.yml ]; then
      docker compose -f ./docker-compose.yml down --remove-orphans >/dev/null 2>&1 || true
    fi

    # Catch any remaining project containers by label/name
    local ids
    ids="$(docker ps -aq --filter label=com.docker.compose.project=Project 2>/dev/null || true)"
    if [ -n "${ids}" ]; then
      # shellcheck disable=SC2086
      docker rm -f ${ids} >/dev/null 2>&1 || true
    fi
    ids="$(docker ps -aq --filter label=com.docker.compose.project=Project-monitoring 2>/dev/null || true)"
    if [ -n "${ids}" ]; then
      # shellcheck disable=SC2086
      docker rm -f ${ids} >/dev/null 2>&1 || true
    fi
    ids="$(docker ps -aq --filter name=^/Project- 2>/dev/null || true)"
    if [ -n "${ids}" ]; then
      # shellcheck disable=SC2086
      docker rm -f ${ids} >/dev/null 2>&1 || true
    fi
  fi

  # 2) Stop common host web servers (80/443)
  print "[free-ports] Stopping common web servers (apache/nginx/caddy)"
  stop_common_web_servers

  # 3) Kill any remaining listeners on project ports
  print "[free-ports] Killing remaining listeners on project ports"
  kill_listeners_on_ports "${ports[@]}"

  # 4) Report
  print
  print "== Remaining listeners (should be empty for these ports) =="
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp | awk 'NR==1 || $4 ~ /:80$|:443$|:3000$|:4000$|:8090$/' || true
  elif command -v netstat >/dev/null 2>&1; then
    netstat -lntp 2>/dev/null | awk 'NR==1 || $4 ~ /:80$|:443$|:3000$|:4000$|:8090$/' || true
  else
    print "ss/netstat not available"
  fi
}

ensure_linux_user() {
  local username="$1"

  if [ -z "${username}" ]; then
    die "Username is required"
  fi
  if [ "${username}" = "root" ]; then
    die "Refusing to manage root user"
  fi
  if id -u "${username}" >/dev/null 2>&1; then
    return 0
  fi

  print "Creating user: ${username}"
  if command -v adduser >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" "${username}"
  else
    useradd -m -s /bin/bash "${username}"
  fi

  if getent group sudo >/dev/null 2>&1; then
    usermod -aG sudo "${username}" || true
  fi
}

danger_delete_and_recreate_user() {
  local username="$1"

  if [ -z "${username}" ]; then
    die "Username is required"
  fi
  if [ "${username}" = "root" ]; then
    die "Refusing to delete root user"
  fi
  if ! id -u "${username}" >/dev/null 2>&1; then
    # Nothing to delete.
    ensure_linux_user "${username}"
    return 0
  fi

  print
  print "DANGEROUS: delete + recreate user '${username}'"
  print "- This removes /home/${username} and all files owned by that user."
  print "- Do this only if you are 100% sure."

  if ! confirm_by_typing "DELETE ${username}" "Type the confirmation to delete the user"; then
    print "Cancelled. Keeping existing user '${username}'."
    return 0
  fi

  print "Stopping processes for ${username} (best effort)"
  pkill -u "${username}" >/dev/null 2>&1 || true

  print "Deleting user ${username}"
  userdel -r "${username}" >/dev/null 2>&1 || userdel "${username}" || true

  ensure_linux_user "${username}"
}

confirm_by_typing() {
  local expected="$1"
  local message="$2"

  if ! is_interactive; then
    return 1
  fi

  print "${message}" >&2
  print "Type '${expected}' to continue:" >&2
  local value
  read -r value || true
  [ "${value}" = "${expected}" ]
}

is_interactive() {
  [ -t 0 ] && [ -t 1 ]
}

prompt() {
  local label="$1"
  local default_value="${2:-}"

  if ! is_interactive; then
    printf '%s' "${default_value}"
    return 0
  fi

  if [ -n "${default_value}" ]; then
    printf '%s [%s]: ' "${label}" "${default_value}" >&2
  else
    printf '%s: ' "${label}" >&2
  fi

  local value
  read -r value || true
  value="${value:-}"

  if [ -z "${value}" ]; then
    printf '%s' "${default_value}"
  else
    printf '%s' "${value}"
  fi
}

prompt_yes_no() {
  local question="$1"
  local default_yes="${2:-true}"

  if ! is_interactive; then
    [ "${default_yes}" = "true" ] && return 0
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
    printf '%s %s: ' "${question}" "${suffix}" >&2
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

pause() {
  if ! is_interactive; then
    return 0
  fi
  print
  read -r -p "Press Enter to continue..." _ || true
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

repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P
}

load_env_if_present() {
  if [ -f ./.env.production ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env.production
    set +a
  fi
}

mask_value() {
  local v="${1:-}"
  if [ -z "${v}" ]; then
    printf '%s' "<not set>"
    return 0
  fi
  # Avoid leaking full secrets on-screen.
  local n=${#v}
  if [ "${n}" -le 8 ]; then
    printf '%s' "<set>"
    return 0
  fi
  printf '%s' "****${v: -4}"
}

env_has_value() {
  local file="$1"
  local key="$2"
  if [ ! -f "${file}" ]; then
    return 1
  fi
  local v
  v="$(grep -E "^${key}=" "${file}" | tail -n 1 | cut -d= -f2- || true)"
  [ -n "${v}" ]
}

get_env_value() {
  local file="$1"
  local key="$2"
  if [ ! -f "${file}" ]; then
    return 0
  fi
  grep -E "^${key}=" "${file}" | tail -n 1 | cut -d= -f2- || true
}

print_service_links() {
  load_env_if_present
  local domain_root
  domain_root="${DOMAIN_ROOT:-${DOMAIN:-rapidroad.uk}}"

  print "Web / service links"
  print "- Customer: https://${domain_root}"
  print "- Driver:   https://driver.${domain_root}"
  print "- Admin:    https://admin.${domain_root}"
  print "- API:      https://api.${domain_root}"
  print
  print "On-server status"
  print "- Menu: sudo bash scripts/Project.sh"
  print "- Status: sudo bash scripts/Project.sh status"
  print "- Health: sudo bash scripts/Project.sh health"
}

cmd_preflight_checks() {
  print "Preflight checks"
  print "- These checks help avoid deploy failures."
  print

  require_cmd git

  if ! command -v docker >/dev/null 2>&1; then
    print "- Docker: NOT installed yet (deploy will install it)"
  else
    print "- Docker: OK ($(docker --version 2>/dev/null || true))"
  fi

  if docker compose version >/dev/null 2>&1; then
    print "- Docker Compose: OK"
  else
    print "- Docker Compose: NOT installed yet (deploy will install it)"
  fi

  if [ -f ./.env.production ]; then
    print "- .env.production: present"
  else
    print "- .env.production: missing (wizard/deploy will create it)"
  fi

  print
  print "Compose config (syntax)"
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose -f docker-compose.production.yml config -q && print "- production: OK" || print "- production: ERROR"
    if [ -f docker-compose.monitoring.yml ]; then
      docker compose -f docker-compose.monitoring.yml config -q && print "- monitoring: OK" || print "- monitoring: ERROR"
    fi
  else
    print "- skipped (docker/compose not installed yet)"
  fi
}

get_domain_root() {
  load_env_if_present
  printf '%s' "${DOMAIN_ROOT:-${DOMAIN:-rapidroad.uk}}"
}

ssl_expiry_report() {
  local domain_root
  domain_root="$(get_domain_root)"

  if ! command -v docker >/dev/null 2>&1; then
    print "SSL expiry: docker not available"
    return 0
  fi
  if ! docker volume inspect Project_letsencrypt >/dev/null 2>&1; then
    print "SSL expiry: letsencrypt volume not found (run deploy once)"
    return 0
  fi

  print "SSL expiry (from letsencrypt volume)"
  local domains=("${domain_root}" "www.${domain_root}" "api.${domain_root}" "driver.${domain_root}" "admin.${domain_root}")
  local d
  for d in "${domains[@]}"; do
    docker run --rm -v Project_letsencrypt:/etc/letsencrypt:ro alpine:3.20 sh -lc "apk add --no-cache openssl >/dev/null 2>&1; f=/etc/letsencrypt/live/${d}/fullchain.pem; if [ -f \"$f\" ]; then echo -n '${d}: '; openssl x509 -in \"$f\" -noout -enddate | sed 's/notAfter=//'; else echo '${d}: <no cert>'; fi" || true
  done
}

run_show_all_dashboard() {
  print
  print "Show all (dashboard)"
  print
  print_current_config
  print
  print_service_links
  print

  if [ -f ./.env.production ]; then
    print "Integrations (set/unset)"
    print "- GEMINI_API_KEY: $(env_has_value ./.env.production GEMINI_API_KEY && echo set || echo not-set)"
    print "- STRIPE_SECRET_KEY: $(env_has_value ./.env.production STRIPE_SECRET_KEY && echo set || echo not-set)"
    print "- TWILIO_AUTH_TOKEN: $(env_has_value ./.env.production TWILIO_AUTH_TOKEN && echo set || echo not-set)"
    print "- SMTP_PASS: $(env_has_value ./.env.production SMTP_PASS && echo set || echo not-set)"
    print
  fi

  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    print "== docker compose ps (production) =="
    docker compose -f docker-compose.production.yml ps || true
    print
  fi

  print "== health checks =="
  cmd_stack_health || true
  print

  ssl_expiry_report
  pause
}

run_ops_web_dashboard_menu() {
  while true; do
    print
    print "Ops web dashboard"
    print "- Local-only URL: http://127.0.0.1:8090/"
    print "- API JSON:        http://127.0.0.1:8090/api/status"
    print "- Remote access:   ssh -L 8090:127.0.0.1:8090 root@YOUR_SERVER_IP"
    print

    if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
      print "Docker/Compose not available yet. Run deploy first."
      pause
      return 0
    fi

    print "1) Start (build + run)"
    print "2) Stop"
    print "3) Restart"
    print "4) Status"
    print "5) Logs (follow)"
    print "6) Quick check (curl)"
    print "7) Back"
    print

    local choice
    choice="$(prompt "Choose" "4")"

    case "${choice}" in
      1)
        docker compose -f docker-compose.production.yml up -d --build ops-dashboard
        print "Started: http://127.0.0.1:8090/"
        pause
        ;;
      2)
        docker compose -f docker-compose.production.yml stop ops-dashboard || true
        pause
        ;;
      3)
        docker compose -f docker-compose.production.yml restart ops-dashboard || true
        pause
        ;;
      4)
        docker compose -f docker-compose.production.yml ps ops-dashboard || true
        pause
        ;;
      5)
        print "Tip: press Ctrl+C to stop following logs."
        docker compose -f docker-compose.production.yml logs --tail=200 -f ops-dashboard || true
        ;;
      6)
        if command -v curl >/dev/null 2>&1; then
          curl -fsS http://127.0.0.1:8090/api/status | head -n 60 || true
        else
          print "curl not installed"
        fi
        pause
        ;;
      7) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_domain_change_wizard() {
  print
  print "Domain change wizard"
  print "- Updates .env.production domain URLs and CORS for your new domain."
  print

  local domain_root
  domain_root="$(prompt "New domain root" "$(get_domain_root)")"

  if [ ! -f ./.env.production ]; then
    print ".env.production not found; creating from example."
    cp ./.env.production.example ./.env.production
  fi

  ensure_env_kv ./.env.production DOMAIN_ROOT "${domain_root}"
  ensure_env_kv ./.env.production NEXT_PUBLIC_API_URL "https://api.${domain_root}"
  ensure_env_kv ./.env.production CORS_ORIGINS "https://${domain_root},https://driver.${domain_root},https://admin.${domain_root}"

  print
  print "Updated .env.production with:"
  print "- DOMAIN_ROOT=${domain_root}"
  print "- NEXT_PUBLIC_API_URL=https://api.${domain_root}"
  print "- CORS_ORIGINS=https://${domain_root},https://driver.${domain_root},https://admin.${domain_root}"
  print
  print "DNS records you should create (A records to your VPS IP):"
  print "- ${domain_root}"
  print "- www.${domain_root}"
  print "- api.${domain_root}"
  print "- driver.${domain_root}"
  print "- admin.${domain_root}"
  print

  if prompt_yes_no "Run deploy now with the new domain settings?" false; then
    run_deploy_guided
  fi
}

run_dry_run_deploy() {
  print
  print "Dry-run (no changes)"
  print "- Shows what deploy would do and checks config."
  print
  cmd_preflight_checks
  print
  print "Would run: scripts/deploy-Project.sh"
  print "- If DNS not ready: use SKIP_LETSENCRYPT=true"
  print "- If secrets missing: deploy will offer AUTO_GENERATE_SECRETS"
  pause
}

run_rollback_menu() {
  print
  print "Rollback"
  print "- Resets the repo to the previous recorded deploy commit and re-deploys."
  print

  local file=".Project_last_deploy_commit"
  if [ ! -f "${file}" ]; then
    print "No rollback commit recorded yet (${file} not found)."
    print "Run 'Update from GitHub + redeploy' at least once to create it."
    pause
    return
  fi

  local commit
  commit="$(cat "${file}" | tr -d ' \n\r\t')"
  if [ -z "${commit}" ]; then
    print "Rollback commit file is empty."
    pause
    return
  fi

  print "Will rollback to commit: ${commit}"
  if ! confirm_by_typing "ROLLBACK" "This will reset code and restart services."; then
    print "Cancelled."
    pause
    return
  fi

  require_cmd git
  git reset --hard "${commit}"
  bash scripts/deploy-Project.sh
  cmd_stack_health || true
  pause
}

ensure_env_kv() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -qE "^${key}=" "${file}"; then
    local escaped
    escaped="$(printf '%s' "${value}" | sed 's/[\\&]/\\\\&/g')"
    sed -i "s|^${key}=.*$|${key}=${escaped}|" "${file}"
  else
    printf '\n%s=%s\n' "${key}" "${value}" >>"${file}"
  fi
}

detect_public_ip() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS https://api.ipify.org || true
  fi
}

print_current_config() {
  load_env_if_present
  local domain_root
  domain_root="${DOMAIN_ROOT:-${DOMAIN:-<not set>}}"

  print "Current config"
  print "- Repo: $(pwd)"
  print "- Domain root: ${domain_root}"
  if [ -f ./.env.production ]; then
    print "- .env.production: present"
  else
    print "- .env.production: MISSING"
  fi
}

run_integrations_menu() {
  while true; do
    print
    print "Integrations (API keys)"
    print "- Add/change API keys without editing files manually."
    print "- Values are masked on screen."
    print

    if [ ! -f ./.env.production ]; then
      print ".env.production not found. Creating from example."
      cp ./.env.production.example ./.env.production
    fi

    load_env_if_present

    print "Current values (masked):"
    print "1) Gemini (AI concierge):        $(mask_value "${GEMINI_API_KEY:-}")"
    print "2) Stripe (payments):            $(mask_value "${STRIPE_SECRET_KEY:-}")"
    print "3) Stripe webhook secret:        $(mask_value "${STRIPE_WEBHOOK_SECRET:-}")"
    print "4) Twilio (SMS) Account SID:     $(mask_value "${TWILIO_ACCOUNT_SID:-}")"
    print "5) Twilio (SMS) Auth Token:      $(mask_value "${TWILIO_AUTH_TOKEN:-}")"
    print "6) Twilio (SMS) From number:     ${TWILIO_FROM:-<not set>}"
    print "7) SMTP host:                    ${SMTP_HOST:-<not set>}"
    print "8) SMTP user:                    ${SMTP_USER:-<not set>}"
    print "9) SMTP pass:                    $(mask_value "${SMTP_PASS:-}")"
    print "10) Google Maps API key (opt):   $(mask_value "${GOOGLE_MAPS_API_KEY:-}")"
    print
    print "11) Open full .env.production"
    print "12) Back"
    print

    local choice
    choice="$(prompt "Choose" "1")"

    case "${choice}" in
      1)
        local v
        v="$(prompt "Enter GEMINI_API_KEY (blank to clear)" "")"
        ensure_env_kv ./.env.production GEMINI_API_KEY "${v}"
        ;;
      2)
        local v
        v="$(prompt "Enter STRIPE_SECRET_KEY (blank to clear)" "")"
        ensure_env_kv ./.env.production STRIPE_SECRET_KEY "${v}"
        ;;
      3)
        local v
        v="$(prompt "Enter STRIPE_WEBHOOK_SECRET (blank to clear)" "")"
        ensure_env_kv ./.env.production STRIPE_WEBHOOK_SECRET "${v}"
        ;;
      4)
        local v
        v="$(prompt "Enter TWILIO_ACCOUNT_SID (blank to clear)" "")"
        ensure_env_kv ./.env.production TWILIO_ACCOUNT_SID "${v}"
        ;;
      5)
        local v
        v="$(prompt "Enter TWILIO_AUTH_TOKEN (blank to clear)" "")"
        ensure_env_kv ./.env.production TWILIO_AUTH_TOKEN "${v}"
        ;;
      6)
        local v
        v="$(prompt "Enter TWILIO_FROM (example: +15551234567)" "")"
        ensure_env_kv ./.env.production TWILIO_FROM "${v}"
        ;;
      7)
        local v
        v="$(prompt "Enter SMTP_HOST" "")"
        ensure_env_kv ./.env.production SMTP_HOST "${v}"
        ;;
      8)
        local v
        v="$(prompt "Enter SMTP_USER" "")"
        ensure_env_kv ./.env.production SMTP_USER "${v}"
        ;;
      9)
        local v
        v="$(prompt "Enter SMTP_PASS (blank to clear)" "")"
        ensure_env_kv ./.env.production SMTP_PASS "${v}"
        ;;
      10)
        local v
        v="$(prompt "Enter GOOGLE_MAPS_API_KEY (blank to clear)" "")"
        ensure_env_kv ./.env.production GOOGLE_MAPS_API_KEY "${v}"
        ;;
      11)
        if ! open_editor_if_possible ./.env.production; then
          print "No editor found (nano/vim). Edit manually: $(pwd)/.env.production"
        fi
        ;;
      12) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_help_menu() {
  print
  print "Help / quick guide"
  print
  print "Common tasks"
  print "- First install: choose '0) First-time setup wizard'"
  print "- Update code: choose '2) Update from GitHub + redeploy'"
  print "- Start/stop: choose '3) App management'"
  print "- Fix SSL: choose '4) SSL / HTTPS'"
  print "- Add API keys: choose '11) Integrations (API keys)'"
  print

  print "Links (documentation)"
  print "- Docker Compose: https://docs.docker.com/compose/"
  print "- Let's Encrypt:  https://letsencrypt.org/getting-started/"
  print "- UFW firewall:   https://help.ubuntu.com/community/UFW"
  print

  print_service_links
  pause
}

run_deploy_guided() {
  print
  print "First-time deploy (guided)"
  print "- This will install Docker, set firewall, and start the app."
  print "- It will ask/auto-generate secrets if needed."
  print

  local domain_root email
  domain_root="$(prompt "Domain (root)" "rapidroad.uk")"
  email="$(prompt "Let's Encrypt email" "admin@${domain_root}")"

  local dns_ready=false
  if prompt_yes_no "Is DNS already pointing to this server (A records ready)?" false; then
    dns_ready=true
  fi

  local start_monitoring=false
  if prompt_yes_no "Start monitoring stack too (Grafana/Prometheus/Loki)?" false; then
    start_monitoring=true
  fi

  local auto_secrets=true
  if ! prompt_yes_no "Auto-generate secrets in .env.production (recommended)?" true; then
    auto_secrets=false
  fi

  # If DNS is not ready, skip Let's Encrypt so the deploy does not fail.
  local skip_le=false
  if [ "${dns_ready}" != "true" ]; then
    skip_le=true
  fi

  print
  print "Running deploy now..."

  DOMAIN="${domain_root}" \
  DOMAIN_ROOT="${domain_root}" \
  LETSENCRYPT_EMAIL="${email}" \
  SKIP_LETSENCRYPT="${skip_le}" \
  START_MONITORING="${start_monitoring}" \
  AUTO_GENERATE_SECRETS="${auto_secrets}" \
    bash scripts/deploy-Project.sh
}

run_deploy_ip_mode() {
  print
  print "IP-only deploy (no domain / no SSL)"
  print "- Starts docker-compose.yml (ports 3000 + 4000)"
  print "- Temporary mode until you buy a domain"
  print

  bash scripts/deploy-ip-mode.sh
  pause
}

run_update_guided() {
  print
  print "Update from GitHub + redeploy"
  print "- Pulls latest code and redeploys safely."
  print

  local dns_ready=false
  if prompt_yes_no "Is DNS already pointing to this server (A records ready)?" false; then
    dns_ready=true
  fi

  local skip_le=false
  if [ "${dns_ready}" != "true" ]; then
    skip_le=true
  fi

  SKIP_LETSENCRYPT="${skip_le}" SYNC_REPO=true bash scripts/deploy-Project.sh
  print
  print "Running quick health check..."
  cmd_stack_health || true
  pause
}

run_first_time_wizard() {
  print
  print "First-time setup wizard (recommended)"
  print "- Asks a few questions"
  print "- Writes safe defaults into .env.production"
  print "- Deploys and runs a health check"
  print

  local manage_user=false
  if prompt_yes_no "Create/manage a dedicated server user (recommended)?" false; then
    manage_user=true
  fi

  local deploy_user=""
  local recreate_user=false
  if [ "${manage_user}" = "true" ]; then
    deploy_user="$(prompt "Deploy username" "taxi")"
    if id -u "${deploy_user}" >/dev/null 2>&1; then
      if prompt_yes_no "User '${deploy_user}' exists. Delete + recreate it? (DANGEROUS)" false; then
        recreate_user=true
      fi
    fi

    if [ "${recreate_user}" = "true" ]; then
      danger_delete_and_recreate_user "${deploy_user}"
    else
      ensure_linux_user "${deploy_user}"
    fi
  fi

  local domain_root email
  domain_root="$(prompt "Domain root (example: example.com)" "rapidroad.uk")"
  email="$(prompt "Let's Encrypt email" "admin@${domain_root}")"

  local dns_ready=false
  if prompt_yes_no "Is DNS already pointing to this server (A records ready)?" false; then
    dns_ready=true
  fi

  local start_monitoring=false
  if prompt_yes_no "Enable monitoring (Grafana/Prometheus/Loki)?" false; then
    start_monitoring=true
  fi

  local auto_secrets=true
  if ! prompt_yes_no "Auto-generate secrets (recommended)?" true; then
    auto_secrets=false
  fi

  local gemini_key
  gemini_key="$(prompt "Gemini API key (optional, enables AI concierge)" "")"

  if [ ! -f ./.env.production ]; then
    print ".env.production not found; creating from example."
    cp ./.env.production.example ./.env.production
  fi

  print
  print "Writing domain settings into .env.production..."
  ensure_env_kv ./.env.production DOMAIN_ROOT "${domain_root}"
  ensure_env_kv ./.env.production NEXT_PUBLIC_API_URL "https://api.${domain_root}"
  ensure_env_kv ./.env.production CORS_ORIGINS "https://${domain_root},https://driver.${domain_root},https://admin.${domain_root}"

  local detected_ip
  detected_ip="$(detect_public_ip)"
  if [ -n "${detected_ip}" ]; then
    if prompt_yes_no "Set VPS_IP=${detected_ip} in .env.production (helps DNS checks)?" true; then
      ensure_env_kv ./.env.production VPS_IP "${detected_ip}"
    fi
  fi

  if [ -n "${gemini_key}" ]; then
    ensure_env_kv ./.env.production GEMINI_API_KEY "${gemini_key}"
  fi

  print
  if prompt_yes_no "Open .env.production to review/edit now?" false; then
    if ! open_editor_if_possible ./.env.production; then
      print "No editor found (nano/vim). Edit manually: $(pwd)/.env.production"
    fi
  fi

  local skip_le=false
  if [ "${dns_ready}" != "true" ]; then
    skip_le=true
  fi

  print
  print "Deploying now..."
  DOMAIN="${domain_root}" \
  DOMAIN_ROOT="${domain_root}" \
  LETSENCRYPT_EMAIL="${email}" \
  SKIP_LETSENCRYPT="${skip_le}" \
  START_MONITORING="${start_monitoring}" \
  AUTO_GENERATE_SECRETS="${auto_secrets}" \
    bash scripts/deploy-Project.sh

  if [ -n "${deploy_user}" ]; then
    if getent group docker >/dev/null 2>&1; then
      usermod -aG docker "${deploy_user}" || true
    fi
    print
    print "User ready: ${deploy_user}"
    print "- Next time you can login as '${deploy_user}' and run: sudo bash scripts/Project.sh"
    print "- Docker access may require re-login (new group membership)."
  fi

  print
  print "Health check..."
  cmd_stack_health || true
  pause
}

run_ssl_menu() {
  while true; do
    print
    print "SSL / HTTPS menu"
    print "- Use this after DNS points to your server to get real Let's Encrypt certs."
    print
    print "1) Setup/renew SSL (auto: ask about DNS)"
    print "2) Setup SSL (skip Let's Encrypt / dummy certs)"
    print "3) Setup SSL (request real Let's Encrypt certs)"
    print "4) Back"
    print

    local choice
    choice="$(prompt "Choose" "1")"
    case "${choice}" in
      1)
        local dns_ready=false
        if prompt_yes_no "Is DNS pointing to this server (A records ready)?" false; then
          dns_ready=true
        fi
        local skip_le=false
        if [ "${dns_ready}" != "true" ]; then
          skip_le=true
        fi
        SKIP_LETSENCRYPT="${skip_le}" bash scripts/setup-ssl.sh
        pause
        ;;
      2)
        SKIP_LETSENCRYPT=true bash scripts/setup-ssl.sh
        pause
        ;;
      3)
        SKIP_LETSENCRYPT=false bash scripts/setup-ssl.sh
        pause
        ;;
      4) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_database_menu() {
  while true; do
    print
    print "Database menu"
    print "- Backup and restore tools."
    print
    print "1) Backup database"
    print "2) Restore database"
    print "3) Back"
    print

    local choice
    choice="$(prompt "Choose" "1")"
    case "${choice}" in
      1)
        print "Running database backup..."
        cmd_backup_database
        pause
        ;;
      2)
        print "Restore will OVERWRITE your database." >&2
        if confirm_by_typing "RESTORE" "Danger: continue with database restore?"; then
          print "Enter backup path (default: backups/db/latest.dump.gz):"
          local dump
          dump="$(prompt "Backup file" "backups/db/latest.dump.gz")"
          cmd_restore_database "${dump}"
        else
          print "Cancelled."
        fi
        pause
        ;;
      3) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_monitoring_menu() {
  while true; do
    print
    print "Monitoring menu"
    print "- Starts/stops Prometheus + Grafana + Loki stack (if configured)."
    print
    print "1) Start monitoring"
    print "2) Stop monitoring"
    print "3) Monitoring status"
    print "4) Back"
    print

    local choice
    choice="$(prompt "Choose" "1")"
    case "${choice}" in
      1)
        print "Starting monitoring stack..."
        docker compose -f docker-compose.monitoring.yml up -d
        pause
        ;;
      2)
        print "Stopping monitoring stack..."
        docker compose -f docker-compose.monitoring.yml down || true
        pause
        ;;
      3)
        docker compose -f docker-compose.monitoring.yml ps || true
        print
        print "Tip: Grafana is typically not exposed publicly by default."
        pause
        ;;
      4) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_manage_menu() {
  while true; do
    print
    print "App management menu"
    print "- Start/stop/restart the app and view logs/health."
    print
    print "1) Status"
    print "2) Health check"
    print "3) Start app"
    print "4) Stop app"
    print "5) Restart app"
    print "6) Logs (choose service)"
    print "7) Back"
    print

    local choice
    choice="$(prompt "Choose" "1")"
    case "${choice}" in
      1) cmd_stack_status; pause ;;
      2) cmd_stack_health; pause ;;
      3) cmd_stack_start; pause ;;
      4) cmd_stack_stop; pause ;;
      5) cmd_stack_restart; pause ;;
      6)
        print "Enter service name (example: nginx-proxy, backend-api, frontend-web, postgres, redis)"
        local service
        read -r service || true
        cmd_stack_logs "${service}"
        pause
        ;;
      7) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_system_menu() {
  while true; do
    print
    print "System / security menu"
    print "- Useful maintenance commands."
    print
    print "1) Show server info"
    print "2) Update system packages"
    print "3) Firewall status (UFW)"
    print "4) Free project ports (stop all services)"
    print "5) Back"
    print

    local choice
    choice="$(prompt "Choose" "1")"
    case "${choice}" in
      1)
        print "== server =="
        uname -a || true
        print
        print "== disk =="
        df -h || true
        print
        print "== memory =="
        free -h || true
        pause
        ;;
      2)
        print "Running system update..."
        cmd_update_system_packages
        pause
        ;;
      3)
        if command -v ufw >/dev/null 2>&1; then
          ufw status verbose || true
        else
          print "ufw not installed"
        fi
        pause
        ;;
      4)
        cmd_free_project_ports
        pause
        ;;
      5) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_env_menu() {
  while true; do
    print
    print ".env.production menu"
    print "- Your secrets and domain settings live here."
    print
    print "1) Show current domain settings"
    print "2) Edit .env.production"
    print "3) Back"
    print

    local choice
    choice="$(prompt "Choose" "1")"
    case "${choice}" in
      1)
        load_env_if_present
        print "DOMAIN_ROOT=${DOMAIN_ROOT:-}" 
        print "DOMAIN=${DOMAIN:-}" 
        print "LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL:-}" 
        print "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-}" 
        pause
        ;;
      2)
        if [ ! -f ./.env.production ]; then
          print ".env.production not found. Creating from example."
          cp ./.env.production.example ./.env.production
        fi
        if ! open_editor_if_possible ./.env.production; then
          print "No editor found (nano/vim). Edit manually: $(pwd)/.env.production"
        fi
        pause
        ;;
      3) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_menu() {
  require_root
  cd "$(repo_root)"
  require_repo_root

  while true; do
    print
    print "Rapid Roads - Main Menu"
    print_current_config
    print
    print "0) First-time setup wizard (recommended)"
    print "1) First-time deploy (guided)"
    print "1a) IP-only deploy (no domain/SSL)"
    print "2) Update from GitHub + redeploy"
    print "3) App management (start/stop/status/logs/health)"
    print "4) SSL / HTTPS (Let's Encrypt)"
    print "5) Database (backup/restore)"
    print "6) Monitoring (Grafana/Prometheus/Loki)"
    print "7) System / security (updates, firewall)"
    print "8) .env.production (view/edit)"
    print "9) Troubleshoot (guided checks)"
    print "10) Preflight checks"
    print "10a) Complete check (everything)"
    print "11) Integrations (API keys)"
    print "12) Help"
    print "13) Domain change wizard"
    print "14) Show all (dashboard)"
    print "15) Ops web dashboard"
    print "16) Dry-run deploy"
    print "17) Rollback"
    print "18) Quit"
    print

    local choice
    choice="$(prompt "Choose" "1")"

    case "${choice}" in
      0) run_first_time_wizard ;;
      1) run_deploy_guided ;;
      1a) run_deploy_ip_mode ;;
      2) run_update_guided ;;
      3) run_manage_menu ;;
      4) run_ssl_menu ;;
      5) run_database_menu ;;
      6) run_monitoring_menu ;;
      7) run_system_menu ;;
      8) run_env_menu ;;
      9) cmd_stack_troubleshoot; pause ;;
      10) cmd_preflight_checks; pause ;;
      10a) cmd_full_check; pause ;;
      11) run_integrations_menu ;;
      12) run_help_menu ;;
      13) run_domain_change_wizard ;;
      14) run_show_all_dashboard ;;
      15) run_ops_web_dashboard_menu ;;
      16) run_dry_run_deploy ;;
      17) run_rollback_menu ;;
      18) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

main() {
  # Optional non-interactive commands:
  #   sudo bash scripts/Project.sh status
  #   sudo bash scripts/Project.sh health
  #   sudo bash scripts/Project.sh logs backend-api
  #   sudo bash scripts/Project.sh backup
  #   sudo bash scripts/Project.sh restore backups/db/latest.dump.gz
  local cmd="${1:-menu}"
  shift || true

  cd "$(repo_root)"
  require_repo_root

  case "${cmd}" in
    menu) run_menu ;;
    status) cmd_stack_status ;;
    health) cmd_stack_health ;;
    logs) cmd_stack_logs "$@" ;;
    start) cmd_stack_start ;;
    stop) cmd_stack_stop ;;
    restart) cmd_stack_restart ;;
    troubleshoot) cmd_stack_troubleshoot ;;
    backup) cmd_backup_database ;;
    restore) cmd_restore_database "$@" ;;
    update-system) cmd_update_system_packages ;;
    free-ports) cmd_free_project_ports ;;
    check) cmd_full_check ;;
    *)
      die "Unknown command: ${cmd}"
      ;;
  esac
}

main "$@"
