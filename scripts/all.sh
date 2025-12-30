#!/usr/bin/env bash
# Project - All-in-one scripts bundle
# This file contains the full logic for deployment/ops tasks.
# All functionality is accessed via `bash scripts/all.sh <command>`.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/all.sh <command> [args]

Examples:
  sudo bash scripts/all.sh                 # opens the menu
  sudo bash scripts/all.sh menu pro        # opens the Pro menu
  sudo bash scripts/all.sh menu status     # quick status

Commands:
  menu                 Run the interactive ops menu
  deploy               Production deploy
  deploy-ip            IP-only deploy
  setup-ssl            SSL bootstrap/renew
  update-and-deploy    Git update + deploy
  vps-deploy-fresh     Fresh Ubuntu VPS deploy
  setup-frontend-host  Install/build/run frontend on host
EOF
}

run_embedded_script() {
  local script_name="$1"; shift

  local tmp
  if command -v mktemp >/dev/null 2>&1; then
    tmp="$(mktemp -t "Project-${script_name}.XXXXXX.sh")"
  else
    tmp="/tmp/Project-${script_name}.$$.$RANDOM.sh"
    : >"${tmp}"
  fi

  # Always clean up (best effort)
  trap 'rm -f "${tmp}" >/dev/null 2>&1 || true' RETURN

  case "${script_name}" in
    Project)
      cat >"${tmp}" <<'__PROJECT_SCRIPT__'
#!/usr/bin/env bash
# Project - Main menu (non-technical friendly)
# Run on the VPS from the repo root:
#   sudo bash scripts/all.sh menu

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
  print "== frontend (host) =="
  if command -v curl >/dev/null 2>&1; then
    curl -fsS http://localhost:3000/ || true
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O- http://localhost:3000/ || true
  else
    print "curl/wget not installed"
  fi
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

  print "== Project complete check =="
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
  prod stop backend-api nginx-proxy || true

  print "[restore] dropping and recreating database ${postgres_db}"
  prod exec -T postgres psql -U "${postgres_user}" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${postgres_db}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${postgres_db};
CREATE DATABASE ${postgres_db};
SQL

  print "[restore] restoring from ${dump_gz}"
  gzip -dc "${dump_gz}" | prod exec -T postgres pg_restore -U "${postgres_user}" -d "${postgres_db}" --clean --if-exists --no-owner

  print "[restore] starting services"
  prod up -d nginx-proxy backend-api

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
  # Stops Project services so no project ports are in use.
  # This does NOT touch SSH (22).
  require_root

  local ports=(80 443 3000 4000 8090)

  print "== Free Project project ports =="
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
  domain_root="${DOMAIN_ROOT:-${DOMAIN:-yourdomain.com}}"

  print "Web / service links"
  print "- Customer: https://${domain_root}"
  print "- Driver:   https://driver.${domain_root}"
  print "- Admin:    https://admin.${domain_root}"
  print "- API:      https://api.${domain_root}"
  print
  print "On-server status"
  print "- Menu:   sudo bash scripts/all.sh menu"
  print "- Status: sudo bash scripts/all.sh menu status"
  print "- Health: sudo bash scripts/all.sh menu health"
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
  printf '%s' "${DOMAIN_ROOT:-${DOMAIN:-yourdomain.com}}"
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
  print "Would run: scripts/all.sh deploy"
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
  bash scripts/all.sh deploy
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
  domain_root="$(prompt "Domain (root)" "yourdomain.com")"
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
    bash scripts/all.sh deploy
}

run_deploy_ip_mode() {
  print
  print "IP-only deploy (no domain / no SSL)"
  print "- Starts docker-compose.yml (ports 3000 + 4000)"
  print "- Temporary mode until you buy a domain"
  print

  bash scripts/all.sh deploy-ip
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

  SKIP_LETSENCRYPT="${skip_le}" SYNC_REPO=true bash scripts/all.sh deploy
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
  domain_root="$(prompt "Domain root (example: example.com)" "yourdomain.com")"
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
    bash scripts/all.sh deploy

  if [ -n "${deploy_user}" ]; then
    if getent group docker >/dev/null 2>&1; then
      usermod -aG docker "${deploy_user}" || true
    fi
    print
    print "User ready: ${deploy_user}"
    print "- Next time you can login as '${deploy_user}' and run: sudo bash scripts/all.sh menu"
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
        SKIP_LETSENCRYPT="${skip_le}" bash scripts/all.sh setup-ssl
        pause
        ;;
      2)
        SKIP_LETSENCRYPT=true bash scripts/all.sh setup-ssl
        pause
        ;;
      3)
        SKIP_LETSENCRYPT=false bash scripts/all.sh setup-ssl
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
        print "Enter service name (example: nginx-proxy, backend-api, postgres, redis)"
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

print_system_summary() {
  print "================================================================="
  print "  SYSTEM SUMMARY"
  print "================================================================="
  
  local load mem disk
  load="$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | xargs || echo "N/A")"
  mem="$(free -m 2>/dev/null | awk '/Mem:/ { printf "%d/%d MB", $3, $2 }' || echo "N/A")"
  disk="$(df -h / 2>/dev/null | awk '/\// { print $5 }' | tail -1 || echo "N/A")"
  
  printf "  Load: %-10s | RAM: %-15s | Disk: %-5s\n" "${load}" "${mem}" "${disk}"

  if command -v docker >/dev/null 2>&1; then
    local containers
    containers="$(docker ps -q | wc -l)"
    if [ "${containers}" -gt 0 ]; then
      printf "  Docker: ${C_GREEN}%s containers running${C_RESET}\n" "${containers}"
    else
      printf "  Docker: ${C_YELLOW}0 containers running${C_RESET}\n"
    fi
  else
    printf "  Docker: ${C_RED}Not installed${C_RESET}\n"
  fi

  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    local branch local_hash
    branch="$(git rev-parse --abbrev-ref HEAD)"
    local_hash="$(git rev-parse --short HEAD)"
    printf "  Branch: ${C_CYAN}%s${C_RESET} (%s)\n" "${branch}" "${local_hash}"
  fi
  print "================================================================="
}

confirm_action() {
  local msg="${1:-Are you sure?}"
  local resp
  resp="$(prompt "${msg} (y/N)" "n")"
  if [[ "${resp}" =~ ^[yY] ]]; then
    return 0
  fi
  return 1
}

run_pro_menu() {
  require_root
  cd "$(repo_root)"
  require_repo_root

  while true; do
    clear
    print "================================================================="
    print "  PRO MANAGEMENT MENU (Advanced)"
    print "================================================================="
    print " 1) Git: Show pending commits (origin/main)"
    print " 2) Git: Stash local changes & Update"
    print " 3) Git: DISCARD local changes & Update (Force)"
    print " 4) Docker: Restart entire stack"
    print " 5) Docker: Prune unused images/volumes (Clean Disk)"
    print " 6) Docker: Force rebuild (no-cache)"
    print " 7) Database: Reset/Wipe (DANGER!)"
    print " 8) Frontend: Update host-mode frontend"
    print " 9) System: View journalctl logs"
    print "10) System: Check open ports (netstat)"
    print " 0) Back to Main Menu"
    print "================================================================="

    local choice
    choice="$(prompt "Choose" "0")"
    case "${choice}" in
      1)
        print "[pro] Fetching origin..."
        git fetch -q origin || true
        print "[pro] Pending commits:"
        git log --oneline --decorate HEAD..origin/main 2>/dev/null || echo "No pending commits or not a git repo."
        pause
        ;;
      2)
        print "[pro] Stashing and updating..."
        git stash
        SYNC_REPO=true AUTO_STASH=true FORCE_RESET=false bash scripts/all.sh deploy
        pause
        ;;
      3)
        confirm_action "This will DISCARD all local changes. Continue?" || continue
        git reset --hard HEAD
        SYNC_REPO=true AUTO_STASH=false FORCE_RESET=true bash scripts/all.sh deploy
        pause
        ;;
      4)
        cmd_stack_restart
        pause
        ;;
      5)
        confirm_action "This will delete all unused Docker data. Continue?" || continue
        docker system prune -af --volumes
        pause
        ;;
      6)
        confirm_action "This will force a full rebuild of all images. Continue?" || continue
        prod build --no-cache
        prod up -d
        pause
        ;;
      7)
        confirm_action "DANGER: This will WIPE the database volumes. Continue?" || continue
        prod down -v
        prod up -d
        pause
        ;;
      8)
        bash scripts/all.sh setup-frontend-host
        pause
        ;;
      9)
        journalctl -u docker --no-pager -n 50
        pause
        ;;
      10)
        netstat -tulpn
        pause
        ;;
      0) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

run_menu() {
  require_root
  cd "$(repo_root)"
  require_repo_root

  while true; do
    clear
    print_system_summary
    print
    print "--- DEPLOYMENT & SETUP ---"
    print " 1) First-time setup wizard (recommended)"
    print " 2) Standard Deploy (guided)"
    print " 3) IP-only Deploy (no domain/SSL)"
    print " 4) Dry-run Deploy (test only)"
    print
    print "--- UPDATES & MAINTENANCE ---"
    print " 5) Update from GitHub + Redeploy"
    print " 6) Rollback to previous version"
    print " 7) System & Security updates (apt/firewall)"
    print
    print "--- SERVICE MANAGEMENT ---"
    print " 8) App Management (start/stop/status/logs)"
    print " 9) Monitoring Dashboard (Grafana/Prometheus)"
    print "10) View/Edit .env.production"
    print
    print "--- DATA & DOMAIN ---"
    print "11) Database Tools (backup/restore)"
    print "12) SSL / HTTPS Management"
    print "13) Domain Change Wizard"
    print
    print "--- ADVANCED ---"
    print "14) Troubleshoot & Preflight checks"
    print "15) Pro Menu (Advanced Ops)"
    print "16) Help & Documentation"
    print " 0) Exit"
    print

    local choice
    choice="$(prompt "Choose" "0")"

    case "${choice}" in
      1) run_first_time_wizard ;;
      2) run_deploy_guided ;;
      3) run_deploy_ip_mode ;;
      4) run_dry_run_deploy ;;
      5) run_update_guided ;;
      6) run_rollback_menu ;;
      7) run_system_menu ;;
      8) run_manage_menu ;;
      9) run_monitoring_menu ;;
      10) run_env_menu ;;
      11) run_database_menu ;;
      12) run_ssl_menu ;;
      13) run_domain_change_wizard ;;
      14) cmd_full_check; pause ;;
      15) run_pro_menu ;;
      16) run_help_menu ;;
      0) break ;;
      *) print "Invalid option" ;;
    esac
  done
}

main() {
  # Optional non-interactive commands:
  #   sudo bash scripts/all.sh menu status
  #   sudo bash scripts/all.sh menu health
  #   sudo bash scripts/all.sh menu logs backend-api
  #   sudo bash scripts/all.sh menu backup
  #   sudo bash scripts/all.sh menu restore backups/db/latest.dump.gz
  local cmd="${1:-menu}"
  shift || true

  cd "$(repo_root)"
  require_repo_root

  case "${cmd}" in
    menu) run_menu ;;
    pro) run_pro_menu ;;
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
__PROJECT_SCRIPT__
      ;;
    deploy-Project)
      cat >"${tmp}" <<'__PROJECT_SCRIPT__'
#!/usr/bin/env bash
# Project - Production Deployment Script
# Domain: yourdomain.com
# VPS IP: 5.249.164.40

set -euo pipefail

DOMAIN="${DOMAIN:-yourdomain.com}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@yourdomain.com}"
START_MONITORING="${START_MONITORING:-false}"
AUTO_GENERATE_SECRETS="${AUTO_GENERATE_SECRETS:-false}"
SKIP_LETSENCRYPT="${SKIP_LETSENCRYPT:-false}"
APP_ONLY="${APP_ONLY:-false}"

# Optional: update repo before deploying
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
  domain_root="${DOMAIN_ROOT:-${DOMAIN:-yourdomain.com}}"

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
# Project hardening (managed by scripts/all.sh deploy)
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

  print "== Project Production Deploy =="
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
  bash scripts/all.sh setup-ssl

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
__PROJECT_SCRIPT__
      ;;
    deploy-ip-mode)
      cat >"${tmp}" <<'__PROJECT_SCRIPT__'
#!/usr/bin/env bash
# Project - IP-only deploy (no domain / no Let's Encrypt / no nginx)
# Uses docker-compose.yml which exposes port 4000 (backend API in Docker).
# Frontend runs on the host (systemd) on port 3000.
# Intended as a temporary mode until you buy a domain.

set -euo pipefail

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
  C_CYAN="${_ESC}[96m"
else
  C_RESET=""
  C_BOLD=""
  C_RED=""
  C_CYAN=""
fi

_print_plain() { printf '%s\n' "$*"; }

print() {
  local msg="$*"
  if [ -n "${C_RESET}" ] && [[ "${msg}" =~ ^==.*==$ ]]; then
    _print_plain "${C_BOLD}${C_CYAN}${msg}${C_RESET}"
    return 0
  fi
  if [ -n "${C_RESET}" ] && [[ "${msg}" =~ ^ERROR: ]]; then
    _print_plain "${C_BOLD}${C_RED}${msg}${C_RESET}"
    return 0
  fi
  _print_plain "${msg}"
}

die() {
  print "ERROR: $*" >&2
  exit 1
}

is_interactive() { [ -t 0 ] && [ -t 1 ]; }

prompt_yes_no() {
  local question="$1"
  local default_yes="${2:-true}"

  if ! is_interactive; then
    [ "${default_yes}" = "true" ] && return 0
    return 1
  fi

  local suffix
  if [ "${default_yes}" = "true" ]; then suffix="[Y/n]"; else suffix="[y/N]"; fi

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

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    die "Run as root (sudo)."
  fi
}

detect_public_ip() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS https://api.ipify.org || true
  fi
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

install_base_packages() {
  apt-get update
  apt-get install -y ca-certificates curl gnupg lsb-release openssl ufw
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
  apt-get update
  apt-get install -y docker-compose-plugin
  docker compose version >/dev/null 2>&1 || die "Docker Compose plugin install failed"
}

configure_firewall_ip_mode() {
  if ! command -v ufw >/dev/null 2>&1; then
    return 0
  fi

  # keep ssh
  ufw allow 22/tcp >/dev/null 2>&1 || true

  # HTTP proxy (recommended)
  ufw allow 80/tcp >/dev/null 2>&1 || true

  # IP-mode ports
  ufw allow 3000/tcp >/dev/null 2>&1 || true
  ufw allow 4000/tcp >/dev/null 2>&1 || true

  # ops dashboard should remain local-only (127.0.0.1 binding), so no UFW rule needed.

  if ufw status | grep -qi inactive; then
    if prompt_yes_no "Enable UFW firewall now?" true; then
      ufw --force enable >/dev/null 2>&1 || true
    fi
  fi
}

ensure_ip_env_file() {
  local ip="$1"
  local file="./.env.ip"

  if [ ! -f "${file}" ]; then
    cat >"${file}" <<'EOF'
  # Project IP-only mode (temporary)
# Used by: docker compose --env-file ./.env.ip -f docker-compose.yml up

POSTGRES_DB=Project
POSTGRES_USER=Project_admin
POSTGRES_PASSWORD=

JWT_SECRET=
JWT_REFRESH_SECRET=

# For dev-compose containers
NEXT_PUBLIC_API_URL=
CORS_ORIGINS=
EOF
    chmod 600 "${file}" || true
  fi

  # Generate secrets if missing
  if ! grep -qE '^POSTGRES_PASSWORD=.+$' "${file}"; then
    ensure_env_kv "${file}" POSTGRES_PASSWORD "$(openssl rand -hex 24)"
  fi
  if ! grep -qE '^JWT_SECRET=.+$' "${file}"; then
    ensure_env_kv "${file}" JWT_SECRET "$(openssl rand -hex 48)"
  fi
  if ! grep -qE '^JWT_REFRESH_SECRET=.+$' "${file}"; then
    ensure_env_kv "${file}" JWT_REFRESH_SECRET "$(openssl rand -hex 48)"
  fi

  ensure_env_kv "${file}" NEXT_PUBLIC_API_URL "http://${ip}:4000"
  # Prefer going through nginx proxy on port 80 when available
  ensure_env_kv "${file}" NEXT_PUBLIC_API_URL "http://${ip}/api"
  ensure_env_kv "${file}" CORS_ORIGINS "http://${ip},http://${ip}:3000"
}

setup_frontend_host_service() {
  if [ "${SETUP_FRONTEND_HOST:-true}" != "true" ]; then
    return 0
  fi

  if [ ! -d ./frontend ]; then
    print "[warn] ./frontend not found; skipping host-frontend setup"
    return 0
  fi

  if [ ! -f ./scripts/all.sh ]; then
    print "[warn] scripts/all.sh missing; skipping host-frontend setup"
    return 0
  fi

  chmod +x ./scripts/all.sh || true
  SERVICE_USER="${SERVICE_USER:-${SUDO_USER:-root}}" ENV_FILE=./.env.ip bash ./scripts/all.sh setup-frontend-host
}

main() {
  require_root

  if [ ! -f ./docker-compose.yml ]; then
    die "Run from repo root (docker-compose.yml not found)."
  fi

  local ip
  ip="$(detect_public_ip)"
  ip="${ip:-5.249.164.40}"

  print "== Project IP-only Deploy =="
  print "VPS IP: ${ip}"
  print "Mode:   HTTP only (no domain / no SSL / no nginx)"
  print

  install_base_packages
  install_docker
  install_docker_compose
  configure_firewall_ip_mode
  ensure_ip_env_file "${ip}"

  print
  print "Starting stack (docker-compose.yml)"
  docker compose --profile ip --env-file ./.env.ip -f docker-compose.yml up -d --build

  print
  print "Setting up frontend on host (systemd)"
  setup_frontend_host_service

  print
  print "Done. Open:"
  print "- Frontend: http://${ip}/"
  print "- API:      http://${ip}/api/v1/health"
  print
  print "Direct ports (also open):"
  print "- Frontend (host): http://${ip}:3000/"
  print "- API (docker):    http://${ip}:4000/v1/health"
  print
  print "Note: admin/driver subdomains require a real domain + production compose."
}

main "$@"
__PROJECT_SCRIPT__
      ;;
    setup-ssl)
      cat >"${tmp}" <<'__PROJECT_SCRIPT__'
#!/usr/bin/env bash
# Project - SSL bootstrap for Dockerized Nginx (webroot)
# - Creates temporary self-signed certs so Nginx can start
# - Creates ssl-dhparams.pem inside letsencrypt volume
# - Requests/renews Let's Encrypt certs for all hostnames

set -euo pipefail

DOMAIN_ROOT="${DOMAIN_ROOT:-yourdomain.com}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@yourdomain.com}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
SKIP_LETSENCRYPT="${SKIP_LETSENCRYPT:-false}"

DOMAINS=(
  "${DOMAIN_ROOT}"
  "www.${DOMAIN_ROOT}"
  "api.${DOMAIN_ROOT}"
  "driver.${DOMAIN_ROOT}"
  "admin.${DOMAIN_ROOT}"
)

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
  C_CYAN="${_ESC}[96m"
else
  C_RESET=""
  C_BOLD=""
  C_RED=""
  C_CYAN=""
fi

_print_plain() { printf '%s\n' "$*"; }

print() {
  local msg="$*"
  if [ -n "${C_RESET}" ]; then
    if [[ "${msg}" =~ ^\[SSL\] ]]; then
      _print_plain "${C_BOLD}${C_CYAN}${msg}${C_RESET}"
      return 0
    fi
    if [[ "${msg}" =~ docker\ is\ required ]] || [[ "${msg}" =~ ^docker\ compose ]] || [[ "${msg}" =~ Failed\ to\ install ]] || [[ "${msg}" =~ still\ unavailable ]] || [[ "${msg}" =~ Expected\ volumes\ not\ found ]]; then
      _print_plain "${C_BOLD}${C_RED}${msg}${C_RESET}"
      return 0
    fi
  fi
  _print_plain "${msg}"
}

die() {
  print "$*" >&2
  exit 1
}

if ! command -v docker >/dev/null 2>&1; then
  die "docker is required"
fi

# Compose variable interpolation reads from the shell environment (and optional .env).
# If we're running on the VPS, prefer the repo's .env.production.
if [ -f ./.env.production ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.production
  set +a
fi

if ! docker compose version >/dev/null 2>&1; then
  print "docker compose plugin not found; attempting to install" >&2

  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    if ! apt-get install -y docker-compose-plugin >/dev/null 2>&1; then
      die "Failed to install docker-compose-plugin via apt; install it manually."
    fi
  else
    die "No apt-get available; install Docker Compose plugin manually."
  fi

  if ! docker compose version >/dev/null 2>&1; then
    die "docker compose still unavailable after install"
  fi
fi

ensure_volume_file() {
  local volume_name="$1"
  local file_path="$2"

  docker run --rm -v "${volume_name}:/data" alpine:3.20 sh -eu -c '
    file_path="$1"
    mkdir -p "$(dirname "/data/${file_path}")"

    if [ ! -f "/data/${file_path}" ]; then
      echo "Generating /data/${file_path}"
      apk add --no-cache openssl >/dev/null
      openssl dhparam -out "/data/${file_path}" 2048 >/dev/null 2>&1
    fi
  ' -- "${file_path}"
}

create_dummy_certs() {
  local volume_name="$1"

  docker run --rm -v "${volume_name}:/etc/letsencrypt" alpine:3.20 sh -eu -c '
    apk add --no-cache openssl >/dev/null

    for d in "$@"; do
      live_dir="/etc/letsencrypt/live/${d}"

      if [ ! -f "${live_dir}/fullchain.pem" ] || [ ! -f "${live_dir}/privkey.pem" ]; then
        echo "Creating dummy cert for ${d}"
        mkdir -p "${live_dir}"
        openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
          -keyout "${live_dir}/privkey.pem" \
          -out "${live_dir}/fullchain.pem" \
          -subj "/CN=${d}" >/dev/null 2>&1
      fi
    done
  ' -- "${DOMAINS[@]}"
}

print "[SSL] Preparing volumes"

# Compose names volumes as: <project>_<volume>
# We resolve the actual name by asking compose for config and grepping isn't reliable.
# Simpler: start compose once so named volumes exist.
docker compose -f "${COMPOSE_FILE}" up -d postgres redis || true

print "[SSL] Creating dhparams in LetsEncrypt volume"
# Compose file pins project name to "Project", so volume names are deterministic.
LE_VOLUME="Project_letsencrypt"
WWW_VOLUME="Project_certbot_www"

# If only postgres/redis were started, these volumes may not exist yet.
# Create them explicitly so we can write dhparams and dummy certs.
docker volume inspect "${LE_VOLUME}" >/dev/null 2>&1 || docker volume create "${LE_VOLUME}" >/dev/null
docker volume inspect "${WWW_VOLUME}" >/dev/null 2>&1 || docker volume create "${WWW_VOLUME}" >/dev/null

if ! docker volume inspect "${LE_VOLUME}" >/dev/null 2>&1 || ! docker volume inspect "${WWW_VOLUME}" >/dev/null 2>&1; then
  die "Expected volumes not found (${LE_VOLUME}, ${WWW_VOLUME}). Run: docker compose -f ${COMPOSE_FILE} up -d"
fi

ensure_volume_file "${LE_VOLUME}" "ssl-dhparams.pem"

print "[SSL] Creating dummy certificates (so Nginx can start)"
create_dummy_certs "${LE_VOLUME}"

print "[SSL] Starting Nginx for ACME challenge"
docker compose -f "${COMPOSE_FILE}" up -d nginx-proxy

if [ "${SKIP_LETSENCRYPT}" = "true" ]; then
  echo "[SSL] SKIP_LETSENCRYPT=true: leaving dummy certificates in place."
  echo "[SSL] Re-run without SKIP_LETSENCRYPT to request real certificates once DNS is ready."
  exit 0
fi

echo "[SSL] Requesting Let's Encrypt certificates"
# Request certs individually to match per-hostname live paths used by nginx configs.
for d in "${DOMAINS[@]}"; do
  echo "  - ${d}"
  docker compose -f "${COMPOSE_FILE}" run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    --email "${EMAIL}" --agree-tos --no-eff-email \
    -d "${d}" \
    --rsa-key-size 4096 \
    --force-renewal
done

echo "[SSL] Reloading Nginx"
docker compose -f "${COMPOSE_FILE}" exec nginx-proxy nginx -s reload

echo "[SSL] Done"
__PROJECT_SCRIPT__
      ;;
    update-and-deploy)
      cat >"${tmp}" <<'__PROJECT_SCRIPT__'
#!/usr/bin/env bash
# Project - Update repo from GitHub and deploy
# - Prevents "git pull" from failing due to local changes on the server
# - By default, stashes local changes and syncs to origin/main
#
# Usage:
#   bash scripts/all.sh update-and-deploy
#
# Options:
#   AUTO_STASH=true|false   (default: true)
#   FORCE_RESET=true|false  (default: false)  # discards local changes instead of stashing
#
# You can also pass deploy flags through env vars, e.g.:
#   sudo SKIP_LETSENCRYPT=true AUTO_GENERATE_SECRETS=true bash scripts/all.sh update-and-deploy

set -euo pipefail

AUTO_STASH="${AUTO_STASH:-true}"
FORCE_RESET="${FORCE_RESET:-false}"
AUTO_DNS_CHECK="${AUTO_DNS_CHECK:-true}"

print() { printf '%s\n' "$*"; }

require_write_access() {
  # This script resets/stashes and updates the repo; it must be able to write.
  if [ ! -w . ]; then
    print "No write access to repo. Run as the deploy user (e.g., taxi) or fix ownership." >&2
    exit 1
  fi
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    print "Missing required command: $cmd" >&2
    exit 1
  fi
}

resolve_ipv4() {
  local host="$1"

  if command -v dig >/dev/null 2>&1; then
    dig +short "${host}" A | head -n 1
    return 0
  fi

  if command -v getent >/dev/null 2>&1; then
    # getent is available on most Ubuntu installs and does not require extra packages.
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
  # Best-effort: only used when VPS_IP isn't provided.
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
  domain_root="${DOMAIN_ROOT:-${DOMAIN:-yourdomain.com}}"

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

repo_root() {
  # scripts/all.sh update-and-deploy -> repo root
  cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P
}

record_last_deploy_commit() {
  # Best-effort: used for rollback from scripts/all.sh menu
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    return
  fi
  git rev-parse HEAD > .Project_last_deploy_commit 2>/dev/null || true
}

ensure_on_main() {
  if git show-ref --verify --quiet refs/heads/main; then
    git checkout -q main
  else
    # Create local main from origin/main if possible
    if git show-ref --verify --quiet refs/remotes/origin/main; then
      git checkout -q -b main origin/main
    else
      git checkout -q -b main
    fi
  fi
}

sync_to_origin_main() {
  git fetch -q origin

  if ! git show-ref --verify --quiet refs/remotes/origin/main; then
    print "origin/main not found. Check your remote: git remote -v" >&2
    exit 1
  fi

  ensure_on_main

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

  # Deploy should match GitHub exactly; avoid merges.
  git reset --hard -q origin/main
}

main() {
  require_cmd git

  local root
  root="$(repo_root)"
  cd "${root}"

  require_write_access

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    print "Not a git repository: ${root}" >&2
    exit 1
  fi

  record_last_deploy_commit

  print "[update] Syncing to origin/main"
  sync_to_origin_main

  auto_set_skip_letsencrypt

  print "[deploy] Running deploy script"
  bash scripts/all.sh deploy
}

main "$@"
__PROJECT_SCRIPT__
      ;;
    vps-deploy-fresh)
      cat >"${tmp}" <<'__PROJECT_SCRIPT__'
#!/usr/bin/env bash
# Project - Fresh VPS deploy from scratch (Ubuntu/Debian)
#
# What it does:
# - Installs minimal prerequisites (git, curl, ca-certificates)
# - Clones (or updates) the repo into /opt/Project-production
# - Ensures .env.production exists (copies from .env.production.example if needed)
# - Optionally writes VPS_IP into .env.production
# - Runs scripts/all.sh deploy (APP_ONLY=true) as the deploy user
#
# Usage:
#   sudo bash scripts/all.sh vps-deploy-fresh [VPS_IP]
#
# Optional env vars:
#   INSTALL_DIR=/opt/Project-production
#   REPO_URL=https://github.com/Boris8800/Project-production.git
#   BRANCH=main
#   DEPLOY_MODE=ip|domain   (default: domain)
#
# Deploy flags passed through to the deploy scripts:
#   AUTO_GENERATE_SECRETS=true|false
#   SKIP_LETSENCRYPT=true|false
#   START_MONITORING=true|false

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-taxi}"
INSTALL_DIR="${INSTALL_DIR:-/home/${DEPLOY_USER}/Project-production}"
REPO_URL="${REPO_URL:-https://github.com/Boris8800/Project-production.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_MODE="${DEPLOY_MODE:-domain}"

# IMPORTANT DEFAULTS (as requested):
# - Delete the deploy user first (taxi), then recreate it.
# - Clean up Project docker containers so ports are free.
# - Run repo-level deploy steps as the deploy user.
RECREATE_DEPLOY_USER="${RECREATE_DEPLOY_USER:-true}"
FORCE_DELETE_USER="${FORCE_DELETE_USER:-true}"
RESET_INSTALL_DIR="${RESET_INSTALL_DIR:-true}"
CLEAN_PROJECT_DOCKER="${CLEAN_PROJECT_DOCKER:-true}"
CLEAN_COMMON_WEB_SERVERS="${CLEAN_COMMON_WEB_SERVERS:-true}"

# If true, delete Project Docker volumes too (DESTROYS DB DATA!).
NUKE_VOLUMES="${NUKE_VOLUMES:-false}"

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
  C_CYAN="${_ESC}[96m"
else
  C_RESET=""
  C_BOLD=""
  C_RED=""
  C_GREEN=""
  C_YELLOW=""
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
    if [[ "${msg}" =~ ^\[fresh\] ]]; then
      _print_plain "${C_BOLD}${C_CYAN}${msg}${C_RESET}"
      return 0
    fi
    if [[ "${msg}" =~ ^ERROR: ]]; then
      _print_plain "${C_BOLD}${C_RED}${msg}${C_RESET}"
      return 0
    fi
    if [[ "${msg}" =~ DATA\ LOSS ]]; then
      _print_plain "${C_BOLD}${C_YELLOW}${msg}${C_RESET}"
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

require_cmd() {
  local cmd="$1"
  command -v "${cmd}" >/dev/null 2>&1 || die "Missing required command: ${cmd}"
}

wait_for_apt() {
  # Wait for other apt/dpkg processes to finish, so we don't fail with lock errors.
  # This prints status while waiting.
  local max_seconds="${1:-600}"
  local start now elapsed
  start="$(date +%s)"

  while true; do
    if pgrep -x apt-get >/dev/null 2>&1 || pgrep -x dpkg >/dev/null 2>&1 || pgrep -x unattended-upgrades >/dev/null 2>&1; then
      now="$(date +%s)"
      elapsed="$((now - start))"
      if [ "${elapsed}" -ge "${max_seconds}" ]; then
        print "[fresh] apt/dpkg still busy after ${elapsed}s; continuing (may fail if lock persists)"
        return 0
      fi
      print "[fresh] Waiting for apt/dpkg to finish... (${elapsed}s)"
      sleep 5
      continue
    fi
    return 0
  done
}

stop_common_web_servers() {
  if [ "${CLEAN_COMMON_WEB_SERVERS}" != "true" ]; then
    return 0
  fi

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

cleanup_Project_docker() {
  if [ "${CLEAN_PROJECT_DOCKER}" != "true" ]; then
    return 0
  fi
  if ! command -v docker >/dev/null 2>&1; then
    return 0
  fi

  print "[fresh] Cleaning existing Project containers (freeing ports)"

  # Stop/remove compose project containers by label if present.
  local ids
  ids="$(docker ps -aq --filter label=com.docker.compose.project=Project 2>/dev/null || true)"
  if [ -n "${ids}" ]; then
    # shellcheck disable=SC2086
    docker rm -f ${ids} >/dev/null 2>&1 || true
  fi

  # Also catch older containers by name prefix.
  ids="$(docker ps -aq --filter name=^/Project- 2>/dev/null || true)"
  if [ -n "${ids}" ]; then
    # shellcheck disable=SC2086
    docker rm -f ${ids} >/dev/null 2>&1 || true
  fi

  # Networks (best effort)
  local nets
  nets="$(docker network ls -q --filter name=Project_ 2>/dev/null || true)"
  if [ -n "${nets}" ]; then
    # shellcheck disable=SC2086
    docker network rm ${nets} >/dev/null 2>&1 || true
  fi

  if [ "${NUKE_VOLUMES}" = "true" ]; then
    print "[fresh] NUKE_VOLUMES=true: removing Project volumes (DATA LOSS)"
    local vols
    vols="$(docker volume ls -q --filter name=Project_ 2>/dev/null || true)"
    if [ -n "${vols}" ]; then
      # shellcheck disable=SC2086
      docker volume rm ${vols} >/dev/null 2>&1 || true
    fi
  fi
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

ensure_linux_user() {
  local username="$1"

  if [ -z "${username}" ]; then
    die "DEPLOY_USER is empty"
  fi
  if [ "${username}" = "root" ]; then
    die "Refusing to manage root user"
  fi

  if id -u "${username}" >/dev/null 2>&1; then
    return 0
  fi

  print "[fresh] Creating user: ${username}"
  if command -v adduser >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" "${username}"
  else
    useradd -m -s /bin/bash "${username}"
  fi

  if getent group sudo >/dev/null 2>&1; then
    usermod -aG sudo "${username}" || true
  fi
}

maybe_delete_and_recreate_user() {
  local username="$1"

  if [ "${RECREATE_DEPLOY_USER}" != "true" ]; then
    ensure_linux_user "${username}"
    return 0
  fi

  if ! id -u "${username}" >/dev/null 2>&1; then
    ensure_linux_user "${username}"
    return 0
  fi

  print
  print "[fresh] Delete + recreate user '${username}'"
  print "[fresh] This removes /home/${username} and all files owned by that user."

  if [ "${FORCE_DELETE_USER}" != "true" ]; then
    if ! confirm_by_typing "DELETE ${username}" "[fresh] Confirm user deletion"; then
      print "[fresh] Cancelled. Keeping existing user '${username}'."
      return 0
    fi
  else
    print "[fresh] FORCE_DELETE_USER=true: skipping interactive confirmation"
  fi

  print "[fresh] Terminating all processes for user '${username}'..."
  pkill -u "${username}" >/dev/null 2>&1 || true
  sleep 1
  pkill -9 -u "${username}" >/dev/null 2>&1 || true
  sleep 1

  userdel -r "${username}" >/dev/null 2>&1 || userdel "${username}" || true
  ensure_linux_user "${username}"
}

install_prereqs() {
  if ! command -v apt-get >/dev/null 2>&1; then
    die "apt-get not found (this script supports Ubuntu/Debian)."
  fi

  print "[fresh] Installing prerequisites (apt update + base tools)"
  wait_for_apt 900
  apt-get update
  wait_for_apt 900
  DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git openssl
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi
  print "[fresh] Installing Docker (this may take a few minutes)"
  curl -fsSL https://get.docker.com | sh
}

install_docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    return 0
  fi
  print "[fresh] Installing Docker Compose plugin"
  wait_for_apt 900
  apt-get update
  wait_for_apt 900
  DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose-plugin
  docker compose version >/dev/null 2>&1 || die "Docker Compose plugin install failed"
}

configure_docker_for_user() {
  local username="$1"
  if [ -z "${username}" ]; then
    return 0
  fi
  if getent group docker >/dev/null 2>&1; then
    usermod -aG docker "${username}" || true
  fi
}

reset_install_dir_if_requested() {
  if [ "${RESET_INSTALL_DIR}" != "true" ]; then
    return 0
  fi

  print "[fresh] RESET_INSTALL_DIR=true: removing ${INSTALL_DIR}"
  rm -rf "${INSTALL_DIR}" || true
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

clone_or_update_repo() {
  reset_install_dir_if_requested

  if [ -d "${INSTALL_DIR}/.git" ]; then
    print "[fresh] Repo already exists at ${INSTALL_DIR}; updating as ${DEPLOY_USER}"
    sudo -u "${DEPLOY_USER}" -H bash -lc "
      cd '${INSTALL_DIR}'
      git fetch -q origin
      git checkout -q '${BRANCH}' || git checkout -q -b '${BRANCH}' 'origin/${BRANCH}'
      git reset --hard -q 'origin/${BRANCH}'
    "
    return
  fi

  print "[fresh] Cloning ${REPO_URL} -> ${INSTALL_DIR} as ${DEPLOY_USER}"
  # Ensure the parent directory is writable by the user (it should be /home/taxi)
  mkdir -p "$(dirname "${INSTALL_DIR}")"
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "$(dirname "${INSTALL_DIR}")" || true
  
  sudo -u "${DEPLOY_USER}" -H git clone --depth 1 --branch "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}"
  cd "${INSTALL_DIR}"
}

ensure_env_file() {
  if [ -f ./.env.production ]; then
    return
  fi

  if [ ! -f ./.env.production.example ]; then
    die "Missing .env.production.example in repo."
  fi

  cp ./.env.production.example ./.env.production
  print "[fresh] Created .env.production from .env.production.example"
}

show_vps_menu() {
  print "====================================="
  print "  Project VPS Management Script"
  print "====================================="
  print
  print "Please choose an option:"
  print "  1) Clean Install (Deletes 'taxi' user and starts fresh)"
  print "  2) Update Existing Install (Pulls latest code and redeploys)"
  print "  3) Exit"
  print
}

run_clean_install() {
  # Default deploy user is taxi (override with DEPLOY_USER=...)
  maybe_delete_and_recreate_user "${DEPLOY_USER}"

  install_prereqs

  require_cmd git
  require_cmd curl

  stop_common_web_servers

  # Free ports by removing any existing Project containers (best effort).
  cleanup_Project_docker

  install_docker
  install_docker_compose

  configure_docker_for_user "${DEPLOY_USER}"

  clone_or_update_repo

  # Ensure env file exists and is owned by user
  sudo -u "${DEPLOY_USER}" -H bash -lc "
    cd '${INSTALL_DIR}'
    if [ ! -f .env.production ]; then
      if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo '[fresh] Created .env.production from .env.production.example'
      fi
    fi
  "

  if [ -n "${VPS_IP_ARG}" ]; then
    print "[fresh] Writing VPS_IP=${VPS_IP_ARG} into .env.production"
    ensure_env_kv "${INSTALL_DIR}/.env.production" VPS_IP "${VPS_IP_ARG}"
  fi

  print "[fresh] Finalizing ownership and permissions in ${INSTALL_DIR}"
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${INSTALL_DIR}"
  chmod +x "${INSTALL_DIR}/scripts/"*.sh || true

  if [ "${DEPLOY_MODE}" = "ip" ]; then
    print "[fresh] Deploying in IP mode (no domain/SSL/nginx) as ${DEPLOY_USER}"
    sudo -u "${DEPLOY_USER}" -H bash -lc "cd '${INSTALL_DIR}'; bash scripts/all.sh deploy-ip"
  else
    print "[fresh] Deploying app as ${DEPLOY_USER} (domain mode)"
    # Run app-level steps (docker compose + SSL bootstrap) as the deploy user.
    # We skip repo sync here because we just cloned.
    sudo -u "${DEPLOY_USER}" -H bash -lc "cd '${INSTALL_DIR}'; APP_ONLY=true AUTO_GENERATE_SECRETS=true SYNC_REPO=false bash scripts/all.sh deploy"
  fi
}

run_update_only() {
  if [ ! -d "${INSTALL_DIR}" ]; then
    die "Install directory not found: ${INSTALL_DIR}. Please run Clean Install first."
  fi
  print "[fresh] Updating existing install as ${DEPLOY_USER}..."
  sudo -u "${DEPLOY_USER}" -H bash -lc "cd '${INSTALL_DIR}'; AUTO_GENERATE_SECRETS=true bash scripts/all.sh deploy"
}

main() {
  require_root

  VPS_IP_ARG="${1:-}"
  if [ -n "${VPS_IP_ARG}" ]; then
    if ! [[ "${VPS_IP_ARG}" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
      die "Invalid VPS_IP: ${VPS_IP_ARG}"
    fi
  fi

  show_vps_menu
  local choice
  # Read from /dev/tty to allow interaction when script is piped (e.g. curl | bash)
  read -rp "Enter your choice [1-3]: " choice < /dev/tty

  case "${choice}" in
    1)
      run_clean_install
      ;;
    2)
      run_update_only
      ;;
    3)
      print "Exiting."
      exit 0
      ;;
    *)
      die "Invalid option. Please run the script again."
      ;;
  esac

  print "[fresh] Done"
  print "[fresh] Status: sudo bash scripts/all.sh menu status"
}

main "$@"
__PROJECT_SCRIPT__
      ;;
    setup-frontend-host)
      cat >"${tmp}" <<'__PROJECT_SCRIPT__'
#!/usr/bin/env bash
# Project - Host frontend setup (systemd)
# Installs Node.js if needed, builds the Next.js frontend, and runs it as a systemd service.

set -euo pipefail

print() { printf '%s\n' "$*"; }
die() { print "ERROR: $*" >&2; exit 1; }

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    die "Run as root (sudo)."
  fi
}

require_cmd() {
  local cmd="$1"
  command -v "${cmd}" >/dev/null 2>&1 || die "Missing required command: ${cmd}"
}

install_nodejs_20() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  require_cmd apt-get
  require_cmd curl

  print "[frontend] Installing Node.js 20.x (NodeSource)"
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
}

install_build_tools() {
  require_cmd apt-get
  print "[frontend] Installing build tools (build-essential, python3)"
  apt-get update -y
  apt-get install -y build-essential python3
}

check_paths() {
  [ -d "${FRONTEND_DIR}" ] || die "Frontend directory not found: ${FRONTEND_DIR}"
  [ -f "${FRONTEND_DIR}/package.json" ] || die "Missing ${FRONTEND_DIR}/package.json"
}

build_frontend() {
  require_cmd sudo

  print "[frontend] Building (npm ci && npm run build) as ${SERVICE_USER}"
  sudo -u "${SERVICE_USER}" -H bash -lc "
    set -euo pipefail
    cd '${FRONTEND_DIR}'
    if [ -f '${ENV_FILE}' ]; then
      set -a
      . '${ENV_FILE}'
      set +a
    fi
    npm ci
    npm run build
  "
}

write_systemd_unit() {
  local unit_path="/etc/systemd/system/${SERVICE_NAME}.service"

  print "[frontend] Writing systemd unit: ${unit_path}"
  cat >"${unit_path}" <<EOF
[Unit]
Description=Project Frontend (Next.js)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${FRONTEND_DIR}
Environment=NODE_ENV=production
Environment=PORT=${FRONTEND_PORT}
EnvironmentFile=-${ENV_FILE}
ExecStart=/usr/bin/npm run start -- -p ${FRONTEND_PORT}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
}

enable_and_start() {
  require_cmd systemctl

  print "[frontend] Enabling + starting ${SERVICE_NAME}"
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}.service" >/dev/null
  systemctl restart "${SERVICE_NAME}.service"
  systemctl --no-pager --full status "${SERVICE_NAME}.service" || true
}

main() {
  require_root

  REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)}"
  FRONTEND_DIR="${FRONTEND_DIR:-${REPO_ROOT}/frontend}"
  ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env.ip}"
  SERVICE_USER="${SERVICE_USER:-${SUDO_USER:-$(id -un)}}"
  SERVICE_NAME="${SERVICE_NAME:-project-frontend}"
  FRONTEND_PORT="${FRONTEND_PORT:-3000}"

  check_paths
  install_nodejs_20
  install_build_tools

  # Ensure npm is available at /usr/bin/npm for systemd ExecStart
  require_cmd node
  require_cmd npm

  build_frontend
  write_systemd_unit
  enable_and_start

  print "[frontend] OK: http://$(hostname -I 2>/dev/null | awk '{print $1}'):${FRONTEND_PORT}/ (or use your server public IP)"
}

main "$@"
__PROJECT_SCRIPT__
      ;;
    *)
      echo "Unknown embedded script: ${script_name}" >&2
      exit 2
      ;;
  esac

  chmod +x "${tmp}" || true
  "${tmp}" "$@"
}

run_menu() { run_embedded_script "Project" "$@"; }
run_deploy() { run_embedded_script "deploy-Project" "$@"; }
run_deploy_ip() { run_embedded_script "deploy-ip-mode" "$@"; }
run_setup_ssl() { run_embedded_script "setup-ssl" "$@"; }
run_update_and_deploy() { run_embedded_script "update-and-deploy" "$@"; }
run_vps_deploy_fresh() { run_embedded_script "vps-deploy-fresh" "$@"; }
run_setup_frontend_host() { run_embedded_script "setup-frontend-host" "$@"; }

main() {
  local cmd="${1:-}"
  shift || true

  case "${cmd}" in
    menu|Project|project|Project.sh) run_menu "$@" ;;
    deploy|deploy-Project|deploy-Project.sh) run_deploy "$@" ;;
    deploy-ip|deploy-ip-mode|deploy-ip-mode.sh) run_deploy_ip "$@" ;;
    setup-ssl|setup-ssl.sh) run_setup_ssl "$@" ;;
    update-and-deploy|update-and-deploy.sh) run_update_and_deploy "$@" ;;
    vps-deploy-fresh|vps-deploy-fresh.sh) run_vps_deploy_fresh "$@" ;;
    setup-frontend-host|setup-frontend-host.sh) run_setup_frontend_host "$@" ;;
    -h|--help|help|"") usage ;;
    *)
      echo "Unknown command: ${cmd}" >&2
      usage
      exit 2
      ;;
  esac
}

main "$@"
