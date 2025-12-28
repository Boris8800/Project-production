#!/usr/bin/env bash
# Rapid Roads - Fresh VPS deploy from scratch (Ubuntu/Debian)
#
# What it does:
# - Installs minimal prerequisites (git, curl, ca-certificates)
# - Clones (or updates) the repo into /opt/Project-production
# - Ensures .env.production exists (copies from .env.production.example if needed)
# - Optionally writes VPS_IP into .env.production
# - Runs scripts/deploy-Project.sh (APP_ONLY=true) as the deploy user
#
# Usage:
#   sudo bash scripts/vps-deploy-fresh.sh [VPS_IP]
#
# Optional env vars:
#   INSTALL_DIR=/opt/Project-production
#   REPO_URL=https://github.com/Boris8800/Rapid.git
#   BRANCH=main
#
# Deploy flags passed through to the deploy scripts:
#   AUTO_GENERATE_SECRETS=true|false
#   SKIP_LETSENCRYPT=true|false
#   START_MONITORING=true|false

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/Project-production}"
REPO_URL="${REPO_URL:-https://github.com/Boris8800/Rapid.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_USER="${DEPLOY_USER:-taxi}"

# IMPORTANT DEFAULTS (as requested):
# - Delete the deploy user first (taxi), then recreate it.
# - Clean up RapidRoads docker containers so ports are free.
# - Run repo-level deploy steps as the deploy user.
RECREATE_DEPLOY_USER="${RECREATE_DEPLOY_USER:-true}"
FORCE_DELETE_USER="${FORCE_DELETE_USER:-true}"
RESET_INSTALL_DIR="${RESET_INSTALL_DIR:-true}"
CLEAN_RAPIDROADS_DOCKER="${CLEAN_RAPIDROADS_DOCKER:-true}"
CLEAN_COMMON_WEB_SERVERS="${CLEAN_COMMON_WEB_SERVERS:-true}"

# If true, delete RapidRoads Docker volumes too (DESTROYS DB DATA!).
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
  if [ "${CLEAN_RAPIDROADS_DOCKER}" != "true" ]; then
    return 0
  fi
  if ! command -v docker >/dev/null 2>&1; then
    return 0
  fi

  print "[fresh] Cleaning existing RapidRoads containers (freeing ports)"

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
    print "[fresh] NUKE_VOLUMES=true: removing RapidRoads volumes (DATA LOSS)"
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

  pkill -u "${username}" >/dev/null 2>&1 || true
  userdel -r "${username}" >/dev/null 2>&1 || userdel "${username}" || true
  ensure_linux_user "${username}"
}

install_prereqs() {
  if ! command -v apt-get >/dev/null 2>&1; then
    die "apt-get not found (this script supports Ubuntu/Debian)."
  fi

  print "[fresh] Installing prerequisites"
  apt-get update
  apt-get install -y ca-certificates curl git openssl
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi
  print "[fresh] Installing Docker"
  curl -fsSL https://get.docker.com | sh
}

install_docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    return 0
  fi
  print "[fresh] Installing Docker Compose plugin"
  apt-get update
  apt-get install -y docker-compose-plugin
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
  mkdir -p "$(dirname "${INSTALL_DIR}")"

  reset_install_dir_if_requested

  if [ -d "${INSTALL_DIR}/.git" ]; then
    print "[fresh] Repo already exists at ${INSTALL_DIR}; updating"
    cd "${INSTALL_DIR}"
    git fetch -q origin
    if git show-ref --verify --quiet "refs/remotes/origin/${BRANCH}"; then
      git checkout -q "${BRANCH}" || git checkout -q -b "${BRANCH}" "origin/${BRANCH}"
      git reset --hard -q "origin/${BRANCH}"
    else
      git checkout -q "${BRANCH}" || true
    fi
    return
  fi

  print "[fresh] Cloning ${REPO_URL} -> ${INSTALL_DIR}"
  git clone "${REPO_URL}" "${INSTALL_DIR}"
  cd "${INSTALL_DIR}"

  if [ "${BRANCH}" != "main" ]; then
    git checkout -q "${BRANCH}"
  fi
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

main() {
  require_root
  install_prereqs

  require_cmd git
  require_cmd curl

  stop_common_web_servers

  # Free ports by removing any existing RapidRoads containers (best effort).
  cleanup_Project_docker

  install_docker
  install_docker_compose

  local vps_ip="${1:-}"
  if [ -n "${vps_ip}" ]; then
    if ! [[ "${vps_ip}" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
      die "Invalid VPS_IP: ${vps_ip}"
    fi
  fi

  # Default deploy user is taxi (override with DEPLOY_USER=...)
  maybe_delete_and_recreate_user "${DEPLOY_USER}"
  configure_docker_for_user "${DEPLOY_USER}"

  clone_or_update_repo
  ensure_env_file

  print "[fresh] Setting repo ownership to ${DEPLOY_USER}"
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${INSTALL_DIR}" || true

  if [ -n "${vps_ip}" ]; then
    print "[fresh] Writing VPS_IP=${vps_ip} into .env.production"
    ensure_env_kv ./.env.production VPS_IP "${vps_ip}"
  fi

  chmod +x scripts/*.sh || true

  print "[fresh] Deploying app as ${DEPLOY_USER}"
  # Run app-level steps (docker compose + SSL bootstrap) as the deploy user.
  # We skip repo sync here because we just cloned.
  sudo -u "${DEPLOY_USER}" -H bash -lc "cd '${INSTALL_DIR}'; APP_ONLY=true SYNC_REPO=false bash scripts/deploy-Project.sh"

  print "[fresh] Done"
}

main "$@"
