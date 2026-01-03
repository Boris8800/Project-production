#!/usr/bin/env bash
# Shared helper functions for embedded scripts

# Normalize a domain root: strip scheme, path, port, remove leading www., trim, lowercase
normalize_domain_root() {
  local d="$1"
  d="${d#http://}"
  d="${d#https://}"
  d="${d%%/*}"
  d="${d%%:*}"
  d="$(echo "${d}" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')"
  d="${d%.}"
  if [[ "${d}" == www.* ]]; then
    d="${d#www.}"
  fi
  printf '%s' "${d}"
}
