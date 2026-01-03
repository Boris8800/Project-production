#!/usr/bin/env bash
# Quick smoke test: check HTTP/HTTPS reachability for given domains
# Usage: scripts/check-domains.sh domain1 domain2 ...
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 domain [domain2 ...]"
  exit 2
fi

FAIL=0
for d in "$@"; do
  printf "Checking %s... " "$d"
  ok=false
  # Try HTTP first
  if command -v curl >/dev/null 2>&1; then
    if curl -sSf -I --max-time 6 "http://${d}" >/dev/null 2>&1; then
      echo "HTTP OK"
      ok=true
    elif curl -sSf -I --max-time 6 "https://${d}" >/dev/null 2>&1; then
      echo "HTTPS OK"
      ok=true
    else
      echo "UNREACHABLE"
    fi
  else
    echo "curl not installed"
    FAIL=2
    continue
  fi

  if [ "$ok" = false ]; then
    FAIL=1
  fi
done

exit $FAIL
