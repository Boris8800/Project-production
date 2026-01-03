#!/bin/sh
set -e

echo "Starting ops-dashboard (dev) at http://127.0.0.1:8090"
docker compose up -d --build ops-dashboard
