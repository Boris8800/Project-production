# PostgreSQL Password Authentication Fix

## Problem
Backend fails with: `error: password authentication failed for user "Project_admin"`

## Root Cause
PostgreSQL only reads the `POSTGRES_PASSWORD` environment variable on **first initialization**. If the `postgres_data` volume already exists with a different password, changing `.env.production` won't help.

## Solution (On Your VPS)

### Option 1: Complete Volume Reset (Recommended)
```bash
# Stop all containers
docker compose -f /home/taxi/Project-production/docker-compose.production.yml down

# Remove the postgres volume specifically
docker volume rm Project_postgres_data

# Restart the deployment
cd /home/taxi/Project-production
sudo -u taxi bash scripts/deploy.sh
```

### Option 2: Manual Password Reset in PostgreSQL
```bash
# Connect to the running postgres container
docker exec -it Project-postgres psql -U Project_admin -d Project

# In PostgreSQL shell, reset the password to match .env.production:
ALTER USER Project_admin WITH PASSWORD 'your_password_from_env_file';
\q

# Restart backend
docker compose -f /home/taxi/Project-production/docker-compose.production.yml restart backend-api
```

### Option 3: Re-run Fresh Install (Easiest)
```bash
# Pull the latest fix from GitHub
cd /home/taxi/Project-production
git pull origin main

# Run the fresh install again (now with improved volume cleanup)
cd ~
sudo bash /home/taxi/Project-production/scripts/all.sh
# Choose option 1 (Clean Install)
```

## How the Fix Works

The updated script now:
1. **Shows which volumes are being removed** with detailed output
2. **Force-removes `postgres_data`** if it still exists after cleanup
3. **Verifies password is set** before starting PostgreSQL
4. **Waits for PostgreSQL** to fully initialize with the new password
5. **Checks readiness** before starting the backend

## Verify the Fix
After redeployment, check:
```bash
# Backend should be healthy
docker ps | grep Project-backend

# Check backend logs (should see successful connection)
docker logs Project-backend | tail -20

# Should see: "TypeOrmModule dependencies initialized"
# Without any password authentication errors
```

## Prevention
The fix is now in the main branch. Future deployments will automatically:
- Remove all volumes on clean install
- Verify PostgreSQL readiness before proceeding
- Show detailed cleanup information
